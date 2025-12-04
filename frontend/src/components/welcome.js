import React, { useState } from "react";
import { useNavigate } from "react-router";
import "./styles.css";

export default function Welcome() {
  // vars and states
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    player: "",
    word: "",
    random: false,
  });

  // form update helper
  function updateForm(jsonObj) {
    return setForm((prevJsonObj) => {
      return { ...prevJsonObj, ...jsonObj };
    });
  }

  // function triggered by user submit
  async function onSubmit(e) {
    e.preventDefault();

    let data;
    let playerData = {};

    if (form.random) {
      // player object from form data without chosen word
      playerData = {
        player: form.player,
      };

      // send player data to back end for session use
      const responce = await fetch("http://localhost:4000/init-game-random", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      });

      // get and handle responce
      data = await responce.json();
    } else {
      // player object from form data
      playerData = {
        player: form.player,
        word: form.word,
      };

      // send player data to back end for session use
      const responce = await fetch("http://localhost:4000/init-game", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      });

      // get and handle responce
      data = await responce.json();
    }

    // confirm session set correctly
    if (data.message === "session set") {
      console.log("Data recieved from route /init-game: ", data);
      navigate("/waiting");
    } else {
      setErrorMessage("Problem setting session data.");
    }
  }

  // display
  return (
    <div className="body">
      <h1>Welcome to hangman!</h1>
      <h3>Enter your name and a word for your opponent to guess</h3>
      <form onSubmit={onSubmit}>
        <div>
          <label>Player name: </label>
          <input
            type="text"
            id="player-name"
            value={form.player}
            onChange={(e) => updateForm({ player: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Word: </label>
          <input
            type="text"
            id="word"
            placeholder="non-random type here"
            value={form.word}
            onChange={(e) => updateForm({ word: e.target.value })}
          />
        </div>
        <div>
          <label>Random word: </label>
          <input
            type="checkbox"
            id="random"
            checked={form.random}
            onChange={(e) => updateForm({ random: e.target.checked })}
          />
        </div>
        <br />
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
