/**
 * Configuration constants for the chess automation system
 */

export const CHESS_COM_URL = 'https://www.chess.com/play/online';

export const SELECTORS = {
  BOARD: 'chess-board',
  PIECE: '.piece',
  SQUARE: '.square',
  MOVE_HIGHLIGHT: '.highlight',
  PROMOTION_DIALOG: '.promotion-window',
};

export const ENGINE_DEFAULTS = {
  DEPTH: 15,
  TIME_LIMIT: 2000, // milliseconds
  MULTIPV: 3, // number of principal variations to calculate
};

export const MOVE_DELAY = {
  MIN: 500, // minimum delay between moves (ms)
  MAX: 2000, // maximum delay between moves (ms)
};

export const ENGINE_TYPES = {
  STOCKFISH: 'stockfish',
  STOCKFISH_WASM: 'stockfish-wasm',
  LC0: 'lc0',
  MAIA: 'maia',
};
