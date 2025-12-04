import React, { useState } from "react";
import { useNavigate } from "react-router";
import "./styles.css";

export default function Welcome() {
  // vars and states
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [playerName, setPlayerName] = useState("");

  // function triggered by user submit
  async function onSubmit(e) {
    e.preventDefault();

    if (!playerName) {
      return;
    }

    navigate("/waiting", { state: { playerName: playerName } });
  }

  // display
  return (
    <div className="body">
      <h1>Welcome to the Game of Speed</h1>
      <h3>Enter your player name to joing the waiting room.</h3>
      <form onSubmit={onSubmit}>
        <div>
          <label>Name: </label>
          <input
            type="text"
            id="player-name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
          />
        </div>
        <div>
          <input type="submit" value="Submit"></input>
        </div>
      </form>
      <div>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      </div>
    </div>
  );
}
