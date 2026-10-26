// Soft interface tones made in the browser (no audio files). Off by default.
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
  select: [[1760, 0, 0.09]],
  start: [[587, 0, 0.5], [880, 0.12, 0.9]],
  // Thermal theme: a quick run of dry clicks, like a scanner locking on
  hunt: [[2600, 0, 0.025], [2300, 0.06, 0.025], [2800, 0.12, 0.025], [2100, 0.2, 0.03], [3000, 0.26, 0.025]],
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
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.05, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + len + 0.02);
    }
  } catch { /* audio unavailable: stay silent */ }
}
