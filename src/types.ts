export interface TileInfo {
  count: number;
  points: number;
  blank?: boolean;
}

export interface Tile {
  letter: string;
  points: number;
  isBlank: boolean;
  id: number;
  assignedLetter?: string;
}

export interface BoardCell {
  letter: string;
  points: number;
  isBlank: boolean;
  assignedLetter?: string;
}

export interface Placement {
  row: number;
  col: number;
  tile: Tile;
  assignedLetter?: string;
}

export interface MoveResult {
  placements: Placement[];
  score: number;
  words: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface MoveHistoryItem {
  player: 'player' | 'computer';
  words: { word: string; score: number }[];
  totalScore: number;
  isRobble?: boolean;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type DictionaryMode = 'standard' | 'complete';

export interface SavedGameData {
  board: (BoardCell | null)[][];
  bag: Tile[];
  playerRack: Tile[];
  computerRack: Tile[];
  playerScore: number;
  computerScore: number;
  isPlayerTurn: boolean;
  consecutivePasses: number;
  gameOver: boolean;
  firstMove: boolean;
  tileIdCounter: number;
  history: MoveHistoryItem[];
  difficulty: DifficultyLevel;
  dictionaryMode?: DictionaryMode;
}
