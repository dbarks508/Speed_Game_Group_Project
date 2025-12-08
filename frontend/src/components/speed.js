import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import "./styles.css";
import { CardComponent, PileComponent } from "./card";

export default function Speed() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [players, setPlayers] = useState([]);
  const [ws, setWs] = useState(null);
  const [playedCard, setPlayedCard] = useState(null);
  const [playedPlayer, setPlayedPlayer] = useState(null);
  const [player1Hand, setPlayer1Hand] = useState([]);
  const [player2Hand, setPlayer2Hand] = useState([]);
  const [playedStacks, setPlayedStacks] = useState({
    stack1: { topCard: null },
    stack2: { topCard: null },
  });
  const [player1Deck, setPlayer1Deck] = useState([]);
  const [player2Deck, setPlayer2Deck] = useState([]);
  const [sideStacks, setSideStacks] = useState({
    stack1: [],
    stack2: [],
  });

  // use effect
  useEffect(() => {
    const websocket = new WebSocket("ws://localhost:4000");
    setWs(websocket);

    websocket.onopen = () => {
      console.log("speed.js connected");

      websocket.send(JSON.stringify({ type: "start" }));
    };

    // handle message
    websocket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("Websocket message: " + JSON.stringify(msg));
        // start game
        if (msg.action === "speed") {
          console.log("connectedPlayers from server:", msg.connectedPlayers);
          setPlayers(msg.connectedPlayers);
          // randomly create and assign player hands, sideStacks, and decks
          // use helper function to initialize game state
          /// TO DO: implement game state initialization
          const SUITS = ["clubs", "diamonds", "hearts", "spades"];
          const deck = [];
          for (let s of SUITS) {
            for (let i = 1; i < 14; i++) {
              deck.push({ suit: s, number: i });
            }
          }

          const shuffledDeck = shuffle(deck);
          dealCards(shuffledDeck);
          console.log("cards dealt");

          sendGameStateToServer(websocket);
        }

        // end the game if end game msg is sent
        if (msg.action === "end") {
          console.log("Game ended, navigating to scores...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 5000);
        }

        // handle game actions
        if (msg.type === "update") {
          setPlayer1Hand(msg.player1Hand);
          setPlayer2Hand(msg.player2Hand);
          setPlayedStacks(msg.playedStacks);
          setPlayer1Deck(msg.player1Deck);
          setPlayer2Deck(msg.player2Deck);
          setSideStacks(msg.sideStacks);

          // remove the card from the player's hand and add to played stack
          playedPlayer = msg.player;
          playedCard = msg.playedCard;

          if (playedPlayer === players[0].player) {
            setPlayer1Hand((prevHand) =>
              prevHand.filter((card) => card.id !== playedCard.id)
            );
          } else if (playedPlayer === players[1].player) {
            setPlayer2Hand((prevHand) =>
              prevHand.filter((card) => card.id !== playedCard.id)
            );
          }

          // set the top card fo the played stack to the played card
          setPlayedStacks((prevStacks) => {
            const updatedStacks = { ...prevStacks };
            if (msg.playedStack === "stack1") {
              updatedStacks.stack1.topCard = playedCard;
            } else if (msg.playedStack === "stack2") {
              updatedStacks.stack2.topCard = playedCard;
            }
            return updatedStacks;
          });

          // check for a win, only go to score page after players have swapped roles
          if (player1Deck.length === 0 && player1Hand.length === 0) {
            console.log("Player 1 wins!");
            setTimeout(() => {
              navigate("/dashboard");
            }, 5000);
          }
          if (player2Deck.length === 0 && player2Hand.length === 0) {
            console.log("Player 2 wins!");
            setTimeout(() => {
              navigate("/dashboard");
            }, 5000);
          }

          //if no players can make a valid move, play a card from the side stacks into the played stacks
          //TO DO: implement logic to check for valid moves and play from side stacks
        }

        // prvents the card from being played and returns it to hand
        if (msg.type === "badPlay"){
          if (msg.playerName === players[0].playerName){
              
          }
          else if (msg.playerName === players[1].playerName){

          }
        }

        // handle errors
        if (msg.error) {
          setErrorMessage(msg.error);
        }
      } catch (err) {
        console.log("error message", err);
      }
    };

    // disconnect
    websocket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      if (websocket && websocket.readyState === WebSocket.OPEN)
        websocket.close();
    };
  }, []);

  function dealCards(shuffledDeck) {
    let cards = [];

    for (let i = 0; i < 5; i++) {
      const [card] = shuffledDeck.splice(0, 1);
      cards.push(card);
    }
    setPlayer1Hand(cards);

    cards = [];
    for (let i = 0; i < 5; i++) {
      const [card] = shuffledDeck.splice(0, 1);
      cards.push(card);
    }
    setPlayer2Hand(cards);

    cards = [];
    for (let i = 0; i < 15; i++) {
      const [card] = shuffledDeck.splice(0, 1);
      cards.push(card);
    }
    setPlayer1Deck(cards);

    cards = [];
    for (let i = 0; i < 15; i++) {
      const [card] = shuffledDeck.splice(0, 1);
      cards.push(card);
    }
    setPlayer2Deck(cards);

    let stack1 = [];
    let stack2 = [];
    for (let i = 0; i < 10; i++) {
      const [card1] = shuffledDeck.splice(0, 1);
      const [card2] = shuffledDeck.splice(0, 1);
      stack1.push(card1);
      stack2.push(card2);
    }
    setSideStacks({
      stack1,
      stack2,
    });
  }

  function sendGameStateToServer(socket) {
    console.log("in send game state");
    const gameState = {
      players,
      player1Hand,
      player2Hand,
      player1Deck,
      player2Deck,
      sideStacks,
    };

    socket.send(
      JSON.stringify({
        type: "initializeGame",
        gameState: gameState,
      })
    );
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

  // determine if this player is the host
  function isHost() {
    if (!data || !players.length) return false;
    const currPlayer = players.find((p) => p.player === data.player);
    return currPlayer && currPlayer.role === "host";
  }

  // handle form changes, including disallowing changes if user is a host
  function updateForm(jsonObj) {
    // disallow changes if user is a host
    if (isHost()) {
      return;
    }

    //     return setForm((prevJsonObj) => {
    //       return { ...prevJsonObj, ...jsonObj };
    //     });
  }

  // use if necesssary
  //   async function postScores() {
  //     const stats = {
  //       userID: "todo",
  //       Name: players[0],
  //       phraseGuessed: "",
  //       numberOfGuesses: 0,
  //       fromDatabaseOrCustom: "todo",
  //       successfulOrNot: "todo",
  //     };

  //     const response = await fetch(`http://localhost:4000/postScores`, {
  //       method: "POST",
  //       credentials: "include",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(stats),
  //     });

  //     if (!response.ok) {
  //       console.log("error posting scores");
  //     }
  //   }




  // NOTE: it is assumed that the client is always player1
  //       if this is not the case, simply reverse the arrays below when needed
  let decks = [player1Deck, player2Deck];
  let hands = [player1Hand, player2Hand];

  function validateDrop(stack){
    return (suit, number) => Math.abs(number - stack?.topCard?.number) === 1;
  }
  function onDiscard(stack){
    return (suit, number) => {
      let index = hands[0].findIndex(({suit: s, number: n}) => s == suit && n == number);
      if(!validateDrop(stack)(suit, number)) return;

      // TODO: send message to server about the card played

      stack.topCard = {suit, number};
      setPlayedStacks({...playedStacks});

      hands[0].splice(index, 1);
      setPlayer1Hand(player1Hand.slice());
      setPlayer2Hand(player2Hand.slice());
    };
  }

  function validateDrop(stack){
    return (suit, number) => Math.abs(number - stack?.topCard?.number) === 1;
  }
  function onDiscard(stack){
    return (suit, number) => {
      let index = hands[0].findIndex(({suit: s, number: n}) => s == suit && n == number);
      if(!validateDrop(stack)(suit, number)) return;

      // TODO: send message to server about the card played

      stack.topCard = {suit, number};
      setPlayedStacks({...playedStacks});

      hands[0].splice(index, 1);
      setPlayer1Hand(player1Hand.slice());
      setPlayer2Hand(player2Hand.slice());
    };
  }

  return (
    <div className="speed-body">
      {/* first column */}
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div className="deck">
          <p>{decks[0].length} cards remaining</p>
          <PileComponent filterDrop={() => false} cards={decks[0]} />
        </div>
      </div>

    {/* middle column */}
    <div style={{display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center"}}>
      {/* first row */}
      <div className="hand">
        {hands[1].map((_, i) => <CardComponent key={i}/>)}
      </div>

      {/* middle row */}
      <div>
        <PileComponent filterDrop={() => false} cards={sideStacks?.stack1}/>
        <PileComponent
          filterDrop={validateDrop(playedStacks?.stack1)}
          onDrop={onDiscard(playedStacks?.stack1)}
          revealed={true}
          cards={playedStacks?.stack1?.topCard == undefined ? []:[playedStacks.stack1.topCard]}
        />

        <PileComponent
          filterDrop={validateDrop(playedStacks?.stack2)}
          onDrop={onDiscard(playedStacks?.stack2)}
          revealed={true}
          cards={playedStacks?.stack2?.topCard == undefined ? []:[playedStacks.stack2.topCard]}
        />
        <PileComponent filterDrop={() => false} cards={sideStacks?.stack2}/>
      </div>

      {/* last row */}
      <div className="hand">
        {hands[0].map((c, i) => <CardComponent key={i} suit={c.suit} number={c.number} revealed={true} isDragable={true}/>)}
      </div>
    </div>

    {/* last column */}
    <div>
      <div className="deck">
        {decks[1].length > 0 ? <CardComponent/>:<PileComponent/>}
        <p>{decks[1].length} cards remaining</p>
      </div>
    </div>
  </div>);
}
