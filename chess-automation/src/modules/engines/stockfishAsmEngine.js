/**
 * Stockfish ASM.js Engine Implementation
 * Alternative implementation using stockfish.js (ASM.js version)
 */

import { BaseEngine } from './baseEngine.js';
import { spawn } from 'child_process';
// Removed unused __dirname - can be added back if needed for path resolution

export class StockfishAsmEngine extends BaseEngine {
  constructor(config = {}) {
    super(config);
    this.process = null;
    this.messageQueue = [];
    this.waitingFor = null;
    this.currentSearch = null;
  }

  async init() {
    try {
      console.log('Initializing Stockfish ASM.js engine...');

      // Path to stockfish executable or script
      const stockfishPath = this.config.path || 'stockfish';

      // Spawn stockfish process
      this.process = spawn(stockfishPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle process output
      this.process.stdout.on('data', (data) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line) => line.trim());
        lines.forEach((line) => this.handleEngineMessage(line));
      });

      this.process.stderr.on('data', (data) => {
        console.error('Stockfish error:', data.toString());
      });

      this.process.on('error', (error) => {
        console.error('Failed to start Stockfish:', error);
        throw error;
      });

      // Initialize UCI
      await this.sendCommand('uci');
      await this.waitFor('uciok');

      // Configure engine
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
      await this.waitFor('readyok');

      this.isReady = true;
      console.log('Stockfish ASM.js engine ready');
    } catch (error) {
      console.error('Failed to initialize Stockfish ASM.js:', error);
      throw error;
    }
  }

  handleEngineMessage(message) {
    console.log('Engine:', message);

    // Check if we're waiting for this message
    if (this.waitingFor && message.includes(this.waitingFor.expected)) {
      this.waitingFor.resolve(message);
      this.waitingFor = null;
      return;
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

    // Store message in queue
    this.messageQueue.push(message);
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
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
            info.score = parseInt(parts[++i]) / 100;
          } else if (parts[i] === 'mate') {
            const mateIn = parseInt(parts[++i]);
            info.score = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn;
            info.mate = mateIn;
          }
          break;
        case 'pv':
          info.pv = [];
          for (let j = i + 1; j < parts.length; j++) {
            if (parts[j] && !parts[j].includes('info')) {
              info.pv.push(parts[j]);
            }
          }
          i = parts.length;
          break;
        case 'nodes':
          info.nodes = parseInt(parts[++i]);
          break;
        case 'nps':
          info.nps = parseInt(parts[++i]);
          break;
        case 'time':
          info.time = parseInt(parts[++i]);
          break;
      }
    }

    if (info.multipv === 1 || !info.multipv) {
      this.evaluation = info;
    }
  }

  async sendCommand(command) {
    if (!this.process) {
      throw new Error('Engine process not initialized');
    }
    console.log('Sending:', command);
    this.process.stdin.write(`${command}\n`);
  }

  async waitFor(expected, timeout = 5000) {
    return new Promise((resolve, reject) => {
      this.waitingFor = { expected, resolve, reject };

      setTimeout(() => {
        if (this.waitingFor && this.waitingFor.expected === expected) {
          this.waitingFor = null;
          reject(new Error(`Timeout waiting for ${expected}`));
        }
      }, timeout);
    });
  }

  async setPosition(fen) {
    await super.setPosition(fen);
    await this.sendCommand(`position fen ${fen}`);
  }

  async getBestMove(options = {}) {
    const depth = options.depth || this.config.depth || 15;
    const timeLimit = options.time || this.config.timeLimit || 2000;

    this.evaluation = null;

    return new Promise((resolve, reject) => {
      this.currentSearch = { resolve, reject };

      // Start search
      let searchCommand = 'go';
      if (options.time) {
        searchCommand += ` movetime ${timeLimit}`;
      } else if (options.depth) {
        searchCommand += ` depth ${depth}`;
      } else {
        searchCommand += ` depth ${depth}`;
      }

      this.sendCommand(searchCommand);

      // Set timeout
      setTimeout(
        () => {
          if (this.currentSearch) {
            this.stop();
            reject(new Error('Search timeout'));
            this.currentSearch = null;
          }
        },
        (timeLimit || 10000) + 5000
      );
    });
  }

  async getCandidateMoves(count = 3, options = {}) {
    const originalMultiPV = this.config.multiPV || 1;
    const candidates = [];

    // Set MultiPV for this search
    await this.sendCommand(`setoption name MultiPV value ${count}`);

    // Track all PV lines
    const pvLines = new Map();
    const originalParse = this.parseInfoMessage.bind(this);

    this.parseInfoMessage = (message) => {
      originalParse(message);
      if (this.evaluation && this.evaluation.pv && this.evaluation.multipv) {
        pvLines.set(this.evaluation.multipv, {
          move: this.evaluation.pv[0],
          evaluation: this.evaluation.score,
          pv: [...this.evaluation.pv],
          depth: this.evaluation.depth,
          nodes: this.evaluation.nodes,
        });
      }
    };

    // Run search
    await this.getBestMove(options);

    // Restore original MultiPV
    await this.sendCommand(`setoption name MultiPV value ${originalMultiPV}`);
    this.parseInfoMessage = originalParse;

    // Convert map to array
    for (let i = 1; i <= count; i++) {
      if (pvLines.has(i)) {
        candidates.push(pvLines.get(i));
      }
    }

    return candidates;
  }

  async stop() {
    await this.sendCommand('stop');
  }

  async quit() {
    if (this.process) {
      await this.sendCommand('quit');
      this.process.kill();
      this.process = null;
      this.isReady = false;
    }
  }
}
