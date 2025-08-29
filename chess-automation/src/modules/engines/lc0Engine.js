/**
 * Lc0 (Leela Chess Zero) Engine Implementation
 * Supports standard Lc0 networks and Maia weights for human-like play
 */

import { BaseEngine } from './baseEngine.js';
import { spawn } from 'child_process';
import fs from 'fs/promises';

export class Lc0Engine extends BaseEngine {
  constructor(config = {}) {
    super(config);
    this.process = null;
    this.messageQueue = [];
    this.waitingFor = null;
    this.currentSearch = null;
    this.pvLines = new Map();
    this.isMaia = config.weightsPath && config.weightsPath.includes('maia');
  }

  async init() {
    try {
      console.log(`Initializing Lc0 engine${this.isMaia ? ' with Maia weights' : ''}...`);

      // Check if weights file exists
      if (this.config.weightsPath) {
        try {
          await fs.access(this.config.weightsPath);
        } catch (_error) {
          console.warn(`Weights file not found: ${this.config.weightsPath}`);
          console.log('Using default network. To use Maia, download weights from:');
          console.log('https://github.com/CSSLab/maia-chess/releases');
          this.config.weightsPath = null;
        }
      }

      // Build Lc0 command with options
      const lc0Path = this.config.path || 'lc0';
      const args = [];

      // Add weights file if specified
      if (this.config.weightsPath) {
        args.push('--weights', this.config.weightsPath);
      }

      // Add backend configuration
      if (this.config.backend) {
        args.push('--backend', this.config.backend);
      }

      // Add other UCI options via command line
      if (this.config.threads) {
        args.push('--threads', this.config.threads.toString());
      }

      // Spawn Lc0 process
      this.process = spawn(lc0Path, args, {
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
        console.error('Lc0 error:', data.toString());
      });

      this.process.on('error', (error) => {
        console.error('Failed to start Lc0:', error);
        console.log('Make sure Lc0 is installed. Install with:');
        console.log('  Ubuntu: apt-get install lc0');
        console.log('  macOS: brew install lc0');
        console.log('  Or download from: https://github.com/LeelaChessZero/lc0/releases');
        throw error;
      });

      // Initialize UCI
      await this.sendCommand('uci');
      await this.waitFor('uciok', 10000);

      // Configure engine via UCI
      await this.setUciOptions();

      await this.sendCommand('isready');
      await this.waitFor('readyok', 5000);

      this.isReady = true;
      console.log(`Lc0 engine ready${this.isMaia ? ' (Maia mode)' : ''}`);
    } catch (error) {
      console.error('Failed to initialize Lc0:', error);
      throw error;
    }
  }

  async setUciOptions() {
    // Set MultiPV
    if (this.config.multiPV) {
      await this.sendCommand(`setoption name MultiPV value ${this.config.multiPV}`);
    }

    // Set batch size for neural network
    if (this.config.batchSize) {
      await this.sendCommand(`setoption name MinibatchSize value ${this.config.batchSize}`);
    }

    // Set temperature for Maia (controls randomness)
    if (this.isMaia && this.config.temperature) {
      await this.sendCommand(`setoption name Temperature value ${this.config.temperature}`);
    }

    // Set other Lc0-specific options
    if (this.config.cacheHistoryLength) {
      await this.sendCommand(
        `setoption name CacheHistoryLength value ${this.config.cacheHistoryLength}`
      );
    }

    // Policy temperature for move randomness
    if (this.config.policyTemperature) {
      await this.sendCommand(
        `setoption name PolicyTemperature value ${this.config.policyTemperature}`
      );
    }

    // FPU (First Play Urgency) value
    if (this.config.fpu) {
      await this.sendCommand(`setoption name FpuValue value ${this.config.fpu}`);
    }
  }

  handleEngineMessage(message) {
    // console.log('Lc0:', message);

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
        // Collect all PV lines for candidate moves
        const candidates = [];
        this.pvLines.forEach((info, multipv) => {
          candidates[multipv - 1] = info;
        });

        this.currentSearch.resolve({
          move: bestMove,
          ponder: ponderMove,
          evaluation: this.evaluation,
          candidates: candidates.filter(Boolean),
        });
        this.currentSearch = null;
        this.pvLines.clear();
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
        case 'seldepth':
          info.seldepth = parseInt(parts[++i]);
          break;
        case 'multipv':
          info.multipv = parseInt(parts[++i]);
          break;
        case 'score':
          i++;
          if (parts[i] === 'cp') {
            // Lc0 uses different scaling, typically already in centipawns
            info.score = parseInt(parts[++i]) / 100;
          } else if (parts[i] === 'mate') {
            const mateIn = parseInt(parts[++i]);
            info.score = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn;
            info.mate = mateIn;
          }
          break;
        case 'wdl':
          // Win-Draw-Loss probabilities (Lc0 specific)
          info.win = parseInt(parts[++i]) / 1000;
          info.draw = parseInt(parts[++i]) / 1000;
          info.loss = parseInt(parts[++i]) / 1000;
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

    // Store PV line for multi-PV
    if (info.multipv && info.pv && info.pv.length > 0) {
      this.pvLines.set(info.multipv, {
        move: info.pv[0],
        evaluation: info.score || 0,
        pv: info.pv,
        depth: info.depth,
        nodes: info.nodes,
        wdl: info.win ? { win: info.win, draw: info.draw, loss: info.loss } : null,
      });
    }

    // Update main evaluation
    if (info.multipv === 1 || !info.multipv) {
      this.evaluation = info;
    }
  }

  async sendCommand(command) {
    if (!this.process) {
      throw new Error('Engine process not initialized');
    }
    // console.log('Sending to Lc0:', command);
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
    const nodes = options.nodes || this.config.nodes || 10000;
    const timeLimit = options.time || this.config.timeLimit || 5000;
    const depth = options.depth || this.config.depth || 20;

    this.evaluation = null;
    this.pvLines.clear();

    return new Promise((resolve, reject) => {
      this.currentSearch = { resolve, reject };

      // Build go command
      let searchCommand = 'go';

      // For Maia, use nodes limit for consistent play strength
      if (this.isMaia && nodes) {
        searchCommand += ` nodes ${nodes}`;
      } else if (options.time) {
        searchCommand += ` movetime ${timeLimit}`;
      } else if (options.nodes) {
        searchCommand += ` nodes ${nodes}`;
      } else {
        searchCommand += ` depth ${depth}`;
      }

      this.sendCommand(searchCommand);

      // Set timeout
      const searchTimeout = Math.max(timeLimit, 10000) + 5000;
      setTimeout(() => {
        if (this.currentSearch) {
          this.stop();
          reject(new Error('Search timeout'));
          this.currentSearch = null;
        }
      }, searchTimeout);
    });
  }

  async getCandidateMoves(count = 3, options = {}) {
    const originalMultiPV = this.config.multiPV || 1;

    // For Maia, typically only use single PV as it's meant to be human-like
    if (this.isMaia && !options.forceMultiPV) {
      const result = await this.getBestMove(options);
      return [
        {
          move: result.move,
          evaluation: result.evaluation?.score || 0,
          pv: result.evaluation?.pv || [result.move],
          depth: result.evaluation?.depth,
          wdl: result.evaluation?.wdl,
        },
      ];
    }

    // Set MultiPV for this search
    await this.sendCommand(`setoption name MultiPV value ${count}`);

    // Run search
    const result = await this.getBestMove(options);

    // Restore original MultiPV
    await this.sendCommand(`setoption name MultiPV value ${originalMultiPV}`);

    // Return candidates from the search
    return (
      result.candidates || [
        {
          move: result.move,
          evaluation: result.evaluation?.score || 0,
          pv: result.evaluation?.pv || [result.move],
          depth: result.evaluation?.depth,
        },
      ]
    );
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

  /**
   * Get engine info for display
   */
  getInfo() {
    return {
      name: this.isMaia ? 'Maia (Human-like)' : 'Leela Chess Zero',
      type: 'lc0',
      weights: this.config.weightsPath || 'default',
      backend: this.config.backend || 'auto',
      isMaia: this.isMaia,
    };
  }
}
