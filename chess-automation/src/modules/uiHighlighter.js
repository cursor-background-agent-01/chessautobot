/**
 * UI Highlighter Module
 * Provides visual feedback for moves and analysis
 */

export class UIHighlighter {
  constructor(page) {
    this.page = page;
    this.highlightStyles = {
      bestMove: 'rgba(0, 255, 0, 0.5)',
      alternativeMove: 'rgba(255, 255, 0, 0.3)',
      lastMove: 'rgba(0, 100, 255, 0.3)',
      threat: 'rgba(255, 0, 0, 0.3)',
      check: 'rgba(255, 0, 0, 0.7)',
    };
  }

  /**
   * Initialize highlighter by injecting styles
   */
  async init() {
    await this.injectStyles();
    await this.injectHighlightFunctions();
    console.log('UI Highlighter initialized');
  }

  /**
   * Set custom highlight colors for engines
   */
  setEngineColors(colors) {
    this.highlightStyles = { ...this.highlightStyles, ...colors };
  }

  /**
   * Inject CSS styles for highlighting
   */
  async injectStyles() {
    await this.page.addStyleTag({
      content: `
        .chess-highlight {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
          border-radius: 3px;
        }
        
        .chess-highlight.best-move {
          background-color: ${this.highlightStyles.bestMove};
          border: 3px solid #00ff00;
        }
        
        .chess-highlight.alternative-move {
          background-color: ${this.highlightStyles.alternativeMove};
          border: 2px solid #ffff00;
        }
        
        .chess-highlight.last-move {
          background-color: ${this.highlightStyles.lastMove};
        }
        
        .chess-highlight.threat {
          background-color: ${this.highlightStyles.threat};
          border: 2px dashed #ff0000;
        }
        
        .chess-highlight.check {
          background-color: ${this.highlightStyles.check};
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .chess-arrow {
          position: absolute;
          pointer-events: none;
          z-index: 11;
        }
        
        .chess-evaluation {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          z-index: 1000;
          min-width: 200px;
        }
        
        .chess-evaluation .eval-score {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .chess-evaluation .eval-move {
          font-size: 18px;
          color: #00ff00;
          margin-bottom: 5px;
        }
        
        .chess-evaluation .eval-depth {
          font-size: 12px;
          color: #888;
        }
        
        .chess-evaluation .eval-alternatives {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #444;
        }
        
        .chess-evaluation .eval-alternative {
          font-size: 14px;
          margin: 3px 0;
          color: #ffff00;
        }
      `,
    });
  }

  /**
   * Inject JavaScript functions for highlighting
   */
  async injectHighlightFunctions() {
    await this.page.evaluateOnNewDocument(() => {
      window.chessHighlighter = {
        highlights: new Map(),

        highlightSquare(square, type = 'best-move') {
          this.clearSquareHighlight(square);

          const squareElement = document.querySelector(`.square-${square}`);
          if (!squareElement) return;

          const highlight = document.createElement('div');
          highlight.className = `chess-highlight ${type}`;
          highlight.dataset.square = square;
          squareElement.appendChild(highlight);

          this.highlights.set(square, highlight);
        },

        clearSquareHighlight(square) {
          const existing = this.highlights.get(square);
          if (existing) {
            existing.remove();
            this.highlights.delete(square);
          }
        },

        clearAllHighlights() {
          this.highlights.forEach((highlight) => highlight.remove());
          this.highlights.clear();
        },

        drawArrow(from, to, color = '#00ff00') {
          // Implementation for drawing arrows between squares
          // This would require SVG overlay on the board
          console.log(`Drawing arrow from ${from} to ${to} with color ${color}`);
        },

        showEvaluation(data) {
          let evalDiv = document.querySelector('.chess-evaluation');
          if (!evalDiv) {
            evalDiv = document.createElement('div');
            evalDiv.className = 'chess-evaluation';
            document.body.appendChild(evalDiv);
          }

          const scoreText = data.mate
            ? `M${Math.abs(data.mate)}`
            : (data.score > 0 ? '+' : '') + data.score.toFixed(2);

          let html = `
            <div class="eval-score">${scoreText}</div>
            <div class="eval-move">Best: ${data.bestMove}</div>
            <div class="eval-depth">Depth: ${data.depth}</div>
          `;

          if (data.alternatives && data.alternatives.length > 0) {
            html += '<div class="eval-alternatives">';
            data.alternatives.forEach((alt, i) => {
              const altScore = alt.score > 0 ? `+${alt.score.toFixed(2)}` : alt.score.toFixed(2);
              html += `<div class="eval-alternative">${i + 2}. ${alt.move} (${altScore})</div>`;
            });
            html += '</div>';
          }

          evalDiv.innerHTML = html;
        },

        hideEvaluation() {
          const evalDiv = document.querySelector('.chess-evaluation');
          if (evalDiv) {
            evalDiv.remove();
          }
        },
      };
    });
  }

  /**
   * Highlight a move on the board
   * @param {string} move - Move in UCI format
   * @param {string} type - Type of highlight
   */
  async highlightMove(move, type = 'best-move') {
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    await this.highlightSquare(from, 'last-move');
    await this.highlightSquare(to, type);
  }

  /**
   * Highlight a square
   * @param {string} square - Square in algebraic notation
   * @param {string} type - Type of highlight
   */
  async highlightSquare(square, type = 'best-move') {
    const { file, rank } = this.squareToCoordinates(square);
    const squareNotation = `${file}${rank}`;

    await this.page.evaluate(
      (sq, t) => {
        if (window.chessHighlighter) {
          window.chessHighlighter.highlightSquare(sq, t);
        }
      },
      squareNotation,
      type
    );
  }

  /**
   * Clear all highlights
   */
  async clearHighlights() {
    await this.page.evaluate(() => {
      if (window.chessHighlighter) {
        window.chessHighlighter.clearAllHighlights();
      }
    });
  }

  /**
   * Show evaluation panel
   * @param {Object} evaluation - Evaluation data
   */
  async showEvaluation(evaluation) {
    await this.page.evaluate((data) => {
      if (window.chessHighlighter) {
        window.chessHighlighter.showEvaluation(data);
      }
    }, evaluation);
  }

  /**
   * Hide evaluation panel
   */
  async hideEvaluation() {
    await this.page.evaluate(() => {
      if (window.chessHighlighter) {
        window.chessHighlighter.hideEvaluation();
      }
    });
  }

  /**
   * Highlight multiple candidate moves
   * @param {Array} candidates - Array of candidate moves
   */
  async highlightCandidates(candidates) {
    await this.clearHighlights();

    if (candidates.length > 0) {
      // Highlight best move
      await this.highlightMove(candidates[0].move, 'best-move');

      // Highlight alternatives
      for (let i = 1; i < Math.min(candidates.length, 3); i++) {
        const to = candidates[i].move.substring(2, 4);
        await this.highlightSquare(to, 'alternative-move');
      }
    }
  }

  /**
   * Draw an arrow between squares
   * @param {string} from - Starting square
   * @param {string} to - Ending square
   * @param {string} color - Arrow color
   */
  async drawArrow(from, to, color = '#00ff00') {
    await this.page.evaluate(
      (f, t, c) => {
        if (window.chessHighlighter) {
          window.chessHighlighter.drawArrow(f, t, c);
        }
      },
      from,
      to,
      color
    );
  }

  /**
   * Convert square notation to coordinates
   * @param {string} square - Square in algebraic notation
   * @returns {Object} Coordinates
   */
  squareToCoordinates(square) {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    const rank = parseInt(square[1]);
    return { file, rank };
  }

  /**
   * Flash a square (for notifications)
   * @param {string} square - Square to flash
   * @param {string} color - Flash color
   * @param {number} duration - Flash duration in ms
   */
  async flashSquare(square, _color = '#ff0000', duration = 500) {
    await this.highlightSquare(square, 'check');
    setTimeout(() => {
      this.clearHighlights();
    }, duration);
  }

  /**
   * Show move animation
   * @param {string} move - Move to animate
   */
  async animateMove(move) {
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    // Flash the starting square
    await this.flashSquare(from, '#00ff00', 300);

    // Draw arrow
    await this.drawArrow(from, to);

    // Flash the destination square
    setTimeout(() => {
      this.flashSquare(to, '#00ff00', 300);
    }, 300);
  }

  /**
   * Display dual analysis with color-coded moves
   * @param {Object} dualAnalysis - Analysis from multiple engines
   */
  async showDualAnalysis(dualAnalysis) {
    await this.clearHighlights();

    // Inject enhanced evaluation display
    await this.page.evaluate((analysis) => {
      // Create or update dual analysis panel
      let panel = document.querySelector('.dual-analysis-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'dual-analysis-panel';
        panel.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-family: monospace;
          z-index: 10000;
          min-width: 300px;
          max-width: 400px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(panel);
      }

      let html = '<h3 style="margin: 0 0 10px 0; font-size: 16px;">🤖 Engine Analysis</h3>';

      // Show each engine's suggestion
      for (const [engineName, result] of Object.entries(analysis.engines)) {
        const color = result.color || '#ffffff';
        const evalText =
          result.evaluation > 0 ? `+${result.evaluation.toFixed(2)}` : result.evaluation.toFixed(2);

        html += `
          <div style="margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${color};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: ${color}; font-weight: bold;">${engineName.toUpperCase()}</span>
              <span style="color: #888; font-size: 12px;">Depth ${result.depth}</span>
            </div>
            <div style="margin-top: 5px;">
              <span style="font-size: 18px; color: ${color};">${result.bestMove}</span>
              <span style="margin-left: 10px; color: #ccc;">${evalText}</span>
            </div>
            ${
              result.candidates && result.candidates.length > 1
                ? `
              <div style="margin-top: 5px; font-size: 12px; color: #888;">
                Alt: ${result.candidates
                  .slice(1, 3)
                  .map((c) => `${c.move} (${c.eval.toFixed(1)})`)
                  .join(', ')}
              </div>
            `
                : ''
            }
          </div>
        `;
      }

      // Show consensus if engines agree
      if (analysis.summary && analysis.summary.consensusStrength > 0.5) {
        html += `
          <div style="margin-top: 10px; padding: 8px; background: rgba(0,255,0,0.1); border-radius: 4px;">
            <span style="color: #00ff00;">✓ Consensus: ${analysis.summary.consensusMove}</span>
            <span style="color: #888; font-size: 12px; margin-left: 10px;">
              ${Math.round(analysis.summary.consensusStrength * 100)}% agree
            </span>
          </div>
        `;
      } else if (analysis.summary) {
        html += `
          <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,0,0.1); border-radius: 4px;">
            <span style="color: #ffff00;">⚠ Engines disagree</span>
            <span style="color: #888; font-size: 12px; margin-left: 10px;">
              ${analysis.summary.uniqueMoves} different moves
            </span>
          </div>
        `;
      }

      panel.innerHTML = html;
    }, dualAnalysis);

    // Highlight moves with different colors
    if (dualAnalysis.engines) {
      const moves = new Map();

      // Collect unique moves with their colors
      for (const [engineName, result] of Object.entries(dualAnalysis.engines)) {
        if (result && result.bestMove) {
          if (!moves.has(result.bestMove)) {
            moves.set(result.bestMove, {
              engines: [],
              color: result.color,
            });
          }
          moves.get(result.bestMove).engines.push(engineName);
        }
      }

      // Highlight each unique move
      for (const [move, data] of moves) {
        const to = move.substring(2, 4);
        await this.highlightSquareWithColor(to, data.color, data.engines.join(' & '));
      }
    }
  }

  /**
   * Highlight square with custom color
   * @param {string} square - Square to highlight
   * @param {string} color - Color to use
   * @param {string} label - Optional label
   */
  async highlightSquareWithColor(square, color, label = '') {
    const { file, rank } = this.squareToCoordinates(square);
    const squareNotation = `${file}${rank}`;

    await this.page.evaluate(
      (sq, col, lbl) => {
        if (window.chessHighlighter) {
          // Remove existing highlight
          window.chessHighlighter.clearSquareHighlight(sq);

          const squareElement = document.querySelector(`.square-${sq}`);
          if (!squareElement) return;

          const highlight = document.createElement('div');
          highlight.className = 'chess-highlight custom-color';
          highlight.style.cssText = `
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
          border-radius: 3px;
          background-color: ${col}40;
          border: 3px solid ${col};
        `;

          if (lbl) {
            const labelDiv = document.createElement('div');
            labelDiv.style.cssText = `
            position: absolute;
            top: 2px;
            right: 2px;
            background: ${col};
            color: black;
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 10px;
            font-weight: bold;
          `;
            labelDiv.textContent = lbl.substring(0, 1).toUpperCase();
            highlight.appendChild(labelDiv);
          }

          highlight.dataset.square = sq;
          squareElement.appendChild(highlight);

          window.chessHighlighter.highlights.set(sq, highlight);
        }
      },
      squareNotation,
      color,
      label
    );
  }

  /**
   * Hide dual analysis panel
   */
  async hideDualAnalysis() {
    await this.page.evaluate(() => {
      const panel = document.querySelector('.dual-analysis-panel');
      if (panel) {
        panel.remove();
      }
    });
  }
}
