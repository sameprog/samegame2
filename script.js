const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cols = 10;
const rows = 15;
const blockSize = 32;
const imageCount = 4;
const images = [];

let board = [];
let score = 0;

// 画像読み込み
for (let i = 0; i < imageCount; i++) {
  const img = new Image();
  img.src = `img${i}.png`; // 例: img0.png〜img3.png
  images.push(img);
}

function initBoard() {
  board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * imageCount))
  );
  score = 0;
  document.getElementById("gameOver").style.display = "none";
  drawBoard();
  checkGameOver();
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) => {
    row.forEach((imgIndex, x) => {
      if (imgIndex !== null) {
        ctx.drawImage(
          images[imgIndex],
          x * blockSize,
          y * blockSize,
          blockSize,
          blockSize
        );
      }
    });
  });

  document.getElementById("score").textContent = score;
}

function getConnected(x, y, target, visited = {}) {
  if (
    x < 0 || x >= cols || y < 0 || y >= rows ||
    board[y][x] !== target || visited[`${x},${y}`]
  ) return [];

  visited[`${x},${y}`] = true;
  return [
    [x, y],
    ...getConnected(x + 1, y, target, visited),
    ...getConnected(x - 1, y, target, visited),
    ...getConnected(x, y + 1, target, visited),
    ...getConnected(x, y - 1, target, visited)
  ];
}

function removeAndCollapse(connected) {
  connected.forEach(([x, y]) => {
    board[y][x] = null;
  });

  for (let x = 0; x < cols; x++) {
    let col = [];
    for (let y = 0; y < rows; y++) {
      if (board[y][x] !== null) col.push(board[y][x]);
    }
    for (let y = rows - 1; y >= 0; y--) {
      board[y][x] = col.length ? col.pop() : null;
    }
  }

  drawBoard();
  checkGameOver();
}

function hasMoves() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const val = board[y][x];
      if (val === null) continue;
      const connected = getConnected(x, y, val);
      if (connected.length >= 2) return true;
    }
  }
  return false;
}

function checkGameOver() {
  if (!hasMoves()) {
    const message = `🎉 ゲーム終了！あなたのスコアは ${score} 点です 🎉`;
    const gameOverEl = document.getElementById("gameOver");
    gameOverEl.textContent = message;
    gameOverEl.style.display = "block";

    // フォームを表示してスコアを渡す
    const scoreForm = document.getElementById("scoreForm");
    if (scoreForm) {
      scoreForm.style.display = "block";
      document.getElementById("scoreInput").value = score;
    }
  }
}

canvas.addEventListener("click", (e) => {
  const x = Math.floor(e.offsetX / blockSize);
  const y = Math.floor(e.offsetY / blockSize);
  const imgIndex = board[y][x];
  if (imgIndex === null) return;

  const connected = getConnected(x, y, imgIndex);
  if (connected.length >= 2) {
    score += connected.length * connected.length;
    removeAndCollapse(connected);
  }
});

window.onload = () => {
  Promise.all(images.map(img => new Promise(resolve => {
    if (img.complete) {
      resolve(); // すでに読み込まれてたら即resolve
    } else {
      img.onload = () => {
        console.log(`loaded: ${img.src}`);
        resolve();
      };
    }
  }))).then(() => {
    console.log("All images loaded!");
    initBoard();
    setupDrawing(); // ⭐ 絵描き機能のセットアップもここでやる
  });
};

// =================== 絵描き機能 ===================
function setupDrawing() {
  const drawCanvas = document.getElementById('drawCanvas');
  if (!drawCanvas) return;  // フォームがまだ出てないときはスキップ
  const drawCtx = drawCanvas.getContext('2d');
  let drawing = false;
  let currentColor = 'black';

  window.changeColor = function(color) {
    currentColor = color;
  };

  window.clearCanvas = function() {
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
  };

  function getPointerPosition(e) {
    let rect = drawCanvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }

  drawCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    drawCtx.beginPath();
    let pos = getPointerPosition(e);
    drawCtx.moveTo(pos.x, pos.y);
  });

  drawCanvas.addEventListener('mouseup', () => {
    drawing = false;
  });

  drawCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    let pos = getPointerPosition(e);
    drawCtx.lineWidth = 2;
    drawCtx.lineCap = 'round';
    drawCtx.strokeStyle = currentColor;
    drawCtx.lineTo(pos.x, pos.y);
    drawCtx.stroke();
  });

  drawCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    drawing = true;
    drawCtx.beginPath();
    let pos = getPointerPosition(e);
    drawCtx.moveTo(pos.x, pos.y);
  });

  drawCanvas.addEventListener('touchend', () => {
    drawing = false;
  });

  drawCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!drawing) return;
    let pos = getPointerPosition(e);
    drawCtx.lineWidth = 2;
    drawCtx.lineCap = 'round';
    drawCtx.strokeStyle = currentColor;
    drawCtx.lineTo(pos.x, pos.y);
    drawCtx.stroke();
  });
}

// =================== 送信処理 ===================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('submitForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('nameInput').value;
    const scoreVal = document.getElementById('scoreInput').value;
    const canvasData = document.getElementById('drawCanvas').toDataURL();

  fetch('https://script.google.com/macros/s/AKfycbwB3e3AVjkTqhx6geH4aI4AiXmrSznM_9sDGbMn3xevfUmHxeT3q8n4MQdcaSWJ3DgC/exec', {
  method: 'POST',
  body: JSON.stringify({ name, score: scoreVal, image: canvasData }),
})
    .then(response => response.text())
    .then(data => {
      alert('登録完了！');
      location.reload();
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('登録失敗...');
    });
  });
});


