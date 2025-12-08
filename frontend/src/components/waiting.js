import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import "./styles.css";

export default function Waiting() {
  const [dots, setDots] = useState("");
  const [message, setMessage] = useState([]);
  let intevalRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const playerName = location.state?.playerName;

  // use effect
  useEffect(() => {
    // connect websocket
    const websocket = new WebSocket(`ws://${document.location.hostname}:4000`);

    // web socket open
    websocket.onopen = () => {
      console.log("connected to websocket on front end");

      // get player data and sent
      const gameState = {
        type: "join",
        player: playerName,
      };

      websocket.send(JSON.stringify(gameState));

      // dots display
      intevalRef.current = setInterval(() => {
        setDots((prev) => moveDots(prev));
      }, 800);
    };

    // set messages as they come in
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessage((prevMessage) => [...prevMessage, data.message]);

        // two players have been added
        if (data.action === "speed") {
          // clear dots interval
          clearInterval(intevalRef.current);

          // nav to hangman
          setTimeout(() => {
            navigate("/speed");
          }, 3000);
        }
      } catch (err) {
        console.log("error parsing data", err);
      }
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket server in waiting.js");
    };

    return () => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  function moveDots(d) {
    if (d === "") return ".";
    if (d === ".") return "..";
    if (d === "..") return "...";
    return "";
  }

  return (
    <div>
      <h1>Waiting room</h1>
      <p>Waiting for players to join{dots}</p>
      <p>{message.join(", ")}</p>
    </div>
  );
}
