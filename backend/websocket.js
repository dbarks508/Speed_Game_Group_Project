const WebSocket = require("ws");

const SUITS = ["clubs", "diamonds", "hearts", "spades"];

const connectedPlayers = new Map();

let gameState = {
  players: [
    {name: "", hand: [], deck: []},
    {name: "", hand: [], deck: []},
  ],

  discardPiles: [[], []],
  sidePiles: [[], []],
};

function parseGameState(name){
  let playerIndex = gameState.players.findIndex(p => p.name == name);
  if(playerIndex < 0) return JSON.stringify({type: "error", error: `error: player '${name}' not found!`});

  let out = {
    hand: gameState.players[playerIndex].hand,
    otherHandCount: gameState.players.at(playerIndex - 1).hand.length,

    deckCount: gameState.players.map(p => p.deck.length),
    sideCount: gameState.sidePiles.map(d => d.length),

    discardTops: gameState.discardPiles.map(d => d.at(-1)),
  };

  if(playerIndex > 0){
    out.deckCount.reverse();
  }

  return JSON.stringify({type:"update", state: out});
}

// main web socket function
function websocket(server) {
  const wss = new WebSocket.Server({ server });

  function updateAll(){
    gameState.players.map(p => SendToPlayer(p.name, parseGameState(p.name)));
  }

  function SendToPlayer(name, data){
    let conns = connectedPlayers.get(name);
    if(conns == undefined || conns.length == 0) return false;

    let prev = conns.length;
    conns = conns.filter(c => c.readyState != WebSocket.CLOSED);
    connectedPlayers.set(name, conns);

    conns.forEach(c => c.send(data));
  }

  // ----- main web socket logic -----
  wss.on("connection", (ws) => {
    console.log("client connected");

    // ws recieves messages from the client
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        // state join sent  from waiting room
        if (data.type === "join") {
          if(data.player == undefined) return;

          let reconnect = connectedPlayers.has(data.player);
          if(!reconnect){
            connectedPlayers.set(data.player, []);
          }
          connectedPlayers.get(data.player).push(ws);

          // send current game state to player
          if (!reconnect && connectedPlayers.size == 2) {
            initGameState(...[...connectedPlayers.keys()].slice(0, 2));

            updateAll();
          }
        }

        if (data.type === "update") {
          ws.send(parseGameState(data.player));
        }

        if (data.type === "play") {
          let player = gameState.players.find(p => p.name == data.player);
          if(player == undefined || data.card == undefined || data.discardPile == undefined) return;

          // ensure player actually has the card
          let cardIndex = player.hand.findIndex(({suit, number}) => suit == data.card.suit && number == data.card.number);
          if(cardIndex < 0) return;

          // ensure the play is legal
          if(!validPlay(data.card, gameState.discardPiles[data.discardPile].at(-1))) return;

          // 'compute' the play
          gameState.discardPiles[data.discardPile].push(data.card);
          player.hand.splice(cardIndex, 1);
          if(player.deck.length > 0){
            player.hand.push(player.deck.pop());
          }

          dealSideStack();

          updateAll();
        }
      } catch (err) {
        console.error(err);
      }
    });

    // ws connection closed
    ws.on("close", () => console.log("client disconnected"));
  });

  return wss;
}



function validPlay(card1, card2){
  if(card1?.number == undefined || card2?.number == undefined) return false;

  return Math.abs(card1.number - card2.number) % 13 === 1 ||
    (card1.number == 1 && card2.number == 13) ||
    (card2.number == 1 && card1.number == 13);
}

function isPlayable(){
  return gameState.players.some(p => {
    return p.hand.some((card) => {
      return gameState.discardPiles.some(d => d.length > 0 && validPlay(card, d.at(-1)));
    });
  });
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

function partition(arr, chunkSize){
  arr = arr.slice();
  let out = [];

  for(let i = 0; i < arr.len; i += chunkSize){
    out.push(arr.splice(0, chunkSize));
  }
  out.push(arr);

  return out;
}

// deals a card from each side stack into it's respective discard pile
// if side stacks are empty, discard piles are combined, shuffled,
// and split, then a new card is played from each side stack
function dealSideStack(){
  // if validPlay is false, draw a card from the side piles
  for(let i = 0; i < 1_000; i++){
    if (!isPlayable()){
      console.log("no valid play");

      // check if side piles are empty; if so combine, shuffle and split discard piles
      if (gameState.sidePiles.some(d => d.length == 0)){
        console.log("shuffling into sidepiles");

        let pile = [];
        gameState.sidePiles.forEach(d => pile.concat(d.splice(0)));
        gameState.discardPiles.forEach(d => pile.concat(d.splice(0)));

        shuffle(pile);

        partition(pile, gameState.sidePiles.length).forEach((d, i) => {
          gameState.sidePiles[i] = d;
        });
      }

      gameState.sidePiles.map((d, i) => {
        gameState.discardPiles[i] = [d.pop()];
      });

      continue;
    }else return;
  }

  console.log("ERROR: `dealSideStack` was unable to get a playable game within 1,000 attempts");
}

function initGameState(name1, name2){
  let deck = SUITS.reduce((acc, s) => acc.concat(new Array(13).fill().map((_, n) => ({suit: s, number: n + 1}))), []);
  shuffle(deck);

  gameState.players = [name1, name2].map(name => ({name, hand: deck.splice(0, 5), deck: deck.splice(0, 15)}));
  gameState.sidePiles = [deck.splice(0, 6), deck.splice(0, 6)];

  dealSideStack();
}


module.exports = websocket;
