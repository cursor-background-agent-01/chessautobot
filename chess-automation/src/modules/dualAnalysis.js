/**
 * Dual Analysis Module
 * Runs multiple engines simultaneously for comparison in manual mode
 */

import { EngineManager } from './engineManager.js';
import { DUAL_ANALYSIS_ENGINES, ENGINES_CONFIG, getEngineColor } from '../config/engines.config.js';

export class DualAnalysis {
  constructor(config = {}) {
    this.config = {
      engines: config.engines || DUAL_ANALYSIS_ENGINES,
      depth: config.depth || 15,
      timeLimit: config.timeLimit || 3000,
      ...config,
    };

    this.engines = new Map();
    this.results = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all engines for dual analysis
   */
  async init() {
    console.log('Initializing dual analysis engines...');

    for (const [name, engineId] of Object.entries(this.config.engines)) {
      try {
        console.log(`Initializing ${name}: ${engineId}`);

        const manager = new EngineManager({
          engine: engineId.includes('stockfish')
            ? 'stockfish-native'
            : engineId.includes('maia') || engineId.includes('lc0')
              ? 'lc0'
              : engineId,
          ...this.getEngineConfig(engineId),
        });

        await manager.init();
        this.engines.set(name, { manager, engineId });

        console.log(`✓ ${name} engine ready`);
      } catch (error) {
        console.error(`Failed to initialize ${name} (${engineId}):`, error);
      }
    }

    if (this.engines.size === 0) {
      throw new Error('No engines could be initialized for dual analysis');
    }

    this.isInitialized = true;
    console.log(`Dual analysis ready with ${this.engines.size} engines`);
  }

  /**
   * Get engine configuration from ID
   */
  getEngineConfig(engineId) {
    return ENGINES_CONFIG[engineId]?.config || {};
  }

  /**
   * Analyze position with all engines
   */
  async analyzePosition(fen, options = {}) {
    if (!this.isInitialized) {
      await this.init();
    }

    const analysisOptions = {
      depth: options.depth || this.config.depth,
      time: options.time || this.config.timeLimit,
    };

    console.log('\n=== Dual Engine Analysis ===');
    console.log(`Position: ${fen}`);

    // Clear previous results
    this.results.clear();

    // Run analysis in parallel
    const analyses = [];
    for (const [name, engine] of this.engines) {
      analyses.push(this.analyzeWithEngine(name, engine, fen, analysisOptions));
    }

    // Wait for all analyses to complete
    await Promise.all(analyses);

    // Return consolidated results
    return this.consolidateResults();
  }

  /**
   * Analyze with a specific engine
   */
  async analyzeWithEngine(name, engine, fen, options) {
    try {
      const startTime = Date.now();

      // Get best move and candidates
      const analysis = await engine.manager.analyzePosition(fen, options);
      const candidates = await engine.manager.getCandidateMoves(fen, 3, {
        depth: Math.min(options.depth, 10),
        time: Math.min(options.time, 1000),
      });

      const timeElapsed = Date.now() - startTime;

      const result = {
        engineName: name,
        engineId: engine.engineId,
        bestMove: analysis.bestMove,
        evaluation: analysis.evaluation,
        depth: analysis.depth,
        candidates,
        time: timeElapsed,
        color: getEngineColor(engine.engineId),
      };

      this.results.set(name, result);

      console.log(
        `${name}: ${analysis.bestMove} (${analysis.evaluation.toFixed(2)}) - ${timeElapsed}ms`
      );

      return result;
    } catch (error) {
      console.error(`Error analyzing with ${name}:`, error);
      return null;
    }
  }

  /**
   * Consolidate results from all engines
   */
  consolidateResults() {
    const results = {
      engines: {},
      consensus: null,
      divergence: 0,
      summary: {},
    };

    // Collect all results
    for (const [name, result] of this.results) {
      if (result) {
        results.engines[name] = result;
      }
    }

    // Find consensus move (if any)
    const moves = {};
    for (const result of this.results.values()) {
      if (result && result.bestMove) {
        moves[result.bestMove] = (moves[result.bestMove] || 0) + 1;
      }
    }

    // Find most common move
    let maxCount = 0;
    for (const [move, count] of Object.entries(moves)) {
      if (count > maxCount) {
        maxCount = count;
        results.consensus = move;
      }
    }

    // Calculate divergence (how much engines disagree)
    const uniqueMoves = Object.keys(moves).length;
    results.divergence = uniqueMoves > 1 ? (uniqueMoves - 1) / this.results.size : 0;

    // Create summary
    results.summary = {
      totalEngines: this.results.size,
      uniqueMoves,
      consensusMove: results.consensus,
      consensusStrength: maxCount / this.results.size,
      moves,
    };

    return results;
  }

  /**
   * Get formatted comparison for display
   */
  getComparison() {
    const comparison = [];

    for (const [name, result] of this.results) {
      if (result) {
        comparison.push({
          engine: name,
          move: result.bestMove,
          eval: result.evaluation,
          color: result.color,
          candidates: result.candidates.slice(0, 2).map((c) => ({
            move: c.move,
            eval: c.evaluation,
          })),
        });
      }
    }

    return comparison;
  }

  /**
   * Stop all analyses
   */
  async stopAll() {
    for (const [name, engine] of this.engines) {
      try {
        await engine.manager.stopAnalysis();
      } catch (error) {
        console.error(`Error stopping ${name}:`, error);
      }
    }
  }

  /**
   * Cleanup all engines
   */
  async cleanup() {
    console.log('Cleaning up dual analysis engines...');

    for (const [name, engine] of this.engines) {
      try {
        await engine.manager.quit();
        console.log(`✓ ${name} cleaned up`);
      } catch (error) {
        console.error(`Error cleaning up ${name}:`, error);
      }
    }

    this.engines.clear();
    this.results.clear();
    this.isInitialized = false;
  }
}
