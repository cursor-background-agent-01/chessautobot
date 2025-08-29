/**
 * Engine Pool Manager
 * Manages multiple engines and selection strategies
 */

import { EngineManager } from './engineManager.js';
import { ENGINES_CONFIG, getEnginePool } from '../config/engines.config.js';

export class EnginePoolManager {
  constructor(config = {}) {
    this.config = {
      pool: 'stockfish', // default pool
      selection: 'random', // random, sequential, weighted, single
      switchEvery: 1, // switch engine every N moves
      weights: null, // for weighted selection
      ...config,
    };

    this.engines = new Map(); // Cache of initialized engines
    this.currentEngine = null;
    this.currentEngineId = null;
    this.moveCount = 0;
    this.poolEngines = [];
    this.poolIndex = 0;
  }

  /**
   * Initialize the engine pool
   */
  async init() {
    console.log(`Initializing engine pool: ${this.config.pool}`);
    console.log(`Selection strategy: ${this.config.selection}`);

    // Get engines for the pool
    this.poolEngines = getEnginePool(this.config.pool);

    if (this.poolEngines.length === 0) {
      throw new Error(`No engines defined in pool: ${this.config.pool}`);
    }

    console.log(`Pool contains ${this.poolEngines.length} engine(s):`, this.poolEngines);

    // Select and initialize first engine
    await this.selectAndInitEngine();
  }

  /**
   * Select and initialize an engine based on strategy
   */
  async selectAndInitEngine() {
    let engineId;

    switch (this.config.selection) {
      case 'random':
        engineId = this.selectRandomEngine();
        break;

      case 'sequential':
        engineId = this.selectSequentialEngine();
        break;

      case 'weighted':
        engineId = this.selectWeightedEngine();
        break;

      case 'single':
      default:
        [engineId] = this.poolEngines;
        break;
    }

    // Initialize engine if not already cached
    if (!this.engines.has(engineId)) {
      await this.initializeEngine(engineId);
    }

    this.currentEngineId = engineId;
    this.currentEngine = this.engines.get(engineId);

    console.log(`Selected engine: ${engineId} (${ENGINES_CONFIG[engineId]?.name})`);
  }

  /**
   * Initialize a specific engine
   */
  async initializeEngine(engineId) {
    const engineConfig = ENGINES_CONFIG[engineId];

    if (!engineConfig) {
      throw new Error(`Engine configuration not found: ${engineId}`);
    }

    if (!engineConfig.enabled) {
      console.warn(`Engine ${engineId} is disabled, skipping`);
      return;
    }

    console.log(`Initializing engine: ${engineId} (${engineConfig.name})`);

    const manager = new EngineManager({
      engine: engineConfig.type,
      ...engineConfig.config,
    });

    try {
      await manager.init();
      this.engines.set(engineId, manager);
      console.log(`Engine ${engineId} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize engine ${engineId}:`, error);
      // Remove from pool if initialization fails
      this.poolEngines = this.poolEngines.filter((id) => id !== engineId);
      throw error;
    }
  }

  /**
   * Select random engine from pool
   */
  selectRandomEngine() {
    return this.poolEngines[Math.floor(Math.random() * this.poolEngines.length)];
  }

  /**
   * Select next engine sequentially
   */
  selectSequentialEngine() {
    // eslint-disable-next-line prefer-destructuring
    const engineId = this.poolEngines[this.poolIndex];
    this.poolIndex = (this.poolIndex + 1) % this.poolEngines.length;
    return engineId;
  }

  /**
   * Select engine based on weights
   */
  selectWeightedEngine() {
    if (!this.config.weights || this.config.weights.length !== this.poolEngines.length) {
      // Fall back to random if weights not properly configured
      return this.selectRandomEngine();
    }

    const totalWeight = this.config.weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < this.poolEngines.length; i++) {
      random -= this.config.weights[i];
      if (random <= 0) {
        return this.poolEngines[i];
      }
    }

    return this.poolEngines[this.poolEngines.length - 1];
  }

  /**
   * Analyze position with current engine
   */
  async analyzePosition(fen, options = {}) {
    if (!this.currentEngine) {
      throw new Error('No engine selected');
    }

    // Check if we should switch engines
    if (this.shouldSwitchEngine()) {
      await this.selectAndInitEngine();
    }

    this.moveCount++;

    // Analyze with current engine
    const result = await this.currentEngine.analyzePosition(fen, options);

    // Add engine info to result
    result.engineId = this.currentEngineId;
    result.engineName = ENGINES_CONFIG[this.currentEngineId]?.name;

    return result;
  }

  /**
   * Get candidate moves from current engine
   */
  async getCandidateMoves(fen, count = 3, options = {}) {
    if (!this.currentEngine) {
      throw new Error('No engine selected');
    }

    return this.currentEngine.getCandidateMoves(fen, count, options);
  }

  /**
   * Check if we should switch engines
   */
  shouldSwitchEngine() {
    if (this.config.selection === 'single') {
      return false;
    }

    if (this.config.switchEvery <= 0) {
      return false;
    }

    return this.moveCount > 0 && this.moveCount % this.config.switchEvery === 0;
  }

  /**
   * Force switch to a specific engine
   */
  async switchToEngine(engineId) {
    if (!ENGINES_CONFIG[engineId]) {
      throw new Error(`Unknown engine: ${engineId}`);
    }

    if (!this.engines.has(engineId)) {
      await this.initializeEngine(engineId);
    }

    this.currentEngineId = engineId;
    this.currentEngine = this.engines.get(engineId);

    console.log(`Switched to engine: ${engineId}`);
  }

  /**
   * Get current engine info
   */
  getCurrentEngineInfo() {
    if (!this.currentEngineId) {
      return null;
    }

    return {
      id: this.currentEngineId,
      name: ENGINES_CONFIG[this.currentEngineId]?.name,
      type: ENGINES_CONFIG[this.currentEngineId]?.type,
      moveCount: this.moveCount,
    };
  }

  /**
   * Get pool info
   */
  getPoolInfo() {
    return {
      pool: this.config.pool,
      selection: this.config.selection,
      switchEvery: this.config.switchEvery,
      engines: this.poolEngines.map((id) => ({
        id,
        name: ENGINES_CONFIG[id]?.name,
        initialized: this.engines.has(id),
      })),
      currentEngine: this.getCurrentEngineInfo(),
    };
  }

  /**
   * Stop all engines
   */
  async stopAll() {
    for (const [id, engine] of this.engines) {
      try {
        await engine.stopAnalysis();
      } catch (error) {
        console.error(`Error stopping engine ${id}:`, error);
      }
    }
  }

  /**
   * Cleanup all engines
   */
  async cleanup() {
    console.log('Cleaning up engine pool...');

    for (const [id, engine] of this.engines) {
      try {
        await engine.quit();
        console.log(`Engine ${id} cleaned up`);
      } catch (error) {
        console.error(`Error cleaning up engine ${id}:`, error);
      }
    }

    this.engines.clear();
    this.currentEngine = null;
    this.currentEngineId = null;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      totalMoves: this.moveCount,
      enginesUsed: new Set(),
      engineUsage: {},
    };

    // Analyze history from all engines
    for (const [id, engine] of this.engines) {
      const history = engine.getHistory();
      if (history.length > 0) {
        stats.enginesUsed.add(id);
        stats.engineUsage[id] = history.length;
      }
    }

    return stats;
  }
}
