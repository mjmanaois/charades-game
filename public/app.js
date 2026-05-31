const socket = io();

/**
 * CANVAS SETUP
 */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// responsive canvas (works on mobile + PC)
function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth - 20, 500);
  canvas.height = 400;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/**
 * WHITEBOARD STYLE SETTINGS (IMPORTANT)
 */
ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = "#000";

/**
 * DRAW STATE
 */
let drawing = false;
let points = [];
let lastEmitTime = 0;

/**
 * JOIN GAME
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
 * GET POINTER POSITION (FIXED FOR MOBILE + PC)
 */
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

/**
 * START DRAW
 */
function startDraw(e) {
  e.preventDefault();

  drawing = true;
  points = [];

  const p = pos(e);
  points.push(p);

  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

/**
 * DRAW (SMOOTH WHITEBOARD STYLE)
 */
function draw(e) {
  if (!drawing) return;
  e.preventDefault();

  const p = pos(e);
  points.push(p);

  if (points.length < 3) return;

  const last2 = points[points.length - 2];
  const last1 = points[points.length - 1];

  const midX = (last2.x + last1.x) / 2;
  const midY = (last2.y + last1.y) / 2;

  ctx.beginPath();
  ctx.moveTo(last2.x, last2.y);
  ctx.quadraticCurveTo(last2.x, last2.y, midX, midY);
  ctx.stroke();

  /**
   * THROTTLE SOCKET EMIT (prevents lag)
   */
  const now = Date.now();
  if (now - lastEmitTime > 10) {
    socket.emit("draw", {
      x1: last2.x,
      y1: last2.y,
      x2: midX,
      y2: midY
    });

    lastEmitTime = now;
  }
}

/**
 * STOP DRAW
 */
function stopDraw() {
  drawing = false;
}

/**
 * EVENT LISTENERS (mouse + touch)
 */
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);

canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stopDraw);

/**
 * RECEIVE DRAW (SMOOTH REMOTE DRAWING)
 */
socket.on("draw", (data) => {
  ctx.beginPath();
  ctx.moveTo(data.x1, data.y1);
  ctx.quadraticCurveTo(data.x1, data.y1, data.x2, data.y2);
  ctx.stroke();
});

/**
 * CLEAR CANVAS
 */
socket.on("clearCanvas", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

/**
 * TURN SYSTEM
 */
socket.on("yourTurn", (data) => {
  if (data.role === "drawer") {
    alert("You are the DRAWER: " + data.word);
  } else {
    alert(data.message || "You are the GUESSER");
  }
});

/**
 * CHAT SYSTEM
 */
socket.on("systemMessage", (msg) => {
  const chat = document.getElementById("chat");
  chat.innerHTML += `<div>${msg}</div>`;
});

/**
 * PLAYER LIST
 */
socket.on("playerList", (players) => {
  document.getElementById("players").innerText =
    "Players: " + players.map(p => p.name).join(", ");
});

/**
 * GUESS SUBMIT
 */
function sendGuess() {
  const text = document.getElementById("guessInput").value;
  socket.emit("guess", text);
}
