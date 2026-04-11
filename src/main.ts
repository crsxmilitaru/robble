import { loadDictionary } from './dictionary';
import { Game } from './game';
import './styles/base.css';
import './styles/game-board.css';
import './styles/history.css';
import './styles/modals.css';
import './styles/rack.css';
import './styles/responsive.css';
import './styles/top-bar.css';
import './styles/variables.css';
import type { DifficultyLevel } from './types';
import { initTooltips } from './ui-utils';
import { initPWAInstall } from './pwa-install';

let game: Game;

function getSelectedDifficulty(): DifficultyLevel {
  const valueEl = document.getElementById('difficulty-value');
  return (valueEl?.dataset.value as DifficultyLevel) || 'medium';
}

function initCustomDropdown(): void {
  const trigger = document.getElementById('difficulty-trigger')!;
  const menu = document.getElementById('difficulty-menu')!;
  const valueEl = document.getElementById('difficulty-value')!;
  const options = menu.querySelectorAll('.dropdown-option');

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
    const value = option.dataset.value as DifficultyLevel;
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
      selectOption(option as HTMLElement);
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

document.addEventListener('DOMContentLoaded', async () => {
  const loaded = await loadDictionary();
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

  initCustomDropdown();
  initTooltips();
  initPWAInstall();

  const initialDifficulty = getSelectedDifficulty();
  game = new Game(initialDifficulty);

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
    game.showModal('Joc Nou', 'Alege dificultatea și începe un joc nou. Progresul curent va fi pierdut.', () => {
      const difficulty = getSelectedDifficulty();
      game.newGame(difficulty);
    }, true);
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

