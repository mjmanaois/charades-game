const socket = io();

let role = "";

// join game immediately
socket.emit("joinGame");

/**
 * START GAME BUTTON
 */
function startGame() {
  socket.emit("playerReady");
}

/**
 * ROLE ASSIGNMENT
 */
socket.on("role", (data) => {
  role = data.role;

  if (role === "drawer") {
    document.getElementById("status").innerText =
      "You are DRAWING: " + data.word;
  }

  if (role === "guesser") {
    document.getElementById("status").innerText =
      "You are GUESSING";
  }
});

/**
 * GAME MESSAGES
 */
socket.on("gameMessage", (msg) => {
  document.getElementById("message").innerText = msg;
});

/**
 * PLAYER COUNT
 */
socket.on("playerCount", (count) => {
  document.getElementById("players").innerText =
    "Players online: " + count;
});

/**
 * GUESS FUNCTION
 */
function sendGuess() {
  const input = document.getElementById("guessInput");
  socket.emit("guess", input.value);
  input.value = "";
}

/**
 * GAME FULL
 */
socket.on("gameFull", () => {
  document.getElementById("message").innerText =
    "Game is full. Try again later.";
});
