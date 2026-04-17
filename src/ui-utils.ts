import { ROMANIAN_LETTERS } from './constants';

export function promptBlankTileLetter(callback: (letter: string) => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'blank-tile-overlay';
  overlay.innerHTML = `<div class="blank-tile-modal"><h3>Alege litera pentru Joker</h3><div class="blank-tile-grid">${ROMANIAN_LETTERS.map(l => `<button class="blank-btn" data-letter="${l}">${l.toUpperCase()}</button>`).join('')}</div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll<HTMLButtonElement>('.blank-btn').forEach(btn => btn.addEventListener('click', () => { document.body.removeChild(overlay); callback(btn.dataset.letter!); }));
}

export function showModal(title: string, message: string, onConfirm?: () => void, onCancel?: () => void, showDifficulty: boolean = false, confirmText?: string, cancelText?: string): () => void {
  const modalOverlay = document.getElementById('modal-overlay')!, modalBtn = document.getElementById('modal-btn')!, cancelBtn = document.getElementById('modal-cancel-btn')!;
  const difficultySelector = document.getElementById('difficulty-selector')!;
  document.getElementById('modal-title')!.textContent = title;
  document.getElementById('modal-message')!.textContent = message;

  if (showDifficulty) {
    difficultySelector.classList.remove('hidden');
  } else {
    difficultySelector.classList.add('hidden');
  }

  const cleanup = () => {
    modalOverlay.classList.add('hidden');
    difficultySelector.classList.add('hidden');
  };
  modalBtn.textContent = confirmText ?? (onConfirm ? 'Confirmă' : 'OK');
  if (onConfirm) {
    cancelBtn.classList.remove('hidden');
    const newModalBtn = modalBtn.cloneNode(true) as HTMLElement, newCancelBtn = cancelBtn.cloneNode(true) as HTMLElement;
    if (cancelText) newCancelBtn.textContent = cancelText;
    modalBtn.parentNode!.replaceChild(newModalBtn, modalBtn); cancelBtn.parentNode!.replaceChild(newCancelBtn, cancelBtn);
    newModalBtn.addEventListener('click', () => { onConfirm(); cleanup(); });
    newCancelBtn.addEventListener('click', () => { if (onCancel) onCancel(); cleanup(); });
  } else {
    cancelBtn.classList.add('hidden');
    const newModalBtn = modalBtn.cloneNode(true) as HTMLElement;
    modalBtn.parentNode!.replaceChild(newModalBtn, modalBtn);
    newModalBtn.addEventListener('click', cleanup);
  }
  modalOverlay.classList.remove('hidden');
  return cleanup;
}

export function createExchangeDialog(rackLetters: string[], onConfirm: (indices: number[]) => void, onCancel: () => void): void {
  const selectedIndices: number[] = [], overlay = document.createElement('div');
  overlay.className = 'blank-tile-overlay';
  overlay.innerHTML = `<div class="blank-tile-modal exchange-modal"><h3>Alege piesele pentru schimb</h3><p>Selectează literele pe care vrei să le înlocuiești:</p><div class="exchange-grid">${rackLetters.map((l, i) => `<button class="exchange-btn" data-idx="${i}">${l}</button>`).join('')}</div><div class="modal-actions"><button id="exchange-cancel" class="secondary">Anulează</button><button id="exchange-confirm" disabled>Confirmă</button></div></div>`;
  document.body.appendChild(overlay);
  const confirmBtn = overlay.querySelector('#exchange-confirm') as HTMLButtonElement, cancelBtn = overlay.querySelector('#exchange-cancel') as HTMLButtonElement;
  overlay.querySelectorAll('.exchange-btn').forEach(btn => btn.addEventListener('click', () => {
    const idx = parseInt((btn as HTMLElement).dataset.idx!), pos = selectedIndices.indexOf(idx);
    if (pos === -1) { selectedIndices.push(idx); btn.classList.add('selected'); } else { selectedIndices.splice(pos, 1); btn.classList.remove('selected'); }
    confirmBtn.disabled = selectedIndices.length === 0;
  }));
  confirmBtn.addEventListener('click', () => { document.body.removeChild(overlay); onConfirm(selectedIndices); });
  cancelBtn.addEventListener('click', () => { document.body.removeChild(overlay); onCancel(); });
}

export function setMessage(msg: string): void { document.getElementById('message-area')!.textContent = msg; }
export function updateScores(playerScore: number, computerScore: number, isPlayerTurn: boolean): void {
  document.getElementById('p1-score')!.textContent = String(playerScore);
  document.getElementById('p2-score')!.textContent = String(computerScore);
  document.getElementById('player1-score')!.classList.toggle('active', isPlayerTurn);
  document.getElementById('player2-score')!.classList.toggle('active', !isPlayerTurn);
  document.getElementById('turn-indicator')!.textContent = '';
}

export function updateTileCounts(bagCount: number, playerCount: number, computerCount: number): void {
  const r = document.getElementById('remaining-count'), p = document.getElementById('player-count'), c = document.getElementById('computer-count');
  const combined = document.getElementById('rack-counts-combined');
  if (r) r.textContent = String(bagCount); if (p) p.textContent = String(playerCount); if (c) c.textContent = String(computerCount);
  if (combined) combined.textContent = `${playerCount}/${computerCount}`;
}

export function updateDifficultyDisplay(difficulty: string): void {
  const d = document.getElementById('current-difficulty-display');
  if (d) {
    if (difficulty === 'easy') d.textContent = 'Ușor';
    else if (difficulty === 'hard') d.textContent = 'Greu';
    else d.textContent = 'Mediu';
  }
}

export function updateSubmitButton(enabled: boolean): void { (document.getElementById('btn-submit') as HTMLButtonElement).disabled = !enabled; }

export function initTooltips(): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'custom-tooltip';
  document.body.appendChild(tooltip);

  let lastTouchTime = 0;
  document.addEventListener('touchstart', () => {
    lastTouchTime = Date.now();
  }, { passive: true });

  const showTooltip = (e: MouseEvent) => {
    if (Date.now() - lastTouchTime < 500) return;
    const target = (e.currentTarget as HTMLElement);
    const text = target.getAttribute('data-tooltip');
    if (!text) return;

    tooltip.textContent = text;
    tooltip.classList.add('visible');

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = rect.bottom + 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    tooltip.classList.remove('pos-top');

    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;

    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = rect.top - tooltipRect.height - 8;
      tooltip.classList.add('pos-top');
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  };

  const hideTooltip = () => {
    tooltip.classList.remove('visible');
  };

  const updateTooltips = () => {
    const elements = document.querySelectorAll('[data-tooltip]');
    elements.forEach(el => {
      el.removeEventListener('mouseenter', showTooltip as any);
      el.removeEventListener('mouseleave', hideTooltip);
      el.removeEventListener('click', hideTooltip);
      el.addEventListener('mouseenter', showTooltip as any);
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('click', hideTooltip);
    });
  };

  updateTooltips();
  document.addEventListener('mousedown', hideTooltip);
  document.addEventListener('touchstart', hideTooltip, { passive: true });

  const observer = new MutationObserver(updateTooltips);
  observer.observe(document.body, { childList: true, subtree: true });
}

export function showDefinitionDialog(word: string, info: { lemma: string, definitions: { htmlRep: string, sourceName: string }[] } | null): void {
  const overlay = document.createElement('div');
  overlay.className = 'blank-tile-overlay definition-overlay';

  let contentHtml = '';
  let headerExtra = '';

  if (!info || info.definitions.length === 0) {
    contentHtml = `<p class="no-def">Nu s-au găsit definiții pentru "<strong>${word}</strong>".</p>`;
  } else {
    const firstDef = info.definitions[0].htmlRep;
    const typeMatch = firstDef.match(/<abbr[^>]*>(.*?)<\/abbr>/);
    const wordType = typeMatch ? typeMatch[1] : '';

    if (wordType) {
      headerExtra = `<span class="word-type">${wordType}</span>`;
    }

    if (info.lemma && info.lemma.toLowerCase() !== word.toLowerCase()) {
      headerExtra += `<span class="word-lemma"> forma lui <strong>${info.lemma}</strong></span>`;
    }

    contentHtml = info.definitions.map(d => `
      <div class="definition-item">
        <div class="definition-html">${d.htmlRep}</div>
        <div class="definition-source">${d.sourceName}</div>
      </div>
    `).join('<hr>');
  }

  overlay.innerHTML = `
    <div class="blank-tile-modal definition-modal">
      <div class="modal-header">
        <div class="header-title-group">
          <h3>${word}</h3>
          ${headerExtra}
        </div>
        <button class="close-def-btn"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="definition-scroll-area">
        ${contentHtml}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.close-def-btn')!;
  const close = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      if (overlay.parentNode) document.body.removeChild(overlay);
    }, 200);
  };

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

export function showToast(message: string, type: 'info' | 'error' = 'info'): void {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined">${type === 'error' ? 'error' : 'info'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode) document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
