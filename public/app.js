const socket = io();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 400;

let drawing = false;

/**
 * JOIN
 */
function joinGame() {
  const name = document.getElementById("nameInput").value;
  socket.emit("joinGame", name);
}

/**
 * START GAME
 */
function startGame() {
  socket.emit("startGame");
}

/**
 * DRAWING
 */
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDraw);

function pos(e) {
  const r = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - r.left,
      y: e.touches[0].clientY - r.top
    };
  }
  return {
    x: e.clientX - r.left,
    y: e.clientY - r.top
  };
}

function startDraw(e) {
  drawing = true;
  const p = pos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function draw(e) {
  if (!drawing) return;

  const p = pos(e);

  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  socket.emit("draw", p);
}

function stopDraw() {
  drawing = false;
}

/**
 * RECEIVE DRAW
 */
socket.on("draw", (data) => {
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
});

/**
 * CLEAR
 */
socket.on("clearCanvas", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

/**
 * TURN INFO
 */
socket.on("yourTurn", (data) => {
  if (data.role === "drawer") {
    alert("You are DRAWER: " + data.word);
  } else {
    alert(data.message);
  }
});

/**
 * CHAT
 */
socket.on("systemMessage", (msg) => {
  const chat = document.getElementById("chat");
  chat.innerHTML += `<div>${msg}</div>`;
});

/**
 * PLAYERS
 */
socket.on("playerList", (players) => {
  document.getElementById("players").innerText =
    "Players: " + players.map(p => p.name).join(", ");
});

/**
 * GUESS
 */
function sendGuess() {
  const text = document.getElementById("guessInput").value;
  socket.emit("guess", text);
}
