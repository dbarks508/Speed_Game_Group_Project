import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import "./styles.css";
import { CardComponent, PileComponent } from "./card";

export default function Speed() {
  const navigate = useNavigate();

  const [ws, setWs] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [gameState, setGameState] = useState(undefined);

  const player = new URLSearchParams(window.location.search).get("playerName");


  // use effect
  useEffect(() => {
    const websocket = new WebSocket(`ws://${document.location.hostname}:4000`);
    setWs(websocket);

    websocket.onopen = () => {
      console.log("speed.js connected");

      // request gamedata
      websocket.send(JSON.stringify({type: "join", player}));
      websocket.send(JSON.stringify({type: "update", player}));
    };

    // handle message
    websocket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("Websocket message: " + JSON.stringify(msg));

        // handle game actions
        if (msg.type === "update") {
          setGameState(msg.state);
        }

        // end the game if end game msg is sent
        if (msg.type === "end") {
          postScores(msg);

          console.log("Game ended, navigating to scores...");
          setTimeout(() => navigate("/dashboard"), 5_000);
        }

        // handle errors
        if (msg.error) {
          console.error(msg.error);
          setErrorMessage(msg.error);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // disconnect
    websocket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      if (websocket && websocket.readyState === WebSocket.OPEN)
        websocket.close();
    };
  }, []);

  useEffect(() => {
    if(errorMessage != undefined && errorMessage.length > 0) alert(errorMessage);
  }, [errorMessage]);

  if(gameState == undefined) return (<div>Loading...</div>);

  async function postScores(msg) {
    const stats = {
      name: player,
      win: msg.win,
      losingCardsLeft: msg.losingHandCount,
    };

    const response = await fetch(`http://${document.location.hostname}:4000/postScores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stats),
    });

    if (!response.ok) {
      console.log("error posting scores");
    }
  }


  function validateDrop(discardIndex) {
    return (suit, number) => {
      let other = gameState.discardTops[discardIndex].number;
      return Math.abs(number - other) % 13 === 1 ||
        (number == 1 && other == 13) ||
        (other == 1 && number == 13);
    };
  }
  function onDiscard(discardIndex) {
    return (suit, number) => {
      let card = {suit, number};

      if (!gameState.hand.some(({suit: s, number: n}) => s == suit && n == number)) return;
      if (!validateDrop(discardIndex)(suit, number)) return;

      ws.send(JSON.stringify({type: "play", card, discardPile: discardIndex, player}))
    };
  }

  return (
    <div className="speed-body">
      {/* first column */}
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div className="deck">
          <p>{gameState.deckCount[0]} cards remaining</p>
          {gameState.deckCount[0] > 0 ? <CardComponent /> : <PileComponent filterDrop={() => false}/>}
        </div>
      </div>

      {/* middle column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* first row */}
        <div className="hand">
          {new Array(gameState.otherHandCount).fill().map((_, i) => (
            <CardComponent key={i} />
          ))}
        </div>

        {/* middle row */}
        <div>
          <PileComponent filterDrop={() => false} cards={gameState.sideCount[0] > 0 ? [{}]:[]} />
          <PileComponent
            filterDrop={validateDrop(0)}
            onDrop={onDiscard(0)}
            revealed={true}
            cards={gameState.discardTops[0] != undefined ? [gameState.discardTops[0]]:[]}
          />

          <PileComponent
            filterDrop={validateDrop(1)}
            onDrop={onDiscard(1)}
            revealed={true}
            cards={gameState.discardTops[1] != undefined ? [gameState.discardTops[1]]:[]}
          />
          <PileComponent filterDrop={() => false} cards={gameState.sideCount[1] > 0 ? [{}]:[]} />
        </div>

        {/* last row */}
        <div className="hand">
          {gameState.hand.map((c, i) => (
            <CardComponent
              key={i}
              suit={c.suit}
              number={c.number}
              revealed={true}
              isDragable={true}
            />
          ))}
        </div>
      </div>

      {/* last column */}
      <div>
        <div className="deck">
          {gameState.deckCount[1] > 0 ? <CardComponent /> : <PileComponent filterDrop={() => false}/>}
          <p>{gameState.deckCount[1]} cards remaining</p>
        </div>
      </div>
    </div>
  );
}
