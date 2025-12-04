import React from "react";
import { Route, Routes } from "react-router-dom";

import Hangman from "./components/hangman.js";
import Welcome from "./components/welcome.js";
import Waiting from "./components/waiting.js";
import Dashboard from "./components/dashboard.js";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/hangman" element={<Hangman />} />
        <Route path="/" element={<Welcome />} />
        <Route path="/waiting" element={<Waiting />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default App;
