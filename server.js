const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];

let gameStarted = false;
let currentDrawerIndex = 0;

let currentWord = "";
let drawingData = [];

const words = [
  "apple", "car", "house", "dog", "bicycle",
  "tree", "phone", "pizza", "computer", "fish"
];

/**
 * START GAME (ONLY 2 PLAYERS)
 */
function startRound() {
  if (players.length !== 2) {
    io.emit("systemMessage", "Game requires exactly 2 players.");
    return;
  }

  drawingData = [];

  const drawer = players[currentDrawerIndex];
  const guesser = players[1 - currentDrawerIndex];

  currentWord = words[Math.floor(Math.random() * words.length)];

  io.emit("clearCanvas");

  // Drawer gets word
  io.to(drawer.id).emit("yourTurn", {
    role: "drawer",
    word: currentWord
  });

  // Guesser gets only hint
  io.to(guesser.id).emit("yourTurn", {
    role: "guesser",
    message: "Guess what the other player is drawing!"
  });

  io.emit("systemMessage", `🎨 ${drawer.name} is drawing`);

  gameStarted = true;
}

/**
 * NEXT TURN (SWAP ROLES)
 */
function nextRound() {
  currentDrawerIndex = 1 - currentDrawerIndex;
  startRound();
}

/**
 * SOCKET CONNECTION
 */
io.on("connection", (socket) => {

  socket.on("joinGame", (name) => {
    if (players.length >= 2) {
      socket.emit("systemMessage", "Game already has 2 players");
      return;
    }

    players.push({ id: socket.id, name });

    io.emit("playerList", players);

    io.emit("systemMessage", `${name} joined`);

    if (players.length === 2) {
      io.emit("systemMessage", "2 players ready! Click Start Game.");
    }
  });

  /**
   * START GAME BUTTON
   */
  socket.on("startGame", () => {
    if (players.length !== 2) {
      socket.emit("systemMessage", "Need exactly 2 players.");
      return;
    }

    currentDrawerIndex = 0;
    startRound();
  });

  /**
   * DRAWING
   */
  socket.on("draw", (data) => {
    drawingData.push(data);
    socket.broadcast.emit("draw", data);
  });

  socket.on("requestCanvasSync", () => {
    socket.emit("syncCanvas", drawingData);
  });

  /**
   * GUESS CHECK
   */
  socket.on("guess", (text) => {
    if (!gameStarted) return;

    if (text.toLowerCase() === currentWord.toLowerCase()) {
      io.emit("systemMessage", `🎉 Correct! Word was "${currentWord}"`);

      nextRound();
    } else {
      socket.emit("systemMessage", "❌ Wrong guess");
    }
  });

  /**
   * DISCONNECT
   */
  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);

    io.emit("playerList", players);

    gameStarted = false;
    currentDrawerIndex = 0;

    io.emit("clearCanvas");
    io.emit("systemMessage", "Player left. Game reset.");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on", PORT));
