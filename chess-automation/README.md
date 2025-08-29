# Chess Automation System

A modular Node.js chess automation system that can play on Chess.com using Puppeteer with multiple chess engines including human-like Maia models.

## Features

- **Multiple Engine Support**: Run multiple engines with random selection
  - Stockfish (WASM and Native)
  - Leela Chess Zero (Lc0)
  - Maia (Human-like play at 1100, 1500, 1900 ELO levels)
- **Engine Pools**: Mix and match engines for varied playing styles
- **Dynamic Engine Switching**: Change engines mid-game
- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **Host-Side Evaluation**: All engine computation runs in Node.js, not in the browser
- **Visual Feedback**: Move highlighting and evaluation display
- **Human-like Behavior**: Configurable delays between moves + Maia for realistic play
- **Interactive & Auto Modes**: Can suggest moves or play automatically

## Project Structure

```
chess-automation/
├── src/
│   ├── config/
│   │   └── constants.js          # Configuration constants
│   ├── modules/
│   │   ├── engines/
│   │   │   ├── baseEngine.js     # Base engine interface
│   │   │   ├── stockfishEngine.js # Stockfish WASM implementation
│   │   │   └── stockfishAsmEngine.js # Stockfish ASM.js implementation
│   │   ├── fenExtractor.js       # FEN extraction from browser
│   │   ├── engineManager.js      # Engine management and coordination
│   │   ├── moveExecutor.js       # Move execution via Puppeteer
│   │   └── uiHighlighter.js      # Visual feedback and highlighting
│   ├── chessAutomation.js        # Main controller
│   └── index.js                   # Entry point and CLI
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc.json               # Prettier configuration
├── package.json                   # Project dependencies
└── README.md                      # This file
```

## Installation

```bash
# Clone or create the project
cd chess-automation

# Install dependencies
npm install

# For Maia (human-like play) - RECOMMENDED
npm run setup:maia
# Or manually:
./scripts/setup-maia.sh

# For Stockfish Native (optional, higher performance)
# Ubuntu/Debian: sudo apt-get install stockfish
# macOS: brew install stockfish

# For Lc0 (required for Maia)
# Ubuntu/Debian: sudo apt-get install lc0
# macOS: brew install lc0
```

## Usage

### Interactive Mode (Default)

Analyzes positions and suggests moves without playing automatically:

```bash
npm start
```

### Auto-Play Mode

Plays moves automatically:

```bash
npm start --auto
```

### Command Line Options

```bash
npm start [options]

SINGLE ENGINE:
  --engine <type>       Use specific engine (stockfish-wasm, maia-1500, etc.)

MULTIPLE ENGINES:
  --pool <name>         Use engine pool for varied play
  --selection <type>    How to select engines (random, sequential, weighted)
  --switch-every <n>    Switch engine every N moves

OPTIONS:
  --auto                Enable auto-play mode
  --headless            Run browser in headless mode
  --depth <n>           Engine search depth (default: 15)
  --no-eval             Disable evaluation display
  --no-highlight        Disable move highlighting
  --list-engines        Show all available engines
  --list-pools          Show all engine pools
  --help                Show help message
```

### Quick Start Examples

```bash
# Human-like play with Maia
npm run play:human          # Interactive mode
npm run play:maia           # Auto-play with Maia pool

# Random engine selection from all available
npm run play:random

# Traditional single engine
npm start                    # Stockfish WASM
npm start --engine maia-1500 # Maia 1500 ELO

# Advanced configurations
npm start --pool strong --switch-every 5
npm start --pool maia-varied --selection weighted
```

### Engine Pools

| Pool | Description | Engines |
|------|-------------|---------|
| `stockfish` | Traditional strong play | stockfish-wasm |
| `maia` | Human-like at different levels | maia-1100, maia-1500, maia-1900 |
| `maia-varied` | Weighted towards beginner | More maia-1100, some 1500/1900 |
| `all` | Everything available | All enabled engines |
| `strong` | Maximum strength | stockfish-native, lc0-default |
| `human-like` | Realistic human play | Mostly Maia with occasional strong |
| `test` | Development testing | stockfish-wasm, maia-1100 |

## API Usage

```javascript
import { ChessAutomation } from './src/chessAutomation.js';
import { ENGINE_TYPES } from './src/config/constants.js';

// Create automation instance
const automation = new ChessAutomation({
  engineType: ENGINE_TYPES.STOCKFISH_WASM,
  autoPlay: false,
  engineDepth: 15,
  showEvaluation: true,
  highlightMoves: true
});

// Initialize
await automation.init();
await automation.navigateToChess();

// Analyze current position
const analysis = await automation.analyzePosition();
console.log('Best move:', analysis.analysis.bestMove);
console.log('Evaluation:', analysis.analysis.evaluation);

// Make a move (analyze and optionally execute)
await automation.makeMove();

// Switch engines on the fly
await automation.switchEngine(ENGINE_TYPES.STOCKFISH);

// Start auto-play
await automation.startAutoPlay();

// Clean up
await automation.cleanup();
```

## Module Documentation

### FenExtractor

Extracts FEN strings from the Chess.com board:

```javascript
const extractor = new FenExtractor(page);
const fen = await extractor.extractFEN();
const orientation = await extractor.getBoardOrientation();
```

### EngineManager

Manages chess engines with a unified interface:

```javascript
const manager = new EngineManager({ 
  engine: ENGINE_TYPES.STOCKFISH_WASM,
  depth: 15 
});
await manager.init();

const analysis = await manager.analyzePosition(fen);
const candidates = await manager.getCandidateMoves(fen, 3);
```

### MoveExecutor

Executes moves on the Chess.com board:

```javascript
const executor = new MoveExecutor(page);
await executor.executeMove('e2e4');
await executor.waitForOurTurn();
```

### UIHighlighter

Provides visual feedback:

```javascript
const highlighter = new UIHighlighter(page);
await highlighter.init();
await highlighter.highlightMove('e2e4');
await highlighter.showEvaluation({ score: 0.3, bestMove: 'e2e4' });
```

## Adding New Engines

To add support for a new engine (e.g., Lc0 or Maia):

1. Create a new engine class in `src/modules/engines/`:

```javascript
// src/modules/engines/lc0Engine.js
import { BaseEngine } from './baseEngine.js';

export class Lc0Engine extends BaseEngine {
  async init() { /* ... */ }
  async getBestMove(options) { /* ... */ }
  async quit() { /* ... */ }
}
```

2. Add the engine type to constants:

```javascript
// src/config/constants.js
export const ENGINE_TYPES = {
  // ...
  LC0: 'lc0',
};
```

3. Update EngineManager to handle the new engine:

```javascript
// src/modules/engineManager.js
case ENGINE_TYPES.LC0:
  this.currentEngine = new Lc0Engine(this.config);
  break;
```

## Development

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Testing

```bash
# Run tests (when implemented)
npm test
```

## Configuration

Edit `src/config/constants.js` to modify default settings:

- `ENGINE_DEFAULTS`: Default engine parameters
- `MOVE_DELAY`: Delay between moves for human-like behavior
- `SELECTORS`: Chess.com DOM selectors (may need updates)

## Troubleshooting

### Engine not initializing

- For Stockfish ASM: Ensure stockfish binary is installed and in PATH
- For Stockfish WASM: Check that stockfish.wasm package is properly installed

### Moves not executing

- Chess.com may have updated their UI. Check and update selectors in `constants.js`
- Ensure you're logged into Chess.com
- Check browser console for errors

### FEN extraction failing

- The board detection logic may need adjustment for Chess.com updates
- Try using the visual debugging mode (non-headless) to see what's happening

## Security & Ethics

**Important:** This tool is for educational purposes. Using automation on Chess.com may violate their Terms of Service. Use responsibly and only in appropriate contexts (e.g., analysis, personal practice against bots).

## License

ISC

## Contributing

Contributions are welcome! Please ensure:

1. Code follows the ESLint configuration
2. New engines implement the BaseEngine interface
3. Modules remain loosely coupled
4. Documentation is updated for new features

## Future Enhancements

- [ ] Lc0 engine integration
- [ ] Maia (human-like) engine support
- [ ] Opening book integration
- [ ] Endgame tablebase support
- [ ] Time management for different time controls
- [ ] Multi-game support
- [ ] Analysis export (PGN, UCI)
- [ ] Web UI for configuration
- [ ] Docker containerization