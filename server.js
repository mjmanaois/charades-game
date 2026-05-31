const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/**
 * GAME STATE
 */
let players = [];
let gameActive = false;

let currentDrawer = null;
let currentWord = "";
let drawingData = [];

const words = [
  "apple",
  "car",
  "house",
  "dog",
  "bicycle",
  "tree",
  "phone",
  "pizza",
  "computer",
  "fish"
];

/**
 * START ROUND (random drawer)
 */
function startRound() {
  if (players.length < 2) {
    io.emit("systemMessage", "Need at least 2 players to start.");
    return;
  }

  drawingData = [];

  // pick random drawer
  currentDrawer = players[Math.floor(Math.random() * players.length)];

  // pick word
  currentWord = words[Math.floor(Math.random() * words.length)];

  io.emit("clearCanvas");

  // send word ONLY to drawer
  io.to(currentDrawer.id).emit("yourTurn", {
    word: currentWord
  });

  // notify guessers
  players.forEach(p => {
    if (p.id !== currentDrawer.id) {
      io.to(p.id).emit("guessTurn", {
        message: `${currentDrawer.name} is drawing. Guess the word!`
      });
    }
  });

  io.emit(
    "systemMessage",
    `🎨 ${currentDrawer.name} is now drawing!`
  );

  gameActive = true;
}

/**
 * SOCKET CONNECTION
 */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /**
   * JOIN GAME
   */
  socket.on("joinGame", (name) => {
    players.push({ id: socket.id, name });

    io.emit("systemMessage", `${name} joined the game`);

    io.emit("playerList", players);
  });

  /**
   * START ROUND BUTTON CLICKED
   */
  socket.on("startRound", () => {
    if (gameActive) {
      socket.emit("systemMessage", "Round already in progress!");
      return;
    }

    startRound();
  });

  /**
   * DRAW EVENT (broadcast to all INCLUDING guessers)
   */
  socket.on("draw", (data) => {
    drawingData.push(data);
    socket.broadcast.emit("draw", data);
  });

  /**
   * SYNC CANVAS FOR NEW PLAYERS
   */
  socket.on("requestCanvasSync", () => {
    socket.emit("syncCanvas", drawingData);
  });

  /**
   * GUESS CHECK
   */
  socket.on("guess", (text) => {
    if (!gameActive) return;

    if (text.toLowerCase() === currentWord.toLowerCase()) {
      io.emit(
        "systemMessage",
        `🎉 ${text} is correct! The word was "${currentWord}"`
      );

      gameActive = false;
      currentDrawer = null;
      currentWord = "";

      io.emit("clearCanvas");
    } else {
      socket.emit("systemMessage", "❌ Wrong guess!");
    }
  });

  /**
   * DISCONNECT
   */
  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);

    io.emit("playerList", players);

    io.emit("systemMessage", "A player left");

    // if drawer left, end round
    if (currentDrawer && socket.id === currentDrawer.id) {
      gameActive = false;
      currentDrawer = null;
      currentWord = "";
      io.emit("clearCanvas");
      io.emit("systemMessage", "Drawer left. Round ended.");
    }
  });
});

/**
 * SERVER START
 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
