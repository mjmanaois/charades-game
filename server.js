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
let readyPlayers = new Set();
let gameStarted = false;

let currentWord = "";
let drawerIndex = 0;

const words = [
  "apple",
  "bicycle",
  "computer",
  "elephant",
  "guitar",
  "pizza",
  "airplane"
];

/**
 * UTILITY: pick random word
 */
function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

/**
 * START GAME
 */
function startGame() {
  if (players.length < 2) return;

  gameStarted = true;
  currentWord = getRandomWord();

  const drawer = players[drawerIndex % players.length];
  const guesser = players[(drawerIndex + 1) % players.length];

  io.to(drawer.id).emit("role", {
    role: "drawer",
    word: currentWord
  });

  io.to(guesser.id).emit("role", {
    role: "guesser"
  });

  io.emit("gameMessage", "Game started!");
}

/**
 * SWITCH TURNS
 */
function nextRound() {
  drawerIndex++;
  currentWord = getRandomWord();

  const drawer = players[drawerIndex % players.length];
  const guesser = players[(drawerIndex + 1) % players.length];

  io.to(drawer.id).emit("role", {
    role: "drawer",
    word: currentWord
  });

  io.to(guesser.id).emit("role", {
    role: "guesser"
  });

  io.emit("gameMessage", "Correct! Switching roles...");
}

/**
 * SOCKET CONNECTION
 */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinGame", () => {
    if (players.length >= 2) {
      socket.emit("gameFull");
      return;
    }

    players.push(socket);
    io.emit("playerCount", players.length);
  });

  socket.on("playerReady", () => {
    readyPlayers.add(socket.id);

    if (players.length === 2 && readyPlayers.size === 2 && !gameStarted) {
      startGame();
    }
  });

  socket.on("guess", (guess) => {
    if (!gameStarted) return;

    if (guess.toLowerCase() === currentWord.toLowerCase()) {
      io.emit("gameMessage", `Correct guess: ${currentWord}`);
      nextRound();
    }
  });

  socket.on("disconnect", () => {
    players = players.filter((p) => p.id !== socket.id);
    readyPlayers.delete(socket.id);

    gameStarted = false;

    io.emit("playerCount", players.length);
    io.emit("gameMessage", "A player left. Game reset.");
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
