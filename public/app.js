const socket = io();

let room = "";
let drawing = false;
let isDrawer = false;

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

document
.getElementById("createBtn")
.onclick = () => {

  socket.emit("createRoom");
};

document
.getElementById("joinBtn")
.onclick = () => {

  room =
  document.getElementById(
    "roomInput"
  ).value;

  socket.emit("joinRoom", room);
};

socket.on("roomCreated", code => {

  room = code;

  document.getElementById(
    "roomDisplay"
  ).innerText =
  "Room: " + code;
});

socket.on("yourWord", word => {

  isDrawer = true;

  document.getElementById(
    "role"
  ).innerText =
  "Draw: " + word;
});

socket.on("guessMode", () => {

  isDrawer = false;

  document.getElementById(
    "role"
  ).innerText =
  "Guess the drawing";
});

canvas.addEventListener(
  "mousedown",
  () => {

    if(isDrawer)
      drawing = true;
  }
);

canvas.addEventListener(
  "mouseup",
  () => drawing = false
);

canvas.addEventListener(
  "mousemove",
  e => {

    if(!drawing || !isDrawer)
      return;

    ctx.fillRect(
      e.offsetX,
      e.offsetY,
      3,
      3
    );

    socket.emit("draw",{
      room,
      x:e.offsetX,
      y:e.offsetY
    });
  }
);

socket.on("draw", data => {

  ctx.fillRect(
    data.x,
    data.y,
    3,
    3
  );
});

document
.getElementById("guessBtn")
.onclick = () => {

  const guess =
  document.getElementById(
    "guessInput"
  ).value;

  socket.emit("guess", {
    room,
    guess
  });
};

socket.on(
  "correctGuess",
  word => {

    alert(
      "Correct! Word was " + word
    );

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
);

socket.on(
  "errorMsg",
  msg => alert(msg)
);