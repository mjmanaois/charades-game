// const socket = io();

// let role = "";

// socket.emit("joinGame");

// function startGame() {
//   socket.emit("playerReady");
// }

// socket.on("playerCount", (count) => {
//   console.log("Players:", count);
// });

// socket.on("role", (data) => {
//   role = data.role;

//   if (role === "drawer") {
//     document.getElementById("status").innerText =
//       "You are DRAWING: " + data.word;
//   }

//   if (role === "guesser") {
//     document.getElementById("status").innerText =
//       "You are GUESSING";
//   }
// });

// socket.on("gameMessage", (msg) => {
//   document.getElementById("message").innerText = msg;
// });

// /**
//  * GUESS INPUT
//  */
// function sendGuess() {
//   const guess = document.getElementById("guessInput").value;
//   socket.emit("guess", guess);
// }
