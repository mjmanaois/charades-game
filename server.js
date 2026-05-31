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
let currentDrawerIndex = 0;

const words = [
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

let currentWord = "";
let gameStarted = false;

/**
 * GET RANDOM WORD
 */
function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
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

  // send role + word to drawer ONLY
  drawer.socket.emit("yourTurn", {
    role: "drawer",
    word: currentWord
  });

  // send role to guesser ONLY
  guesser.socket.emit("yourTurn", {
    role: "guesser",
    message: "Guess the word based on the drawing!"
  });

  io.emit("systemMessage", `${drawer.name} is drawing now!`);
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
    if (players.length >= 2) {
      socket.emit("systemMessage", "Game is full (2 players max)");
      return;
    }

    players.push({
      id: socket.id,
      name,
      socket
    });

    io.emit(
      "systemMessage",
      `${name} joined the game (${players.length}/2)`
    );

    io.emit("playerList", players);

    if (players.length === 2 && !gameStarted) {
      gameStarted = true;
      startRound();
    }
  });

  /**
   * START GAME MANUALLY (optional button)
   */
  socket.on("startGame", () => {
    if (players.length < 2) return;

    gameStarted = true;
    startRound();
  });

  /**
   * DRAW SYNC
   */
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  /**
   * GUESS CHECK
   */
  socket.on("guess", (guess) => {
    if (guess.toLowerCase() === currentWord.toLowerCase()) {
      const winner = players.find((p) => p.id === socket.id);

      io.emit("systemMessage", `${winner.name} guessed correctly! 🎉`);

      // next turn rotation
      currentDrawerIndex =
        (currentDrawerIndex + 1) % players.length;

      setTimeout(() => {
        startRound();
      }, 1500);
    } else {
      socket.emit("systemMessage", "Wrong guess ❌");
    }
  });

  /**
   * DISCONNECT
   */
  socket.on("disconnect", () => {
    players = players.filter((p) => p.id !== socket.id);

    io.emit("playerList", players);
    io.emit("systemMessage", "A player left the game");

    if (players.length < 2) {
      gameStarted = false;
    }
  });
});

/**
 * START SERVER
 */
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
