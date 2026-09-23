import { getStoredDictionaryMode, loadDictionary } from './dictionary';
import { Game } from './game';
import './styles/base.css';
import './styles/game-board.css';
import './styles/history.css';
import './styles/modals.css';
import './styles/rack.css';
import './styles/responsive.css';
import './styles/top-bar.css';
import './styles/variables.css';
import type { DictionaryMode, DifficultyLevel } from './types';
import { initTooltips } from './ui-utils';
import { initPWAInstall } from './pwa-install';
import { soundManager } from './sounds';

let game: Game;

function getSelectedDifficulty(): DifficultyLevel {
  const valueEl = document.getElementById('difficulty-value');
  return (valueEl?.dataset.value as DifficultyLevel) || 'medium';
}

function getSelectedDictionaryMode(): DictionaryMode {
  const valueEl = document.getElementById('dict-value');
  return (valueEl?.dataset.value as DictionaryMode) || getStoredDictionaryMode();
}

function setupDropdown(triggerId: string, menuId: string, valueId: string): void {
  const trigger = document.getElementById(triggerId);
  const menu = document.getElementById(menuId);
  const valueEl = document.getElementById(valueId);

  if (!trigger || !menu || !valueEl) {
    return;
  }

  const options = menu.querySelectorAll<HTMLElement>('.dropdown-option');

  const toggleMenu = () => {
    const isOpen = !menu.classList.contains('hidden');
    if (isOpen) {
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.remove('hidden');
      trigger.setAttribute('aria-expanded', 'true');
    }
  };

  const selectOption = (option: HTMLElement) => {
    const value = option.dataset.value || '';
    const label = option.textContent || '';
    valueEl.dataset.value = value;
    valueEl.textContent = label;
    options.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    menu.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      selectOption(option);
    });
  });

  document.addEventListener('click', () => {
    if (!menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

function syncDictionaryDropdown(): void {
  const mode = getStoredDictionaryMode();
  const valueEl = document.getElementById('dict-value');
  const menu = document.getElementById('dict-menu');

  if (valueEl && menu) {
    valueEl.dataset.value = mode;
    const option = menu.querySelector<HTMLElement>(`[data-value="${mode}"]`);
    if (option) {
      valueEl.textContent = option.textContent || 'Uzual';
      menu.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    }
  }
}

function initMuteButton(): void {
  const btn = document.getElementById('btn-mute')!;
  const icon = btn.querySelector('.material-symbols-outlined')!;
  const update = () => {
    const muted = soundManager.isMuted();
    icon.textContent = muted ? 'volume_off' : 'volume_up';
    btn.setAttribute('aria-label', muted ? 'Activează sunetul' : 'Dezactivează sunetul');
    btn.classList.toggle('muted', muted);
  };
  update();
  btn.addEventListener('click', () => {
    soundManager.toggleMute();
    update();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const initialMode = getStoredDictionaryMode();
  const loaded = await loadDictionary(initialMode);
  if (!loaded) {
    document.getElementById('load-status')!.textContent = 'Eroare la încărcare. Se reîncearcă...';
    setTimeout(() => location.reload(), 3000);
    return;
  }

  const loadingScreen = document.getElementById('loading-screen')!;
  const app = document.getElementById('app')!;
  loadingScreen.classList.add('fade-out');
  app.classList.remove('hidden');

  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 500);

  setupDropdown('difficulty-trigger', 'difficulty-menu', 'difficulty-value');
  setupDropdown('dict-trigger', 'dict-menu', 'dict-value');
  syncDictionaryDropdown();
  initTooltips();
  initPWAInstall();
  initMuteButton();

  const initialDifficulty = getSelectedDifficulty();
  game = new Game(initialDifficulty, initialMode);

  document.getElementById('btn-submit')!.addEventListener('click', () => game.submitMove());
  document.getElementById('btn-pass')!.addEventListener('click', () => {
    game.showModal('Confirmare', 'Sigur vrei să treci peste rând?', () => game.pass());
  });
  document.getElementById('btn-shuffle')!.addEventListener('click', () => game.shuffleRack());
  document.getElementById('btn-recall')!.addEventListener('click', () => game.recallTiles());
  document.getElementById('btn-exchange')!.addEventListener('click', () => {
    game.exchangeDialog();
  });
  document.getElementById('btn-new-game')!.addEventListener('click', () => {
    syncDictionaryDropdown();
    game.showModal('Joc Nou', 'Alege setările și începe un joc nou. Progresul curent va fi pierdut.', async () => {
      const difficulty = getSelectedDifficulty();
      const dictMode = getSelectedDictionaryMode();
      await game.newGame(difficulty, dictMode);
    }, null, true);
  });

  const historyPanel = document.getElementById('history-panel')!;
  const historyOverlay = document.getElementById('history-overlay')!;
  const toggleHistory = () => {
    const isOpen = historyPanel.classList.toggle('open');
    historyOverlay.classList.toggle('visible', isOpen);
  };

  document.getElementById('btn-history')!.addEventListener('click', toggleHistory);
  document.getElementById('btn-close-history')!.addEventListener('click', toggleHistory);
  historyOverlay.addEventListener('click', toggleHistory);
});

