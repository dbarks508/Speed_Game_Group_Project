const express = require("express");
const gameRoutes = express.Router();
const dbo = require("../db/conn");

gameRoutes.post("/init-game", (req, res) => {
  const { player, word } = req.body;

  if (!player) {
    return res.status(400).send("no player data");
  }

  req.session.player = player;
  req.session.word = word;

  res.send({ message: "session set" });
});

gameRoutes.post("/init-game-random", async (req, res) => {
  const { player } = req.body;

  if (!player) {
    return res.status(400).send("no player data");
  }

  // get random word from db
  let db = dbo.getDB();
  const randomWordCollection = db.collection("random_words");
  const randomWord = await randomWordCollection
    .aggregate([{ $sample: { size: 1 } }])
    .toArray();

  req.session.player = player;
  req.session.word = randomWord[0].word;

  console.log(
    `Session player and word: ${req.session.player} | ${req.session.word}`
  );

  res.send({ message: "session set" });
});

gameRoutes.route("/postScores").post(async (req, res) => {
  try {
    const {
      userId,
      Name,
      phraseGuessed,
      numberOfGuesses,
      fromDatabaseOrCustom,
      successfulOrNot,
    } = req.body;

    let db = dbo.getDB();
    const gameCollection = db.collection("game_data");

    const scoreObject = {
      userID: userId,
      Name: Name,
      phraseGuessed: phraseGuessed,
      numberOfGuesses: numberOfGuesses,
      fromDatabaseOrCustom: fromDatabaseOrCustom,
      successfulOrNot: successfulOrNot,
    };

    const result = await gameCollection.insertOne(scoreObject);

    if (result.acknowledged) {
      return res.status(201).json({
        message: "Score successfully saved",
        id: result.insertedId,
      });
    } else {
      return res.status(500).json({ message: "Database insertion failed" });
    }
  } catch (err) {
    console.error("Backend posting scores error:", err);
    return res.status(500).json({ message: "Server error inserting score" });
  }
});

gameRoutes.get("/verify", (req, res) => {
  let status = "";
  if (!req.session.player) {
    status = "no session set";
  } else {
    status = "valid session";
  }

  // send data back
  const data = {
    status: status,
    player: req.session.player,
    word: req.session.word,
  };

  console.log(
    `Session player and word: ${req.session.player} | ${req.session.word}`
  );

  res.json(data);
});

module.exports = gameRoutes;
