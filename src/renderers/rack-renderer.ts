import type { Tile } from '../types';

export interface RackHandlers { onTileClick: (idx: number) => void; }

export class RackRenderer {
  private container: HTMLElement;
  private rack: Tile[];
  private selectedIndex: number;
  private handlers: RackHandlers;

  constructor(containerId: string, rack: Tile[], selectedIndex: number, handlers: RackHandlers) {
    this.container = document.getElementById(containerId)!; this.rack = rack; this.selectedIndex = selectedIndex; this.handlers = handlers;
  }

  updateRack(rack: Tile[], selectedIndex: number): void { this.rack = rack; this.selectedIndex = selectedIndex; }

  render(): void {
    this.container.innerHTML = '';
    this.rack.forEach((tile, idx) => {
      const el = document.createElement('div');
      el.className = `rack-tile ${tile.isBlank ? 'blank-tile' : ''} ${idx === this.selectedIndex ? 'selected' : ''}`;
      el.innerHTML = tile.isBlank ? `<span>?</span>` : `<span>${tile.letter}</span><span class="tile-points">${tile.points}</span>`;
      el.addEventListener('click', () => this.handlers.onTileClick(idx));
      this.container.appendChild(el);
    });
  }
}
