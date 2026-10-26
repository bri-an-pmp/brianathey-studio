// Tiny chiptune sound effects made in the browser (no audio files). Off by default.
let enabled = false;
let ctx = null;

try { enabled = localStorage.getItem('bas_sound') === 'on'; } catch { /* ignore */ }

export const soundEnabled = () => enabled;

// One shared audio engine for effects and the theme music.
export function audioCtx() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSound(on) {
  enabled = Boolean(on);
  try { localStorage.setItem('bas_sound', enabled ? 'on' : 'off'); } catch { /* ignore */ }
}

const PATTERNS = {
  // [frequency Hz, start s, length s]
  select: [[880, 0, 0.06]],
  record: [[1319, 0, 0.07], [1976, 0.07, 0.18]],
  start: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.25]],
};

export function sfx(name) {
  if (!enabled) return;
  const notes = PATTERNS[name];
  if (!notes) return;
  try {
    audioCtx();
    const now = ctx.currentTime + 0.01;
    for (const [freq, start, len] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, now + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + len + 0.02);
    }
  } catch { /* audio unavailable: stay silent */ }
}
