const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/**
 * Game State
 */
let players = [];
let gameStarted = false;

let currentDrawerIndex = 0;
let currentWord = "";
let drawingData = []; // store strokes so new users can sync

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
 * Helper: start a round
 */
function startRound() {
  if (players.length < 2) return;

  drawingData = [];

  const drawer = players[currentDrawerIndex];
  currentWord = words[Math.floor(Math.random() * words.length)];

  io.emit("clearCanvas");

  io.to(drawer.id).emit("yourTurn", {
    word: currentWord
  });

  players.forEach(p => {
    if (p.id !== drawer.id) {
      io.to(p.id).emit("guessTurn", {
        message: "Guess the word!"
      });
    }
  });

  io.emit("systemMessage", `New round started! Drawer is ${drawer.name}`);
}

/**
 * Next turn
 */
function nextTurn() {
  currentDrawerIndex++;

  if (currentDrawerIndex >= players.length) {
    currentDrawerIndex = 0;
  }

  startRound();
}

/**
 * Socket connection
 */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinGame", (name) => {
    players.push({ id: socket.id, name });

    io.emit("systemMessage", `${name} joined the game`);

    if (players.length >= 2 && !gameStarted) {
      gameStarted = true;
      startRound();
    }
  });

  /**
   * Drawing sync (broadcast to everyone INCLUDING guesser)
   */
  socket.on("draw", (data) => {
    drawingData.push(data);
    socket.broadcast.emit("draw", data);
  });

  /**
   * Send full canvas history to new users
   */
  socket.on("requestCanvasSync", () => {
    socket.emit("syncCanvas", drawingData);
  });

  /**
   * Guess checking
   */
  socket.on("guess", (text) => {
    if (text.toLowerCase() === currentWord.toLowerCase()) {
      io.emit("systemMessage", `🎉 Correct guess! The word was "${currentWord}"`);

      nextTurn();
    } else {
      socket.emit("systemMessage", "❌ Wrong guess, try again!");
    }
  });

  /**
   * Disconnect handling
   */
  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);

    io.emit("systemMessage", "A player left the game");

    if (players.length < 2) {
      gameStarted = false;
    } else {
      if (currentDrawerIndex >= players.length) {
        currentDrawerIndex = 0;
      }
      startRound();
    }
  });
});

/**
 * Start server (Render / Railway compatible)
 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
