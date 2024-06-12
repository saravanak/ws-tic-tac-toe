var express = require("express");
var app = express();
var expressWs = require("express-ws")(app);
const { v4: uuidv4 } = require("uuid");

function sendWs(ws, object) {
  ws.send(JSON.stringify(object));
}
const STATE_JOIN = "join";

const game = {
  firstPlayer: null, // Web socket
  secondPlayer: null, // Web socket
  gameState: [], // Array of the ticks 'x', 'o', null
  moves: [], //the moves thus made in seuqence

  reset: function () {
    this.firstPlayer = {};
    this.secondPlayer = {};
    (this.gameState = Array(9).fill(null)), // Array of the ticks 'x', 'o', null;
      (this.moves = []);
  },

  join: function (connection) {
    //TODO DRY
    console.log('Joining the player...');
    if (!this.firstPlayer.id) {
      this.firstPlayer.id = uuidv4();
      connection.playerId = this.firstPlayer.id;
      connection.symbol = "x";
      console.log(`Joined player 1 with id: ${connection.playerId}`);
      return;
    }
    if (!this.secondPlayer.id ) {
      this.secondPlayer.id = uuidv4();
      connection.playerId = this.secondPlayer.id;
      connection.symbol = "o";
      console.log(`Joined player 2 with id: ${connection.playerId}`);
    }
    //Handle error here.
  },

  canJoin: function () {
    return !this.firstPlayer.id || !this.secondPlayer.id;
  },

  otherPlayerJoined: function(id) {
    return this.firstPlayer.id == id ? this.secondPlayer.id : this.firstPlayer.id
  }
};

/*

Time running out; so i am just summarizing the next steps here
Next steps :

return game status for debugging purposes periodically to another page
close player details on connection close 
Add commands for MOVE, GAME_WIN, announce winner if player takes too long to move. 
Take back aka history not be implemented. 
Validate message on socket to check if the request is tampered. (imeplement security or wss ?)
*/
game.reset();

app.use(function (req, res, next) {
  req.testing = "testing";
  return next();
});

app.get("/", function (req, res, next) {
  console.log("get route", req.testing);
  res.end();
});

app.ws("/echo", function (ws, req) {
  console.log("Echo handler");
  sendWs(ws, {
    type: "welcome",
    payload: {
      welcomeMessage: "Welcome to the tic-tac-toe server ",
      canJoin: game.canJoin(),
    }
  });

  ws.on("message", function (msg) {
    console.log("Got Message", msg);
    let payloadFromClient = msg ;
    
    try{
      payloadFromClient =  JSON.parse(msg);
    }catch(e){
      console.error("Unable to parse mesage as json...");
    }

    if (!payloadFromClient.command) {
      ws.nexState = STATE_JOIN;
      console.log(`Processing welcome message, ${ws.nextState}`);
      sendWs(ws, {
        type: "welcome",
        payload: {
          welcomeMessage: "Welcome to the tic-tac-toe server ",
          canJoin: game.canJoin(),
        }
      });
      return;
    }
    

    switch (payloadFromClient.command) {
      case "join_game":
        console.log("Processing join game command..", game.canJoin(), ws.nexState);
        if (game.canJoin() ) {
          game.join(ws);
          sendWs(ws, {
            type: "joined_game",
            payload: {
              id: ws.playerId,
              yourSymbol: ws.symbol,
              canMove: !game.canJoin(),
              status: "NOT_STARTED",
              playerStatus: game.otherPlayerJoined(ws.playerId) ?  "JOINED" :"NOT_JOINED"
            }
          });
        }
        break;
    }
  });
  console.log("socket", req.testing);
  
});

app.listen(3001);

/**
 * PROTOCOL
 *
 *  join_me :  server adds the id.
 *
 */
