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
const players = [];
let currentDrawerIndex = 0;
let currentWord = "";
let gameStarted = false;

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
 * UTIL: RANDOM WORD
 */
function getWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * UTIL: BROADCAST PLAYERS
 */
function updatePlayers() {
  io.emit("playerList", players.map(p => ({ name: p.name })));
}

/**
 * START ROUND
 */
function startRound() {
  if (players.length < 2) return;

  currentWord = getWord();

  const drawer = players[currentDrawerIndex];
  const guesser = players[(currentDrawerIndex + 1) % players.length];

  io.emit("clearCanvas");

  // Drawer gets the word
  drawer.socket.emit("yourTurn", {
    role: "drawer",
    word: currentWord
  });

  // Guesser only gets instruction
  guesser.socket.emit("yourTurn", {
    role: "guesser",
    message: "Guess the word from the drawing!"
  });

  io.emit("systemMessage", `🎨 ${drawer.name} is drawing now`);
}

/**
 * NEXT TURN
 */
function nextTurn() {
  currentDrawerIndex = (currentDrawerIndex + 1) % players.length;
  startRound();
}

/**
 * SOCKET HANDLING
 */
io.on("connection", (
