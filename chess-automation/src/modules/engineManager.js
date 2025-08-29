/**
 * Engine Manager Module
 * Manages different chess engines and provides a unified interface
 */

import { StockfishEngine } from './engines/stockfishEngine.js';
import { StockfishAsmEngine } from './engines/stockfishAsmEngine.js';
import { ENGINE_TYPES, ENGINE_DEFAULTS } from '../config/constants.js';

export class EngineManager {
  constructor(config = {}) {
    this.config = {
      ...ENGINE_DEFAULTS,
      ...config,
    };
    this.currentEngine = null;
    this.engineType = config.engine || ENGINE_TYPES.STOCKFISH_WASM;
    this.analysisHistory = [];
  }

  /**
   * Initialize the engine manager with specified engine
   * @param {string} engineType - Type of engine to use
   * @returns {Promise<void>}
   */
  async init(engineType = null) {
    if (engineType) {
      this.engineType = engineType;
    }

    console.log(`Initializing engine manager with ${this.engineType}...`);

    // Clean up existing engine if any
    if (this.currentEngine) {
      await this.quit();
    }

    // Create and initialize the appropriate engine
    switch (this.engineType) {
      case ENGINE_TYPES.STOCKFISH_WASM:
        this.currentEngine = new StockfishEngine(this.config);
        break;

      case ENGINE_TYPES.STOCKFISH:
        this.currentEngine = new StockfishAsmEngine(this.config);
        break;

      case ENGINE_TYPES.LC0:
        // Placeholder for Lc0 implementation
        throw new Error('Lc0 engine not yet implemented');

      case ENGINE_TYPES.MAIA:
        // Placeholder for Maia implementation
        throw new Error('Maia engine not yet implemented');

      default:
        throw new Error(`Unknown engine type: ${this.engineType}`);
    }

    await this.currentEngine.init();
    console.log('Engine manager initialized successfully');
  }

  /**
   * Switch to a different engine
   * @param {string} engineType - New engine type
   * @returns {Promise<void>}
   */
  async switchEngine(engineType) {
    console.log(`Switching from ${this.engineType} to ${engineType}`);
    await this.init(engineType);
  }

  /**
   * Analyze a position and get the best move
   * @param {string} fen - FEN string of the position
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzePosition(fen, options = {}) {
    if (!this.currentEngine || !this.currentEngine.getIsReady()) {
      throw new Error('Engine not ready');
    }

    const startTime = Date.now();

    // Set position
    await this.currentEngine.setPosition(fen);

    // Get best move
    const result = await this.currentEngine.getBestMove(options);

    const analysisTime = Date.now() - startTime;

    // Create analysis result
    const analysis = {
      fen,
      bestMove: result.move,
      evaluation: result.evaluation?.score || 0,
      depth: result.evaluation?.depth || options.depth || this.config.DEPTH,
      pv: result.evaluation?.pv || [result.move],
      engineType: this.engineType,
      timestamp: new Date().toISOString(),
      analysisTime,
    };

    // Store in history
    this.analysisHistory.push(analysis);
    if (this.analysisHistory.length > 100) {
      this.analysisHistory.shift();
    }

    return analysis;
  }

  /**
   * Get multiple candidate moves for a position
   * @param {string} fen - FEN string
   * @param {number} count - Number of candidates to get
   * @param {Object} options - Analysis options
   * @returns {Promise<Array>} Array of candidate moves
   */
  async getCandidateMoves(fen, count = 3, options = {}) {
    if (!this.currentEngine || !this.currentEngine.getIsReady()) {
      throw new Error('Engine not ready');
    }

    await this.currentEngine.setPosition(fen);
    const candidates = await this.currentEngine.getCandidateMoves(count, options);

    return candidates.map((candidate, index) => ({
      rank: index + 1,
      move: candidate.move,
      evaluation: candidate.evaluation,
      depth: candidate.depth,
      pv: candidate.pv || [candidate.move],
    }));
  }

  /**
   * Stop current analysis
   * @returns {Promise<void>}
   */
  async stopAnalysis() {
    if (this.currentEngine) {
      await this.currentEngine.stop();
    }
  }

  /**
   * Get analysis history
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array}
   */
  getHistory(limit = 10) {
    return this.analysisHistory.slice(-limit);
  }

  /**
   * Clear analysis history
   */
  clearHistory() {
    this.analysisHistory = [];
  }

  /**
   * Get current engine status
   * @returns {Object}
   */
  getStatus() {
    return {
      engineType: this.engineType,
      isReady: this.currentEngine?.getIsReady() || false,
      currentPosition: this.currentEngine?.currentPosition || null,
      lastEvaluation: this.currentEngine?.getEvaluation() || null,
      historySize: this.analysisHistory.length,
    };
  }

  /**
   * Quit the engine
   * @returns {Promise<void>}
   */
  async quit() {
    if (this.currentEngine) {
      await this.currentEngine.quit();
      this.currentEngine = null;
    }
  }
}
