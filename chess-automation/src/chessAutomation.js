/**
 * Main Chess Automation Controller
 * Orchestrates all modules to play chess on Chess.com
 */

import puppeteer from 'puppeteer';
import { FenExtractor } from './modules/fenExtractor.js';
import { EngineManager } from './modules/engineManager.js';
import { EnginePoolManager } from './modules/enginePoolManager.js';
import { DualAnalysis } from './modules/dualAnalysis.js';
import { MoveExecutor } from './modules/moveExecutor.js';
import { UIHighlighter } from './modules/uiHighlighter.js';
import { CHESS_COM_URL, ENGINE_TYPES } from './config/constants.js';
import { DUAL_ANALYSIS_ENGINES } from './config/engines.config.js';

export class ChessAutomation {
  constructor(config = {}) {
    this.config = {
      headless: false,
      engineType: ENGINE_TYPES.STOCKFISH,
      useEnginePool: false, // Use engine pool instead of single engine
      enginePool: 'stockfish', // Which pool to use
      engineSelection: 'random', // How to select engines
      engineSwitchEvery: 1, // Switch engine every N moves
      useDualAnalysis: false, // Use dual analysis in manual mode
      dualEngines: DUAL_ANALYSIS_ENGINES, // Engines for dual analysis
      showEvaluation: true,
      highlightMoves: true,
      autoPlay: false,
      engineDepth: 15,
      engineTime: 2000,
      ...config,
    };

    this.browser = null;
    this.page = null;
    this.fenExtractor = null;
    this.engineManager = null;
    this.enginePoolManager = null;
    this.dualAnalysis = null;
    this.moveExecutor = null;
    this.uiHighlighter = null;
    this.isPlaying = false;
    this.gameState = {
      fen: null,
      lastMove: null,
      moveCount: 0,
      evaluation: null,
      currentEngine: null,
    };
  }

  /**
   * Initialize the automation system
   */
  async init() {
    try {
      console.log('Initializing Chess Automation System...');

      // Launch browser
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });

      // Create page
      this.page = await this.browser.newPage();

      // Initialize modules
      this.fenExtractor = new FenExtractor(this.page);
      this.moveExecutor = new MoveExecutor(this.page);
      this.uiHighlighter = new UIHighlighter(this.page);

      // Initialize engine manager or pool
      if (this.config.useDualAnalysis && !this.config.autoPlay) {
        // Use dual analysis for manual mode
        this.dualAnalysis = new DualAnalysis({
          engines: this.config.dualEngines,
          depth: this.config.engineDepth,
          timeLimit: this.config.engineTime,
        });
        await this.dualAnalysis.init();
      } else if (this.config.useEnginePool) {
        // Use engine pool for multiple engines
        this.enginePoolManager = new EnginePoolManager({
          pool: this.config.enginePool,
          selection: this.config.engineSelection,
          switchEvery: this.config.engineSwitchEvery,
        });
        await this.enginePoolManager.init();
      } else {
        // Use single engine
        this.engineManager = new EngineManager({
          engine: this.config.engineType,
          depth: this.config.engineDepth,
          timeLimit: this.config.engineTime,
          multiPV: 3,
        });
        await this.engineManager.init();
      }

      // Initialize UI highlighter if enabled
      if (this.config.highlightMoves) {
        await this.uiHighlighter.init();
      }

      console.log('Chess Automation System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Navigate to Chess.com and prepare for play
   */
  async navigateToChess() {
    try {
      console.log('Navigating to Chess.com...');
      await this.page.goto(CHESS_COM_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for board to load
      await this.page.waitForSelector('chess-board', { timeout: 10000 });

      // Inject helper functions
      await this.fenExtractor.injectHelpers();

      console.log('Successfully navigated to Chess.com');
    } catch (error) {
      console.error('Failed to navigate to Chess.com:', error);
      throw error;
    }
  }

  /**
   * Start playing automatically
   */
  async startAutoPlay() {
    if (this.isPlaying) {
      console.log('Already playing');
      return;
    }

    this.isPlaying = true;
    console.log('Starting auto-play...');

    while (this.isPlaying) {
      try {
        // Check if it's our turn
        const isOurTurn = await this.moveExecutor.isOurTurn();

        if (isOurTurn) {
          // Get current position
          const fen = await this.fenExtractor.extractFEN();

          if (fen !== this.gameState.fen) {
            // Position changed, make a move
            await this.makeMove(fen);
          }
        }

        // Wait before checking again
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.error('Error during auto-play:', error);
        // Continue playing despite errors
      }
    }
  }

  /**
   * Stop auto-play
   */
  stopAutoPlay() {
    this.isPlaying = false;
    console.log('Auto-play stopped');
  }

  /**
   * Make a single move
   * @param {string} fen - Current position FEN
   */
  async makeMove(fen = null) {
    try {
      // Get current FEN if not provided
      if (!fen) {
        fen = await this.fenExtractor.extractFEN();
      }

      console.log('Current position:', fen);
      this.gameState.fen = fen;

      // Analyze position with appropriate engine
      let analysis;
      let candidates = [];

      if (this.config.useEnginePool) {
        // Use engine pool
        analysis = await this.enginePoolManager.analyzePosition(fen, {
          depth: this.config.engineDepth,
          time: this.config.engineTime,
        });

        // Store current engine info
        this.gameState.currentEngine = this.enginePoolManager.getCurrentEngineInfo();
        console.log(`Using engine: ${this.gameState.currentEngine?.name}`);

        if (this.config.showEvaluation) {
          candidates = await this.enginePoolManager.getCandidateMoves(fen, 3, {
            depth: Math.min(this.config.engineDepth, 10),
            time: Math.min(this.config.engineTime, 1000),
          });
        }
      } else {
        // Use single engine
        analysis = await this.engineManager.analyzePosition(fen, {
          depth: this.config.engineDepth,
          time: this.config.engineTime,
        });

        if (this.config.showEvaluation) {
          candidates = await this.engineManager.getCandidateMoves(fen, 3, {
            depth: Math.min(this.config.engineDepth, 10),
            time: Math.min(this.config.engineTime, 1000),
          });
        }
      }

      console.log('Analysis:', analysis);
      this.gameState.evaluation = analysis.evaluation;

      // Highlight moves if enabled
      if (this.config.highlightMoves && this.uiHighlighter) {
        await this.uiHighlighter.highlightMove(analysis.bestMove);

        if (candidates.length > 0) {
          await this.uiHighlighter.highlightCandidates(candidates);
        }
      }

      // Show evaluation if enabled
      if (this.config.showEvaluation && this.uiHighlighter) {
        await this.uiHighlighter.showEvaluation({
          score: analysis.evaluation,
          bestMove: analysis.bestMove,
          depth: analysis.depth,
          alternatives: candidates.slice(1).map((c) => ({
            move: c.move,
            score: c.evaluation,
          })),
        });
      }

      // Execute the move if auto-play is enabled
      if (this.config.autoPlay) {
        const success = await this.moveExecutor.executeMove(analysis.bestMove);

        if (success) {
          this.gameState.lastMove = analysis.bestMove;
          this.gameState.moveCount++;
          console.log(`Move ${this.gameState.moveCount}: ${analysis.bestMove}`);
        } else {
          console.error('Failed to execute move');
        }
      }

      return analysis;
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  }

  /**
   * Get current game state
   */
  getGameState() {
    return { ...this.gameState };
  }

  /**
   * Get engine status
   */
  getEngineStatus() {
    if (this.config.useEnginePool) {
      return this.enginePoolManager.getPoolInfo();
    }
    return this.engineManager.getStatus();
  }

  /**
   * Switch to a different engine
   * @param {string} engineType - New engine type
   */
  async switchEngine(engineType) {
    if (this.config.useEnginePool) {
      await this.enginePoolManager.switchToEngine(engineType);
    } else {
      await this.engineManager.switchEngine(engineType);
    }
    console.log(`Switched to ${engineType} engine`);
  }

  /**
   * Set configuration
   * @param {Object} config - New configuration
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };

    // Update engine manager config if needed
    if (config.engineDepth || config.engineTime) {
      this.engineManager.config = {
        ...this.engineManager.config,
        depth: config.engineDepth || this.engineManager.config.depth,
        timeLimit: config.engineTime || this.engineManager.config.timeLimit,
      };
    }
  }

  /**
   * Analyze current position without making a move
   */
  async analyzePosition() {
    const fen = await this.fenExtractor.extractFEN();

    if (this.config.useDualAnalysis && !this.config.autoPlay) {
      // Use dual analysis for comprehensive evaluation
      const dualResult = await this.dualAnalysis.analyzePosition(fen);

      // Show dual analysis visualization
      if (this.config.highlightMoves && this.uiHighlighter) {
        await this.uiHighlighter.showDualAnalysis(dualResult);
      }

      return {
        fen,
        dualAnalysis: dualResult,
        type: 'dual',
      };
    } else if (this.config.useEnginePool) {
      const analysis = await this.enginePoolManager.analyzePosition(fen);
      const candidates = await this.enginePoolManager.getCandidateMoves(fen, 5);
      return {
        fen,
        analysis,
        candidates,
        engineInfo: this.enginePoolManager.getCurrentEngineInfo(),
        type: 'pool',
      };
    } else {
      const analysis = await this.engineManager.analyzePosition(fen);
      const candidates = await this.engineManager.getCandidateMoves(fen, 5);
      return {
        fen,
        analysis,
        candidates,
        type: 'single',
      };
    }
  }

  /**
   * Clean up and close
   */
  async cleanup() {
    try {
      console.log('Cleaning up...');

      this.stopAutoPlay();

      if (this.uiHighlighter) {
        await this.uiHighlighter.hideEvaluation();
        await this.uiHighlighter.hideDualAnalysis();
        await this.uiHighlighter.clearHighlights();
      }

      if (this.dualAnalysis) {
        await this.dualAnalysis.cleanup();
      }

      if (this.enginePoolManager) {
        await this.enginePoolManager.cleanup();
      }

      if (this.engineManager) {
        await this.engineManager.quit();
      }

      if (this.browser) {
        await this.browser.close();
      }

      console.log('Cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
