import { Palette, TILE_SIZE, COLS, ROWS, createEmptyGrid, rotateMatrixCW, randomPiece } from './assets.js';
import { sfx } from './sfx.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const overlay = document.getElementById('overlay');
const msg = document.getElementById('message');
const btnRestart = document.getElementById('btn-restart');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

// Game state
let grid = createEmptyGrid();
let current = null; // { type, shape, color, x, y }
let nextPiece = randomPiece();
let score = 0;
let linesCleared = 0;
let level = 1;
let dropIntervalMs = 800; // will scale with level
let dropAccumulator = 0;
let lastTime = 0;
let running = true;

function resetGame() {
  grid = createEmptyGrid();
  current = null;
  nextPiece = randomPiece();
  score = 0;
  linesCleared = 0;
  level = 1;
  dropIntervalMs = 800;
  dropAccumulator = 0;
  lastTime = 0;
  running = true;
  overlay.hidden = true; // ensure overlay hidden during gameplay
  spawnPiece();
  updateHUD();
}

function spawnPiece() {
  current = structuredClone(nextPiece);
  nextPiece = randomPiece();
  // Center horizontally
  current.x = Math.floor((COLS - current.shape[0].length) / 2);
  current.y = -1; // start above the visible board for smooth entry
  if (collides(current, grid, current.x, current.y)) {
    gameOver();
  }
}

function updateHUD() {
  scoreEl.textContent = String(score);
  linesEl.textContent = String(linesCleared);
  levelEl.textContent = String(level);
  drawNext();
}

function collides(piece, board, offsetX, offsetY) {
  const shape = piece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = offsetX + c;
      const y = offsetY + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
  }
  return false;
}

function mergePiece(piece, board) {
  const shape = piece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = piece.x + c;
      const y = piece.y + r;
      if (y >= 0) board[y][x] = { color: piece.color, style: piece.style };
    }
  }
}

function clearLines(board) {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    const full = board[y].every(cell => cell);
    if (full) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++; // re-check same row index after unshift
    }
  }
  if (cleared > 0) {
    const scores = [0, 100, 300, 500, 800];
    score += scores[cleared] * level;
    linesCleared += cleared;
    sfx.lineClear(cleared);
    const newLevel = 1 + Math.floor(linesCleared / 10);
    if (newLevel !== level) {
      level = newLevel;
      dropIntervalMs = Math.max(120, 800 - (level - 1) * 60);
    }
    updateHUD();
  }
}

function hardDrop() {
  if (!current) return;
  while (!collides(current, grid, current.x, current.y + 1)) {
    current.y++;
  }
  lockPiece();
}

function lockPiece() {
  mergePiece(current, grid);
  clearLines(grid);
  spawnPiece();
  sfx.lock();
}

function rotate() {
  if (!current) return;
  const prev = current.shape;
  const rotated = rotateMatrixCW(prev);
  const test = { ...current, shape: rotated };
  // basic wall kicks: try offsets
  const kicks = [0, -1, 1, -2, 2];
  for (const dx of kicks) {
    // also clamp within bounds after rotation by adjusting x
    const shapeWidth = rotated[0].length;
    const minX = 0;
    const maxX = COLS - shapeWidth;
    let targetX = Math.min(maxX, Math.max(minX, current.x + dx));
    if (!collides(test, grid, targetX, current.y)) {
      current.shape = rotated;
      current.x = targetX;
      sfx.rotate();
      return;
    }
  }
}

function move(dx) {
  if (!current) return;
  const shapeWidth = current.shape[0].length;
  // clamp target x within board bounds considering shape width
  let targetX = current.x + dx;
  const minX = 0;
  const maxX = COLS - shapeWidth;
  if (targetX < minX) targetX = minX;
  if (targetX > maxX) targetX = maxX;
  if (!collides(current, grid, targetX, current.y)) {
    current.x = targetX;
    sfx.move();
  }
}

function softDrop() {
  if (!current) return;
  if (!collides(current, grid, current.x, current.y + 1)) {
    current.y++;
    sfx.dropStep();
  } else {
    lockPiece();
  }
}

function gameOver() {
  running = false;
  overlay.hidden = false;
  msg.textContent = 'Game Over';
  sfx.gameOver();
}

function drawCell(x, y, color, style = 'brick') {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  if (style === 'steel') {
    drawSteel(px, py, color);
  } else {
    drawBrick(px, py, color);
  }
}

function drawBrick(px, py, color) {
  ctx.fillStyle = color;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  // Brick grooves
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  // horizontal middle groove
  ctx.beginPath();
  ctx.moveTo(px, py + TILE_SIZE / 2);
  ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
  ctx.stroke();
  // vertical grooves (two columns)
  ctx.beginPath();
  ctx.moveTo(px + TILE_SIZE / 3, py);
  ctx.lineTo(px + TILE_SIZE / 3, py + TILE_SIZE / 2);
  ctx.moveTo(px + (2 * TILE_SIZE) / 3, py + TILE_SIZE / 2);
  ctx.lineTo(px + (2 * TILE_SIZE) / 3, py + TILE_SIZE);
  ctx.stroke();
  // outline
  ctx.strokeStyle = '#222';
  ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}

function drawSteel(px, py, color) {
  // base plate
  ctx.fillStyle = color;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  // rivets
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  const r = 2;
  ctx.beginPath(); ctx.arc(px + 5, py + 5, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + TILE_SIZE - 5, py + 5, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + 5, py + TILE_SIZE - 5, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + TILE_SIZE - 5, py + TILE_SIZE - 5, r, 0, Math.PI * 2); ctx.fill();
  // shade bottom
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(px, py + TILE_SIZE - 6, TILE_SIZE, 6);
  // outline
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}

function drawGridBackground() {
  ctx.fillStyle = Palette.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = Palette.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    const px = x * TILE_SIZE;
    ctx.beginPath();
    ctx.moveTo(px + 0.5, 0);
    ctx.lineTo(px + 0.5, ROWS * TILE_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    const py = y * TILE_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, py + 0.5);
    ctx.lineTo(COLS * TILE_SIZE, py + 0.5);
    ctx.stroke();
  }
}

function drawBoard() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = grid[y][x];
      if (cell) drawCell(x, y, cell.color, cell.style || 'brick');
    }
  }
}

function drawPiece(piece) {
  const shape = piece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = piece.x + c;
      const y = piece.y + r;
      if (y >= 0) drawCell(x, y, piece.color, piece.style || 'brick');
    }
  }
}

function drawNext() {
  nextCtx.fillStyle = Palette.background;
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = nextPiece.shape;
  const w = shape[0].length;
  const h = shape.length;
  const scale = 18; // smaller tile for preview
  const offsetX = Math.floor((nextCanvas.width - w * scale) / 2);
  const offsetY = Math.floor((nextCanvas.height - h * scale) / 2);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!shape[r][c]) continue;
      const px = offsetX + c * scale;
      const py = offsetY + r * scale;
      nextCtx.fillStyle = nextPiece.color;
      nextCtx.fillRect(px, py, scale, scale);
      nextCtx.strokeStyle = '#222';
      nextCtx.strokeRect(px + 1, py + 1, scale - 2, scale - 2);
    }
  }
}

function update(time = 0) {
  if (!running) return;
  const delta = time - lastTime;
  lastTime = time;
  dropAccumulator += delta;

  if (dropAccumulator > dropIntervalMs) {
    softDrop();
    dropAccumulator = 0;
  }

  drawGridBackground();
  drawBoard();
  if (current) drawPiece(current);

  requestAnimationFrame(update);
}

// Controls
function handleKey(e) {
  if (!running && e.code === 'Enter') { resetGame(); return; }
  switch (e.code) {
    case 'ArrowLeft':
      move(-1); break;
    case 'ArrowRight':
      move(1); break;
    case 'ArrowDown':
      softDrop(); break;
    case 'Space':
      hardDrop(); break;
    case 'KeyZ':
    case 'KeyX':
    case 'ArrowUp':
      rotate(); break;
  }
}

function bindButtons() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.getAttribute('data-action');
      if (a === 'left') move(-1);
      if (a === 'right') move(1);
      if (a === 'down') softDrop();
      if (a === 'rotate') rotate();
      if (a === 'hard') hardDrop();
    });
  });
}

btnRestart.addEventListener('click', resetGame);
window.addEventListener('keydown', handleKey);

// Init
function init() {
  // Ensure canvas size matches logical grid
  canvas.width = COLS * TILE_SIZE;
  canvas.height = ROWS * TILE_SIZE;
  spawnPiece();
  updateHUD();
  requestAnimationFrame(update);
  sfx.start();
}

init();


