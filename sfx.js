// Tiny WebAudio chiptune-like SFX without external assets

class SFX {
  constructor() {
    this._ctx = null;
    this._enabled = true;
    this._unlock = this._unlock.bind(this);
    window.addEventListener('pointerdown', this._unlock, { once: true });
    window.addEventListener('keydown', this._unlock, { once: true });
  }

  get ctx() {
    if (!this._ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this._ctx = new AudioCtx();
    }
    return this._ctx;
  }

  _unlock() {
    try { this.ctx.resume(); } catch {}
  }

  _beep({ freq = 440, duration = 0.06, type = 'square', gain = 0.05 }) {
    if (!this._enabled) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  start() { this._beep({ freq: 660, duration: 0.08 }); }
  move() { this._beep({ freq: 330, duration: 0.03 }); }
  rotate() { this._beep({ freq: 520, duration: 0.04 }); }
  dropStep() { this._beep({ freq: 200, duration: 0.02, gain: 0.03 }); }
  lock() { this._beep({ freq: 280, duration: 0.06 }); }
  lineClear(n = 1) {
    const base = 700;
    for (let i = 0; i < n; i++) {
      setTimeout(() => this._beep({ freq: base - i * 80, duration: 0.06 }), i * 70);
    }
  }
  gameOver() {
    const seq = [400, 300, 200];
    seq.forEach((f, i) => setTimeout(() => this._beep({ freq: f, duration: 0.1 }), i * 120));
  }
}

export const sfx = new SFX();


