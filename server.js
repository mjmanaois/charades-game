const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let currentWord = "";

const words = ["apple", "dog", "car", "house", "bicycle", "tree"];

io.on("connection", (socket) => {

  socket.on("joinGame", (name) => {
    socket.name = name;
    players.push(name);
    io.emit("players", players);
  });

  socket.on("newRound", () => {
    currentWord = words[Math.floor(Math.random() * words.length)];

    socket.emit("word", currentWord); // only drawer sees word
    io.emit("chat", "🎮 New round started!");
  });

  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("guess", (text) => {
    if (text.toLowerCase() === currentWord) {
      io.emit("chat", `🏆 ${socket.name} guessed the word!`);
    } else {
      io.emit("chat", `${socket.name}: ${text}`);
    }
  });

  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p !== socket.name);
    io.emit("players", players);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Running on", PORT));
