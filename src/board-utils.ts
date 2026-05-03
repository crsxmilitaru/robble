import { BOARD_SIZE } from './constants';
import type { BoardCell, Tile } from './types';

export function isWithinBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function createBoardCell(tile: Pick<Tile, 'letter' | 'points' | 'isBlank'>, assignedLetter?: string): BoardCell {
  const isBlank = tile.isBlank;

  return {
    letter: isBlank ? ' ' : tile.letter,
    points: isBlank ? 0 : tile.points,
    isBlank,
    assignedLetter: isBlank ? assignedLetter : undefined,
  };
}
