const WebSocket = require("ws");

const connectedPlayers = [];

// main web socket function
function websocket(server) {
  const wss = new WebSocket.Server({ server });

  // ----- web socket helper -----
  wss.broadcast = function broadcast(data) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  // ----- main web socket logic -----
  wss.on("connection", (ws) => {
    console.log("client connected");

    // ws recieves messages from the client
    ws.on("message", (message) => {
      console.log(message.toString());
      try {
        const data = JSON.parse(message);

        // state join sent  from waiting room
        if (data.type === "join") {
          const existing = connectedPlayers.find(
            (p) => p.player === data.player
          );
          if (existing) {
            existing.ws = ws;
            console.log("player reconnected");
          } else {
            connectedPlayers.push({ player: data.player, ws: ws });
          }

          // send current game state to player
          if (connectedPlayers.length == 2) {
            ws.send(
              JSON.stringify({
                action: "speed",
                connectedPlayers: connectedPlayers.map((p) => ({
                  player: p.player,
                })),
              })
            );
          }
        }
      } catch (err) {
        console.log("message error: ", err.message);
      }
    });

    // handle player actions, such as playing a card
    wss.on("playerAction", (gameState) => {
      // compare the current card to the stack being played on
      // if the played card is one higher or lower than the top card of the played stack, allow play
      if(gameState.playedCard == (gameState.playedStack.topCard + 1) || gameState.playedCard == (gameState.playedStack.topCard - 1)){
        // allow play
        console.log("valid play, card played to stack");
         // update the played stack top card
        gameState.playedStack.topCard = gameState.playedCard;
        
        // send updated game state to all connected players
        wss.broadcast(
          JSON.stringify({
            action: "updateGameState",
            gameState: gameState, // front end needs to update game visual state
          })
        );

      }
      else{
        // dont allow play and return card to hand
        console.log("invalid play, card returned to hand");
      }
      
    }
    );

    // ws connection closed
    ws.on("close", () => {
      console.log("client disconnected");
    });
  });

  return wss;
}
module.exports = websocket;
