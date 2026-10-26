// "Hunt": an original jungle-action score for the Alien theme, played live in the browser,
// in the style of an '80s action-thriller main title: a long stretch of suspense (low drone,
// string tremolo, deep ringing hits, a swelling timpani roll), then a driving military
// tom-and-snare march with low strings and brass punching back, a low-brass theme, and an
// all-out assault before it falls back into suspense. Original music: no film melodies are used.
import { audioCtx } from './sound.js?v=20261026165411';

const BPM = 100;
const STEP = 60 / BPM / 4; // one sixteenth note
const BAR = 16; // 4/4
const BARS = 8; // per section
const SECTIONS = ['suspense', 'march', 'theme', 'assault', 'breakdown'];
const LEVELS = { suspense: 0.42, march: 0.72, theme: 0.85, assault: 1, breakdown: 0.4 };
const TOTAL = BAR * BARS * SECTIONS.length;

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(name) {
  const [, letter, acc, oct] = /^([A-G])(#|b)?(\d)$/.exec(name);
  return 12 * (Number(oct) + 1) + NOTE[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

// The march: syncopated toms (high, mid, low) with accents, over a steady military snare.
// [step, drum (0 high, 1 mid, 2 low), velocity]
const TOMS = [[0, 2, 1], [2, 2, 0.6], [3, 1, 0.8], [6, 2, 0.9], [8, 2, 1], [10, 1, 0.7], [11, 0, 0.8], [14, 2, 0.9], [15, 1, 0.6]];
const TOMS_FILL = [[0, 2, 1], [4, 2, 0.9], [8, 1, 0.9], [9, 1, 0.7], [10, 0, 0.8], [11, 0, 0.8], [12, 1, 0.9], [13, 1, 0.9], [14, 2, 1], [15, 2, 1]];
const SNARE = [[4, 0.8], [12, 0.85], [7, 0.3], [13, 0.35], [15, 0.3]];
// Low strings punch on the off-beats the toms leave open
const STRING_HITS = [[0, 'E2', 1], [3, 'E2', 0.7], [6, 'G2', 0.8], [8, 'E2', 1], [11, 'F2', 0.8], [14, 'E2', 0.8]];
// Brass answers on the syncopations
const BRASS_HITS = [[3, ['E3', 'B3']], [11, ['F3', 'C4']]];
// The low-brass theme (original): a falling, menacing line over four bars
const THEME = [
  [[0, 'E3', 6], [6, 'G3', 4], [10, 'F#3', 6]],
  [[0, 'E3', 10], [12, 'B2', 4]],
  [[0, 'E3', 6], [6, 'A3', 4], [10, 'G3', 6]],
  [[0, 'F3', 8], [8, 'E3', 8]],
];
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
  // A fast limiter last, so no pile-up of drums and brass can ever distort
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -4;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.12;
  const trim = ctx.createGain();
  trim.gain.value = 0.85;
  master.connect(level).connect(shelf).connect(comp).connect(limiter).connect(trim).connect(ctx.destination);
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

/* ---------- Orchestral percussion and suspense ---------- */

// Concert toms: three pitches, a punchy attack and a short ring
function tom(t, drum, vel) {
  const f = [220, 150, 98][drum];
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(f * 1.6, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.42 * vel, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  const pan = ctx.createStereoPanner();
  pan.pan.value = [-0.35, 0, 0.35][drum];
  o.connect(g).connect(pan).connect(master);
  send(pan, 0.3);
  o.start(t);
  o.stop(t + 0.4);
  const skin = noiseSource(t, 0.05);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = f * 6;
  bp.Q.value = 1;
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0.18 * vel, t);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  skin.connect(bp).connect(sg).connect(pan);
}

// Timpani: a tuned low boom that rings
function timpani(t, m, vel, ring = 2.2) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  g.connect(master);
  send(g, 0.55);
  for (const [mult, amp] of [[1, 1], [1.5, 0.35], [1.98, 0.2]]) {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(hz(m) * mult * 1.03, t);
    o.frequency.exponentialRampToValueAtTime(hz(m) * mult, t + 0.12);
    const og = ctx.createGain();
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + ring + 0.1);
  }
}

// A timpani roll that swells, leading into the next section
function timpaniRoll(t, len, m) {
  const hits = Math.floor(len / 0.055);
  for (let i = 0; i < hits; i++) timpani(t + i * 0.055, m, 0.05 + (i / hits) * 0.25, i === hits - 1 ? 2.2 : 0.18);
}

// String tremolo: bowed fast, swelling in and out (the sound of something coming)
function tremolo(t, ms, len, peak) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.linearRampToValueAtTime(1600, t + len * 0.8);
  const shake = ctx.createGain();
  shake.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 13;
  const depth = ctx.createGain();
  depth.gain.value = 0.5;
  lfo.connect(depth).connect(shake.gain);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + len * 0.85);
  g.gain.linearRampToValueAtTime(0.0001, t + len);
  lp.connect(shake).connect(g).connect(master);
  send(g, 0.5);
  for (const m of ms) {
    for (const d of [-9, 9]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.value = d;
      o.connect(lp);
      o.start(t);
      o.stop(t + len + 0.05);
    }
  }
  lfo.start(t);
  lfo.stop(t + len + 0.05);
}

// A deep, ringing low note, like the bottom of a piano struck hard
function lowHit(t, m) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
  g.connect(master);
  send(g, 0.8);
  for (const [mult, type, amp] of [[1, 'triangle', 1], [2, 'sine', 0.4], [3.01, 'sine', 0.15]]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz(m) * mult;
    const og = ctx.createGain();
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + 4.1);
  }
}

// Cymbal swell into a downbeat
function cymbalSwell(t, len) {
  const src = noiseSource(t, len + 0.1);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(3000, t);
  hp.frequency.linearRampToValueAtTime(7000, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + len);
  g.gain.linearRampToValueAtTime(0.0001, t + len + 0.05);
  src.connect(hp).connect(g).connect(master);
  send(g, 0.4);
}

/* ---------- The arrangement ---------- */
function playStep(i, t) {
  const section = SECTIONS[Math.floor(i / (BAR * BARS))];
  const bar = Math.floor(i / BAR) % BARS;
  const s = i % BAR;
  const lastBar = bar === BARS - 1;
  const drive = section === 'march' || section === 'theme' || section === 'assault';

  // Section loudness, the drone, and a big hit at the start of every driving section
  if (bar === 0 && s === 0) {
    level.gain.cancelScheduledValues(t);
    level.gain.setValueAtTime(level.gain.value, t);
    level.gain.linearRampToValueAtTime(LEVELS[section], t + (drive ? 0.05 : 2));
    drone(t, BAR * BARS * STEP);
    if (drive) { timpani(t, midi('E2'), 1); logDrum(t, 1, true); }
    if (section === 'assault') brass(t + STEP * 8, LOW_BRASS, 1.2, 0.8);
  }

  /* Suspense and breakdown: tremolo, ringing low hits, clicks, the whistle, a swelling roll */
  if (section === 'suspense' || section === 'breakdown') {
    if (s === 0 && bar % 2 === 0) lowHit(t, midi(bar % 4 === 0 ? 'E1' : 'F1'));
    if (s === 0 && bar === 0) tremolo(t, [midi('E2'), midi('B2')], BAR * STEP * 4, 0.05);
    if (s === 0 && bar === 4) tremolo(t, [midi('F2'), midi('B2'), midi('E3')], BAR * STEP * 3, 0.07);
    if (s === 8 && (bar === 1 || bar === 5)) logDrum(t, 0.5, true);
    if (s === 6 && (bar === 2 || bar === 5)) clicks(t);
    if (s === 0 && bar === 1) whistle(t, midi('E6'), midi('B5'), BAR * STEP * 1.6);
    if (section === 'suspense') {
      if (bar >= 6 && s === 0 && bar === 6) timpaniRoll(t, BAR * STEP * 2 - 0.1, midi('E2'));
      if (bar === 7 && s === 8) cymbalSwell(t, STEP * 8);
      if (bar >= 6 && s % 2 === 0) snare(t, 0.15 + ((bar - 6) * 16 + s) / 32 * 0.5);
    } else if (bar >= 4 && [0, 6, 10].includes(s)) {
      handDrum(t, s === 6, 0.5); // a lone heartbeat before the loop starts over
    }
    return;
  }

  /* The march, the theme and the assault */
  const pattern = lastBar ? TOMS_FILL : TOMS;
  for (const [at, drum, vel] of pattern) if (at === s) tom(t, drum, vel);
  for (const [at, vel] of SNARE) if (at === s) snare(t, vel);
  if (lastBar && s >= 8) { snare(t, 0.4 + (s - 8) * 0.07); snare(t + STEP / 2, 0.35 + (s - 8) * 0.07); }
  if (lastBar && s === 8 && section !== 'assault') cymbalSwell(t, STEP * 8);
  if (s === 0 && bar % 4 === 0) timpani(t, midi('E2'), 0.9);
  if (s % 2 === 1) shaker(t, s % 4 === 1 ? 0.8 : 0.5);
  if ([2, 10].includes(s) && section !== 'march') handDrum(t, s === 10, 0.7);

  for (const [at, n, vel] of STRING_HITS) if (at === s) string(t, midi(n), vel);

  if (section !== 'march' || bar >= 4) {
    for (const [at, ns] of BRASS_HITS) if (at === s && bar % 2 === 1) brass(t, ns.map(midi), 0.35, 0.7);
  }
  if (section === 'theme' || section === 'assault') {
    const phrase = THEME[bar % 4];
    for (const [at, n, len] of phrase) if (at === s) brass(t, [midi(n), midi(n) - 12], len * STEP + 0.25, 1);
  }
  if (section === 'assault') {
    if (s === 0 && bar > 0) brass(t, bar % 2 === 0 ? STAB_A : STAB_B, 0.6, 0.8);
    if (s === 8) logDrum(t, 0.8, true);
  }
  if (s === 14 && bar === 3) clicks(t);
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
