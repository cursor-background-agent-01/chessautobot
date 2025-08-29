/**
 * Move Executor Module
 * Responsible for executing chess moves on the Chess.com board
 */

import { SELECTORS, MOVE_DELAY } from '../config/constants.js';

export class MoveExecutor {
  constructor(page) {
    this.page = page;
    this.lastMoveTime = 0;
  }

  /**
   * Execute a chess move by clicking on the board
   * @param {string} move - Move in UCI format (e.g., 'e2e4', 'e7e8q')
   * @param {Object} options - Execution options
   * @returns {Promise<boolean>} Success status
   */
  async executeMove(move, options = {}) {
    try {
      // Parse the move
      const { from, to, promotion } = this.parseMove(move);

      // Add human-like delay
      await this.addMoveDelay(options.delay);

      // Get square elements
      const fromSquare = await this.getSquareElement(from);
      const toSquare = await this.getSquareElement(to);

      if (!fromSquare || !toSquare) {
        throw new Error(`Invalid squares: from=${from}, to=${to}`);
      }

      // Execute the move
      await this.clickSquare(fromSquare);
      await this.page.waitForTimeout(100); // Small delay between clicks
      await this.clickSquare(toSquare);

      // Handle promotion if needed
      if (promotion) {
        await this.handlePromotion(promotion);
      }

      this.lastMoveTime = Date.now();
      console.log(`Move executed: ${move}`);
      return true;
    } catch (error) {
      console.error(`Failed to execute move ${move}:`, error);
      return false;
    }
  }

  /**
   * Parse UCI move notation
   * @param {string} move - Move in UCI format
   * @returns {Object} Parsed move components
   */
  parseMove(move) {
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const promotion = move.length > 4 ? move[4] : null;

    return { from, to, promotion };
  }

  /**
   * Convert algebraic notation to board coordinates
   * @param {string} square - Square in algebraic notation (e.g., 'e4')
   * @returns {Object} Board coordinates
   */
  squareToCoordinates(square) {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0) + 1; // 1-8
    const rank = parseInt(square[1]); // 1-8
    return { file, rank };
  }

  /**
   * Get square element on the board
   * @param {string} square - Square in algebraic notation
   * @returns {Promise<ElementHandle>}
   */
  async getSquareElement(square) {
    const { file, rank } = this.squareToCoordinates(square);

    // Check board orientation
    const orientation = await this.getBoardOrientation();

    // Adjust coordinates based on board orientation
    const displayFile = orientation === 'white' ? file : 9 - file;
    const displayRank = orientation === 'white' ? rank : 9 - rank;

    // Find the square element
    const selector = `.square-${displayFile}${displayRank}`;

    return this.page.$(selector);
  }

  /**
   * Click on a square
   * @param {ElementHandle} square - Square element to click
   */
  async clickSquare(square) {
    if (typeof square === 'string') {
      // If square is a selector string
      await this.page.click(square);
    } else {
      // If square is an element handle
      await square.click();
    }
  }

  /**
   * Handle pawn promotion
   * @param {string} piece - Piece to promote to (q, r, b, n)
   */
  async handlePromotion(piece) {
    try {
      // Wait for promotion dialog
      await this.page.waitForSelector(SELECTORS.PROMOTION_DIALOG, { timeout: 2000 });

      // Map piece notation to selector
      const pieceMap = {
        q: '.promotion-piece.queen',
        r: '.promotion-piece.rook',
        b: '.promotion-piece.bishop',
        n: '.promotion-piece.knight',
      };

      const pieceSelector = pieceMap[piece.toLowerCase()] || pieceMap['q'];
      await this.page.click(pieceSelector);
    } catch (error) {
      console.error('Promotion dialog not found or error selecting piece:', error);
    }
  }

  /**
   * Get board orientation
   * @returns {Promise<'white'|'black'>}
   */
  async getBoardOrientation() {
    const isFlipped = await this.page.evaluate(() => {
      const board = document.querySelector('chess-board');
      return board ? board.classList.contains('flipped') : false;
    });

    return isFlipped ? 'black' : 'white';
  }

  /**
   * Add human-like delay between moves
   * @param {number} customDelay - Custom delay in milliseconds
   */
  async addMoveDelay(customDelay) {
    const delay = customDelay || this.getRandomDelay();
    const timeSinceLastMove = Date.now() - this.lastMoveTime;

    if (timeSinceLastMove < delay) {
      await this.page.waitForTimeout(delay - timeSinceLastMove);
    }
  }

  /**
   * Get random delay for human-like behavior
   * @returns {number} Delay in milliseconds
   */
  getRandomDelay() {
    return Math.floor(Math.random() * (MOVE_DELAY.MAX - MOVE_DELAY.MIN) + MOVE_DELAY.MIN);
  }

  /**
   * Execute a series of moves
   * @param {Array<string>} moves - Array of moves in UCI format
   * @param {Object} options - Execution options
   * @returns {Promise<boolean>} Success status
   */
  async executeMoves(moves, options = {}) {
    for (const move of moves) {
      const success = await this.executeMove(move, options);
      if (!success) {
        console.error(`Failed to execute move sequence at: ${move}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Check if it's our turn to move
   * @returns {Promise<boolean>}
   */
  async isOurTurn() {
    return this.page.evaluate(() => {
      // This would need to be adapted based on Chess.com's actual indicators
      const turnIndicator = document.querySelector('.clock-player-turn');
      if (!turnIndicator) return false;

      const ourClock = turnIndicator.closest('.clock-bottom');
      return ourClock !== null;
    });
  }

  /**
   * Wait for our turn
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<boolean>}
   */
  async waitForOurTurn(timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.isOurTurn()) {
        return true;
      }
      await this.page.waitForTimeout(500);
    }

    return false;
  }
}
