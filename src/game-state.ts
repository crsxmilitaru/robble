import type { BoardCell } from './types';
export interface GameState { board: (BoardCell | null)[][]; isFirstMove: boolean; cloneBoard(): (BoardCell | null)[][]; }
