const socket = io();

// DOM elements
const wordBox = document.getElementById("word");
const chatBox = document.getElementById("chat");
const playersBox = document.getElementById("players");
const msgInput = document.getElementById("msg");

// --------------------
// Join game automatically
// --------------------
let username = prompt("Enter your name:");
if (!username) username = "Player";

socket.emit("joinGame", username);

// --------------------
// Receive word from server
// --------------------
socket.on("newWord", (word) => {
  wordBox.textContent = word;
});

// --------------------
// Player list update
// --------------------
socket.on("playersUpdate", (players) => {
  playersBox.innerHTML = "";

  players.forEach((p) => {
    const div = document.createElement("div");
    div.className = "player";
    div.textContent = p;
    playersBox.appendChild(div);
  });
});

// --------------------
// Chat messages
// --------------------
socket.on("chatMessage", (msg) => {
  addMessage(msg);
});

// --------------------
// Send message
// --------------------
function sendMessage() {
  const msg = msgInput.value.trim();
  if (!msg) return;

  socket.emit("chatMessage", `${username}: ${msg}`);
  msgInput.value = "";
}

// --------------------
// Add message to chat UI
// --------------------
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "chat-message";
  div.textContent = msg;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight; // mobile-friendly scroll
}

// --------------------
// Game actions
// --------------------
function getWord() {
  socket.emit("getWord");
}

function startGame() {
  socket.emit("startGame");
}

// --------------------
// Enter key support
// --------------------
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
