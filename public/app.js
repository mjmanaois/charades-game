const socket = io();

let room = "";
let drawing = false;
let isDrawer = false;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Buttons
document.getElementById("createBtn").onclick = () => {
  socket.emit("createRoom");
};

document.getElementById("joinBtn").onclick = () => {
  room = document.getElementById("roomInput").value.trim();
  if (!room) return alert("Enter a room code");

  socket.emit("joinRoom", room);
};

// Room created
socket.on("roomCreated", (code) => {
  room = code;
  document.getElementById("roomDisplay").innerText = "Room: " + code;
});

// You are drawer
socket.on("yourWord", (word) => {
  isDrawer = true;
  document.getElementById("role").innerText = "Draw: " + word;
});

// You are guesser
socket.on("guessMode", () => {
  isDrawer = false;
  document.getElementById("role").innerText = "Guess the drawing";
});

// Drawing start
canvas.addEventListener("mousedown", () => {
  if (isDrawer) drawing = true;
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
});

// Draw on canvas
canvas.addEventListener("mousemove", (e) => {
  if (!drawing || !isDrawer) return;

  const x = e.offsetX;
  const y = e.offsetY;

  ctx.fillRect(x, y, 3, 3);

  socket.emit("draw", {
    room,
    x,
    y,
  });
});

// Receive drawing
socket.on("draw", (data) => {
  ctx.fillRect(data.x, data.y, 3, 3);
});

// Guess
document.getElementById("guessBtn").onclick = () => {
  const guess = document.getElementById("guessInput").value.trim();
  if (!guess) return;

  socket.emit("guess", {
    room,
    guess,
  });

  document.getElementById("guessInput").value = "";
};

// Correct guess
socket.on("correctGuess", (word) => {
  alert("Correct! Word was " + word);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Errors
socket.on("errorMsg", (msg) => {
  alert(msg);
});
