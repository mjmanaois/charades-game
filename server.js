const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ----------------------
// GAME STATE
// ----------------------
let players = [];
let currentWord = "";
let drawerId = null;

const words = [
  "apple",
  "dog",
  "car",
  "house",
  "bicycle",
  "tree",
  "phone",
  "guitar",
  "sun",
  "rain"
];

// ----------------------
// SOCKET CONNECTION
// ----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ----------------------
  // JOIN GAME
  // ----------------------
  socket.on("joinGame", (name) => {
    socket.name = name;
    players.push({ id: socket.id, name });

    io.emit("players", players.map(p => p.name));

    io.emit("chat", `🎉 ${name} joined the game`);
  });

  // ----------------------
  // START NEW ROUND
  // ----------------------
  socket.on("newRound", () => {
    if (players.length === 0) return;

    currentWord = words[Math.floor(Math.random() * words.length)];

    // pick random drawer
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    drawerId = randomPlayer.id;

    io.emit("clear"); // clear canvas for everyone

    // ONLY drawer sees the word
    io.to(drawerId).emit("word", currentWord);

    // others are notified
    io.emit("chat", "🎮 New round started! Someone is drawing...");
  });

  // ----------------------
  // DRAW EVENT
  // ----------------------
  socket.on("draw", (data) => {
    // broadcast drawing to ALL EXCEPT drawer
    socket.broadcast.emit("draw", data);
  });

  // ----------------------
  // CHAT / GUESS
  // ----------------------
  socket.on("guess", (text) => {
    const guess = text.toLowerCase().trim();

    // correct answer
    if (guess === currentWord) {
      io.emit("chat", `🏆 ${socket.name} guessed the word correctly!`);
      currentWord = ""; // end round
      return;
    }

    io.emit("chat", `${socket.name}: ${text}`);
  });

  // ----------------------
  // CLEAR CANVAS
  // ----------------------
  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });

  // ----------------------
  // DISCONNECT
  // ----------------------
  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);

    io.emit("players", players.map(p => p.name));

    io.emit("chat", `❌ ${socket.name || "A player"} left`);
  });
});

// ----------------------
// SERVER START
// ----------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
