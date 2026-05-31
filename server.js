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
let gameStarted = false;
let currentDrawerIndex = 0;
let currentWord = "";

/**
 * WORD BANK
 */
const WORDS = [
  "apple",
  "dog",
  "car",
  "house",
  "pizza",
  "computer",
  "bicycle",
  "phone",
  "tree",
  "book"
];

/**
 * GET RANDOM WORD
 */
function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * UPDATE PLAYER LIST
 */
function updatePlayers() {
  io.emit("playerList", players.map(p => ({ name: p.name })));
}

/**
 * START ROUND
 */
function startRound() {
  if (players.length < 2) return;

  currentWord = getRandomWord();

  const drawer = players[currentDrawerIndex];
  const guesser = players[(currentDrawerIndex + 1) % players.length];

  io.emit("clearCanvas");

  /**
   * IMPORTANT FIX:
   * DO NOT alert word
   * SEND TO UI instead
   */

  drawer.socket.emit("gameRole", {
    role: "drawer",
    word: currentWord,
    message: "You are drawing"
  });

  guesser.socket.emit("gameRole", {
    role: "guesser",
    message: "Guess the word from the drawing"
  });

  io.emit("systemMessage", `🎨 ${drawer.name} is drawing now!`);
}

/**
 * NEXT TURN
 */
function nextTurn() {
  currentDrawerIndex = (currentDrawerIndex + 1) % players.length;
  startRound();
}

/**
 * SOCKET CONNECTION
 */
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  /**
   * JOIN GAME
   */
  socket.on("joinGame", (name) => {
    if (!name) return;

    if (players.find(p => p.id === socket.id)) return;

    if (players.length >= 2) {
      socket.emit("systemMessage", "Game is full (2 players only)");
      return;
    }

    players.push({
      id: socket.id,
      name,
      socket
    });

    updatePlayers();

    io.emit("systemMessage", `${name} joined the game`);

    if (players.length === 2 && !gameStarted) {
      gameStarted = true;
      startRound();
    }
  });

  /**
   * START GAME MANUAL
   */
  socket.on("startGame", () => {
    if (players.length < 2) return;
    gameStarted = true;
    startRound();
  });

  /**
   * DRAW SYNC (FIXED)
   */
  socket.on("draw", (data) => {
    // send to everyone except drawer
    socket.broadcast.emit("draw", data);
  });

  /**
   * GUESS CHECK
   */
  socket.on("guess", (guess) => {
    if (!currentWord) return;

    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedWord = currentWord.toLowerCase().trim();

    if (normalizedGuess === normalizedWord) {
      const winner = players.find(p => p.id === socket.id);

      io.emit("systemMessage", `🎉 ${winner.name} guessed correctly!`);

      setTimeout(() => {
        nextTurn();
      }, 1500);
    } else {
      socket.emit("systemMessage", "❌ Wrong guess");
    }
  });

  /**
   * DISCONNECT FIX
   */
  socket.on("disconnect", () => {
    const index = players.findIndex(p => p.id === socket.id);

    if (index !== -1) {
      const name = players[index].name;
      players.splice(index, 1);

      io.emit("systemMessage", `${name} left`);
      updatePlayers();
    }

    gameStarted = false;
  });
});

/**
 * START SERVER
 */
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
