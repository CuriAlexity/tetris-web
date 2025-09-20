// NES/Dendy palette and tile helpers
export const Palette = {
  background: '#0b0b0b',
  grid: '#111',
  brick: '#b64b2b',
  steelLight: '#c4c9ce',
  steelDark: '#6f7780',
  grass: '#3a7d2b',
  water: '#2a4ea3',
  text: '#e6e6e6',
  accent: '#ff6b00'
};

export const TILE_SIZE = 24; // logical cell size in px for canvas
export const COLS = 10;
export const ROWS = 20;

// Tetrimino shapes (I, J, L, O, S, T, Z) as matrices of 1s
export const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

export const PIECE_COLORS = {
  I: '#9bdaf1',
  J: '#7da0ff',
  L: '#ffb347',
  O: '#ffd966',
  S: '#6bd67a',
  T: '#c98cff',
  Z: '#ff6b6b'
};

// Map each piece to a material style for Battle City vibes
export const PIECE_STYLE = {
  I: 'steel',
  J: 'brick',
  L: 'brick',
  O: 'steel',
  S: 'brick',
  T: 'steel',
  Z: 'brick'
};

export function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function rotateMatrixCW(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const res = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      res[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return res;
}

export function randomPiece() {
  const keys = Object.keys(SHAPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return { type, shape: SHAPES[type], color: PIECE_COLORS[type], style: PIECE_STYLE[type] };
}


