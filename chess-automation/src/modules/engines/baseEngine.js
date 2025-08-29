/**
 * Base Engine Interface
 * All chess engines must implement this interface
 */

export class BaseEngine {
  constructor(config = {}) {
    this.config = config;
    this.isReady = false;
    this.currentPosition = null;
    this.evaluation = null;
  }

  /**
   * Initialize the engine
   * @returns {Promise<void>}
   */
  async init() {
    throw new Error('init() must be implemented by subclass');
  }

  /**
   * Set the current position
   * @param {string} fen - FEN string of the position
   * @returns {Promise<void>}
   */
  async setPosition(fen) {
    this.currentPosition = fen;
  }

  /**
   * Get the best move for the current position
   * @param {Object} options - Search options (depth, time, etc.)
   * @returns {Promise<Object>} - { move: string, evaluation: number, pv: string[] }
   */
  async getBestMove(_options = {}) {
    throw new Error('getBestMove() must be implemented by subclass');
  }

  /**
   * Get multiple candidate moves with evaluations
   * @param {number} count - Number of moves to return
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of move objects
   */
  async getCandidateMoves(_count = 3, _options = {}) {
    throw new Error('getCandidateMoves() must be implemented by subclass');
  }

  /**
   * Stop the current search
   * @returns {Promise<void>}
   */
  async stop() {
    // Override in subclass if needed
  }

  /**
   * Quit the engine
   * @returns {Promise<void>}
   */
  async quit() {
    throw new Error('quit() must be implemented by subclass');
  }

  /**
   * Check if engine is ready
   * @returns {boolean}
   */
  getIsReady() {
    return this.isReady;
  }

  /**
   * Get current evaluation
   * @returns {Object|null}
   */
  getEvaluation() {
    return this.evaluation;
  }
}
