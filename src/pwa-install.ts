import { showToast } from './ui-utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installButton: HTMLButtonElement | null = null;

export function initPWAInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    showInstallPrompt();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallPrompt();
  });

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    const swPath = import.meta.env.BASE_URL + 'sw.js';
    navigator.serviceWorker.register(swPath).catch(() => {
      showToast('Eroare la activarea modului offline.', 'error');
    });
  } else if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
}

function showInstallPrompt(): void {
  if (installButton) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-install-content">
      <img src="${import.meta.env.BASE_URL}icon-192.png" alt="Robble" class="pwa-icon">
      <div class="pwa-text">
        <strong>Instalează Robble</strong>
        <span>Joacă offline, direct de pe ecranul principal</span>
      </div>
      <div class="pwa-actions">
        <button id="pwa-install-btn" class="pwa-install-btn">Instalează</button>
        <button id="pwa-dismiss-btn" class="pwa-dismiss-btn" aria-label="Închide">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #pwa-install-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #18181b;
      color: #fff;
      padding: 12px 16px;
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .pwa-install-content {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 600px;
      margin: 0 auto;
    }
    .pwa-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
    }
    .pwa-text {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 2px;
    }
    .pwa-text strong {
      font-size: 15px;
      font-weight: 600;
    }
    .pwa-text span {
      font-size: 13px;
      opacity: 0.8;
    }
    .pwa-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pwa-install-btn {
      background: #fff;
      color: #18181b;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      font-family: inherit;
    }
    .pwa-install-btn:hover {
      background: #f4f4f5;
    }
    .pwa-dismiss-btn {
      background: transparent;
      color: #fff;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
    }
    .pwa-dismiss-btn:hover {
      opacity: 1;
    }
    @media (max-width: 480px) {
      .pwa-text span {
        display: none;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(banner);

  installButton = banner.querySelector('#pwa-install-btn') as HTMLButtonElement;
  const dismissBtn = banner.querySelector('#pwa-dismiss-btn') as HTMLButtonElement;

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      hideInstallPrompt();
    }
  });

  dismissBtn.addEventListener('click', () => {
    hideInstallPrompt();
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  });
}

function hideInstallPrompt(): void {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.animation = 'slideUp 0.2s ease-out reverse';
    setTimeout(() => {
      banner.remove();
      installButton = null;
    }, 200);
  }
}
