import { AI } from './ai';
import { BOARD_SIZE, CENTER, RACK_SIZE, TILE_DISTRIBUTION } from './constants';
import { isValidWord } from './dictionary';
import type { GameState } from './game-state';
import { BoardRenderer } from './renderers/board-renderer';
import { HistoryRenderer } from './renderers/history-renderer';
import { RackRenderer } from './renderers/rack-renderer';
import { computeMove } from './scoring';
import { soundManager } from './sounds';
import type { BoardCell, DifficultyLevel, MoveHistoryItem, Placement, SavedGameData, Tile, ValidationResult } from './types';
import { createExchangeDialog, promptBlankTileLetter, setMessage, showModal, updateDifficultyDisplay, updateScores as updateScoreDisplay, updateSubmitButton, updateTileCounts } from './ui-utils';

const STORAGE_KEY = 'robble_game';

export class Game implements GameState {
  board: (BoardCell | null)[][];
  bag: Tile[] = [];
  playerRack: Tile[] = [];
  computerRack: Tile[] = [];
  playerScore = 0;
  computerScore = 0;
  selectedTileIndex = -1;
  placedThisTurn: Placement[] = [];
  isPlayerTurn = true;
  consecutivePasses = 0;
  gameOver = false;
  firstMove = true;
  private tileIdCounter = 0;
  history: MoveHistoryItem[] = [];
  difficulty: DifficultyLevel = 'medium';

  private boardRenderer: BoardRenderer;
  private rackRenderer: RackRenderer;
  private historyRenderer: HistoryRenderer;
  private ai: AI;

  get isFirstMove(): boolean { return this.firstMove; }

  constructor(difficulty?: DifficultyLevel) {
    this.board = Array.from({ length: BOARD_SIZE }, () => Array<BoardCell | null>(BOARD_SIZE).fill(null));
    this.boardRenderer = new BoardRenderer(this.board, this.placedThisTurn, { onCellClick: (r, c) => this.onCellClick(r, c) });
    this.rackRenderer = new RackRenderer('player-tiles', this.playerRack, this.selectedTileIndex, { onTileClick: (idx) => this.onRackTileClick(idx) });
    this.historyRenderer = new HistoryRenderer('history-list');

    if (this.restoreGame()) {
      this.ai = new AI(this, this.difficulty);
      this.render();
      this.setMessage(this.gameOver ? 'Jocul s-a terminat.' : 'Joc restaurat!');
      if (!this.isPlayerTurn && !this.gameOver) setTimeout(() => this.computerTurn(), 800);
    } else {
      this.ai = new AI(this, difficulty);
      if (difficulty) this.difficulty = difficulty;
      this.initBag();
      this.dealInitialTiles();
      this.render();
      this.setMessage('Plasează piesele pe tablă pentru a forma un cuvânt!');
    }
  }

  private render(): void {
    const hasSelection = this.selectedTileIndex !== -1;
    this.boardRenderer.updateBoard(this.board, this.placedThisTurn, hasSelection);
    this.boardRenderer.render();
    this.rackRenderer.updateRack(this.playerRack, this.selectedTileIndex);
    this.rackRenderer.render();
    this.updateScores();
    updateTileCounts(this.bag.length, this.playerRack.length, this.computerRack.length);
    updateDifficultyDisplay(this.difficulty);
    this.historyRenderer.render(this.history);
    updateSubmitButton(this.placedThisTurn.length > 0);
  }

  private initBag(): void {
    this.bag = [];
    for (const [letter, info] of Object.entries(TILE_DISTRIBUTION)) {
      for (let i = 0; i < info.count; i++) {
        this.bag.push({ letter, points: info.points, isBlank: info.blank || false, id: this.tileIdCounter++ });
      }
    }
    this.shuffle(this.bag);
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private dealInitialTiles(): void {
    for (let i = 0; i < RACK_SIZE; i++) {
      if (this.bag.length) this.playerRack.push(this.bag.pop()!);
      if (this.bag.length) this.computerRack.push(this.bag.pop()!);
    }
  }

  private refillRack(rack: Tile[]): void {
    while (rack.length < RACK_SIZE && this.bag.length) rack.push(this.bag.pop()!);
  }

  cloneBoard(): (BoardCell | null)[][] {
    return this.board.map(row => row.map(cell => cell ? { ...cell } : null));
  }

  private onRackTileClick(idx: number): void {
    if (!this.isPlayerTurn || this.gameOver) return;
    this.selectedTileIndex = this.selectedTileIndex === idx ? -1 : idx;
    if (this.selectedTileIndex !== -1) soundManager.play('PICKUP');
    this.render();
  }

  private onCellClick(row: number, col: number): void {
    if (!this.isPlayerTurn || this.gameOver) return;
    if (this.board[row][col] && !this.placedThisTurn.some(p => p.row === row && p.col === col)) return;
    if (this.placedThisTurn.some(p => p.row === row && p.col === col)) {
      this.returnTileToRack(row, col); return;
    }
    if (this.selectedTileIndex === -1) return;
    const tile = this.playerRack[this.selectedTileIndex];
    if (tile.isBlank) {
      promptBlankTileLetter((chosenLetter) => {
        this.playerRack.splice(this.selectedTileIndex, 1);
        this.board[row][col] = { letter: ' ', points: 0, isBlank: true, assignedLetter: chosenLetter.toUpperCase() };
        this.placedThisTurn.push({ row, col, tile, assignedLetter: chosenLetter.toUpperCase() });
        this.selectedTileIndex = -1; this.render(); updateSubmitButton(this.placedThisTurn.length > 0);
        this.updateScorePreview();
      });
      return;
    }
    this.playerRack.splice(this.selectedTileIndex, 1);
    this.board[row][col] = { letter: tile.letter, points: tile.points, isBlank: false };
    this.placedThisTurn.push({ row, col, tile });
    this.selectedTileIndex = -1; soundManager.play('PLACE'); this.render(); updateSubmitButton(this.placedThisTurn.length > 0);
    this.updateScorePreview();
  }

  private returnTileToRack(row: number, col: number): void {
    const placedIdx = this.placedThisTurn.findIndex(p => p.row === row && p.col === col);
    if (placedIdx === -1) return;
    const placed = this.placedThisTurn.splice(placedIdx, 1)[0];
    this.playerRack.push(placed.tile);
    this.board[row][col] = null;
    this.selectedTileIndex = -1; soundManager.play('PICKUP'); this.render(); updateSubmitButton(this.placedThisTurn.length > 0);
    this.updateScorePreview();
  }

  recallTiles(): void {
    this.placedThisTurn.forEach(p => { this.board[p.row][p.col] = null; this.playerRack.push(p.tile); });
    this.placedThisTurn = []; this.selectedTileIndex = -1; this.render(); updateSubmitButton(false);
    this.hideScorePreview();
  }

  private validatePlacement(): ValidationResult {
    if (this.placedThisTurn.length === 0) return { valid: false, error: 'Nu ai plasat nicio piesă!' };
    const positions = this.placedThisTurn.map(p => ({ row: p.row, col: p.col }));
    const rows = positions.map(p => p.row), cols = positions.map(p => p.col);
    const sameRow = rows.every(r => r === rows[0]), sameCol = cols.every(c => c === cols[0]);
    if (!sameRow && !sameCol) return { valid: false, error: 'Piesele trebuie plasate pe un rând sau o coloană!' };
    if (sameRow) {
      const row = rows[0], minC = Math.min(...cols), maxC = Math.max(...cols);
      for (let c = minC; c <= maxC; c++) if (!this.board[row][c]) return { valid: false, error: 'Piesele trebuie să formeze un cuvânt continuu!' };
    } else {
      const col = cols[0], minR = Math.min(...rows), maxR = Math.max(...rows);
      for (let r = minR; r <= maxR; r++) if (!this.board[r][col]) return { valid: false, error: 'Piesele trebuie să formeze un cuvânt continuu!' };
    }
    if (this.firstMove) {
      if (!positions.some(p => p.row === CENTER && p.col === CENTER)) return { valid: false, error: 'Prima mutare trebuie să treacă prin centrul tablei (★)!' };
    } else {
      const touchesExisting = positions.some(p => {
        const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        return dirs.some(([dr, dc]) => {
          const nr = p.row + dr, nc = p.col + dc;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) return false;
          return this.board[nr][nc] && !positions.some(pp => pp.row === nr && pp.col === nc);
        });
      });
      if (!touchesExisting) return { valid: false, error: 'Cuvântul trebuie să se conecteze cu piesele existente!' };
    }
    return { valid: true };
  }

  async submitMove(): Promise<void> {
    soundManager.play('CLICK');
    const validation = this.validatePlacement();
    if (!validation.valid) { this.setMessage(validation.error!); return; }
    const { words } = computeMove(this.board, this.placedThisTurn);
    if (words.length === 0) { this.setMessage('Nu s-a format niciun cuvânt!'); return; }
    const validationResults = await Promise.all(words.map(async w => ({ word: w.word, valid: await isValidWord(w.word) })));
    const invalidWords = validationResults.filter(r => !r.valid);
    if (invalidWords.length > 0) {
      this.setMessage(`Cuvinte necunoscute: ${invalidWords.map(w => w.word).join(', ')}`);
      soundManager.play('ERROR'); return;
    }
    const totalScore = words.reduce((sum, w) => sum + w.score, 0), wordList = words.map(w => w.word.toUpperCase()).join(', ');
    const isRobble = this.placedThisTurn.length === RACK_SIZE;
    const addedScore = isRobble ? totalScore + 50 : totalScore;
    this.playerScore += addedScore;
    this.setMessage(`${wordList}: +${addedScore} puncte${isRobble ? ' (+50 bonus)' : ''}!`);
    soundManager.play(isRobble ? 'BINGO' : 'SUCCESS');
    this.history.push({ player: 'player', words: words.map(w => ({ word: w.word.toUpperCase(), score: w.score })), totalScore: addedScore, isRobble });
    this.placedThisTurn = []; this.firstMove = false; this.consecutivePasses = 0; this.refillRack(this.playerRack); this.selectedTileIndex = -1; this.isPlayerTurn = false;
    this.render();
    this.saveGame();
    this.hideScorePreview();
    if (this.checkGameEnd()) return;
    setTimeout(() => this.computerTurn(), 800);
  }

  pass(): void {
    if (!this.isPlayerTurn || this.gameOver) return;
    this.recallTiles(); this.consecutivePasses++; this.isPlayerTurn = false; this.saveGame();
    this.setMessage('Ai dat pass.'); this.updateScores(); soundManager.play('PICKUP');
    if (this.consecutivePasses >= 6) { this.endGame(); return; }
    setTimeout(() => this.computerTurn(), 800);
  }

  private async computerTurn(): Promise<void> {
    if (this.gameOver) return;
    this.ai.setDifficulty(this.difficulty);
    const result = await this.ai.findBestMove(this.computerRack);
    if (result) {
      result.placements.forEach(p => {
        const isBlank = p.tile.isBlank;
        this.board[p.row][p.col] = { letter: isBlank ? ' ' : p.tile.letter, points: isBlank ? 0 : p.tile.points, isBlank, assignedLetter: p.assignedLetter };
        const idx = this.computerRack.findIndex(t => t.id === p.tile.id);
        if (idx !== -1) this.computerRack.splice(idx, 1);
      });
      this.computerScore += result.score;
      this.history.push({ player: 'computer', words: result.words.map(w => ({ word: w.toUpperCase(), score: 0 })), totalScore: result.score, isRobble: result.placements.length === RACK_SIZE });
      this.consecutivePasses = 0; this.firstMove = false;
      this.setMessage(`Calculator: ${result.words.join(', ')} (+${result.score})`);
      soundManager.play('PLACE');
    } else {
      this.consecutivePasses++; this.setMessage('Calculatorul a dat pass.');
    }
    this.refillRack(this.computerRack); this.isPlayerTurn = true; this.render(); this.saveGame();
    if (this.checkGameEnd()) return;
    if (this.consecutivePasses >= 6) this.endGame();
  }

  private checkGameEnd(): boolean {
    if ((this.playerRack.length === 0 || this.computerRack.length === 0) && this.bag.length === 0) {
      this.endGame(); return true;
    }
    return false;
  }

  private endGame(): void {
    this.gameOver = true;
    const playerPenalty = this.playerRack.reduce((s, t) => s + t.points, 0), computerPenalty = this.computerRack.reduce((s, t) => s + t.points, 0);
    this.playerScore -= playerPenalty; this.computerScore -= computerPenalty;
    if (this.playerRack.length === 0) this.playerScore += computerPenalty;
    if (this.computerRack.length === 0) this.computerScore += playerPenalty;
    this.updateScores(); soundManager.play('GAME_OVER'); this.saveGame();
    let title: string, message: string;
    if (this.playerScore > this.computerScore) { title = 'Felicitări! Ai câștigat!'; message = `Scor final: Tu ${this.playerScore} - Calculator ${this.computerScore}`; }
    else if (this.computerScore > this.playerScore) { title = 'Calculatorul a câștigat!'; message = `Scor final: Tu ${this.playerScore} - Calculator ${this.computerScore}`; }
    else { title = 'Egalitate!'; message = `Scor final: ${this.playerScore} - ${this.computerScore}`; }
    this.showModal(title, message, () => this.newGame(), () => { this.setMessage('Jocul s-a terminat.'); }, false, 'Joc nou', 'Vezi tabla');
  }

  showModal(title: string, message: string, onConfirm: (() => void) | null = null, onCancel?: (() => void) | null, showDifficulty: boolean = false, confirmText?: string, cancelText?: string): void {
    soundManager.play('CLICK'); showModal(title, message, onConfirm ?? undefined, onCancel ?? undefined, showDifficulty, confirmText, cancelText);
  }

  newGame(newDifficulty?: DifficultyLevel): void {
    if (newDifficulty) { this.difficulty = newDifficulty; this.ai.setDifficulty(newDifficulty); }
    this.board = Array.from({ length: BOARD_SIZE }, () => Array<BoardCell | null>(BOARD_SIZE).fill(null));
    this.playerRack = []; this.computerRack = []; this.playerScore = 0; this.computerScore = 0; this.selectedTileIndex = -1;
    this.placedThisTurn = []; this.isPlayerTurn = true; this.consecutivePasses = 0; this.gameOver = false; this.firstMove = true; this.history = [];
    this.boardRenderer.updateBoard(this.board, this.placedThisTurn, false);
    this.rackRenderer.updateRack(this.playerRack, this.selectedTileIndex);
    this.initBag(); this.dealInitialTiles(); this.render(); this.saveGame();
    this.setMessage('Joc nou! Plasează piesele pe tablă.'); updateSubmitButton(false);
    this.hideScorePreview();
  }

  shuffleRack(): void {
    if (this.gameOver) return;
    this.shuffle(this.playerRack); this.selectedTileIndex = -1; soundManager.play('SHUFFLE');
    this.rackRenderer.updateRack(this.playerRack, this.selectedTileIndex); this.rackRenderer.render();
  }

  exchangeDialog(): void {
    if (!this.isPlayerTurn || this.gameOver) return;
    if (this.bag.length < RACK_SIZE) { this.setMessage(`Nu poți schimba piese dacă în sac sunt mai puțin de ${RACK_SIZE} piese!`); return; }
    this.recallTiles();
    createExchangeDialog(this.playerRack.map(t => t.isBlank ? '?' : t.letter), (indices) => this.performExchange(indices), () => { });
  }

  private performExchange(indices: number[]): void {
    soundManager.play('SHUFFLE');
    const toExchange: Tile[] = [];
    indices.sort((a, b) => b - a);
    for (const idx of indices) toExchange.push(this.playerRack.splice(idx, 1)[0]);
    this.bag.push(...toExchange); this.shuffle(this.bag); this.refillRack(this.playerRack);
    this.setMessage(`Ai schimbat ${indices.length} piese.`); this.isPlayerTurn = false; this.consecutivePasses++; this.saveGame();
    this.render();
    if (this.consecutivePasses >= 6) { this.endGame(); return; }
    setTimeout(() => this.computerTurn(), 800);
  }

  private setMessage(msg: string): void { setMessage(msg); }
  private updateScores(): void { updateScoreDisplay(this.playerScore, this.computerScore, this.isPlayerTurn); }

  private async updateScorePreview(): Promise<void> {
    if (this.placedThisTurn.length === 0) {
      this.hideScorePreview();
      return;
    }

    const validation = this.validatePlacement();
    if (!validation.valid) {
      setMessage('', undefined, { text: validation.error || 'Plasare invalidă', type: 'invalid' });
      return;
    }

    const { words, total } = computeMove(this.board, this.placedThisTurn);

    if (words.length === 0) {
      setMessage('', undefined, { text: 'Niciun cuvânt format', type: 'invalid' });
      return;
    }

    const wordList = words.map(w => w.word.toUpperCase()).join(', ');
    const isRobble = this.placedThisTurn.length === 7;
    const displayScore = isRobble ? total + 50 : total;
    const scoreText = `${displayScore} puncte${isRobble ? ' (+50 bonus)' : ''}`;

    setMessage(wordList, scoreText, { text: 'Se verifică...', type: 'checking' });

    try {
      const validationResults = await Promise.all(
        words.map(async w => ({ word: w.word, valid: await isValidWord(w.word) }))
      );
      const invalidWords = validationResults.filter(r => !r.valid);

      if (invalidWords.length > 0) {
        setMessage(wordList, scoreText, { text: `Cuvinte necunoscute: ${invalidWords.map(w => w.word.toUpperCase()).join(', ')}`, type: 'invalid' });
      } else {
        setMessage(wordList, scoreText, { text: 'Toate cuvintele sunt valide', type: 'valid' });
      }
    } catch {
      setMessage(wordList, scoreText, { text: 'Verificare indisponibilă', type: '' });
    }
  }

  private hideScorePreview(): void {
    setMessage('Plasează piesele pe tablă pentru a forma un cuvânt!');
  }

  private saveGame(): void {
    const data: SavedGameData = {
      board: this.board,
      bag: this.bag,
      playerRack: this.playerRack,
      computerRack: this.computerRack,
      playerScore: this.playerScore,
      computerScore: this.computerScore,
      isPlayerTurn: this.isPlayerTurn,
      consecutivePasses: this.consecutivePasses,
      gameOver: this.gameOver,
      firstMove: this.firstMove,
      tileIdCounter: this.tileIdCounter,
      history: this.history,
      difficulty: this.difficulty,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private restoreGame(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      const data: SavedGameData = JSON.parse(raw);
      this.board = data.board;
      this.bag = data.bag;
      this.playerRack = data.playerRack;
      this.computerRack = data.computerRack;
      this.playerScore = data.playerScore;
      this.computerScore = data.computerScore;
      this.isPlayerTurn = data.isPlayerTurn;
      this.consecutivePasses = data.consecutivePasses;
      this.gameOver = data.gameOver;
      this.firstMove = data.firstMove;
      this.tileIdCounter = data.tileIdCounter;
      this.history = data.history;
      this.difficulty = data.difficulty;
      return true;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }
}
