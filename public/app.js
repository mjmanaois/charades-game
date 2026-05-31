const socket = io();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 400;

let drawing = false;

/**
 * JOIN GAME
 */
function joinGame() {
  const name = document.getElementById("nameInput").value;
  socket.emit("joinGame", name);
}

/**
 * START BUTTON
 */
document.getElementById("startBtn").addEventListener("click", () => {
  socket.emit("startRound");
});

/**
 * DRAWING
 */
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDraw);

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function startDraw(e) {
  drawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;

  const pos = getPos(e);

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  socket.emit("draw", pos);
}

function stopDraw() {
  drawing = false;
}

/**
 * RECEIVE DRAWING
 */
socket.on("draw", (data) => {
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
});

/**
 * CLEAR CANVAS
 */
socket.on("clearCanvas", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

/**
 * SYNC CANVAS (optional future use)
 */
socket.on("syncCanvas", (data) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

/**
 * CHAT / SYSTEM
 */
socket.on("systemMessage", (msg) => {
  const div = document.getElementById("chat");
  div.innerHTML += `<div>${msg}</div>`;
});

/**
 * PLAYER LIST
 */
socket.on("playerList", (players) => {
  document.getElementById("players").innerText =
    "Players: " + players.map(p => p.name).join(", ");
});

/**
 * YOUR TURN
 */
socket.on("yourTurn", (data) => {
  alert("You are drawing: " + data.word);
});

/**
 * GUESS
 */
function sendGuess() {
  const text = document.getElementById("guessInput").value;
  socket.emit("guess", text);
}
