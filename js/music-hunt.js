// "Hunt": an original jungle-action soundtrack for the Alien theme, played live in the browser.
// Tribal log drums and hand drums in a stalking 7/8, military snare rolls, grinding low strings,
// tense brass stabs, a dark drone, an eerie whistle and dry clicks. No audio files.
import { audioCtx } from './sound.js?v=20261026164508';

const BPM = 104;
const STEP = 60 / BPM / 4; // one sixteenth note
const BAR = 14; // 7/8: grouped 3 + 2 + 2 eighths (accents on 0, 6 and 10)
const BARS = 8; // per section
const SECTIONS = ['stalk', 'chase', 'attack', 'breakdown'];
const LEVELS = { stalk: 0.5, chase: 0.75, attack: 1, breakdown: 0.45 };
const TOTAL = BAR * BARS * SECTIONS.length;

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(name) {
  const [, letter, acc, oct] = /^([A-G])(#|b)?(\d)$/.exec(name);
  return 12 * (Number(oct) + 1) + NOTE[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

// Low-string ostinato: grinds between E and F, drops to the tritone on bars 4 and 8
const OSTINATO = ['E2', 'E2', 'F2', 'E2', 'G2', 'F2', 'E2'].map(midi);
const OSTINATO_TURN = ['E2', 'E2', 'F2', 'E2', 'Bb1', 'B1', 'E2'].map(midi);
// Brass stab clusters (a minor second inside each one keeps them tense)
const STAB_A = ['E3', 'B3', 'F4'].map(midi);
const STAB_B = ['D3', 'A3', 'Eb4'].map(midi);
const LOW_BRASS = ['E2', 'B2'].map(midi);

let ctx = null;
let master = null;
let level = null; // section dynamics: quiet stalking, full-force attack
let verb = null;
let noise = null;

function makeImpulse(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
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
  master = ctx.createGain();
  master.gain.value = 0;
  level = ctx.createGain();
  level.gain.value = 0.6;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.ratio.value = 2.5;
  comp.attack.value = 0.005;
  const shelf = ctx.createBiquadFilter();
  shelf.type = 'highshelf';
  shelf.frequency.value = 6000;
  shelf.gain.value = -4;
  master.connect(level).connect(shelf).connect(comp).connect(ctx.destination);
  // A humid, medium-sized space: shorter and drier than the Neon Noir reverb
  verb = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.buffer = makeImpulse(3.2);
  const verbOut = ctx.createGain();
  verbOut.gain.value = 0.5;
  verb.connect(conv).connect(verbOut).connect(master);
}

const send = (node, amount) => {
  const g = ctx.createGain();
  g.gain.value = amount;
  node.connect(g).connect(verb);
};

function noiseSource(t, len) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  src.start(t, Math.random() * 1.5);
  src.stop(t + len);
  return src;
}

/* ---------- Percussion ---------- */

// Deep log drum / taiko: a falling sine with a woody click
function logDrum(t, vel, deep = false) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(deep ? 95 : 130, t);
  o.frequency.exponentialRampToValueAtTime(deep ? 38 : 52, t + 0.28);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.55 * vel, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (deep ? 1.1 : 0.55));
  o.connect(g).connect(master);
  send(g, deep ? 0.6 : 0.25);
  o.start(t);
  o.stop(t + 1.2);
  const click = noiseSource(t, 0.04);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 1.4;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.25 * vel, t);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  click.connect(bp).connect(cg).connect(master);
}

// Hand drums answering each other: two pitches, panned apart
function handDrum(t, high, vel) {
  const o = ctx.createOscillator();
  const f = high ? 340 : 235;
  o.frequency.setValueAtTime(f * 1.25, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.22 * vel, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  const pan = ctx.createStereoPanner();
  pan.pan.value = high ? 0.45 : -0.45;
  o.connect(g).connect(pan).connect(master);
  send(pan, 0.2);
  o.start(t);
  o.stop(t + 0.22);
}

// Military snare: rattly noise over a short tone
function snare(t, vel) {
  const src = noiseSource(t, 0.16);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200;
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.26 * vel, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  src.connect(bp).connect(g).connect(master);
  send(g, 0.25);
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(210, t);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.06);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.12 * vel, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(og).connect(master);
  o.start(t);
  o.stop(t + 0.08);
}

function shaker(t, vel) {
  const src = noiseSource(t, 0.07);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05 * vel, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  src.connect(hp).connect(g).connect(master);
}

// Dry clicks in a quick burst, like something watching from the trees
function clicks(t) {
  const n = 3 + Math.floor(Math.random() * 3);
  const pan = ctx.createStereoPanner();
  pan.pan.value = Math.random() * 1.6 - 0.8;
  pan.connect(master);
  send(pan, 0.35);
  for (let i = 0; i < n; i++) {
    const at = t + i * (0.055 + Math.random() * 0.02);
    const src = noiseSource(at, 0.012);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600 + Math.random() * 900;
    bp.Q.value = 9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.5, at + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.011);
    src.connect(bp).connect(g).connect(pan);
  }
}

/* ---------- Pitched parts ---------- */

// Short, heavy low-string note (two detuned saws, closed filter)
function string(t, m, vel, len = STEP * 1.6) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400 * vel, t);
  lp.frequency.exponentialRampToValueAtTime(380, t + len);
  lp.Q.value = 3;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.09 * vel, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08);
  lp.connect(g).connect(master);
  send(g, 0.18);
  for (const [m2, d] of [[m, -7], [m, 7], [m + 12, 0]]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = hz(m2);
    o.detune.value = d;
    const og = ctx.createGain();
    og.gain.value = m2 === m ? 0.5 : 0.25;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + len + 0.1);
  }
}

// Tense, slightly distorted brass stab that swells, bites and falls away
function brass(t, ms, len, vel = 1) {
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(2.4 * ((i / 511.5) - 1));
  shaper.curve = curve;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(300, t);
  lp.frequency.exponentialRampToValueAtTime(2600, t + 0.09);
  lp.frequency.exponentialRampToValueAtTime(500, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.16 * vel, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  shaper.connect(lp).connect(g).connect(master);
  send(g, 0.4);
  for (const m of ms) {
    for (const d of [-10, 10]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(hz(m) * 0.985, t); // brass "lips" into the note
      o.frequency.exponentialRampToValueAtTime(hz(m), t + 0.06);
      o.detune.value = d;
      const og = ctx.createGain();
      og.gain.value = 0.22;
      o.connect(og).connect(shaper);
      o.start(t);
      o.stop(t + len + 0.05);
    }
  }
}

// Dark drone under everything: low E with a slowly breathing filter
function drone(t, len) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(90, t);
  lp.frequency.linearRampToValueAtTime(260, t + len / 2);
  lp.frequency.linearRampToValueAtTime(90, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.1, t + 2);
  g.gain.setValueAtTime(0.1, t + len - 1.5);
  g.gain.linearRampToValueAtTime(0.0001, t + len + 0.5);
  lp.connect(g).connect(master);
  send(g, 0.3);
  for (const [m, type, d] of [[midi('E1'), 'sine', 0], [midi('E2'), 'sawtooth', -5], [midi('B2'), 'sawtooth', 5]]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz(m);
    o.detune.value = d;
    o.connect(lp);
    o.start(t);
    o.stop(t + len + 0.6);
  }
}

// Eerie high whistle that glides down, with a nervous vibrato
function whistle(t, from, to, len) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(hz(from), t);
  o.frequency.exponentialRampToValueAtTime(hz(to), t + len * 0.8);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6.2;
  const depth = ctx.createGain();
  depth.gain.value = 18;
  lfo.connect(depth).connect(o.detune);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.028, t + 0.6);
  g.gain.setValueAtTime(0.028, t + len - 0.8);
  g.gain.linearRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(master);
  send(g, 0.9);
  o.start(t); lfo.start(t);
  o.stop(t + len + 0.1); lfo.stop(t + len + 0.1);
}

/* ---------- The arrangement ---------- */
function playStep(i, t) {
  const section = SECTIONS[Math.floor(i / (BAR * BARS))];
  const barInSection = Math.floor(i / BAR) % BARS;
  const s = i % BAR;
  const lastBar = barInSection === BARS - 1;
  const accent = s === 0 || s === 6 || s === 10;

  // Drone, section loudness and the section-opening boom
  if (barInSection === 0 && s === 0) {
    level.gain.cancelScheduledValues(t);
    level.gain.setValueAtTime(level.gain.value, t);
    level.gain.linearRampToValueAtTime(LEVELS[section], t + (section === 'attack' ? 0.05 : 1.5));
    drone(t, BAR * BARS * STEP);
    logDrum(t, 1, true);
    if (section === 'attack') brass(t, LOW_BRASS, 1.6, 1);
  }

  // Log drums: the 3+2+2 heartbeat, busier as the hunt closes in
  if (accent) logDrum(t, s === 0 ? 1 : 0.75);
  if (section !== 'stalk' && s === 3) logDrum(t, 0.4);
  if (section === 'attack' && (s === 12 || s === 13)) logDrum(t, 0.55);

  // Hand drums
  const hands = section === 'stalk' ? [8, 12] : section === 'breakdown' ? [2, 8, 12] : [2, 4, 8, 9, 12, 13];
  if (hands.includes(s)) handDrum(t, s % 4 === 0, 0.6 + Math.random() * 0.4);

  // Shaker on every other sixteenth once the chase starts
  if ((section === 'chase' || section === 'attack') && s % 2 === 1) shaker(t, s % 4 === 1 ? 1 : 0.6);

  // Snare: roll building into the next section, plus backbeats in the attack
  if ((section === 'chase' || section === 'attack') && lastBar && s >= 6) {
    const vel = 0.35 + (s - 6) * 0.09;
    snare(t, vel);
    snare(t + STEP / 2, vel * 0.85);
  } else if (section === 'attack' && (s === 6 || s === 10)) snare(t, 0.7);

  // Low strings on every eighth (the grinding ostinato)
  if ((section === 'chase' || section === 'attack') && s % 2 === 0) {
    const line = barInSection % 4 === 3 ? OSTINATO_TURN : OSTINATO;
    string(t, line[s / 2], accent ? 1 : 0.7);
  }
  if (section === 'breakdown' && barInSection >= 4 && s === 0) string(t, midi('E2'), 0.8, STEP * 10);

  // Brass stabs on the downbeats of the attack, answered low on the last accent
  if (section === 'attack' && s === 0 && barInSection % 2 === 0) brass(t, barInSection % 4 === 0 ? STAB_A : STAB_B, 0.75);
  if (section === 'attack' && s === 10 && barInSection % 2 === 1) brass(t, LOW_BRASS, 0.5, 0.8);

  // Eerie whistle and clicks when the jungle goes quiet
  if ((section === 'stalk' || section === 'breakdown') && s === 0 && barInSection % 4 === 1) {
    whistle(t, midi(barInSection === 1 ? 'E6' : 'B5'), midi(barInSection === 1 ? 'B5' : 'F5'), BAR * STEP * 1.8);
  }
  if ((section === 'stalk' || section === 'breakdown') && s === 7 && (barInSection === 2 || barInSection === 6)) clicks(t);
  if (section === 'attack' && s === 13 && barInSection === 3) clicks(t);
}

/* ---------- Transport ---------- */
let timer = 0;
let nextTime = 0;
let stepIndex = 0;

function tick() {
  if (ctx.state === 'suspended') ctx.resume();
  const ahead = document.hidden ? 2.5 : 0.3;
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
  while (nextTime < ctx.currentTime + ahead) {
    playStep(stepIndex, nextTime);
    nextTime += STEP;
    stepIndex = (stepIndex + 1) % TOTAL;
  }
}

export function startHunt() {
  try {
    setupGraph();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 1.5);
    nextTime = ctx.currentTime + 0.1;
    stepIndex = 0;
    timer = setInterval(tick, 40);
    tick();
    return true;
  } catch {
    return false;
  }
}

export function stopHunt() {
  clearInterval(timer);
  const g = master;
  if (g && ctx) {
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => g.disconnect(), 1700);
  }
}
