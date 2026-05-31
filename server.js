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
  io.emit(
    "playerList",
    players.map((p) => ({ name: p.name }))
  );
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

  // Drawer ONLY gets the word
  drawer.socket.emit("yourTurn", {
    role: "drawer",
    word: currentWord
  });

  // Guesser gets only instruction
  guesser.socket.emit("yourTurn", {
    role: "guesser",
    message: "Guess the word from the drawing!"
  });

  io.emit("systemMessage", `🎨 ${drawer.name} is drawing!`);
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
  console.log("User connected:", socket.id);

  /**
   * JOIN GAME
   */
  socket.on("joinGame", (name) => {
    if (!name) return;

    // prevent duplicate entries (refresh bug fix)
    const existing = players.find((p) => p.id === socket.id);
    if (existing) return;

    if (players.length >= 2) {
      socket.emit("systemMessage", "Game is full (2 players max)");
      return;
    }

    players.push({
      id: socket.id,
      name,
      socket
    });

    updatePlayers();

    io.emit(
      "systemMessage",
      `${name} joined (${players.length}/2)`
    );

    // auto start when 2 players ready
    if (players.length === 2 && !gameStarted) {
      gameStarted = true;
      startRound();
    }
  });

  /**
   * START GAME MANUAL (optional button)
   */
  socket.on("startGame", () => {
    if (players.length < 2) return;

    gameStarted = true;
    startRound();
  });

  /**
   * DRAWING SYNC
   */
  socket.on("draw", (data) => {
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
      const winner = players.find((p) => p.id === socket.id);

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
    const index = players.findIndex((p) => p.id === socket.id);

    if (index !== -1) {
      const name = players[index].name;
      players.splice(index, 1);

      io.emit("systemMessage", `${name} left the game`);
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
