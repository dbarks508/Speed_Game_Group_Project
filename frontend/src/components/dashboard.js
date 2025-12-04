import React, { useState, useEffect } from "react";
import "./dashboard.css";

export default function Dashboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);

  // Fetch Leaderboard Data on Load
  useEffect(() => {
    async function getLeaderboard() {
      try {
        const response = await fetch(`http://localhost:4000/leaderboard`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (data.leaderboard) {
          setLeaderboardData(data.leaderboard);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    }

    getLeaderboard();
  }, []);

  return (
    <div className="background">
      <div className="container">
        <header className="header">
          <h1>Game Leaderboard</h1>
          <p>Ranked by least guesses</p>
        </header>

        {/* Main Content */}
        <section className="dashboard-content">
          <div className="table-container">
            <div className="table-header-row">
              <div className="col">Rank</div>
              <div className="col">Player Name</div>
              <div className="col">Phrase</div>
              <div className="col">Source</div>
              <div className="col">Status</div>
              <div className="col text-right">Guesses</div>
            </div>

            <div className="table-body">
              {/* If there is no data in the database - Return error text */}
              {leaderboardData.length === 0 ? (
                <p style={{ padding: "1rem", textAlign: "center" }}>
                  No games played yet.
                </p>
              ) : (
                // Getting data and assigning it to the leaderboard rows
                leaderboardData.map((game, index) => (
                  <div className="table-row" key={index}>
                    <div className="col">
                      <span className="rank-badge">#{index + 1}</span>
                    </div>
                    <div className="col">{game.Name}</div>
                    <div className="col">{game.phraseGuessed}</div>
                    <div className="col">
                      <span className="tag">{game.fromDatabaseOrCustom}</span>
                    </div>
                    <div className="col">
                      {game.successfulOrNot ? "Success" : "Failed"}
                    </div>
                    <div className="col text-right font-large">
                      {game.numberOfGuesses}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
