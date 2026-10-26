// "Studio Hill (chill mix)": an original, laid-back 16-bit style theme, played
// live with soft FM-style synths (like a 90s console sound chip). No audio files.
import { audioCtx } from './sound.js?v=20261026165411';

const BPM = 84;
const STEP = 60 / BPM / 4; // one sixteenth note
const SWING = STEP * 0.12; // off-beat sixteenths lean back a little
const STEPS_PER_BAR = 16;

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(name) {
  const [, letter, acc, oct] = /^([A-G])(#|b)?(\d)$/.exec(name);
  return 12 * (Number(oct) + 1) + NOTE[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

/* ---------- The song (16 bars, two bars per chord, loops) ---------- */
const CHORDS = [
  ['F3', 'A3', 'C4', 'E4'], // Fmaj7
  ['E3', 'G3', 'B3', 'D4'], // Em7
  ['A3', 'C4', 'E4', 'G4', 'B4'], // Am9
  ['G3', 'B3', 'D4', 'E4'], // G6
  ['D3', 'F3', 'A3', 'C4', 'E4'], // Dm9
  ['C4', 'E4', 'G4', 'B4'], // Cmaj7
  ['Bb3', 'D4', 'F4', 'A4'], // Bbmaj7
  ['C4', 'F4', 'G4'], // Csus4
];
const ROOTS = ['F2', 'E2', 'A2', 'G2', 'D2', 'C2', 'Bb1', 'C2'];

// Melody: [step, note, length in steps]. Sparse, so the echo can fill the space.
const LEAD = [
  [[0, 'E5', 6], [6, 'C5', 2], [8, 'A4', 8]],
  [[4, 'G5', 4], [8, 'E5', 8]],
  [[0, 'D5', 6], [6, 'B4', 2], [8, 'G4', 8]],
  [[4, 'A4', 2], [6, 'B4', 2], [8, 'D5', 8]],
  [[0, 'E5', 4], [4, 'G5', 4], [8, 'B5', 8]],
  [[8, 'A5', 4], [12, 'G5', 4]],
  [[0, 'E5', 12]],
  [[8, 'D5', 4], [12, 'B4', 4]],
  [[0, 'A4', 4], [4, 'C5', 4], [8, 'E5', 8]],
  [[4, 'F5', 4], [8, 'E5', 4], [12, 'C5', 4]],
  [[0, 'D5', 6], [6, 'E5', 2], [8, 'G5', 8]],
  [[8, 'B5', 8]],
  [[0, 'A5', 8], [8, 'F5', 4], [12, 'D5', 4]],
  [[0, 'C5', 12]],
  [[0, 'F5', 4], [4, 'G5', 8]],
  [],
];

const ARP_STEPS = [0, 3, 6, 8, 11, 14]; // gentle electric-piano pattern
const BARS = LEAD.length;
const TOTAL_STEPS = BARS * STEPS_PER_BAR;

// Everything that happens on each sixteenth of the loop.
const TIMELINE = Array.from({ length: TOTAL_STEPS }, () => []);
for (let bar = 0; bar < BARS; bar++) {
  const at = (s) => TIMELINE[bar * STEPS_PER_BAR + s];
  const chord = CHORDS[Math.floor(bar / 2)].map(midi);
  const root = midi(ROOTS[Math.floor(bar / 2)]);
  const firstOfPair = bar % 2 === 0;

  if (firstOfPair) at(0).push({ v: 'pad', ms: chord, len: STEPS_PER_BAR * 2 });
  for (const [s, n, len] of LEAD[bar]) at(s).push({ v: 'lead', m: midi(n), len });
  ARP_STEPS.forEach((s, i) => {
    const turn = firstOfPair ? i : ARP_STEPS.length - 1 - i; // up, then back down
    at(s).push({ v: 'keys', m: chord[turn % chord.length] + 12 });
  });
  at(0).push({ v: 'bass', m: root, len: 6 });
  at(10).push({ v: 'bass', m: root + (firstOfPair ? 7 : 12), len: 4 });

  at(0).push({ v: 'kick' });
  at(10).push({ v: 'kick' });
  at(8).push({ v: 'rim' });
  for (let s = 2; s < 16; s += 4) at(s).push({ v: 'hat', level: 0.035 });
  for (let s = 0; s < 16; s += 4) at(s).push({ v: 'hat', level: 0.018 });
}

/* ---------- Instruments ---------- */
let ctx = null;
let master = null;
let echoIn = null;
let noise = null;

function setupGraph() {
  ctx = audioCtx();
  master = ctx.createGain();
  master.gain.value = 0;
  const warm = ctx.createBiquadFilter(); // takes the edge off the whole mix
  warm.type = 'lowpass';
  warm.frequency.value = 6000;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  master.connect(warm).connect(comp).connect(ctx.destination);

  // Long, darkening echo: each repeat gets softer and warmer.
  echoIn = ctx.createGain();
  const delay = ctx.createDelay(2);
  delay.delayTime.value = STEP * 3;
  const fb = ctx.createGain();
  fb.gain.value = 0.48;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2200;
  const wet = ctx.createGain();
  wet.gain.value = 0.38;
  echoIn.connect(delay).connect(tone).connect(fb).connect(delay);
  tone.connect(wet).connect(master);

  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
}

// Two-operator FM voice: a modulator colors the carrier's tone.
function fm(t, freq, len, { ratio, indexStart, indexEnd, indexTime, level, attack, release, out, vibrato = 0 }) {
  const car = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const amp = ctx.createGain();
  car.frequency.value = freq;
  mod.frequency.value = freq * ratio;
  modGain.gain.setValueAtTime(freq * indexStart, t);
  modGain.gain.exponentialRampToValueAtTime(Math.max(freq * indexEnd, 0.01), t + indexTime);
  mod.connect(modGain).connect(car.frequency);

  const end = t + Math.max(len, attack + 0.05);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(level, t + attack);
  amp.gain.exponentialRampToValueAtTime(level * 0.55, end);
  amp.gain.exponentialRampToValueAtTime(0.0001, end + release);
  car.connect(amp);
  out.forEach((node) => amp.connect(node));

  const stopAt = end + release + 0.05;
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 4.8;
    lfoGain.gain.setValueAtTime(0, t);
    lfoGain.gain.linearRampToValueAtTime(vibrato, t + 0.6); // vibrato drifts in on long notes
    lfo.connect(lfoGain).connect(car.detune);
    lfo.start(t);
    lfo.stop(stopAt);
  }
  car.start(t); mod.start(t);
  car.stop(stopAt); mod.stop(stopAt);
}

// Warm pad: two slightly detuned voices per note, filtered and slow to fade in and out.
function pad(t, ms, len) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(700, t);
  filter.frequency.linearRampToValueAtTime(1300, t + len / 2);
  filter.frequency.linearRampToValueAtTime(800, t + len);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(0.045, t + 0.9);
  amp.gain.setValueAtTime(0.045, t + len - 0.2);
  amp.gain.linearRampToValueAtTime(0.0001, t + len + 1.2); // overlaps the next chord
  filter.connect(amp).connect(master);
  for (const m of ms) {
    for (const detune of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.value = detune;
      o.connect(filter);
      o.start(t);
      o.stop(t + len + 1.3);
    }
  }
}

function noiseHit(t, { type, freq, q = 1, level, decay }) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(level, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(filter).connect(amp).connect(master);
  src.start(t);
  src.stop(t + decay + 0.02);
}

function kick(t) {
  const o = ctx.createOscillator();
  const amp = ctx.createGain();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  amp.gain.setValueAtTime(0.38, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(amp).connect(master);
  o.start(t);
  o.stop(t + 0.32);
}

function playStep(i, t) {
  if (i % 2 === 1) t += SWING;
  for (const e of TIMELINE[i]) {
    switch (e.v) {
      case 'pad': pad(t, e.ms, e.len * STEP); break;
      case 'lead':
        // Mellow, flute-like FM voice.
        fm(t, hz(e.m), e.len * STEP * 0.95, {
          ratio: 2, indexStart: 0.9, indexEnd: 0.3, indexTime: 0.4, level: 0.09,
          attack: 0.08, release: 0.5, out: [master, echoIn], vibrato: e.len >= 6 ? 8 : 0,
        });
        break;
      case 'keys':
        // Soft electric piano.
        fm(t, hz(e.m), STEP * 2, {
          ratio: 1, indexStart: 1.4, indexEnd: 0.15, indexTime: 0.5, level: 0.045,
          attack: 0.005, release: 0.6, out: [master, echoIn],
        });
        break;
      case 'bass':
        fm(t, hz(e.m), e.len * STEP * 0.9, {
          ratio: 1, indexStart: 1.2, indexEnd: 0.2, indexTime: 0.2, level: 0.22,
          attack: 0.02, release: 0.25, out: [master],
        });
        break;
      case 'kick': kick(t); break;
      case 'rim': noiseHit(t, { type: 'bandpass', freq: 2800, q: 6, level: 0.12, decay: 0.05 }); break;
      case 'hat': noiseHit(t, { type: 'highpass', freq: 8000, level: e.level, decay: 0.03 }); break;
      default: break;
    }
  }
}

/* ---------- Transport ---------- */
let timer = 0;
let nextTime = 0;
let stepIndex = 0;
let playing = false;
let pausedByHiding = false;
const listeners = new Set();

export const musicPlaying = () => playing;
export function onMusicChange(fn) { listeners.add(fn); }
const notify = () => listeners.forEach((fn) => fn(playing));

function tick() {
  // Schedule a little ahead so timing stays steady even if the page is busy.
  while (nextTime < ctx.currentTime + 0.15) {
    playStep(stepIndex, nextTime);
    nextTime += STEP;
    stepIndex = (stepIndex + 1) % TOTAL_STEPS;
  }
}

export function startMusic() {
  if (playing) return true;
  try {
    setupGraph();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1.5); // slow fade-in
    nextTime = ctx.currentTime + 0.08;
    stepIndex = 0;
    timer = setInterval(tick, 25);
    tick();
    playing = true;
    notify();
    return true;
  } catch {
    return false;
  }
}

export function stopMusic() {
  if (!playing) return;
  clearInterval(timer);
  playing = false;
  const g = master;
  if (g && ctx) {
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => g.disconnect(), 800);
  }
  notify();
}

// Pause when the visitor switches tabs; pick up again when they come back.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && playing) { pausedByHiding = true; stopMusic(); }
  else if (!document.hidden && pausedByHiding) { pausedByHiding = false; startMusic(); }
});
