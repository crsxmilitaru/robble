import { BOARD_SIZE, BONUS, BONUS_MAP } from './constants';
import type { BoardCell, Placement } from './types';

export interface ScoredWord { word: string; score: number; }
export interface MoveScore { words: ScoredWord[]; total: number; }

function effectiveLetter(cell: BoardCell): string {
  return cell.isBlank && cell.assignedLetter ? cell.assignedLetter : cell.letter;
}

export function scoreWordThrough(board: (BoardCell | null)[][], row: number, col: number, direction: 'row' | 'col', placedSet: Set<string>): ScoredWord | null {
  if (!board[row][col]) return null;
  const dr = direction === 'col' ? 1 : 0, dc = direction === 'row' ? 1 : 0;
  let sr = row, sc = col;
  while (sr - dr >= 0 && sc - dc >= 0 && board[sr - dr][sc - dc]) { sr -= dr; sc -= dc; }
  let word = '', score = 0, wordMult = 1, r = sr, c = sc;
  while (r < BOARD_SIZE && c < BOARD_SIZE && board[r][c]) {
    const cell = board[r][c]!;
    word += effectiveLetter(cell);
    let letterScore = cell.points;
    if (placedSet.has(`${r},${c}`)) {
      const b = BONUS_MAP[`${r},${c}`];
      if (b === BONUS.DL) letterScore *= 2;
      else if (b === BONUS.TL) letterScore *= 3;
      else if (b === BONUS.DW || b === BONUS.CENTER) wordMult *= 2;
      else if (b === BONUS.TW) wordMult *= 3;
    }
    score += letterScore; r += dr; c += dc;
  }
  return word.length < 2 ? null : { word, score: score * wordMult };
}

export function computeMove(board: (BoardCell | null)[][], placements: Placement[]): MoveScore {
  if (placements.length === 0) return { words: [], total: 0 };
  const placedSet = new Set(placements.map(p => `${p.row},${p.col}`));
  const sameRow = placements.every(p => p.row === placements[0].row);
  const mainDir: 'row' | 'col' = sameRow ? 'row' : 'col', crossDir: 'row' | 'col' = sameRow ? 'col' : 'row';
  const words: ScoredWord[] = [];
  const main = scoreWordThrough(board, placements[0].row, placements[0].col, mainDir, placedSet);
  if (main) words.push(main);
  for (const p of placements) {
    const cross = scoreWordThrough(board, p.row, p.col, crossDir, placedSet);
    if (cross) words.push(cross);
  }
  let total = words.reduce((sum, w) => sum + w.score, 0);
  if (placements.length === 7) total += 50;
  return { words, total };
}

export function applyPlacements(board: (BoardCell | null)[][], placements: Placement[]): void {
  for (const p of placements) {
    const isBlank = p.tile.isBlank;
    board[p.row][p.col] = { letter: isBlank ? ' ' : p.tile.letter, points: isBlank ? 0 : p.tile.points, isBlank, assignedLetter: p.assignedLetter };
  }
}
