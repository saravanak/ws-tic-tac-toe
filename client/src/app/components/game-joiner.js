export default function GameJoiner({ gameState, joinAsAplayer }) {
  const { isGameJoined, canJoin, serverMessage } = gameState;

  let component = null;

  if (canJoin) {
    component = <button onClick={() => joinAsAplayer()}> Join Game </button>;
  } else {
    component = <b> You can't join the game now</b>;
  }

  return (
    <>
      <p> {serverMessage}</p>
      {component}
    </>
  );
}
