const socket = io();

// ---------------- UI ----------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const playersDiv = document.getElementById("players");
const wordBox = document.getElementById("wordBox");

// Resize canvas properly
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ---------------- USER ----------------
let name = prompt("Enter your name:");
if (!name) name = "Player";

socket.emit("joinGame", name);

// ---------------- DRAWING ----------------
let drawing = false;

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mousemove", draw);

// mobile touch support
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", stopDraw);
canvas.addEventListener("touchmove", drawTouch);

function startDraw(e) {
  drawing = true;
  ctx.beginPath();
}

function stopDraw() {
  drawing = false;
}

function draw(e) {
  if (!drawing) return;

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  socket.emit("draw", {
    x: e.offsetX / canvas.width,
    y: e.offsetY / canvas.height
  });
}

function drawTouch(e) {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();

  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  ctx.lineTo(x, y);
  ctx.stroke();

  socket.emit("draw", {
    x: x / canvas.width,
    y: y / canvas.height
  });
}

// ---------------- RECEIVE DRAW ----------------
socket.on("draw", (data) => {
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  ctx.lineTo(data.x * canvas.width, data.y * canvas.height);
  ctx.stroke();
});

// ---------------- CHAT ----------------
function sendGuess() {
  const text = msg.value;
  if (!text) return;

  socket.emit("guess", text);
  msg.value = "";
}

socket.on("chat", (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

// ---------------- PLAYERS ----------------
socket.on("players", (list) => {
  playersDiv.innerHTML = list.map(p => `<div>${p}</div>`).join("");
});

// ---------------- WORD ----------------
socket.on("word", (w) => {
  wordBox.textContent = "Draw: " + w;
});

// ---------------- ACTIONS ----------------
function requestWord() {
  const socket = io();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear");
}
