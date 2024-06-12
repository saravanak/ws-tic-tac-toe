"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Board } from "./tic-tac-toe";
import GameJoiner from "./game-joiner";

export default function Game() {
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const currentSquares = history[currentMove];

  const [isClient, setIsClient] = useState(false);
  const [gameState, setGameState] = useState({
    isGameJoined: false,
    canJoin: false,
    serverMessage: null,
  });

  let socket;
  let { isGameJoined, yourSymbol, id: gameId, canMove, status: gameStatus,playerStatus } = gameState;
  const socketRef = useRef();

  useEffect(() => {
    if (isClient) {
      socket = new WebSocket("ws://localhost:3001/echo");
      socketRef.current = socket;
      socket.onopen = function (e) {  
      };

      socket.onmessage = function (event) {
        console.log(`[message] Data received from server: ${event.data}`);
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "welcome":
            console.log("Got welcome message");
            setGameState({
              ...gameState,
              canJoin: message.payload.canJoin,
              serverMessage: message.payload.welcomeMessage,
            });
            break;
          case "joined_game":
            setGameState({
              ...gameState,
              isGameJoined: true,
              canJoin: false,
              ...message.payload,
              /*
              yourSymbol: ws.symbol,
              canMove: !game.canJoin(),
              gameState: "waiting for the other opponent",
              */
              
            });
            break;
        }
      };

      socket.onclose = function (event) {
        if (event.wasClean) {
          console.log(
            `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
          );
        } else {
          // e.g. server process killed or network down
          // event.code is usually 1006 in this case
          console.log("[close] Connection died", event);
        }
      };
    }
    setIsClient(true);
  }, [isClient]);

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setXIsNext(nextMove % 2 === 0);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = "Go to move #" + move;
    } else {
      description = "Go to game start";
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        {isGameJoined ? (
          <>
            <p>You are player <span style={{fontSize: "4rem" }}>{yourSymbol}</span> with id {gameId}</p>
            <Board
              canMove={canMove}
              xIsNext={xIsNext}
              squares={currentSquares}
              onPlay={handlePlay}
              gameStatus={gameStatus}
              playerStatus={playerStatus}
            />
            <div className="game-info">
              <ol>{moves}</ol>
            </div>
          </>
        ) : (
          <GameJoiner
            gameState={gameState}
            joinAsAplayer={() => {
              socketRef.current.send(
                JSON.stringify({
                  command: "join_game",
                })
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
