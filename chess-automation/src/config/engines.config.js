/**
 * Engine Configuration
 * Define all available engines and their settings here
 */

export const ENGINES_CONFIG = {
  // Stockfish Native - Maximum strength
  'stockfish-native-max': {
    name: 'Stockfish Native (Max)',
    type: 'stockfish-native',
    enabled: true,
    config: {
      path: '/usr/games/stockfish',
      threads: 4,
      hash: 128,
      multiPV: 3,
      depth: 20,
      skill: 20,
    },
  },

  // Stockfish Native - Strong (skill 17)
  'stockfish-native-17': {
    name: 'Stockfish Native (Skill 17)',
    type: 'stockfish-native',
    enabled: true,
    config: {
      path: '/usr/games/stockfish',
      threads: 4,
      hash: 128,
      multiPV: 3,
      depth: 15,
      skill: 17,
    },
  },

  // Stockfish Native - Medium (skill 12)
  'stockfish-native-12': {
    name: 'Stockfish Native (Skill 12)',
    type: 'stockfish-native',
    enabled: true,
    config: {
      path: '/usr/games/stockfish',
      threads: 4,
      hash: 64,
      multiPV: 3,
      depth: 12,
      skill: 12,
    },
  },

  // Lc0 with default network
  'lc0-default': {
    name: 'Leela Chess Zero',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: null,
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 256,
      multiPV: 3,
    },
  },

  // Maia 1100 - Beginner
  'maia-1100': {
    name: 'Maia 1100 (Beginner)',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: './weights/maia-1100.pb.gz',
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 128,
      multiPV: 1,
      temperature: 1.0,
    },
  },

  // Maia 1100 with more randomness
  'maia-1100-random': {
    name: 'Maia 1100 (Random)',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: './weights/maia-1100.pb.gz',
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 128,
      multiPV: 1,
      temperature: 1.5, // More random
    },
  },

  // Maia 1500 - Intermediate
  'maia-1500': {
    name: 'Maia 1500 (Intermediate)',
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

  // Maia 1500 with less randomness
  'maia-1500-focused': {
    name: 'Maia 1500 (Focused)',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: './weights/maia-1500.pb.gz',
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 128,
      multiPV: 1,
      temperature: 0.7, // More focused
    },
  },

  // Maia 1900 - Advanced
  'maia-1900': {
    name: 'Maia 1900 (Advanced)',
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

  // Maia 1900 with maximum focus
  'maia-1900-strong': {
    name: 'Maia 1900 (Strong)',
    type: 'lc0',
    enabled: true,
    config: {
      path: 'lc0',
      weightsPath: './weights/maia-1900.pb.gz',
      backend: 'cuda-auto',
      threads: 2,
      batchSize: 256,
      multiPV: 1,
      temperature: 0.5, // Very focused
    },
  },

  // Default Stockfish Native
  'stockfish-native': {
    name: 'Stockfish Native',
    type: 'stockfish-native',
    enabled: true,
    config: {
      path: '/usr/games/stockfish',
      threads: 4,
      hash: 128,
      multiPV: 3,
      depth: 18,
      skill: 20,
    },
  },
};

/**
 * Engine Pool Configurations
 * Define lists of engines for random selection
 */
export const ENGINE_POOLS = {
  // Single Stockfish
  stockfish: ['stockfish-native-max'],

  // All Stockfish variations
  'stockfish-varied': [
    'stockfish-native-12',
    'stockfish-native-17',
    'stockfish-native-max',
  ],

  // All Maia variations
  maia: ['maia-1100', 'maia-1500', 'maia-1900'],

  // Maia with variations
  'maia-varied': [
    'maia-1100',
    'maia-1100-random',
    'maia-1500',
    'maia-1500-focused',
    'maia-1900',
    'maia-1900-strong',
  ],

  // THE ULTIMATE POOL - Everything with semi-random variations
  all: [
    // Stockfish variations (weighted)
    'stockfish-native-12',
    'stockfish-native-12',
    'stockfish-native-17',
    'stockfish-native-17',
    'stockfish-native-max',
    'stockfish-native-max',
    // Maia variations (weighted)
    'maia-1100',
    'maia-1100',
    'maia-1100-random',
    'maia-1500',
    'maia-1500',
    'maia-1500',
    'maia-1500-focused',
    'maia-1900',
    'maia-1900',
    'maia-1900-strong',
    // Lc0 occasionally
    'lc0-default',
  ],

  // Strong engines only
  strong: ['stockfish-native-max', 'lc0-default', 'maia-1900-strong'],

  // Human-like with variations
  'human-like': [
    'maia-1100',
    'maia-1100-random',
    'maia-1500',
    'maia-1500',
    'maia-1500-focused',
    'maia-1900',
    'stockfish-native-17',
  ],

  // Beginner friendly
  beginner: ['stockfish-native-12', 'maia-1100', 'maia-1100-random'],

  // Development/testing
  test: ['stockfish-native-17', 'maia-1500'],
};

/**
 * Dual analysis engines for manual mode
 */
export const DUAL_ANALYSIS_ENGINES = {
  stockfish: 'stockfish-native-max', // Maximum strength Stockfish for best moves
  maia: 'maia-1500', // Human-like suggestions
};

/**
 * Engine colors for visualization
 */
export const ENGINE_COLORS = {
  stockfish: '#00ff00', // Green for Stockfish
  maia: '#ff9900', // Orange for Maia
  lc0: '#00ccff', // Cyan for Lc0
  best: '#00ff00', // Green for best move
  human: '#ffff00', // Yellow for human-like move
  alternative: '#ff00ff', // Magenta for alternatives
};

/**
 * Default engine selection strategy
 */
export const DEFAULT_ENGINE_STRATEGY = {
  pool: 'all',
  selection: 'random',
  switchEvery: 1,
  weights: null,
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
 * Get engine color based on type
 */
export function getEngineColor(engineId) {
  if (engineId.includes('stockfish')) return ENGINE_COLORS.stockfish;
  if (engineId.includes('maia')) return ENGINE_COLORS.maia;
  if (engineId.includes('lc0')) return ENGINE_COLORS.lc0;
  return ENGINE_COLORS.alternative;
}

/**
 * Download instructions for engines
 */
export const ENGINE_SETUP_INSTRUCTIONS = `
=== Engine Setup Instructions ===

1. STOCKFISH SETUP:
   Run: npm run setup:stockfish
   Or manually:
   - Ubuntu: sudo apt-get install stockfish
   - macOS: brew install stockfish
   - Windows: Download from stockfishchess.org

2. MAIA SETUP (Human-like play):
   Run: npm run setup:maia
   This downloads Maia weights for human-like play

3. LC0 SETUP (Required for Maia):
   - Ubuntu: sudo apt-get install lc0
   - macOS: brew install lc0
   - Windows: Download from github.com/LeelaChessZero/lc0

4. VERIFY INSTALLATION:
   Run: npm run list:engines
   All engines should show ✓ if properly configured
`;
