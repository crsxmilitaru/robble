import { addWorkerListener, getDictionaryWorker } from './dictionary';
import type { GameState } from './game-state';
import type { DifficultyLevel, MoveResult, Tile } from './types';

export class AI {
  private state: GameState;
  private difficulty: DifficultyLevel;
  private static requestIdCounter = 1000000; // Use a distinct range for AI requests

  constructor(state: GameState, difficulty: DifficultyLevel = 'medium') {
    this.state = state;
    this.difficulty = difficulty;
    getDictionaryWorker();
  }

  setDifficulty(difficulty: DifficultyLevel): void {
    this.difficulty = difficulty;
  }

  async findBestMove(rack: Tile[]): Promise<MoveResult | null> {
    const worker = getDictionaryWorker();
    const requestId = ++AI.requestIdCounter;

    return new Promise((resolve) => {
      const unsub = addWorkerListener((e) => {
        if (e.data.type === 'findBestMove' && e.data.requestId === requestId) {
          unsub();
          resolve(e.data.result);
        }
      });

      const stateToPass = {
        isFirstMove: this.state.isFirstMove,
        board: this.state.board
      };

      worker.postMessage({
        type: 'findBestMove',
        state: stateToPass,
        rack: [...rack],
        difficulty: this.difficulty,
        requestId
      });
    });
  }
}
