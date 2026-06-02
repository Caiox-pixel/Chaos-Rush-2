/**
 * VirtualJoystick.js
 * Joystick virtual para PWA mobile — Chaos Rush
 *
 * Uso:
 *   import VirtualJoystick from './VirtualJoystick.js';
 *   this.joystick = new VirtualJoystick();          // em create()
 *   this.joystick.destroy();                        // em shutdown/destroy
 *
 * Leitura no player.js:
 *   const joy = this.scene.joystick;
 *   if (joy && joy.active) { vx += joy.vx; vy += joy.vy; }
 *   if (joy && joy.dashPressed) { joy.consumeDash(); // aciona dash }
 */

export default class VirtualJoystick {
  constructor() {
    this.vx = 0;
    this.vy = 0;
    this.active = false;       // true enquanto o dedo está no joystick
    this.dashPressed = false;  // true por 1 frame quando o botão é tocado

    this._build();
    this._bindEvents();
  }

  // ─────────────────────────────────────────────
  // CONSTRUÇÃO DO DOM
  // ─────────────────────────────────────────────
  _build() {
    const css = `
      #vj-root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
        user-select: none;
        -webkit-user-select: none;
      }

      /* ── JOYSTICK BASE ── */
      #vj-zone {
        position: absolute;
        bottom: 28px;
        left: 28px;
        width: 140px;
        height: 140px;
        pointer-events: all;
        touch-action: none;
      }
      #vj-base {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%,
          rgba(255,255,255,0.10) 0%,
          rgba(255,255,255,0.03) 60%,
          rgba(0,0,0,0.45) 100%);
        border: 2px solid rgba(255,255,255,0.18);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.06),
          0 4px 24px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.12);
        backdrop-filter: blur(4px);
      }
      /* marcadores de direção */
      #vj-base::before,
      #vj-base::after {
        content: '';
        position: absolute;
        background: rgba(255,255,255,0.08);
        border-radius: 2px;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
      }
      #vj-base::before { width: 2px; height: 70%; }
      #vj-base::after  { width: 70%; height: 2px; }

      #vj-stick {
        position: absolute;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle at 38% 30%,
          rgba(255,255,255,0.28) 0%,
          rgba(120,180,255,0.18) 40%,
          rgba(40,80,160,0.60) 100%);
        border: 2px solid rgba(140,200,255,0.45);
        box-shadow:
          0 0 12px rgba(100,160,255,0.35),
          0 2px 8px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,255,255,0.20);
        transition: transform 0.04s linear;
        will-change: transform;
      }
      #vj-stick.pressed {
        background: radial-gradient(circle at 38% 30%,
          rgba(255,255,255,0.35) 0%,
          rgba(160,220,255,0.28) 40%,
          rgba(60,120,220,0.70) 100%);
        box-shadow:
          0 0 20px rgba(100,180,255,0.55),
          0 2px 8px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,255,255,0.28);
      }

      /* ── BOTÃO DE DASH ── */
      #vj-dash-btn {
        position: absolute;
        bottom: 40px;
        right: 36px;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        pointer-events: all;
        touch-action: none;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at 38% 30%,
          rgba(255,255,255,0.28) 0%,
          rgba(120,180,255,0.18) 40%,
          rgba(40,80,160,0.60) 100%);
        border: 2px solid rgba(140,200,255,0.45);
        box-shadow:
          0 0 14px rgba(100,160,255,0.35),
          0 3px 10px rgba(0,0,0,0.45),
          inset 0 1px 0 rgba(255,255,255,0.18);
        backdrop-filter: blur(4px);
        transition: transform 0.08s ease, box-shadow 0.08s ease;
      }
      #vj-dash-btn:active,
      #vj-dash-btn.pressed {
        transform: scale(0.88);
        box-shadow:
          0 0 28px rgba(255,180,0,0.55),
          0 1px 4px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,230,120,0.25);
      }
      #vj-dash-label {
        font-family: 'Arial Black', Arial, sans-serif;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.5px;
        color: white;
        text-shadow: 0 0 8px rgba(255,160,0,0.70), 0 1px 2px rgba(0,0,0,0.8);
        text-transform: uppercase;
        pointer-events: none;
      }

      /* Oculta em desktop */
      @media (hover: hover) and (pointer: fine) {
        #vj-root { display: none !important; }
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'vj-root';
    root.innerHTML = `
      <div id="vj-zone">
        <div id="vj-base"></div>
        <div id="vj-stick"></div>
      </div>
      <div id="vj-dash-btn">
        <span id="vj-dash-label">DASH</span>
      </div>
    `;
    document.body.appendChild(root);

    this._root  = root;
    this._zone  = root.querySelector('#vj-zone');
    this._stick = root.querySelector('#vj-stick');
    this._dash  = root.querySelector('#vj-dash-btn');

    // raio máximo que o stick pode se deslocar
    this._radius = 42; // px
    this._touchId = null;
    this._zoneRect = null;
  }

  // ─────────────────────────────────────────────
  // EVENTOS DE TOUCH
  // ─────────────────────────────────────────────
  _bindEvents() {
    // ── JOYSTICK ──
    this._zone.addEventListener('touchstart', e => {
      e.preventDefault();
      if (this._touchId !== null) return;
      const t = e.changedTouches[0];
      this._touchId   = t.identifier;
      this._zoneRect  = this._zone.getBoundingClientRect();
      this._stick.classList.add('pressed');
      this._updateStick(t.clientX, t.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      if (this._touchId === null) return;
      const t = this._findTouch(e.changedTouches, this._touchId);
      if (!t) return;
      e.preventDefault();
      this._updateStick(t.clientX, t.clientY);
    }, { passive: false });

    document.addEventListener('touchend', e => {
      const t = this._findTouch(e.changedTouches, this._touchId);
      if (!t) return;
      this._touchId = null;
      this._resetStick();
    });

    document.addEventListener('touchcancel', e => {
      const t = this._findTouch(e.changedTouches, this._touchId);
      if (!t) return;
      this._touchId = null;
      this._resetStick();
    });

    // ── DASH ──
    this._dash.addEventListener('touchstart', e => {
      e.preventDefault();
      this.dashPressed = true;
      this._dash.classList.add('pressed');
    }, { passive: false });

    this._dash.addEventListener('touchend', e => {
      e.preventDefault();
      this._dash.classList.remove('pressed');
    }, { passive: false });

    this._dash.addEventListener('touchcancel', () => {
      this._dash.classList.remove('pressed');
    });
  }

  _findTouch(list, id) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === id) return list[i];
    }
    return null;
  }

  _updateStick(cx, cy) {
    const rect  = this._zoneRect;
    const ox     = rect.left + rect.width  / 2;
    const oy     = rect.top  + rect.height / 2;

    let dx = cx - ox;
    let dy = cy - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this._radius) {
      dx = (dx / dist) * this._radius;
      dy = (dy / dist) * this._radius;
    }

    // posiciona o knob visualmente
    this._stick.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // normaliza para -1..1
    const norm = dist > 0 ? Math.min(dist / this._radius, 1) : 0;
    const angle = Math.atan2(dy, dx);
    this.vx = norm > 0.12 ? Math.cos(angle) : 0;
    this.vy = norm > 0.12 ? Math.sin(angle) : 0;
    this.active = (norm > 0.12);
  }

  _resetStick() {
    this._stick.style.transform = 'translate(-50%, -50%)';
    this._stick.classList.remove('pressed');
    this.vx     = 0;
    this.vy     = 0;
    this.active = false;
  }

  // ─────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────

  /** Chame no player após processar o dash para evitar repetição */
  consumeDash() {
    this.dashPressed = false;
  }

  /** Destrói todos os elementos DOM — chame no shutdown da scene */
  destroy() {
    this._root?.remove();
  }
}