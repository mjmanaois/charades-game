const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend
app.use(express.static("public"));

// Store players
let players = [];

// Word list for charades
const words = [
  "apple",
  "bicycle",
  "teacher",
  "dancing",
  "basketball",
  "airplane",
  "guitar",
  "phone",
  "sleeping",
  "running"
];

// ----------------------
// Socket.io connection
// ----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join game
  socket.on("joinGame", (name) => {
    socket.username = name;

    players.push(name);

    io.emit("playersUpdate", players);
    io.emit("chatMessage", `🎉 ${name} joined the game`);
  });

  // Chat system
  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", msg);
  });

  // Get random word
  socket.on("getWord", () => {
    const word = words[Math.floor(Math.random() * words.length)];

    // send only to requester (important for charades)
    socket.emit("newWord", word);
  });

  // Start game
  socket.on("startGame", () => {
    io.emit("chatMessage", "🎮 Game has started!");
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.username) {
      players = players.filter((p) => p !== socket.username);

      io.emit("playersUpdate", players);
      io.emit("chatMessage", `❌ ${socket.username} left the game`);
    }

    console.log("User disconnected:", socket.id);
  });
});

// ----------------------
// Port setup (IMPORTANT for Render)
// ----------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
