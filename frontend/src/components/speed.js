import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import "./styles.css";

export default function Speed() {
  const navigate = useNavigate();
  const [ws, setWs] = useState(null);
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({
    guess: "",
  });

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
    // verify the session
    async function verify() {
      const response = await fetch(`http://localhost:4000/verify`, {
        method: "GET",
        credentials: "include",
      });

      const res = await response.json();
      console.log(res);

      if (res.status === "no session set") {
        navigate("/");
        return;
      }

      setData(res);

      // connect websocket
      const websocket = new WebSocket("ws://localhost:4000");

      // web socket open
      websocket.onopen = () => {
        console.log("connected to websocket on front end");
        // get player data and sent
        const gameState = {
          type: "start",
          player: res.player,
          word: res.word,
        };

        websocket.send(JSON.stringify(gameState));
      };

      // handle message
      websocket.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("Websocket message: " + JSON.stringify(msg));
          // start game
          if (msg.action === "speed") {
            setPlayers(msg.connectedPlayers);
            // randomly create and assign player hands, sideStacks, and decks
            // use helper function to initialize game state 
            /// TO DO: implement game state initialization

          }

          // end the game if end game msg is sent
          if (msg.action === "end") {
            setDisplayWord(msg.displayWord);
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
            if (
              player1Deck.length === 0 && player1Hand.length === 0
            ) {
              console.log("Player 1 wins!");
              setTimeout(() => {
                navigate("/dashboard");
              }, 5000);
            }
            if (
              player2Deck.length === 0 && player2Hand.length === 0
            ) {
              console.log("Player 2 wins!");
              setTimeout(() => {
                navigate("/dashboard");
              }, 5000);
            }

            // if no players can make a valid move, play a card from the side stacks into the played stacks
            // TO DO: implement logic to check for valid moves and play from side stacks
          }

          // handle errors
          if (msg.error) {
            setErrorMessage(msg.error);
          }
        } catch (err) {
          console.log("error parsing data" + err);
        }
      };

      // disconnect
      websocket.onclose = () => {
        console.log("Disconnected from WebSocket server");
      };

      setWs(websocket);
    }
    verify();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [navigate]);

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

    return setForm((prevJsonObj) => {
      return { ...prevJsonObj, ...jsonObj };
    });
  }

  // use if necesssary
  async function postScores() {
    const stats = {
      userID: "todo",
      Name: players[0],
      phraseGuessed: displayWord,
      numberOfGuesses: guesses,
      fromDatabaseOrCustom: "todo",
      successfulOrNot: "todo",
    };

    const response = await fetch(`http://localhost:4000/postScores`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stats),
    });

    if (!response.ok) {
      console.log("error posting scores");
    }
  }

  // handle button press, disallow if user is a host
  async function onSubmit(e) {
    e.preventDefault();

    // disallow press if user is a host
    if (isHost()) {
      return;
    }

    // disallow press if max guesses reached
    if (guessCounter >= maxGuesses) {
      setErrorMessage("Maximum number of guesses reached");
      return;
    }

    console.log("form submitted");

    // increment guess counter
    setGuessCounter(guessCounter + 1);

    // TODO
    const guessData = {
      type: "guess",
      guess: form.guess,
      player: data.player,
    };
    ws.send(JSON.stringify(guessData));

    // reset form
    setForm({ guess: "" });
    setErrorMessage("");
  }

  return (
    <div className="body">
      <h1>Welcome to hangman</h1>
      <div className="wordDisplay">
        <h4>Word to guess:</h4>
        <br></br>
        <h2 className="guessDisplay">{displayWord || "Loading word..."}</h2>
        <br></br>
        <p id="guesses">Guessed letters: {guesses.join(", ")}</p>
        <br></br>
      </div>
      <br></br>
      {!isHost() ? (
        <>
          <p>Make your guess below:</p>
          <form onSubmit={onSubmit}>
            <div className="guessInput">
              <label>Make guess: </label>
              <input
                type="text"
                id="guess"
                value={form.guess}
                onChange={(e) => updateForm({ guess: e.target.value })}
                required
                maxLength={1}
              />
            </div>
            <br />
            <div>
              <input type="submit" value="Guess"></input>
            </div>
          </form>
        </>
      ) : (
        <p>Observing game as the Host</p>
      )}
      <div>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      </div>
    </div>
  );
}
