import { fetchDefinition } from '../dictionary';
import type { MoveHistoryItem } from '../types';
import { showDefinitionDialog } from '../ui-utils';

export class HistoryRenderer {
  private container: HTMLElement | null;
  constructor(containerId: string) { this.container = document.getElementById(containerId); }
  render(history: MoveHistoryItem[]): void {
    const container = this.container; if (!container) return;
    container.innerHTML = '';
    history.slice().reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = `history-item ${item.player}`;
      const wordsHtml = item.words.map(w => `<span class="history-word" data-word="${w.word}">${w.word}</span>`).join(', ');
      el.innerHTML = `<div class="item-header"><span>${item.player === 'player' ? 'Tu' : 'AI'}</span>${item.isRobble ? '<span class="robble-badge">ROBBLE!</span>' : ''}</div><div class="item-words">${wordsHtml}</div><div class="item-score">+${item.totalScore}</div>`;

      el.querySelectorAll('.history-word').forEach(wordEl => {
        wordEl.addEventListener('click', async (e) => {
          const word = (e.target as HTMLElement).dataset.word;
          if (word) {
            const result = await fetchDefinition(word);
            showDefinitionDialog(word, result);
          }
        });
      });

      container.appendChild(el);
    });
  }
}
