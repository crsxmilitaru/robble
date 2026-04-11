import { BOARD_SIZE, CENTER, RACK_SIZE, ROMANIAN_LETTERS } from './constants';
import { normalizeRomanianWord } from './dictionary-utils';
import type { GameState } from './game-state';
import { applyPlacements, computeMove } from './scoring';
import type { Trie } from './trie';
import type { DifficultyLevel, MoveResult, Placement, Tile } from './types';

export class AILogic {
  private state: GameState;
  private difficulty: DifficultyLevel;
  private trie: Trie;
  private dictionary: Set<string>;

  constructor(state: GameState, trie: Trie, dictionary: Set<string>, difficulty: DifficultyLevel = 'medium') {
    this.state = state;
    this.trie = trie;
    this.dictionary = dictionary;
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty: DifficultyLevel): void {
    this.difficulty = difficulty;
  }

  private isValidWordLocal(word: string): boolean {
    return this.dictionary.has(normalizeRomanianWord(word));
  }

  findBestMove(rack: Tile[]): MoveResult | null {
    const allMoves: MoveResult[] = [];
    if (this.state.isFirstMove) {
      const words = this.findAllWordsFromRack(rack);
      for (const wordInfo of words) {
        const col = CENTER - Math.floor(wordInfo.word.length / 2);
        if (col < 0 || col + wordInfo.word.length > BOARD_SIZE) continue;
        const placements: Placement[] = [];
        for (let i = 0; i < wordInfo.word.length; i++) {
          const t = wordInfo.tiles[i];
          placements.push({
            row: CENTER,
            col: col + i,
            tile: t,
            assignedLetter: t.isBlank ? t.assignedLetter : undefined,
          });
        }
        const result = this.computeMoveScore(placements);
        if (result.score > 0) allMoves.push({ placements, score: result.score, words: result.words });
      }
    } else {
      const anchors = this.findAnchors();
      for (const [ar, ac] of anchors) {
        for (const direction of ['row', 'col'] as const) {
          const moves = this.findMovesAtAnchor(rack, ar, ac, direction);
          allMoves.push(...moves);
        }
      }
    }
    if (allMoves.length === 0) return null;
    return this.selectMoveByDifficulty(allMoves);
  }

  private selectMoveByDifficulty(moves: MoveResult[]): MoveResult {
    moves.sort((a, b) => b.score - a.score);
    switch (this.difficulty) {
      case 'easy': {
        const cutoff = Math.ceil(moves.length * 0.6);
        const candidates = moves.slice(-cutoff);
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
      case 'hard': return moves[0];
      case 'medium':
      default: {
        const cutoff = Math.max(1, Math.ceil(moves.length * 0.4));
        const candidates = moves.slice(0, cutoff);
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
  }

  private findAllWordsFromRack(rack: Tile[]): { word: string; tiles: Tile[] }[] {
    const results: { word: string; tiles: Tile[] }[] = [];
    const seen = new Set<string>();
    const search = (remaining: Tile[], current: string, tiles: Tile[]): void => {
      if (current.length >= 2 && this.trie.isWord(current)) {
        if (!seen.has(current)) {
          seen.add(current);
          results.push({ word: current, tiles: [...tiles] });
        }
      }
      if (current.length >= RACK_SIZE) return;
      const used = new Set<string>();
      for (let i = 0; i < remaining.length; i++) {
        const tile = remaining[i];
        const isBlank = tile.isBlank;
        const uniqueKey = isBlank ? `blank_${tile.id}` : tile.letter.toLowerCase();
        if (used.has(uniqueKey)) continue;
        used.add(uniqueKey);
        if (isBlank) {
          for (const letter of ROMANIAN_LETTERS) {
            const next = current + letter;
            if (!this.trie.hasPrefix(next)) continue;
            const tileWithAssignment = { ...tile, assignedLetter: letter.toUpperCase() };
            search([...remaining.slice(0, i), ...remaining.slice(i + 1)], next, [...tiles, tileWithAssignment]);
          }
        } else {
          const l = tile.letter.toLowerCase();
          const next = current + l;
          if (!this.trie.hasPrefix(next)) continue;
          search([...remaining.slice(0, i), ...remaining.slice(i + 1)], next, [...tiles, tile]);
        }
      }
    };
    search(rack, '', []);
    results.sort((a, b) => b.word.length - a.word.length);
    return results.slice(0, 100);
  }

  private findAnchors(): number[][] {
    const anchors = new Set<string>();
    const board = this.state.board;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c]) {
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
              anchors.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
    return [...anchors].map(s => s.split(',').map(Number));
  }

  private findMovesAtAnchor(rack: Tile[], anchorR: number, anchorC: number, direction: 'row' | 'col'): MoveResult[] {
    const moves: MoveResult[] = [];
    const dr = direction === 'col' ? 1 : 0;
    const dc = direction === 'row' ? 1 : 0;
    const board = this.state.board;
    const getValidLetters = (row: number, col: number): string[] | null => {
      const isHorizontalMove = direction === 'row';
      if (isHorizontalMove) {
        let r1 = row, r2 = row;
        while (r1 > 0 && board[r1 - 1][col]) r1--;
        while (r2 < BOARD_SIZE - 1 && board[r2 + 1][col]) r2++;
        if (r1 === r2) return null;
        let prefix = '';
        for (let r = r1; r < row; r++) prefix += this.effectiveLetter(board[r][col]!).toLowerCase();
        let suffix = '';
        for (let r = row + 1; r <= r2; r++) suffix += this.effectiveLetter(board[r][col]!).toLowerCase();
        if (prefix.length === 0 && suffix.length === 0) return null;
        const valid: string[] = [];
        for (const letter of ROMANIAN_LETTERS) {
          if (this.isValidWordLocal(prefix + letter + suffix)) valid.push(letter);
        }
        return valid.length > 0 ? valid : null;
      } else {
        let c1 = col, c2 = col;
        while (c1 > 0 && board[row][c1 - 1]) c1--;
        while (c2 < BOARD_SIZE - 1 && board[row][c2 + 1]) c2++;
        if (c1 === c2) return null;
        let prefix = '';
        for (let c = c1; c < col; c++) prefix += this.effectiveLetter(board[row][c]!).toLowerCase();
        let suffix = '';
        for (let c = col + 1; c <= c2; c++) suffix += this.effectiveLetter(board[row][c]!).toLowerCase();
        if (prefix.length === 0 && suffix.length === 0) return null;
        const valid: string[] = [];
        for (const letter of ROMANIAN_LETTERS) {
          if (this.isValidWordLocal(prefix + letter + suffix)) valid.push(letter);
        }
        return valid.length > 0 ? valid : null;
      }
    };
    const leftLimit = (() => {
      let count = 0;
      let r = anchorR - dr, c = anchorC - dc;
      while (r >= 0 && c >= 0 && !board[r][c]) { count++; r -= dr; c -= dc; }
      return count;
    })();
    const boardPrefix = (() => {
      let r = anchorR - dr * (leftLimit + 1), c = anchorC - dc * (leftLimit + 1), p = '';
      while (r >= 0 && c >= 0 && board[r][c]) {
        p = this.effectiveLetter(board[r][c]!).toLowerCase() + p;
        r -= dr; c -= dc;
      }
      return p;
    })();
    for (let beforeAnchor = 0; beforeAnchor <= leftLimit; beforeAnchor++) {
      let pos = 0;
      const startR = anchorR - dr * beforeAnchor;
      const startC = anchorC - dc * beforeAnchor;
      const placeAtPos = (remaining: Tile[], currentWord: string, currentPlacements: Placement[]): void => {
        const r = startR + dr * pos, c = startC + dc * pos;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c]) {
          const letter = this.effectiveLetter(board[r][c]!).toLowerCase();
          if (this.trie.hasPrefix(currentWord + letter)) {
            pos++; placeAtPos(remaining, currentWord + letter, currentPlacements); pos--;
          }
          return;
        }
        if (currentWord.length >= 2 && this.trie.isWord(currentWord) && currentPlacements.length > 0) {
          if (pos > beforeAnchor || (beforeAnchor === leftLimit && boardPrefix.length > 0) || currentPlacements.some(p => getValidLetters(p.row, p.col) !== null)) {
            const result = this.computeMoveScore(currentPlacements);
            if (result.score > 0) moves.push({ placements: [...currentPlacements], score: result.score, words: result.words });
          }
        }
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return;
        const validHere = getValidLetters(r, c);
        const used = new Set<string>();
        for (let i = 0; i < remaining.length; i++) {
          const tile = remaining[i];
          const isBlank = tile.isBlank;
          const uniqueKey = isBlank ? `blank_${tile.id}` : tile.letter.toLowerCase();
          if (used.has(uniqueKey)) continue;
          used.add(uniqueKey);
          if (isBlank) {
            for (const letter of ROMANIAN_LETTERS) {
              if (validHere && !validHere.includes(letter)) continue;
              const next = currentWord + letter;
              if (!this.trie.hasPrefix(next)) continue;
              pos++; placeAtPos([...remaining.slice(0, i), ...remaining.slice(i + 1)], next, [...currentPlacements, { row: r, col: c, tile, assignedLetter: letter.toUpperCase() }]); pos--;
            }
          } else {
            const l = tile.letter.toLowerCase(), next = currentWord + l;
            if (!this.trie.hasPrefix(next)) continue;
            if (validHere && !validHere.includes(l)) continue;
            pos++; placeAtPos([...remaining.slice(0, i), ...remaining.slice(i + 1)], next, [...currentPlacements, { row: r, col: c, tile }]); pos--;
          }
        }
      };
      const currentPrefix = (beforeAnchor === leftLimit) ? boardPrefix : '';
      if (currentPrefix === '' || this.trie.hasPrefix(currentPrefix)) placeAtPos([...rack], currentPrefix, []);
    }
    return moves;
  }

  private computeMoveScore(placements: Placement[]): { score: number; words: string[] } {
    if (placements.length === 0) return { score: 0, words: [] };
    const tempBoard = this.state.cloneBoard();
    applyPlacements(tempBoard, placements);
    const { words, total } = computeMove(tempBoard, placements);
    if (words.length === 0) return { score: 0, words: [] };
    for (const w of words) if (!this.isValidWordLocal(w.word)) return { score: 0, words: [] };
    return { score: total, words: words.map(w => w.word.toUpperCase()) };
  }

  private effectiveLetter(cell: { isBlank: boolean; assignedLetter?: string; letter: string }): string {
    return (cell.isBlank && cell.assignedLetter) ? cell.assignedLetter : cell.letter;
  }
}
