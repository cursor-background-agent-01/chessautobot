/**
 * Chess Automation System - Entry Point
 * Supports multiple engines with flexible configuration
 */

import { ChessAutomation } from './chessAutomation.js';
import { ENGINE_TYPES } from './config/constants.js';
import { ENGINE_POOLS, ENGINES_CONFIG, ENGINE_SETUP_INSTRUCTIONS } from './config/engines.config.js';

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  engine: ENGINE_TYPES.STOCKFISH,
  usePool: false,
  pool: 'stockfish',
  selection: 'random',
  switchEvery: 1,
  autoPlay: false,
  headless: false,
  depth: 15,
  showEval: true,
  highlight: true,
  dualAnalysis: false,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--engine':
      options.engine = args[++i] || ENGINE_TYPES.STOCKFISH;
      break;
    case '--pool':
      options.usePool = true;
      options.pool = args[++i] || 'stockfish';
      // Special handling for 'all' pool in manual mode
      if (options.pool === 'all' && !options.autoPlay) {
        options.dualAnalysis = true;
      }
      break;
    case '--selection':
      options.selection = args[++i] || 'random';
      break;
    case '--switch-every':
      options.switchEvery = parseInt(args[++i]) || 1;
      break;
    case '--auto':
      options.autoPlay = true;
      // Disable dual analysis in auto mode
      options.dualAnalysis = false;
      break;
    case '--headless':
      options.headless = true;
      break;
    case '--depth':
      options.depth = parseInt(args[++i]) || 15;
      break;
    case '--no-eval':
      options.showEval = false;
      break;
    case '--no-highlight':
      options.highlight = false;
      break;
    case '--list-engines':
      listEngines();
      process.exit(0);
      break;
    case '--list-pools':
      listPools();
      process.exit(0);
      break;
    case '--setup-help':
      console.log(ENGINE_SETUP_INSTRUCTIONS);
      process.exit(0);
      break;
    case '--help':
      showHelp();
      process.exit(0);
  }
}

function listEngines() {
  console.log('\n=== Available Engines ===\n');
  Object.entries(ENGINES_CONFIG).forEach(([id, config]) => {
    const status = config.enabled ? '✓' : '✗';
    console.log(`${status} ${id.padEnd(20)} - ${config.name}`);
    if (config.type === 'lc0' && config.config.weightsPath) {
      console.log(`    Weights: ${config.config.weightsPath}`);
    }
  });
  console.log('\n✓ = enabled, ✗ = disabled');
}

function listPools() {
  console.log('\n=== Engine Pools ===\n');
  Object.entries(ENGINE_POOLS).forEach(([name, engines]) => {
    console.log(`${name}:`);
    console.log(`  Engines: ${engines.join(', ')}`);
    console.log('');
  });
}

function showHelp() {
  console.log(`
Chess Automation System - Play chess on Chess.com with AI assistance

Usage: npm start [options]

SINGLE ENGINE MODE:
  --engine <type>       Chess engine to use (default: stockfish-wasm)
                        Examples: stockfish-wasm, stockfish-native, lc0-default,
                                 maia-1100, maia-1500, maia-1900

MULTIPLE ENGINE MODE:
  --pool <name>         Use engine pool for random/varied play
                        Available pools: ${Object.keys(ENGINE_POOLS).join(', ')}
                        Special: --pool all in manual mode shows DUAL ANALYSIS
  --selection <type>    How to select engines: random, sequential, weighted, single
                        Default: random
  --switch-every <n>    Switch engine every N moves (default: 1, 0 = never)

GENERAL OPTIONS:
  --auto                Enable auto-play mode
  --headless            Run browser in headless mode
  --depth <n>           Engine search depth (default: 15)
  --no-eval             Disable evaluation display
  --no-highlight        Disable move highlighting

INFO COMMANDS:
  --list-engines        List all available engines
  --list-pools          List all engine pools
  --setup-help          Show instructions for setting up engines
  --help                Show this help message

EXAMPLES:

  # Single engine (traditional mode)
  npm start                                    # Stockfish WASM
  npm start --engine maia-1500                # Maia 1500 (human-like)
  npm start --engine lc0-default --depth 20   # Lc0 with depth 20

  # DUAL ANALYSIS (Manual mode with --pool all)
  npm start --pool all                        # Shows BOTH Stockfish & Maia suggestions!
  npm run play:dual                           # Same as above (shortcut)

  # Multiple engines AUTO-PLAY (pool mode)
  npm start --pool all --auto                 # Semi-random mix of all engines
  npm start --pool maia --auto                # Random Maia (1100/1500/1900)
  npm start --pool strong --switch-every 5    # Strong engines, switch every 5 moves
  npm start --pool human-like --auto          # Human-like play with auto-play

  # Custom configurations
  npm start --pool stockfish-varied --auto    # Stockfish with varying skill levels
  npm start --pool maia-varied --selection weighted --auto
  npm start --pool test --selection sequential --switch-every 3

ENGINE POOLS:
  stockfish     - Only Stockfish
  maia          - All Maia models (1100, 1500, 1900)
  maia-varied   - Weighted Maia (more beginner moves)
  all           - All available engines
  strong        - Strong engines only (Stockfish Native, Lc0)
  human-like    - Mostly Maia with occasional strong play
  test          - Testing pool (Stockfish WASM, Maia 1100)

NOTES:
  - Maia engines provide human-like play at different skill levels
  - Pool mode allows mixing engines for varied playing styles
  - Use --maia-setup for instructions on downloading Maia weights
  `);
}

// Main execution
async function main() {
  // Show configuration
  console.log('\n===========================================');
  console.log('Chess Automation System');
  console.log('===========================================\n');

  if (options.usePool) {
    console.log('Mode: Multiple Engines (Pool)');
    console.log(`Pool: ${options.pool}`);
    console.log(`Selection: ${options.selection}`);
    console.log(`Switch every: ${options.switchEvery} move(s)`);

    const poolEngines = ENGINE_POOLS[options.pool];
    if (poolEngines) {
      console.log(`Engines in pool: ${poolEngines.join(', ')}`);
    }
  } else {
    console.log('Mode: Single Engine');
    console.log(`Engine: ${options.engine}`);
  }

  console.log(`Auto-play: ${options.autoPlay}`);
  console.log(`Search depth: ${options.depth}`);
  console.log(`Show evaluation: ${options.showEval}`);
  console.log(`Highlight moves: ${options.highlight}`);
  console.log('');

  // Create automation instance
  const automation = new ChessAutomation({
    engineType: options.engine,
    useEnginePool: options.usePool,
    enginePool: options.pool,
    engineSelection: options.selection,
    engineSwitchEvery: options.switchEvery,
    useDualAnalysis: options.dualAnalysis,
    autoPlay: options.autoPlay,
    headless: options.headless,
    engineDepth: options.depth,
    showEvaluation: options.showEval,
    highlightMoves: options.highlight,
  });

  try {
    // Initialize system
    await automation.init();

    // Navigate to Chess.com
    await automation.navigateToChess();

    console.log('\n===========================================');
    console.log('System Ready!');
    console.log('===========================================\n');

    if (options.autoPlay) {
      console.log('Auto-play mode enabled. The bot will play automatically.');
      console.log('Press Ctrl+C to stop.\n');

      // Start auto-play
      await automation.startAutoPlay();
    } else {
      console.log('Interactive mode. The system will analyze positions.');
      console.log('Commands:');
      console.log("  - The system will automatically detect when it's your turn");
      console.log('  - Best moves will be highlighted on the board');
      console.log('  - Evaluation will be shown in the corner');
      if (options.usePool) {
        console.log('  - Engine will be shown for each move');
      }
      console.log('  - Press Ctrl+C to exit\n');

      // Interactive mode - analyze positions periodically
      let lastFen = '';

      while (true) {
        try {
          const fen = await automation.fenExtractor.extractFEN();

          // Only analyze if position changed
          if (fen !== lastFen) {
            console.log('\n=== New Position Detected ===');
            lastFen = fen;

            const analysis = await automation.analyzePosition();

            if (analysis.type === 'dual') {
              // Dual analysis output
              console.log('FEN:', analysis.fen);
              console.log('\n=== DUAL ENGINE ANALYSIS ===');

              for (const [engineName, result] of Object.entries(analysis.dualAnalysis.engines)) {
                console.log(`\n${engineName.toUpperCase()}:`);
                console.log(`  Move: ${result.bestMove}`);
                console.log(`  Eval: ${result.evaluation.toFixed(2)}`);
                console.log(`  Depth: ${result.depth}`);
                if (result.candidates && result.candidates.length > 1) {
                  console.log(
                    `  Alt: ${result.candidates
                      .slice(1, 3)
                      .map((c) => `${c.move} (${c.evaluation.toFixed(1)})`)
                      .join(', ')}`
                  );
                }
              }

              if (analysis.dualAnalysis.summary) {
                const { summary } = analysis.dualAnalysis;
                if (summary.consensusStrength > 0.5) {
                  console.log(
                    `\n✓ Consensus: ${summary.consensusMove} (${Math.round(summary.consensusStrength * 100)}% agree)`
                  );
                } else {
                  console.log(
                    `\n⚠ Engines disagree: ${summary.uniqueMoves} different moves suggested`
                  );
                }
              }
            } else {
              // Single or pool analysis output
              console.log('FEN:', analysis.fen);
              if (analysis.engineInfo) {
                console.log(`Engine: ${analysis.engineInfo.name} (${analysis.engineInfo.id})`);
              }
              console.log('Best move:', analysis.analysis.bestMove);
              console.log('Evaluation:', analysis.analysis.evaluation.toFixed(2));
              console.log('\nTop 3 moves:');

              analysis.candidates.slice(0, 3).forEach((move, i) => {
                console.log(`  ${i + 1}. ${move.move} (${move.evaluation.toFixed(2)})`);
              });
            }

            // Highlighting and evaluation display
            if (analysis.type === 'dual') {
              // Dual analysis already shows its own visualization
              // No additional highlighting needed as it's handled in analyzePosition
            } else {
              // Single or pool analysis - show traditional highlighting
              if (options.highlight && analysis.analysis) {
                await automation.uiHighlighter.highlightMove(analysis.analysis.bestMove);
              }

              // Show evaluation
              if (options.showEval && analysis.analysis) {
                const evalData = {
                  score: analysis.analysis.evaluation,
                  bestMove: analysis.analysis.bestMove,
                  depth: analysis.analysis.depth,
                  alternatives: analysis.candidates.slice(1, 3).map((c) => ({
                    move: c.move,
                    score: c.evaluation,
                  })),
                };

                // Add engine info if using pool
                if (analysis.engineInfo) {
                  evalData.engine = analysis.engineInfo.name;
                }

                await automation.uiHighlighter.showEvaluation(evalData);
              }
            }
          }

          // Wait before checking again
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Error in main loop:', error);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
  } catch (error) {
    console.error('Fatal error:', error);
    if (error.message.includes('Lc0') || error.message.includes('Maia')) {
      console.log('\nTo use Lc0/Maia engines, run: npm start --maia-setup');
    }
  } finally {
    // Cleanup on exit
    await automation.cleanup();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nReceived interrupt signal. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nReceived termination signal. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
