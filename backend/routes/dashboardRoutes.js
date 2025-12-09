const express = require("express");
const dashboardRoutes = express.Router();
const dbo = require("../db/conn");

// Route to ADD a new game score
dashboardRoutes.route("/leaderboard/add").post(async (req, response) => {
  try {
    let db = dbo.getDB();
    let myObj = {
      Name: req.body.Name,
      Wins: req.body.Wins,
      Losses: req.body.Losses,
      numCardsRemaining: req.body.numCardsRemaining,
    };

    // Insert the object into the "scores" collection
    const result = await db.collection("scores").insertOne(myObj);
    response.json(result);
  } catch (err) {
    console.error("Error adding score:", err);
    response.status(500).json({ error: "Failed to add score" });
  }
});

// Route to get leaderboard data. Sorted by least amount of guesses (Ascending)
dashboardRoutes.route("/leaderboard").get(async (req, res) => {
  try {
    let db = dbo.getDB();
    const gameCollection = db.collection("scores");

    let query = {};
    // Filtering query by name
    if (req.query.name) {
      query = { Name: req.query.name };
    }

    // Getting all records
    // Sorting by: { numCardsRemaining: -1 } to get the highest number of cards remaining first
    const gameData = await gameCollection
      .find(query)
      .sort({ numCardsRemaining: -1 })
      .toArray();

    // Creating a list to put it all into
    const formattedLeaderboard = gameData.map((game) => {
      return {
        id: game._id.toString(),
        Name: game.Name,
        Wins: game.Wins,
        Losses: game.Losses,
        numCardsRemaining: game.numCardsRemaining,
      };
    });

    // Sending to frontend
    res.json({ leaderboard: formattedLeaderboard });
  } catch (err) {
    console.error("Error in /leaderboard:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard information" });
  }
});

module.exports = dashboardRoutes;
