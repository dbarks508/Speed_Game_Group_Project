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


  function send(data){
    ws.send(JSON.stringify({...data, player}));
  }

  // use effect
  useEffect(() => {
    const websocket = new WebSocket(`ws://${document.location.hostname}:4000`);
    setWs(websocket);

    websocket.onopen = () => {
      console.log("speed.js connected");

      // request gamedata
      send({type: "update"});
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
  }, [errorMessage])

  

  // use if necesssary
  // // determine if this player is the host
  // function isHost() {
  //   if (!data || !players.length) return false;
  //   const currPlayer = players.find((p) => p.player === data.player);
  //   return currPlayer && currPlayer.role === "host";
  // }
  //   async function postScores() {
  //     const stats = {
  //       userID: "todo",
  //       Name: players[0],
  //       phraseGuessed: "",
  //       numberOfGuesses: 0,
  //       fromDatabaseOrCustom: "todo",
  //       successfulOrNot: "todo",
  //     };

  //     const response = await fetch(`http://${document.location.hostname}:4000/postScores`, {
  //       method: "POST",
  //       credentials: "include",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(stats),
  //     });

  //     if (!response.ok) {
  //       console.log("error posting scores");
  //     }
  //   }


  function validateDrop(discardIndex) {
    return (suit, number) => Math.abs(number - gameState.discardTops[discardIndex].number) % 13 === 1;
  }
  function onDiscard(discardIndex) {
    return (suit, number) => {
      let card = {suit, number};

      if (!gameState.hand.some(({suit: s, number: n}) => s == suit && n == number)) return;
      if (!validateDrop(discardIndex)(suit, number)) return;

      send({type: "play", card, discardPile: discardIndex});
    };
  }

  return (
    <div className="speed-body">
      {/* first column */}
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div className="deck">
          <p>{gameState.decks[1].length} cards remaining</p>
          {gameState.decks[1].length > 0 ? <CardComponent /> : <PileComponent filterDrop={() => false}/>}
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
          <PileComponent filterDrop={() => false} cards={gameState.sidePiles[0].length > 0 ? [{}]:[]} />
          <PileComponent
            filterDrop={validateDrop(0)}
            onDrop={onDiscard(0)}
            revealed={true}
            cards={[gameState.discardTops[0]]}
          />

          <PileComponent
            filterDrop={validateDrop(1)}
            onDrop={onDiscard(1)}
            revealed={true}
            cards={[gameState.discardTops[1]]}
          />
          <PileComponent filterDrop={() => false} cards={gameState.sidePiles[1].length > 0 ? [{}]:[]} />
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
          {gameState.decks[0].length > 0 ? <CardComponent /> : <PileComponent filterDrop={() => false}/>}
          <p>{gameState.decks[0].length} cards remaining</p>
        </div>
      </div>
    </div>
  );
}
