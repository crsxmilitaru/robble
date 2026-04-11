import type { MoveHistoryItem } from '../types';

export class HistoryRenderer {
  private container: HTMLElement | null;
  constructor(containerId: string) { this.container = document.getElementById(containerId); }
  render(history: MoveHistoryItem[]): void {
    const container = this.container; if (!container) return;
    container.innerHTML = '';
    history.slice().reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = `history-item ${item.player}`;
      el.innerHTML = `<div class="item-header"><span>${item.player === 'player' ? 'Tu' : 'AI'}</span>${item.isRobble ? '<span class="robble-badge">ROBBLE!</span>' : ''}</div><div class="item-words">${item.words.map(w => w.word).join(', ')}</div><div class="item-score">+${item.totalScore}</div>`;
      container.appendChild(el);
    });
  }
}
