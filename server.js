const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

const words = [
  "apple",
  "house",
  "dog",
  "cat",
  "car",
  "tree",
  "banana",
  "computer",
  "book",
  "phone"
];

function randomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {

    const room = Math.random().toString(36).substring(2, 7);

    rooms[room] = {
      players: [socket.id],
      turn: 0,
      word: randomWord(),
      scores: {}
    };

    rooms[room].scores[socket.id] = 0;

    socket.join(room);

    socket.emit("roomCreated", room);
  });

  socket.on("joinRoom", room => {

    if (!rooms[room]) {
      socket.emit("errorMsg", "Room not found");
      return;
    }

    if (rooms[room].players.length >= 2) {
      socket.emit("errorMsg", "Room full");
      return;
    }

    rooms[room].players.push(socket.id);
    rooms[room].scores[socket.id] = 0;

    socket.join(room);

    io.to(room).emit("gameStart", {
      players: rooms[room].players
    });

    startRound(room);
  });

  socket.on("draw", data => {
    socket.to(data.room).emit("draw", data);
  });

  socket.on("guess", ({ room, guess }) => {

    const currentRoom = rooms[room];

    if (!currentRoom) return;

    if (
      guess.toLowerCase() ===
      currentRoom.word.toLowerCase()
    ) {

      io.to(room).emit("correctGuess", guess);

      const guesser =
        currentRoom.players[
          (currentRoom.turn + 1) % 2
        ];

      currentRoom.scores[guesser]++;

      currentRoom.turn =
        (currentRoom.turn + 1) % 2;

      currentRoom.word = randomWord();

      startRound(room);
    }
  });

  socket.on("disconnect", () => {

    for (const room in rooms) {

      if (
        rooms[room].players.includes(socket.id)
      ) {

        io.to(room).emit(
          "errorMsg",
          "Player disconnected"
        );

        delete rooms[room];
      }
    }
  });
});

function startRound(room) {

  const currentRoom = rooms[room];

  const drawer =
    currentRoom.players[currentRoom.turn];

  const guesser =
    currentRoom.players[
      (currentRoom.turn + 1) % 2
    ];

  io.to(drawer).emit("yourWord",
    currentRoom.word
  );

  io.to(guesser).emit("guessMode");

  io.to(room).emit("scoreUpdate",
    currentRoom.scores
  );
}

server.listen(3000, () => {
  console.log("Server running");
});