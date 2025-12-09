import React, { useState, useEffect } from "react";
import "./dashboard.css";

export default function Dashboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [searchName, setSearchName] = useState("");

  // Fetch Leaderboard Data on Load
  useEffect(() => {
    async function getLeaderboard(nameFilter = "") {
      try {
        // If a name is provided, add to the URL
        let url = `http://${document.location.hostname}:4000/leaderboard`;
        if (nameFilter) {
          url += `?name=${encodeURIComponent(nameFilter)}`;
        }
        
        const response = await fetch(url, {
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

    const searchParams = new URLSearchParams(window.location.search);
    const nameFromUrl = searchParams.get("name");

    if (nameFromUrl) {
      setSearchName(nameFromUrl);
      getLeaderboard(nameFromUrl);
    } else {
      getLeaderboard();
    }
  }, []);

  // Calculating totals:
  const totalWins = leaderboardData.filter((game) => game.winner === true).length;
  const totalLosses = leaderboardData.filter((game) => game.winner === false).length;

  return (
    <div className="background">
      <div className="container">
        <header className="header">
          <h1>Game Leaderboard</h1>
          <p>Ranked by Cards Remaining (Highest First)</p>

          <div style={{ marginTopo: "1rem", fontSize: "1.2rem", fontWeight: "bold"}}>
             {searchName ? `Overall Stats for ${searchName}:` : `Overall Stats for __Player__: ${searchName}`}
             <span style ={{ color: "#4caf50", marginLeft: "10px" }}>Wins: {totalWins}</span>
             <span style ={{ color: "#f44336", marginLeft: "20px" }}>Losses: {totalLosses}</span>
          </div>
        </header>

        {/* Main Content */}
        <section className="dashboard-content">
          <div className="table-container">
            <div className="table-header-row">
              <div className="col">Name</div>
              <div className="col">Win/Loss</div>
              <div className="col text-right">Num of Cards Remaining for Losing Player</div>
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
                    <div className="col">{game.name}</div>
                    <div className="col">
                      {game.winner > 0 ? (
                        <span style={{ color: "#4caf50", fontWeight: "bold" }}>Win</span>
                      ) : (
                        <span style={{ color: "#f44336", fontWeight: "bold" }}>Loss</span>
                      )}
                    </div>
                    <div className="col text-right">{game.cardCount}</div>
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
