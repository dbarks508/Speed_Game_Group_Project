const { json } = require("express");
const WebSocket = require("ws");

const connectedPlayers = [];

let gameState = {
  players: [
    { player: null },
    { player: null }
  ],
  discardPiles: {
    stack1: { topCard: null, history: [] },
    stack2: { topCard: null, history: [] },
  },
  sidePiles: {
    stack1: [],
    stack2: [],
  },
  player1Hand: [],
  player2Hand: [],
  player1Deck: [],
  player2Deck: [],
  playedCard: null,
  playedStack: null,
  playerName: null,
};

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
            connectedPlayers.push({ player: data.player });
          }

          // send current game state to player
          if (connectedPlayers.length == 2) {
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                console.log("sending state");
                client.send(
                  JSON.stringify({
                    action: "speed",
                    connectedPlayers: connectedPlayers,
                  })
                );
              }
            });
          }
        }

        if (data.type === "start") {

          // send start game state to all connected players
          wss.broadcast(
            JSON.stringify({
              action: "speed",
              connectedPlayers: connectedPlayers,
            })
          );
        }

        if (data.type === "initializeGame") {
          const state = data.gameState; // <-- the object from the front end

          // Assign player name
          if(
            gameState.players[0].player == null ||
            (gameState.players[0].player != null && gameState.players[1].player != null)
          ) gameState.players[0].player = state.playerName;
          else gameState.players[1].player = state.playerName;

          // Assign hands
          gameState.players[0].hand = state.player1Hand;
          gameState.players[1].hand = state.player2Hand;

          // Assign decks
          gameState.players[0].deck = state.player1Deck;
          gameState.players[1].deck = state.player2Deck;

          // Assign side stacks
          gameState.discardPiles.stack1 = {topCard: null, history: []};
          gameState.discardPiles.stack2 = {topCard: null, history: []};

          gameState.sidePiles.stack1 = state.sideStacks.stack1;
          gameState.sidePiles.stack2 = state.sideStacks.stack2;

          // deal new cards from side stacks if no valid plays are available
          dealSideStack();

          // send back to front
          wss.broadcast(
            JSON.stringify({
              action: "update",
              gameState: gameState,
            })
          );

          console.log("Game initialized and broadcasted:", gameState);
        }

        if (data.type === "playerAction") {
          // abort if player has not actually taken an action
          if(gameState.playedCard == undefined) return;

          // compare the current card to the stack being played on
          // if the played card is one higher or lower than the top card of the played stack, allow play
          if (validPlay(gameState.playedCard, gameState.playedStack.topCard)) {
            // allow play
            console.log("valid play, card played to stack");
            // update the played stack
            gameState.playedStack.history.push(gameState.topCard);
            gameState.playedStack.topCard = gameState.playedCard;

            if (gameState.playedStack === gameState.discardPiles.stack1) {
              gameState.discardPiles.stack1.topCard = gameState.playedCard;
            } else if (gameState.playedStack === gameState.discardPiles.stack2) {
              gameState.discardPiles.stack2.topCard = gameState.playedCard;
            }

            if (gameState.playerName === gameState.players[0].player.playerName) {
              // remove the played card from the player's hand
              gameState.player1Hand = gameState.player1Hand.filter(
                (card) => card !== gameState.playedCard
              );
              // draw the top most card from their deck
              if (gameState.player1Deck.length > 0) {
                gameState.player1Hand.push(
                  gameState.player1Deck.pop()
                );
              }
            }
            else if (gameState.playerName === gameState.players[1].player.playerName) {
              // remove the played card from the player's hand
              gameState.player2Hand = gameState.player2Hand.filter(
                (card) => card !== gameState.playedCard
              );
              // draw the top most card from their deck
              if (gameState.player2Deck.length > 0) {
                gameState.player2Hand.push(
                  gameState.player2Deck.pop()
                );
              }
            }

            // deal new cards from side stacks if no valid plays are available
            dealSideStack();

            // send updated game state to all connected players
            wss.broadcast(
              JSON.stringify({
                action: "update",
                gameState: gameState, // front end needs to update game visual state
                playerName: gameState.playerName,
                playedCard: gameState.playedCard,
                playedStack: gameState.playedStack,
              })


            );
          } else {
            // dont allow play and return card to hand
            console.log("invalid play, card returned to hand");
            wss.broadcast(
              JSON.stringify({
                action: "badPlay",
                gameState: gameState, // front end needs to update game visual state
                playerName: gameState.playerName,
                playedCard: gameState.playedCard,
                playedStack: gameState.playedStack,
              })
            );
          }
        }
      } catch (err) {
        console.error(err);
      }
    });

    wss.on("start", (gameState) => {
      // send start game state to all connected players
      wss.broadcast(
        JSON.stringify({
          action: "speed",
          gameState: gameState, // front end needs to initialize game visual state
        })
      );
    });


    // ws connection closed
    ws.on("close", () => {
      console.log("client disconnected");
    });
  });

  return wss;
}



function validPlay(card1, card2){
  return Math.abs(card1.number - card2.number) % 13 === 1;
}

function isPlayable(hand){
  hand.some((card) => (
    validPlay(card.number, gameState.discardPiles.stack1.topCard) ||
    validPlay(card.number, gameState.discardPiles.stack2.topCard)
  ));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    // pick a random index from 0 to i inclusive
    const j = Math.floor(Math.random() * (i + 1)); // at random index
    // Swap arr[i] with the element
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// deals a card from each side stack into it's respective discard pile
// if side stacks are empty, discard piles are combined, shuffled,
// and split, then a new card is played from each side stack
function dealSideStack(){
  // check if at game start or if player's a hand has a valid play
  let validPlay = gameState.discardPiles.stack1.topCard != undefined && (isPlayable(gameState.player1Hand) || isPlayable(gameState.player2Hand));

  // if validPlay is false, draw a card from the side piles
  if (!validPlay){
    // check if side piles are empty, combine, shuffle and split discard piles and play the top card if so
    if (gameState.sidePiles.stack1.length == 0 || gameState.sidePiles.stack2.length == 0){
      let tempStack = gameState.discardPiles.stack1.history.concat(gameState.discardPiles.stack2.history);
      tempStack = shuffle(tempStack);

      gameState.sidePiles.stack1 = tempStack.splice(Math.ceil(tempStack.length/2));
      gameState.sidePiles.stack2 = tempStack;

      gameState.discardPiles.stack1 = {topCard: null, history: []};
      gameState.discardPiles.stack2 = {topCard: null, history: []};
    }

    gameState.discardPiles.stack1.topCard = gameState.sidePiles.stack1.pop();
    gameState.discardPiles.stack1.history.push(gameState.discardPiles.stack1.topCard);
    gameState.discardPiles.stack2.topCard = gameState.sidePiles.stack2.pop();
    gameState.discardPiles.stack2.history.push(gameState.discardPiles.stack2.topCard);
  }
}


module.exports = websocket;
