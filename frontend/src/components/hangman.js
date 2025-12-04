import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import "./styles.css";

import Tally from "./tally.js";

export default function Hangman() {
  const navigate = useNavigate();
  const [ws, setWs] = useState(null);
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [displayWord, setDisplayWord] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({
    guess: "",
  });

  const [guessCounter, setGuessCounter] = useState(0);
  const [maxGuesses] = useState(7);

  const [hasSwapped, setHasSwapped] = useState(false);

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
          if (msg.action === "hangman") {
            setDisplayWord(msg.displayWord);
            setGuesses(msg.guesses || []);
            setPlayers(msg.players || []);

            // prevent multiple swaps and proper score screen navigation
            if (msg.hasSwapped !== undefined) {
              setHasSwapped(msg.hasSwapped);
            }
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
            setDisplayWord(msg.displayWord);
            setGuesses(msg.guesses);

            // check for a win, only go to score page after players have swapped roles
            if (
              msg.displayWord.indexOf("_") === -1 ||
              msg.guesses.length >= maxGuesses
            ) {
              // navigate to scores if roles were swapped earlier
              if (hasSwapped) {
                console.log("Word guessed! Navigating to scores...");
                setTimeout(() => {
                  navigate("/dashboard");
                }, 5000);
              }
              // otherwise play second round
              else {
                console.log("Word guessed, waiting for role swap...");
                // swap after word is guessed or max guesses reached
                if (
                  (msg.displayWord.indexOf("_") === -1 ||
                    msg.guesses.length >= maxGuesses) &&
                  !hasSwapped
                ) {
                  console.log("Swapping roles...");
                  // swap roles
                  const swapData = {
                    type: "swap",
                    player: res.player,
                    word: res.word,
                  };
                  websocket.send(JSON.stringify(swapData));
                  setHasSwapped(true);

                  setGuessCounter(0);
                }
              }
            }
          }

          if (msg.type === "swapped") {
            console.log("Swapped roles...");
            setDisplayWord(msg.displayWord);
            setGuesses(msg.guesses || []);
            setPlayers(msg.players || []);
            setHasSwapped(true);
            setGuessCounter(0);

            await postScores();

            // check if this client is the new host of the game, send their word if so
            const currPlayer = msg.players.find((p) => p.player === res.player);
            if (currPlayer && currPlayer.role === "host") {
              console.log("Sending new word to server as the new host...");
              const startData = {
                type: "start",
                player: res.player,
                word: res.word,
              };
              websocket.send(JSON.stringify(startData));
            }
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
        <h4 >Word to guess:</h4>
        <br></br>
        <h2 className="guessDisplay">{displayWord || "Loading word..."}</h2>
        <br></br>
        <Tally count={guessCounter} />
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
