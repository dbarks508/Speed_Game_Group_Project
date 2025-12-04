// ----- requires -----
const express = require("express");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const WebSocket = require("ws");
require("dotenv").config({ path: "./config.env" });
const port = process.env.PORT;

const app = express();
const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// ----- middleware -----
// cors
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// session
app.use(
  session({
    secret: "keyboard cat",
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
      mongoUrl: process.env.ATLAS_URI,
    }),
  })
);

const dashboardRoutes = require("./routes/dashboardRoutes");
const dbo = require("./db/conn");
const { json } = require("stream/consumers");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- routes -----
app.use(require("./routes/game"));
app.use(dashboardRoutes);

// connect websocket.js
const websocket = require("./websocket");
websocket(server);

// ----- app listening -----
server.listen(port, () => {
  dbo.connectToServer(function (err) {
    if (err) {
      console.err(err);
    }
  });
  console.log(`Server is running on port ${port}`);
});
