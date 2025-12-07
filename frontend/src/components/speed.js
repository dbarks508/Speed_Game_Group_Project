import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import "./styles.css";
import { CardComponent } from "./card";

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


  // TODO: when a card is dragged, call sendGameStateToServer() then send a websocket message for "playerAction" to process play
  // probably when an onDragEnd or onDrop whatever event gets triggered by releasing the card
  return <div className="body">
    <h2>Speed Game</h2>
    <div className="game-area">
      <div className="player-area">
        <h3>Player 1 Hand</h3>
        <div className="hand">
          {player1Hand.map((card, index) => (
            <CardComponent key={index} suit={card.suit} number={card.number} />
          ))}
        </div>
        <h3>Player 1 Deck: {player1Deck.length} cards left</h3>
      </div>
      <div className="side-stack-area"> 

      </div>
      <div className="played-stacks-area">
        <h3>Played Stacks</h3>
          <div className="side-stacks">
            <div className="side-stack">
              {sideStacks.stack1.length > 0 ? (
                <CardComponent
                  suit={sideStacks.stack1[0].suit}
                  number={sideStacks.stack1[0].number}
                />
              ) : (<p>Empty</p>
              )}
          </div>
        <div className="played-stacks">
          <div className="played-stack">
            {playedStacks.stack1.topCard ? (
              <CardComponent
                suit={playedStacks.stack1.topCard.suit}
                number={playedStacks.stack1.topCard.number}
              />
            ) : (<p>Empty</p>
            )}
          </div>
          <div className="played-stack">
            {playedStacks.stack2.topCard ? (
              <CardComponent
                suit={playedStacks.stack2.topCard.suit}
                number={playedStacks.stack2.topCard.number}
              />
            ) : (<p>Empty</p>
            )}
          </div>
          <div className="side-stacks">
            <div className="side-stack">
              {sideStacks.stack2.length > 0 ? (
                <CardComponent
                  suit={sideStacks.stack2[0].suit}
                  number={sideStacks.stack2[0].number}
                />
              ) : (<p>Empty</p>
              )}
          </div>
        </div>

      </div>
      <div className="player-area">
        <h3>Player 2 Hand</h3>
        <div className="hand">
          {player2Hand.map((card, index) => (
            <CardComponent key={index} suit={card.suit} number={card.number} />
          ))}
        </div>
        <h3>Player 2 Deck: {player2Deck.length} cards left</h3>
      </div>
    </div>
    </div>
    </div>
  </div>;
}
