import { BOARD_SIZE, BONUS_LABELS, BONUS_MAP } from '../constants';
import type { BoardCell, Placement } from '../types';

export class BoardRenderer {
  private board: (BoardCell | null)[][];
  private placedThisTurn: Placement[];
  private onCellClick: (row: number, col: number) => void;

  constructor(board: (BoardCell | null)[][], placedThisTurn: Placement[], handlers: { onCellClick: (row: number, col: number) => void; }) {
    this.board = board; this.placedThisTurn = placedThisTurn; this.onCellClick = handlers.onCellClick;
  }

  updateBoard(board: (BoardCell | null)[][], placedThisTurn: Placement[], hasSelection: boolean): void {
    this.board = board; this.placedThisTurn = placedThisTurn;
    const boardEl = document.getElementById('board');
    if (boardEl) boardEl.classList.toggle('has-selection', hasSelection);
  }

  render(): void {
    const boardEl = document.getElementById('board')!;
    if (boardEl.children.length === 0) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          boardEl.appendChild(this.createCell(r, c));
        }
      }
    } else {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const cell = boardEl.children[r * BOARD_SIZE + c] as HTMLElement;
          this.updateCell(cell, r, c);
        }
      }
    }
  }

  private createCell(r: number, c: number): HTMLElement {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = String(r);
    cell.dataset.col = String(c);
    cell.addEventListener('click', () => this.onCellClick(r, c));
    this.updateCell(cell, r, c);
    return cell;
  }

  private updateCell(cell: HTMLElement, r: number, c: number): void {
    this.renderBonus(cell, r, c);
    this.renderTile(cell, r, c);
  }

  private renderBonus(cell: HTMLElement, r: number, c: number): void {
    const existingBonus = cell.querySelector('.bonus-label');
    if (this.board[r][c]) {
      if (existingBonus) existingBonus.remove();
      return;
    }

    const bonus = BONUS_MAP[`${r},${c}`];
    if (!bonus) {
      if (existingBonus) existingBonus.remove();
      return;
    }

    if (existingBonus && cell.classList.contains(bonus)) return;

    cell.innerHTML = ''; // Clear everything to render bonus correctly
    cell.classList.remove('dl', 'tl', 'dw', 'tw', 'center');
    cell.classList.add(bonus);

    const labelText = BONUS_LABELS[bonus];
    if (labelText) {
      const label = document.createElement('span');
      label.className = 'bonus-label';
      const [mult, type] = labelText.split('\n');
      label.innerHTML = type ? `<span class="mult">${mult}</span><span class="type">${type}</span>` : labelText;
      cell.appendChild(label);
    }
  }

  private renderTile(cell: HTMLElement, r: number, c: number): void {
    const tile = this.board[r][c];
    const isPlacedThisTurn = this.placedThisTurn.some(p => p.row === r && p.col === c);

    if (!tile) {
      cell.classList.remove('has-tile', 'placed-this-turn');
      const existingTile = cell.querySelector('.tile-on-board');
      if (existingTile) existingTile.remove();
      return;
    }

    cell.classList.add('has-tile');
    cell.classList.toggle('placed-this-turn', isPlacedThisTurn);

    let tileDiv = cell.querySelector('.tile-on-board') as HTMLElement;
    const isBlank = !!(tile.isBlank || tile.assignedLetter);
    const displayLetter = (tile.assignedLetter || tile.letter).toUpperCase();

    if (!tileDiv) {
      tileDiv = document.createElement('div');
      tileDiv.className = 'tile-on-board';
      cell.appendChild(tileDiv);
    }

    // Check if content changed to avoid unnecessary updates
    const currentLetter = tileDiv.querySelector('.letter')?.textContent;
    if (currentLetter !== displayLetter) {
      tileDiv.classList.toggle('blank-tile', isBlank);
      tileDiv.innerHTML = isBlank
        ? `<span class="letter">${displayLetter}</span>`
        : `<span class="letter">${tile.letter}</span><span class="points">${tile.points}</span>`;
    }
  }
}
