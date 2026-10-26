// "Haze": an original, slow neo-noir ambient soundtrack, played live in the browser.
// Deep drones, swelling vintage-synth brass, a gliding lead, distant metal and rain,
// all inside a large generated reverb. No audio files.
import { audioCtx } from './sound.js?v=20261026151617';

const STEP = 0.25; // seconds per step (sixteenth notes at 60 BPM)
const BLOCK = 64; // steps per chord (16 seconds)

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(name) {
  const [, letter, acc, oct] = /^([A-G])(#|b)?(\d)$/.exec(name);
  return 12 * (Number(oct) + 1) + NOTE[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

/* ---------- The piece (4 chords of 16 seconds, loops) ---------- */
const BLOCKS = [
  { // D minor (add 9)
    drone: 'D2',
    pads: [[0, ['D3', 'A3', 'E4', 'F4'], 64]],
    lead: [[16, 'A4', 12], [28, 'C5', 4], [32, 'D5', 22], [54, 'E5', 10]],
    metal: [40],
    pulse: [],
  },
  { // B-flat major 7
    drone: 'Bb1',
    pads: [[0, ['Bb2', 'F3', 'A3', 'D4'], 64]],
    lead: [[0, 'F5', 20], [20, 'E5', 4], [24, 'D5', 16], [40, 'C5', 8], [48, 'D5', 16]],
    metal: [],
    pulse: [0, 8, 16, 24, 32, 40, 48, 56],
  },
  { // G minor 9
    drone: 'G1',
    pads: [[0, ['G2', 'D3', 'Bb3', 'F4', 'A4'], 64]],
    lead: [[8, 'Bb4', 8], [16, 'D5', 8], [24, 'G5', 22], [46, 'F5', 8], [54, 'D5', 10]],
    metal: [20],
    pulse: [0, 8, 16, 24, 32, 40, 48, 56],
  },
  { // A suspended, resolving to A major
    drone: 'A1',
    pads: [[0, ['A2', 'E3', 'A3', 'D4', 'E4'], 32], [32, ['A2', 'E3', 'A3', 'C#4', 'E4'], 32]],
    lead: [[0, 'E5', 16], [16, 'C#5', 8], [24, 'E5', 8], [32, 'A4', 28]],
    metal: [],
    pulse: [32, 40, 48, 56],
    braam: [0, ['A1', 'E2', 'A2'], 32],
  },
];

// Melody and pads sound an octave lower than written, for a deeper, calmer tone.
// Pad notes that would drop into mud (below D2) stay up.
const OCTAVE_DOWN = -12;
const padNote = (m) => (m + OCTAVE_DOWN < 38 ? m : m + OCTAVE_DOWN);

const TOTAL_STEPS = BLOCKS.length * BLOCK;
const TIMELINE = Array.from({ length: TOTAL_STEPS }, () => []);
{
  const leadNotes = [];
  BLOCKS.forEach((b, i) => {
    const at = (s) => TIMELINE[i * BLOCK + s];
    at(0).push({ v: 'drone', m: midi(b.drone), len: BLOCK });
    b.pads.forEach(([s, notes, len]) => at(s).push({ v: 'pad', ms: notes.map((n) => padNote(midi(n))), len }));
    b.lead.forEach(([s, n, len]) => {
      const e = { v: 'lead', m: midi(n) + OCTAVE_DOWN, len };
      leadNotes.push(e);
      at(s).push(e);
    });
    b.metal.forEach((s) => at(s).push({ v: 'metal' }));
    b.pulse.forEach((s) => at(s).push({ v: 'pulse' }));
    if (b.braam) at(b.braam[0]).push({ v: 'braam', ms: b.braam[1].map(midi), len: b.braam[2] });
  });
  // Each lead note glides in from the one before it.
  leadNotes.forEach((e, i) => { e.from = leadNotes[(i - 1 + leadNotes.length) % leadNotes.length].m; });
}

/* ---------- Sound engine ---------- */
let ctx = null;
let master = null;
let verb = null;
let echo = null;
let rainSrc = null;
let noise = null;
let impulse = null;

function makeImpulse(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.4;
  }
  return buf;
}

function setupGraph() {
  ctx = audioCtx();
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  impulse = impulse || makeImpulse(9);

  master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 3;
  // Soften the top end of the whole mix for a warmer, more soothing tone.
  const shelf = ctx.createBiquadFilter();
  shelf.type = 'highshelf';
  shelf.frequency.value = 2500;
  shelf.gain.value = -9;
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 4200;
  warm.Q.value = 0.5;
  master.connect(shelf).connect(warm).connect(comp).connect(ctx.destination);

  // Huge reverb with a long tail.
  verb = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.buffer = impulse;
  const verbOut = ctx.createGain();
  verbOut.gain.value = 0.85;
  verb.connect(conv).connect(verbOut).connect(master);

  // Long echo that bounces left and right, darker on every repeat.
  echo = ctx.createGain();
  const echoOut = ctx.createGain();
  echoOut.gain.value = 0.9;
  echoOut.connect(master);
  echoOut.connect(verb);
  const sides = [-0.8, 0.8].map((pan, i) => {
    const delay = ctx.createDelay(2);
    delay.delayTime.value = i === 0 ? 0.75 : 1.125;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1200;
    const fb = ctx.createGain();
    fb.gain.value = 0.58;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    delay.connect(tone).connect(panner).connect(echoOut);
    tone.connect(fb);
    return { delay, fb };
  });
  echo.connect(sides[0].delay);
  sides[0].fb.connect(sides[1].delay); // left feeds right…
  sides[1].fb.connect(sides[0].delay); // …and right feeds back to left

  // Soft rain bed, always under the music.
  rainSrc = ctx.createBufferSource();
  rainSrc.buffer = noise;
  rainSrc.loop = true;
  const rainHp = ctx.createBiquadFilter();
  rainHp.type = 'highpass';
  rainHp.frequency.value = 600;
  const rainLp = ctx.createBiquadFilter();
  rainLp.type = 'lowpass';
  rainLp.frequency.value = 2800;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.02;
  rainSrc.connect(rainHp).connect(rainLp).connect(rainGain).connect(master);
  rainSrc.start();
}

function envelope(param, t, peak, attack, hold, release) {
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.setValueAtTime(peak, t + attack + hold);
  param.linearRampToValueAtTime(0.0001, t + attack + hold + release);
}

function drone(t, m, len) {
  const out = ctx.createGain();
  envelope(out.gain, t, 1, 3, Math.max(len - 3, 0.1), 4);
  out.connect(master);
  const droneVerb = ctx.createGain();
  droneVerb.gain.value = 0.5;
  out.connect(droneVerb).connect(verb);
  const sub = ctx.createOscillator();
  sub.frequency.value = hz(m);
  const subGain = ctx.createGain();
  subGain.gain.value = 0.16;
  sub.connect(subGain).connect(out);
  // Octave above, so phone speakers can hear it too.
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = hz(m + 12);
  saw.detune.value = 4;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(140, t);
  lp.frequency.linearRampToValueAtTime(320, t + len / 2);
  lp.frequency.linearRampToValueAtTime(140, t + len);
  const sawGain = ctx.createGain();
  sawGain.gain.value = 0.06;
  saw.connect(lp).connect(sawGain).connect(out);
  const stop = t + len + 4.2;
  sub.start(t); saw.start(t);
  sub.stop(stop); saw.stop(stop);
}

// Swelling brass pad in the style of a vintage polysynth: notes sag into pitch.
function pad(t, ms, len) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 2;
  lp.frequency.setValueAtTime(250, t);
  lp.frequency.linearRampToValueAtTime(1150, t + 4);
  lp.frequency.linearRampToValueAtTime(600, t + len);
  const out = ctx.createGain();
  envelope(out.gain, t, 0.022, 2.5, Math.max(len - 2.5, 0.1), 3.5);
  lp.connect(out);
  out.connect(master);
  out.connect(verb);
  const padEcho = ctx.createGain();
  padEcho.gain.value = 0.4;
  out.connect(padEcho).connect(echo);
  const stop = t + len + 3.7;
  for (const m of ms) {
    for (const d of [-9, 9]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.setValueAtTime(d - 28, t);
      o.detune.setTargetAtTime(d, t, 0.25);
      o.connect(lp);
      o.start(t);
      o.stop(stop);
    }
  }
}

// Lonely lead line that glides between notes, with slow vibrato.
function lead(t, m, from, len) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1050;
  lp.Q.value = 1.5;
  const out = ctx.createGain();
  envelope(out.gain, t, 0.05, 0.35, Math.max(len - 0.35, 0.1), 1.8);
  lp.connect(out);
  out.connect(master);
  out.connect(echo);
  out.connect(verb);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4.6;
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(14, t + 1.5);
  lfo.connect(depth);
  const stop = t + len + 2;
  for (const [type, gain] of [['sawtooth', 0.35], ['triangle', 1]]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(hz(from), t);
    o.frequency.exponentialRampToValueAtTime(hz(m), t + 0.22);
    depth.connect(o.detune);
    const g = ctx.createGain();
    g.gain.value = gain;
    o.connect(g).connect(lp);
    o.start(t);
    o.stop(stop);
  }
  lfo.start(t);
  lfo.stop(stop);
}

// One distant, distorted low brass blast per loop.
function braam(t, ms, len) {
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(3 * ((i / 511.5) - 1));
  shaper.curve = curve;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(120, t);
  lp.frequency.linearRampToValueAtTime(1100, t + 1.6);
  lp.frequency.exponentialRampToValueAtTime(160, t + len);
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(0.11, t + 0.8);
  out.gain.exponentialRampToValueAtTime(0.0001, t + len);
  shaper.connect(lp).connect(out);
  out.connect(master);
  out.connect(verb);
  out.connect(echo);
  for (const m of ms) {
    for (const d of [-8, 8]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.value = d;
      const g = ctx.createGain();
      g.gain.value = 0.3;
      o.connect(g).connect(shaper);
      o.start(t);
      o.stop(t + len + 0.1);
    }
  }
}

// Far-off metallic ring, mostly reverb.
function metal(t) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const base = 350 + Math.random() * 600;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.35, t);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
  for (const mult of [1, 2.76]) {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = base * mult;
    bp.Q.value = 30;
    src.connect(bp).connect(out);
  }
  out.connect(verb);
  src.start(t);
  src.stop(t + 2.6);
}

// Slow, soft low heartbeat.
function pulse(t) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(58, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.2, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g).connect(master);
  g.connect(verb);
  o.start(t);
  o.stop(t + 0.65);
}

function playStep(i, t) {
  for (const e of TIMELINE[i]) {
    switch (e.v) {
      case 'drone': drone(t, e.m, e.len * STEP); break;
      case 'pad': pad(t, e.ms, e.len * STEP); break;
      case 'lead': lead(t, e.m, e.from, e.len * STEP); break;
      case 'braam': braam(t, e.ms, e.len * STEP); break;
      case 'metal': metal(t); break;
      case 'pulse': pulse(t); break;
      default: break;
    }
  }
}

/* ---------- Transport ---------- */
let timer = 0;
let nextTime = 0;
let stepIndex = 0;
let playing = false;
const listeners = new Set();

export const musicPlaying = () => playing;
export function onMusicChange(fn) { listeners.add(fn); }
const notify = () => listeners.forEach((fn) => fn(playing));

function tick() {
  // Schedule ahead so the music never gaps. Browsers slow timers in background
  // tabs to about once a second, so look further ahead while the tab is hidden.
  if (ctx.state === 'suspended') ctx.resume();
  const ahead = document.hidden ? 2.5 : 0.4;
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05; // recover from a long stall
  while (nextTime < ctx.currentTime + ahead) {
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
    master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 3); // slow fade-in
    nextTime = ctx.currentTime + 0.1;
    stepIndex = 0;
    timer = setInterval(tick, 50);
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
  const rain = rainSrc;
  if (g && ctx) {
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setTimeout(() => {
      try { rain?.stop(); } catch { /* already stopped */ }
      g.disconnect();
    }, 2200);
  }
  notify();
}

// The soundtrack keeps playing and looping when the visitor switches tabs;
// it only stops when they press the button.
