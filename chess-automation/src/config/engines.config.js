/**
 * Engine Configuration
 * Define all available engines and their settings here
 */

export const ENGINES_CONFIG = {
  // Stockfish WASM - runs in Node.js using WebAssembly
  'stockfish-wasm': {
    name: 'Stockfish WASM',
    type: 'stockfish-wasm',
    enabled: true,
    config: {
      threads: 1,
      hash: 16,
      multiPV: 3,
      depth: 15,
      skill: 20, // 0-20, lower is weaker
    },
  },

  // Stockfish Native - requires stockfish binary
  'stockfish-native': {
    name: 'Stockfish Native',
    type: 'stockfish-native',
    enabled: true,
    config: {
      path: 'stockfish', // Path to stockfish binary
      threads: 4,
      hash: 128,
      multiPV: 3,
      depth: 18,
      skill: 20,
    },
  },

  // Lc0 with default network
  'lc0-default': {
    name: 'Leela Chess Zero',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0', // Path to lc0 binary
      weightsPath: null, // Will use default network
      backend: 'cuda-auto', // cuda-auto, cuda, opencl, cpu
      threads: 2,
      batchSize: 256,
      multiPV: 3,
    },
  },

  // Lc0 with Maia 1100 weights (beginner level)
  'maia-1100': {
    name: 'Maia 1100',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: './weights/maia-1100.pb.gz', // Download from https://github.com/CSSLab/maia-chess
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 128,
      multiPV: 1,
      temperature: 1.0, // Higher = more random/human-like
    },
  },

  // Lc0 with Maia 1500 weights (intermediate level)
  'maia-1500': {
    name: 'Maia 1500',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: './weights/maia-1500.pb.gz',
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 128,
      multiPV: 1,
      temperature: 1.0,
    },
  },

  // Lc0 with Maia 1900 weights (advanced level)
  'maia-1900': {
    name: 'Maia 1900',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: './weights/maia-1900.pb.gz',
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 128,
      multiPV: 1,
      temperature: 1.0,
    },
  },

  // Custom Lc0 configuration
  'lc0-custom': {
    name: 'Lc0 Custom',
    type: 'lc0',
    enabled: false,
    config: {
      path: 'lc0',
      weightsPath: './weights/your-custom-weights.pb.gz',
      backend: 'cuda-auto',
      threads: 4,
      batchSize: 512,
      multiPV: 3,
    },
  },
};

/**
 * Engine Pool Configurations
 * Define lists of engines for random selection
 */
export const ENGINE_POOLS = {
  // Use only Stockfish
  stockfish: ['stockfish-wasm'],

  // Use only Maia for human-like play
  maia: ['maia-1100', 'maia-1500', 'maia-1900'],

  // Mix of different strength Maia models
  'maia-varied': ['maia-1100', 'maia-1100', 'maia-1500', 'maia-1900'], // More weight to weaker

  // All engines randomly
  all: ['stockfish-wasm', 'stockfish-native', 'lc0-default', 'maia-1100', 'maia-1500', 'maia-1900'],

  // Strong engines only
  strong: ['stockfish-native', 'lc0-default'],

  // Human-like engines with occasional strong play
  'human-like': ['maia-1100', 'maia-1500', 'maia-1500', 'maia-1900', 'stockfish-wasm'],

  // Development/testing
  test: ['stockfish-wasm', 'maia-1100'],
};

/**
 * Default engine selection strategy
 */
export const DEFAULT_ENGINE_STRATEGY = {
  pool: 'stockfish', // Which pool to use
  selection: 'random', // 'random', 'sequential', 'weighted', 'single'
  switchEvery: 1, // Switch engine every N moves (0 = never switch)
  weights: null, // For weighted selection
};

/**
 * Get enabled engines from config
 */
export function getEnabledEngines() {
  return Object.entries(ENGINES_CONFIG)
    .filter(([_, config]) => config.enabled)
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Get engines from a pool
 */
export function getEnginePool(poolName) {
  return ENGINE_POOLS[poolName] || ENGINE_POOLS.stockfish;
}

/**
 * Select random engine from pool
 */
export function selectRandomEngine(poolName) {
  const pool = getEnginePool(poolName);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Download instructions for Maia weights
 */
export const MAIA_SETUP = `
To use Maia engines, download the weights:

1. Create weights directory:
   mkdir -p ./weights

2. Download Maia weights from:
   https://github.com/CSSLab/maia-chess/releases

   wget https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1100.pb.gz -P ./weights/
   wget https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1500.pb.gz -P ./weights/
   wget https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1900.pb.gz -P ./weights/

3. Install Lc0:
   - Ubuntu: apt-get install lc0
   - macOS: brew install lc0
   - Or download from: https://github.com/LeelaChessZero/lc0/releases
`;
