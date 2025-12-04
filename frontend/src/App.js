import React from "react";
import { Route, Routes } from "react-router-dom";

import Speed from "./components/speed.js";
import Welcome from "./components/welcome.js";
import Waiting from "./components/waiting.js";
import Dashboard from "./components/dashboard.js";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/speed" element={<Speed />} />
        <Route path="/" element={<Welcome />} />
        <Route path="/waiting" element={<Waiting />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default App;
