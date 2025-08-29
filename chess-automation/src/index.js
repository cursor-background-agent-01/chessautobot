/**
 * Example usage of the Chess Automation System
 */

import { ChessAutomation } from './chessAutomation.js';
import { ENGINE_TYPES } from './config/constants.js';

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  engine: ENGINE_TYPES.STOCKFISH_WASM,
  autoPlay: false,
  headless: false,
  depth: 15,
  showEval: true,
  highlight: true,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--engine':
      options.engine = args[++i] || ENGINE_TYPES.STOCKFISH_WASM;
      break;
    case '--auto':
      options.autoPlay = true;
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
    case '--help':
      showHelp();
      process.exit(0);
  }
}

function showHelp() {
  console.log(`
Chess Automation System - Play chess on Chess.com with AI assistance

Usage: npm start [options]

Options:
  --engine <type>    Chess engine to use (stockfish-wasm, stockfish, lc0, maia)
                     Default: stockfish-wasm
  --auto             Enable auto-play mode
  --headless         Run browser in headless mode
  --depth <n>        Engine search depth (default: 15)
  --no-eval          Disable evaluation display
  --no-highlight     Disable move highlighting
  --help             Show this help message

Examples:
  npm start                           # Interactive mode with Stockfish WASM
  npm start --auto                    # Auto-play mode
  npm start --engine stockfish --depth 20  # Use Stockfish with depth 20

Interactive Commands (when not in auto mode):
  Press Ctrl+C to stop the program
  The system will analyze positions and suggest moves
  `);
}

// Main execution
async function main() {
  const automation = new ChessAutomation({
    engineType: options.engine,
    autoPlay: options.autoPlay,
    headless: options.headless,
    engineDepth: options.depth,
    showEvaluation: options.showEval,
    highlightMoves: options.highlight,
  });

  try {
    console.log('Starting Chess Automation System...');
    console.log('Configuration:', options);

    // Initialize system
    await automation.init();

    // Navigate to Chess.com
    await automation.navigateToChess();

    console.log('\n===========================================');
    console.log('Chess Automation System is ready!');
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
      console.log('  - Press Ctrl+C to exit\n');

      // Interactive mode - analyze positions periodically
      let lastFen = '';

      while (true) {
        try {
          const fen = await automation.fenExtractor.extractFEN();

          // Only analyze if position changed
          if (fen !== lastFen) {
            console.log('\nNew position detected!');
            lastFen = fen;

            const analysis = await automation.analyzePosition();

            console.log('FEN:', analysis.fen);
            console.log('Best move:', analysis.analysis.bestMove);
            console.log('Evaluation:', analysis.analysis.evaluation.toFixed(2));
            console.log('\nTop 3 moves:');

            analysis.candidates.slice(0, 3).forEach((move, i) => {
              console.log(`  ${i + 1}. ${move.move} (${move.evaluation.toFixed(2)})`);
            });

            // Highlight best move
            if (options.highlight) {
              await automation.uiHighlighter.highlightMove(analysis.analysis.bestMove);
            }

            // Show evaluation
            if (options.showEval) {
              await automation.uiHighlighter.showEvaluation({
                score: analysis.analysis.evaluation,
                bestMove: analysis.analysis.bestMove,
                depth: analysis.analysis.depth,
                alternatives: analysis.candidates.slice(1, 3).map((c) => ({
                  move: c.move,
                  score: c.evaluation,
                })),
              });
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
