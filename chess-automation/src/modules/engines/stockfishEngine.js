/**
 * Stockfish Engine Implementation
 * Uses stockfish.wasm for running Stockfish in Node.js
 */

import { BaseEngine } from './baseEngine.js';
import stockfish from 'stockfish.wasm';

export class StockfishEngine extends BaseEngine {
  constructor(config = {}) {
    super(config);
    this.engine = null;
    this.messageHandlers = new Map();
    this.currentSearch = null;
  }

  async init() {
    try {
      console.log('Initializing Stockfish WASM engine...');

      // Initialize Stockfish WASM
      this.engine = await stockfish();

      // Set up message handling
      this.setupMessageHandling();

      // Configure engine
      await this.sendCommand('uci');
      await this.waitForMessage('uciok');

      // Set options
      if (this.config.threads) {
        await this.sendCommand(`setoption name Threads value ${this.config.threads}`);
      }
      if (this.config.hash) {
        await this.sendCommand(`setoption name Hash value ${this.config.hash}`);
      }
      if (this.config.multiPV) {
        await this.sendCommand(`setoption name MultiPV value ${this.config.multiPV}`);
      }

      await this.sendCommand('isready');
      await this.waitForMessage('readyok');

      this.isReady = true;
      console.log('Stockfish engine ready');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      throw error;
    }
  }

  setupMessageHandling() {
    // Override the engine's print function to capture output
    const originalPrint = this.engine.print;
    this.engine.print = (line) => {
      if (originalPrint) originalPrint(line);
      this.handleEngineMessage(line);
    };
  }

  handleEngineMessage(message) {
    // Handle UCI protocol messages
    if (message === 'uciok' || message === 'readyok') {
      const handlers = this.messageHandlers.get(message) || [];
      handlers.forEach((handler) => handler(message));
      this.messageHandlers.delete(message);
    }

    // Handle best move
    if (message.startsWith('bestmove')) {
      const parts = message.split(' ');
      const [, bestMove] = parts;
      const ponderMove = parts[3] || null;

      if (this.currentSearch) {
        this.currentSearch.resolve({
          move: bestMove,
          ponder: ponderMove,
          evaluation: this.evaluation,
        });
        this.currentSearch = null;
      }
    }

    // Handle evaluation info
    if (message.startsWith('info')) {
      this.parseInfoMessage(message);
    }
  }

  parseInfoMessage(message) {
    const parts = message.split(' ');
    const info = {};

    for (let i = 0; i < parts.length; i++) {
      switch (parts[i]) {
        case 'depth':
          info.depth = parseInt(parts[++i]);
          break;
        case 'multipv':
          info.multipv = parseInt(parts[++i]);
          break;
        case 'score':
          i++;
          if (parts[i] === 'cp') {
            info.score = parseInt(parts[++i]) / 100; // Convert centipawns to pawns
          } else if (parts[i] === 'mate') {
            info.score = parts[++i].startsWith('-') ? -10000 : 10000;
            info.mate = parseInt(parts[i]);
          }
          break;
        case 'pv':
          info.pv = [];
          for (let j = i + 1; j < parts.length; j++) {
            if (parts[j] && !parts[j].startsWith('info')) {
              info.pv.push(parts[j]);
            }
          }
          i = parts.length; // End loop
          break;
      }
    }

    // Update evaluation
    if (info.multipv === 1 || !info.multipv) {
      this.evaluation = info;
    }
  }

  async sendCommand(command) {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }
    this.engine.postMessage(command);
  }

  async waitForMessage(expectedMessage, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const handlers = this.messageHandlers.get(expectedMessage) || [];

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${expectedMessage}`));
      }, timeout);

      handlers.push((message) => {
        clearTimeout(timeoutId);
        resolve(message);
      });

      this.messageHandlers.set(expectedMessage, handlers);
    });
  }

  async setPosition(fen) {
    await super.setPosition(fen);
    await this.sendCommand(`position fen ${fen}`);
  }

  async getBestMove(options = {}) {
    const depth = options.depth || this.config.depth || 15;
    const timeLimit = options.time || this.config.timeLimit || 2000;

    return new Promise((resolve, reject) => {
      this.currentSearch = { resolve, reject };

      // Start search
      if (options.time) {
        this.sendCommand(`go movetime ${timeLimit}`);
      } else {
        this.sendCommand(`go depth ${depth}`);
      }

      // Set timeout
      setTimeout(() => {
        if (this.currentSearch) {
          this.currentSearch.reject(new Error('Search timeout'));
          this.currentSearch = null;
        }
      }, timeLimit + 5000);
    });
  }

  async getCandidateMoves(count = 3, options = {}) {
    // Temporarily set MultiPV
    const originalMultiPV = this.config.multiPV || 1;
    await this.sendCommand(`setoption name MultiPV value ${count}`);

    const candidates = [];
    const searchPromise = this.getBestMove(options);

    // Collect all PV lines during search
    const originalParseInfo = this.parseInfoMessage.bind(this);
    this.parseInfoMessage = (message) => {
      originalParseInfo(message);
      const info = this.evaluation;
      if (info && info.multipv && info.pv && info.pv.length > 0) {
        candidates[info.multipv - 1] = {
          move: info.pv[0],
          evaluation: info.score,
          pv: info.pv,
          depth: info.depth,
        };
      }
    };

    await searchPromise;

    // Restore original MultiPV
    await this.sendCommand(`setoption name MultiPV value ${originalMultiPV}`);
    this.parseInfoMessage = originalParseInfo;

    return candidates.filter(Boolean);
  }

  async stop() {
    await this.sendCommand('stop');
  }

  async quit() {
    if (this.engine) {
      await this.sendCommand('quit');
      this.engine = null;
      this.isReady = false;
    }
  }
}
