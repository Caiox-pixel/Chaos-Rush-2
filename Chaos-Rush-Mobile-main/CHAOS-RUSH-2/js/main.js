import LoginScene from './scene/LoginScene.js';
import RegisterScene from './scene/RegisterScene.js';
import MenuScene from './scene/MenuScene.js';
import MainScene from './scene/MainScene.js';
import PauseMenu from './scene/PauseMenu.js';
import PrefaceMenu from './scene/PrefaceMenu.js';

// Detecta dimensões reais do device
const getGameDimensions = () => {
  const w = Math.max(document.documentElement.clientWidth, window.innerWidth) || 393;
  const h = Math.max(document.documentElement.clientHeight, window.innerHeight) || 873;
  return { width: w, height: h };
};

const { width: initialWidth, height: initialHeight } = getGameDimensions();

const config = {
  type: Phaser.AUTO,

  parent: 'game-container',

  dom: {
    createContainer: true
  },

  scale: {
    mode: Phaser.Scale.RESIZE,
    orientation: 'portrait-primary',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    fullscreenTarget: 'parent',
    width: initialWidth,
    height: initialHeight,
    min: {
      width: 320,
      height: 568
    },
    autoRound: true
  },

  render: {
    pixelArt: true,
    antialias: false,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      fps: 60
    }
  },

  input: {
    queue: true,
    touch: {
      target: window
    }
  },

  scene: [
    LoginScene,
    RegisterScene,
    MenuScene,
    PrefaceMenu,
    MainScene,
    PauseMenu
  ]
};

window.game = new Phaser.Game(config);

// Detectar se é dispositivo mobile
const isMobileDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
};

const lockPortraitOrientation = () => {
  if (!isMobileDevice()) return;
  const desired = 'portrait-primary';
  if (!screen.orientation || typeof screen.orientation.lock !== 'function') {
    console.log('[PWA] screen.orientation.lock() não suportado');
    return;
  }
  screen.orientation.lock(desired)
    .then(() => console.log('[PWA] Orientação travada em retrato'))
    .catch(err => {
      if (err.name === 'NotSupportedError') {
        console.log('[PWA] Lock de orientação não suportado');
      } else {
        console.warn('[PWA] Falha ao travar retrato:', err);
      }
    });
};

const resumeAudioOnGesture = () => {
  const resume = () => {
    if (window.game && window.game.sound && window.game.sound.context) {
      const context = window.game.sound.context;
      if (context.state === 'suspended' && typeof context.resume === 'function') {
        context.resume()
          .then(() => console.log('[PWA] Audio liberado após gesto'))
          .catch(err => console.warn('[PWA] Falha ao resumir áudio:', err));
      }
    }
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('touchstart', resume, { once: true });
};

const updatePortraitOverlay = () => {
  const overlay = document.getElementById('orientation-lock-overlay');
  if (!overlay) return;
  if (!isMobileDevice()) {
    overlay.classList.add('hidden');
    return;
  }
  const isLandscape = window.innerWidth > window.innerHeight;
  overlay.classList.toggle('hidden', !isLandscape);
};

const resizeGame = () => {
  updatePortraitOverlay();
  if (!window.game || !window.game.scale) return;
  const width = document.documentElement.clientWidth || window.innerWidth;
  const height = document.documentElement.clientHeight || window.innerHeight;
  window.game.scale.resize(width, height);
  if (window.game.scale.refresh) window.game.scale.refresh();
};

window.addEventListener('load', () => {
  lockPortraitOrientation();
  updatePortraitOverlay();
  resumeAudioOnGesture();
  resizeGame();
});

window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => setTimeout(resizeGame, 200));

if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
  screen.orientation.addEventListener('change', () => setTimeout(resizeGame, 200));
}

// Detectar instalação do PWA
let deferredPrompt;
let installPromptShown = false;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Install prompt disponível');

  if (!installPromptShown) {
    const showPrompt = () => {
      if (deferredPrompt && !installPromptShown) {
        installPromptShown = true;
        deferredPrompt.prompt().then(() => deferredPrompt.userChoice)
          .then(choiceResult => {
            console.log('[PWA] Resultado:', choiceResult.outcome);
            deferredPrompt = null;
          })
          .catch(err => {
            console.warn('[PWA] Erro ao exibir prompt:', err);
            deferredPrompt = null;
            installPromptShown = false;
          });
      }
    };
    window.addEventListener('pointerdown', showPrompt, { once: true });
    window.addEventListener('touchstart', showPrompt, { once: true });
  }
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] App instalado com sucesso!');
  deferredPrompt = null;
  installPromptShown = true;
});

window.addEventListener('online', () => console.log('[PWA] Online'));
window.addEventListener('offline', () => console.log('[PWA] Offline - usando cache'));