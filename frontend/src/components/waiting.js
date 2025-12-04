import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router"; 
import "./styles.css";

export default function Waiting() {
  const [dots, setDots] = useState(".");
  const [message, setMessage] = useState([]);
  let intevalRef = useRef(null);
  const navigate = useNavigate();
  const [player, setPlayer] = useState("");
  const [word, setWord] = useState("");

  // use effect
  useEffect(() => {
    let websocket;
    // get session data
    async function verify() {
      const response = await fetch(`http://localhost:4000/verify`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.status === "no session set") {
        navigate("/");
        return;
      }

      setPlayer(data.player);
      setWord(data.word);

      // connect websocket
      websocket = new WebSocket("ws://localhost:4000");

      // web socket open
      websocket.onopen = () => {
        console.log("connected to websocket on front end");

        // get player data and sent
        const gameState = {
          type: "join",
          player: data.player,
          word: data.word,
        };

        websocket.send(JSON.stringify(gameState));
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
          if (data.action === "hangman") {
            // clear dots interval
            clearInterval(intevalRef.current);

            // nav to hangman
            setTimeout(() => {
              navigate("/hangman");
            }, 3000);
          }
        } catch (err) {
          console.log("error parsing data");
        }
      };

      websocket.onclose = () => {
        console.log("Disconnected from WebSocket server");
      };
    }

    verify();

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
