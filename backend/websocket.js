const WebSocket = require("ws");
const dbo = require("./db/conn");

const players = [];
const guesses = [];
let wordToGuess = "";
let displayWord = "";

let hasSwapped = false;

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

        // state type joing sent from waiting room
        if (data.type === "join") {
          const existing = players.find((p) => p.player === data.player);
          if (existing) {
            existing.ws = ws;
            console.log("player reconnected");

            // set word to ensure it is sent
            if (data.word && !wordToGuess) {
              wordToGuess = data.word;
              displayWord = "_".repeat(wordToGuess.length);
              console.log("word set on reconnect: " + wordToGuess);
            }

            // send current game state to player
            if (players.length == 2) {
              ws.send(
                JSON.stringify({
                  action: "hangman",
                  wordToGuess: wordToGuess,
                  displayWord: displayWord,
                  guesses: guesses,
                  players: players.map((p) => ({ player: p.player, role: p.role })),
                })
              );
            }

            return;
          }

          if (players.length == 0) {
            // set word on host join
            if (data.word) {
              wordToGuess = data.word;
              displayWord = "_".repeat(wordToGuess.length);
              console.log("word set on reconnect: " + wordToGuess);
            }

            const playerObject = {
              player: data.player,
              role: "host",
              ws: ws,
            };
            players.push(playerObject);
            console.log("player added, host set");
            wss.broadcast(
              JSON.stringify({
                message: `${data.player} has joined as host`,
                action: "wait",
              })
            );
          } else if (data.player != players[0].player && players.length < 2) {
            const playerObject = {
              player: data.player,
              role: "guesser",
              ws: ws,
            };
            players.push(playerObject);
            console.log("player added, guesser set");
            
            wss.broadcast(
              JSON.stringify({
                message: `${data.player} has joined as guesser`,
                action: "hangman",
                wordToGuess: wordToGuess,
                displayWord: displayWord,
                guesses: guesses,
                players: players.map((p) => ({ player: p.player, role: p.role })),
              })
            );
            console.log("Guessing: " + wordToGuess, " | Display: " + displayWord);
          }

          // save guessed words TODO
        }

        // swap host and guesser roles
        if (data.type === "swap") {
          // only permit one swap
          if (hasSwapped) {
            console.log("roles have already been swapped");
            return;
          }

          if (players.length == 2) {
            const temp = players[0].role;
            players[0].role = players[1].role;
            players[1].role = temp;
            console.log("roles swapped");

            // get word from the new host
            const newHost = players.find((p) => p.role === "host");
            console.log("new host: " + newHost.player);
            console.log("Word from host: " + data.word);

            // set guess list, display word, word to guess for new host
            guesses.length = 0;
            
            // if word is provided use it, otherwise til new word is sent from client
            if(data.word && data.word.length > 0){
              wordToGuess = data.word;
              displayWord = "_".repeat(wordToGuess.length);
              console.log("new word set: " + wordToGuess);
            } else{
              wordToGuess = "";
              displayWord = "";
              console.log("waiting for new word from host...");
            }

            hasSwapped = true;

            wss.broadcast(
              JSON.stringify({
                message: `Roles have been swapped! New host: ${players.find((p) => p.role === "host").player}, New guesser: ${players.find((p) => p.role === "guesser").player}`,
                action: "hangman",
                type: "swapped",
                wordToGuess: wordToGuess,
                displayWord: displayWord,
                guesses: guesses,
                players: players.map((p) => ({ player: p.player, role: p.role })),
                hasSwapped: true,
              })
            );
          }
        }

        // initial game setup from host
        if (data.type === "start") {
          if (data.word && data.word.length > 0) {
            wordToGuess = data.word;
            displayWord = "_".repeat(wordToGuess.length);
            console.log("game started with word: " + wordToGuess);

            wss.broadcast(
              JSON.stringify({
                action: "hangman",
                message: `Game started!`,
                wordToGuess: wordToGuess,
                displayWord: displayWord,
                guesses: guesses,
                players: players.map((p) => ({ player: p.player, role: p.role })),
                hasSwapped: hasSwapped,
              })
            );
          }
        }

        // game state guess sent from hangman.js
        if (data.type === "guess") {
          const g = data.guess.toLowerCase();
          let repeated = false;

          if (guesses.includes(g)) {
            ws.send(
              JSON.stringify({ message: "Already guessed letter: " + g })
            );
            console.log("repeated guess");
            repeated = true;
          }

          if (!repeated) {
            guesses.push(g);
            console.log("guess tracked");

            let newDisplayWord = "";
            for (let i = 0; i < wordToGuess.length; i++) {
              if (wordToGuess[i].toLowerCase() === g) {
                newDisplayWord += wordToGuess[i];
              } else if (displayWord[i] !== "_") {
                newDisplayWord += displayWord[i];
              }
              else {
                newDisplayWord += "_";
              }
            }
            displayWord = newDisplayWord;
            console.log("display word updated");

            // Check if word is complete
            const wordComplete = displayWord.indexOf("_") === -1;

            // log game result to database if complete
            if (wordComplete) {
              console.log("Word guessed! Logging game result to database...");
              (async () => {
                try {
                  let db = dbo.getDB();
                  const gameCollection = db.collection("game_data");
                  const newGameRecord = {
                    userID: data.player,
                    Name: data.player,
                    phraseGuessed: wordToGuess,
                    numberOfGuesses: guesses.length,
                    fromDatabaseOrCustom: hasSwapped ? "custom" : "database",
                    successfulOrNot: "successful",
                  };
                  const result = await gameCollection.insertOne(newGameRecord);
                  console.log("Game record inserted with _id: ", result.insertedId);
                } catch (err) {
                  console.error("Error inserting game record: ", err);
                }
              })();
            }
            else if (guesses.length >= 6) {
              console.log("Max guesses reached! Logging game result to database...");
              (async () => {
                try {
                  let db = dbo.getDB();
                  const gameCollection = db.collection("game_data");
                  const newGameRecord = {
                    userID: data.player,
                    Name: data.player,
                    phraseGuessed: wordToGuess,
                    numberOfGuesses: guesses.length,
                    fromDatabaseOrCustom: hasSwapped ? "custom" : "database",
                    successfulOrNot: "unsuccessful",
                  };
                  const result = await gameCollection.insertOne(newGameRecord);
                  console.log("Game record inserted with _id: ", result.insertedId);
                } catch (err) {
                  console.error("Error inserting game record: ", err);
                }
              })();
            }

            // if word is complete and we've already swapped, send end game signal
            if (wordComplete && hasSwapped) {
              console.log("Word guessed! Game over.");

              

              wss.broadcast(
                JSON.stringify({
                  type: "end",
                  action: "end",
                  message: `The word "${wordToGuess}" has been guessed! Game over.`,
                  wordToGuess: wordToGuess,
                  displayWord: displayWord,  // Send the complete word
                  guesses: guesses,
                  players: players.map((p) => ({ player: p.player, role: p.role })),
                })
              );
              return;
            }

            // if user is out of guesses

            wss.broadcast(
              JSON.stringify({
                type:"update",
                message: `${data.player} guessed: ${g}`,
                guesses: guesses,
                wordToGuess: wordToGuess,
                displayWord: displayWord,
              })
            );

          }

        }
      } catch (err) {
        console.log("message error: ", err.message);
      }
    });

    // ws connection closed
    ws.on("close", () => {
      console.log("client disconnected");
    });
  });

  return wss;
}
module.exports = websocket;
