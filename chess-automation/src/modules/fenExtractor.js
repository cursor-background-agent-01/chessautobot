/**
 * FEN Extractor Module
 * Responsible for extracting FEN strings from the Chess.com board
 */

export class FenExtractor {
  constructor(page) {
    this.page = page;
  }

  /**
   * Extract FEN string from the current board position
   * @returns {Promise<string>} FEN string
   */
  async extractFEN() {
    try {
      const fen = await this.page.evaluate(() => {
        // Method 1: Try to get from the game object if available
        if (window.game && typeof window.game.getFEN === 'function') {
          return window.game.getFEN();
        }

        // Method 2: Parse the board visually
        const board = document.querySelector('chess-board');
        if (!board) {
          throw new Error('Chess board not found');
        }

        // Get board orientation (not currently used but may be needed)
        // const isFlipped = board.classList.contains('flipped');

        // Initialize empty board
        const position = Array(8)
          .fill(null)
          .map(() => Array(8).fill(null));

        // Find all pieces on the board
        const pieces = board.querySelectorAll('.piece');
        pieces.forEach((piece) => {
          const square = piece.parentElement;
          if (!square || !square.classList.contains('square')) return;

          // Extract square coordinates
          const file = parseInt(square.className.match(/square-(\d)(\d)/)?.[1] || '0');
          const rank = parseInt(square.className.match(/square-(\d)(\d)/)?.[2] || '0');

          if (file === 0 || rank === 0) return;

          // Extract piece type and color
          const pieceClasses = piece.className;
          const isWhite = pieceClasses.includes('w');
          const pieceType = this.getPieceType(pieceClasses);

          if (pieceType) {
            const row = 8 - rank;
            const col = file - 1;
            position[row][col] = isWhite ? pieceType.toUpperCase() : pieceType.toLowerCase();
          }
        });

        // Convert position array to FEN string
        const fenPosition = position
          .map((row) => {
            let fenRow = '';
            let emptyCount = 0;

            for (const square of row) {
              if (square === null) {
                emptyCount++;
              } else {
                if (emptyCount > 0) {
                  fenRow += emptyCount;
                  emptyCount = 0;
                }
                fenRow += square;
              }
            }

            if (emptyCount > 0) {
              fenRow += emptyCount;
            }

            return fenRow;
          })
          .join('/');

        // Add default values for other FEN components
        // This is simplified - in production, you'd track these properly
        const activeColor = 'w'; // You'd need to determine whose turn it is
        const castling = 'KQkq'; // You'd need to track castling rights
        const enPassant = '-'; // You'd need to track en passant square
        const halfmove = '0';
        const fullmove = '1';

        return `${fenPosition} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
      });

      return fen;
    } catch (error) {
      console.error('Error extracting FEN:', error);
      throw error;
    }
  }

  /**
   * Detect board orientation (playing as white or black)
   * @returns {Promise<'white'|'black'>}
   */
  async getBoardOrientation() {
    return this.page.evaluate(() => {
      const board = document.querySelector('chess-board');
      if (!board) return 'white';
      return board.classList.contains('flipped') ? 'black' : 'white';
    });
  }

  /**
   * Get whose turn it is
   * @returns {Promise<'white'|'black'>}
   */
  async getActiveColor() {
    return this.page.evaluate(() => {
      // This would need to be adapted based on Chess.com's actual DOM structure
      const moveList = document.querySelector('.move-list');
      if (!moveList) return 'white';

      const moves = moveList.querySelectorAll('.move');
      return moves.length % 2 === 0 ? 'white' : 'black';
    });
  }

  /**
   * Helper to inject piece type detection into page context
   */
  async injectHelpers() {
    await this.page.evaluateOnNewDocument(() => {
      window.getPieceType = (className) => {
        if (className.includes('king') || className.includes('k')) return 'k';
        if (className.includes('queen') || className.includes('q')) return 'q';
        if (className.includes('rook') || className.includes('r')) return 'r';
        if (className.includes('bishop') || className.includes('b')) return 'b';
        if (className.includes('knight') || className.includes('n')) return 'n';
        if (className.includes('pawn') || className.includes('p')) return 'p';
        return null;
      };
    });
  }
}
