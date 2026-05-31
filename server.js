const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let gameActive = false;

let currentDrawer = null;
let currentWord = "";
let drawingData = [];

const words = [
  "apple", "car", "house", "dog", "bicycle",
  "tree", "phone", "pizza", "computer", "fish"
];

/**
 * START ROUND
 */
function startRound() {
  if (players.length < 2) {
    io.emit("systemMessage", "Need at least 2 players.");
    return;
  }

  drawingData = [];

  currentDrawer = players[Math.floor(Math.random() * players.length)];
  currentWord = words[Math.floor(Math.random() * words.length)];

  io.emit("clearCanvas");

  io.to(currentDrawer.id).emit("yourTurn", {
    word: currentWord
  });

  players.forEach(p => {
    if (p.id !== currentDrawer.id) {
      io.to(p.id).emit("guessTurn", {
        message: `${currentDrawer.name} is drawing. Guess!`
      });
    }
  });

  io.emit("systemMessage", `🎨 ${currentDrawer.name} is drawing!`);
  gameActive = true;
}

/**
 * SOCKET.IO
 */
io.on("connection", (socket) => {

  socket.on("joinGame", (name) => {
    players.push({ id: socket.id, name });
    io.emit("playerList", players);
    io.emit("systemMessage", `${name} joined`);
  });

  socket.on("startRound", () => {
    if (gameActive) {
      socket.emit("systemMessage", "Round already running");
      return;
    }
    startRound();
  });

  socket.on("draw", (data) => {
    drawingData.push(data);
    socket.broadcast.emit("draw", data);
  });

  socket.on("requestCanvasSync", () => {
    socket.emit("syncCanvas", drawingData);
  });

  socket.on("guess", (text) => {
    if (!gameActive) return;

    if (text.toLowerCase() === currentWord.toLowerCase()) {
      io.emit("systemMessage", `🎉 Correct! Word was ${currentWord}`);

      gameActive = false;
      currentDrawer = null;
      currentWord = "";

      io.emit("clearCanvas");
    } else {
      socket.emit("systemMessage", "❌ Wrong guess");
    }
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit("playerList", players);

    if (currentDrawer?.id === socket.id) {
      gameActive = false;
      io.emit("clearCanvas");
      io.emit("systemMessage", "Drawer left. Round ended.");
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on", PORT));
