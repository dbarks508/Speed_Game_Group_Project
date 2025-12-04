const express = require("express");
const dashboardRoutes = express.Router();
const dbo = require("../db/conn");

// Route to get leaderboard data. Sorted by least amount of guesses (Ascending)
dashboardRoutes.route("/leaderboard").get(async (req, res) => {
  try {
    let db = dbo.getDB();
    const gameCollection = db.collection("game_data");

    // Getting all records
    // Sorting by: { numberOfGuesses: 1 } to get the smallest number first
    const gameData = await gameCollection
      .find({})
      .sort({ numberOfGuesses: 1 })
      .toArray();

    // Creating a list to put it all into
    const formattedLeaderboard = gameData.map((game) => {
      return {
        // Converting Mongo ID to string just in case React needs a key
        id: game._id.toString(),
        userID: game.userID,
        Name: game.Name, // Using Capital N as seen in your DB screenshot
        phraseGuessed: game.phraseGuessed,
        numberOfGuesses: game.numberOfGuesses,
        fromDatabaseOrCustom: game.fromDatabaseOrCustom,
        successfulOrNot: game.successfulOrNot,
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
