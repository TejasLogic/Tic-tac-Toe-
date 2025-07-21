import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDU8S1f9oKQ3KKctJLUhW1nORkIE3L5nlo",
  authDomain: "tfriends-2f4c2.firebaseapp.com",
  projectId: "tfriends-2f4c2",
  storageBucket: "tfriends-2f4c2.firebasestorage.app",
  messagingSenderId: "352613364257",
  appId: "1:352613364257:web:5e84066725b80b4e186960",
  measurementId: "G-6VL6XYS52N"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let playerName = "";
let playerSymbol = "";
let gameCode = "";
let isPlayerTurn = false;

const boardEl = document.getElementById("board");
const statusText = document.getElementById("statusText");
const settingsBtn = document.getElementById("settingsBtn");
const settingsMenu = document.getElementById("settingsMenu");
const toggleSound = document.getElementById("toggleSound");

let soundEnabled = true;
toggleSound.addEventListener("change", () => {
  soundEnabled = toggleSound.checked;
});
settingsBtn.addEventListener("click", () => {
  settingsMenu.classList.toggle("hidden");
});

const moveSound = new Audio("https://www.dropbox.com/scl/fi/hgd5fnljxk2mcg4db2s40/wind-swoosh-short-289744.mp3?rlkey=yd9ivyzczp0nunj48zad2fobi&raw=1");
const drawSound = new Audio("https://www.dropbox.com/scl/fi/bzkyhbe7q38o394shnqak/draw-sword1-44724.mp3?rlkey=kqsr97qauwl4mw9kcqt2joucs&raw=1");
const buttonSound = new Audio("https://www.dropbox.com/scl/fi/qssjedqg2v46sfuic97x8/button-202966.mp3?rlkey=pxf1h8r4lb1ndvvaq5x4tuf90&raw=1");
const winSound = new Audio("https://www.dropbox.com/scl/fi/rqtpt50ql9njerjik5eht/game-bonus-144751.mp3?rlkey=hpvey4qy8kvdu1f3408a3e4sp&raw=1");

function playSound(sound) {
  if (soundEnabled) sound.play();
}

function generateCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

window.createGame = () => {
  playSound(buttonSound);
  playerName = document.getElementById("playerName").value.trim();
  if (!playerName) return alert("Enter your name first.");
  gameCode = generateCode();

  set(ref(db, "games/" + gameCode), {
    board: Array(9).fill(""),
    players: { X: playerName },
    turn: "X",
    winner: ""
  });

  playerSymbol = "X";
  isPlayerTurn = true;
  showGame();
};

window.joinGame = () => {
  playSound(buttonSound);
  playerName = document.getElementById("playerName").value.trim();
  gameCode = document.getElementById("gameCodeInput").value.trim().toUpperCase();
  if (!playerName || !gameCode) return alert("Enter name and game code.");

  const gameRef = ref(db, "games/" + gameCode);
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return alert("Invalid game code.");

    if (!data.players?.O && data.players?.X !== playerName) {
      update(gameRef, {
        "players/O": playerName
      });
      playerSymbol = "O";
    } else {
      playerSymbol = data.players.X === playerName ? "X" : "O";
    }

    isPlayerTurn = data.turn === playerSymbol;
    showGame();
  });
};

function showGame() {
  document.getElementById("startMenu").classList.add("hidden");
  document.getElementById("gameArea").classList.remove("hidden");
  document.getElementById("gameCodeDisplay").innerText = gameCode;
  setupRealtimeUpdates();
}

function setupRealtimeUpdates() {
  const gameRef = ref(db, "games/" + gameCode);
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    renderBoard(data.board);
    if (data.winner) {
      statusText.innerText = data.winner === "draw" ? "It's a draw!" : `${data.winner} wins!`;
      playSound(data.winner === "draw" ? drawSound : winSound);
    } else {
      isPlayerTurn = data.turn === playerSymbol;
      statusText.innerText = isPlayerTurn ? "Your turn" : "Opponent's turn";
    }
  });
}

function renderBoard(board) {
  boardEl.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.innerText = cell;
    div.onclick = () => makeMove(i);
    boardEl.appendChild(div);
  });
}

function makeMove(index) {
  if (!isPlayerTurn || !playerSymbol) return;

  const gameRef = ref(db, "games/" + gameCode);
  get(gameRef).then((snapshot) => {
    const data = snapshot.val();
    if (!data || data.board[index]) return;

    const newBoard = [...data.board];
    newBoard[index] = playerSymbol;
    const winner = checkWinner(newBoard);

    update(gameRef, {
      board: newBoard,
      turn: playerSymbol === "X" ? "O" : "X",
      winner
    });

    playSound(moveSound);
  });
}

function checkWinner(b) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a, b1, c] of winPatterns) {
    if (b[a] && b[a] === b[b1] && b[b1] === b[c]) return b[a];
  }
  return b.every(cell => cell) ? "draw" : "";
}

window.resetGame = () => {
  playSound(buttonSound);
  const resetBoard = Array(9).fill("");
  update(ref(db, "games/" + gameCode), {
    board: resetBoard,
    winner: "",
    turn: "X"
  });
};

window.goBack = () => {
  playSound(buttonSound);
  window.location.href = "index.html";
};
