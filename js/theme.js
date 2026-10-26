// Theme menu (top right): Neon Noir (default), Thermal (black-and-red machine HUD on this page) and
// 16-Bit Zone (a separate version of the site at /16-bit/). Remembered per browser.
import { tr } from './i18n.js?v=20261026151405';
import { sfx } from './sound.js?v=20261026151405';

const root = document.documentElement;
const select = document.getElementById('theme-select');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(pointer: fine)').matches;

/* ---------- Original glyphs ----------
   Each digit is a slanted spine with four marks, drawn as glowing bar segments:
   a long bar to the right is a 1 bit, a short bar to the left is a 0 bit (top = 8, bottom = 1).
   Drawn here, not taken from any font or film. */
const NS = 'http://www.w3.org/2000/svg';
function glyph(ch) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 10 18');
  svg.setAttribute('class', 'glyph');
  const bar = (d) => {
    const n = document.createElementNS(NS, 'path');
    n.setAttribute('d', d);
    n.setAttribute('class', 'tick');
    svg.append(n);
  };
  if (ch === ':') { bar('M4.2 6 h1.6'); bar('M4.2 12 h1.6'); return svg; }
  if (ch === '▲') { bar('M4 4 l2 -1'); bar('M1.5 13 l2 1'); bar('M6.5 14 l2 -1'); return svg; } // mark used in place of letters
  const d = Number(ch);
  if (!Number.isInteger(d)) return null;
  bar('M3.6 1.5 L6.4 16.5');
  [8, 4, 2, 1].forEach((bit, i) => {
    const y = 3.6 + i * 3.5, x = 3.6 + (y - 1.5) * (2.8 / 15);
    if (d & bit) bar(`M${(x + 1).toFixed(2)} ${y.toFixed(2)} l3.4 -1.3`);
    else bar(`M${(x - 3).toFixed(2)} ${(y + 0.6).toFixed(2)} l1.6 -0.6`);
  });
  if (d === 0) bar('M2.4 17.4 h5.2');
  return svg;
}

function glyphRow(text) {
  const row = document.createElement('span');
  row.className = 'glyphs';
  row.setAttribute('aria-hidden', 'true');
  for (const ch of text.replace(/[A-Za-z]+-?/g, '▲')) {
    const g = glyph(ch);
    if (g) row.append(g);
  }
  return row;
}

// Puts glyphs beside a label; the real text stays for screen readers and copy/paste
function glyphify(el) {
  if (!el || el.dataset.glyphText === el.textContent) return;
  el.dataset.glyphText = el.textContent;
  el.previousElementSibling?.classList?.contains('glyphs') && el.previousElementSibling.remove();
  el.classList.add('glyph-src');
  el.before(glyphRow(el.textContent));
}

const GLYPH_TARGETS = '.fc-num, .repo-id';
function glyphifyAll() {
  document.querySelectorAll(GLYPH_TARGETS).forEach(glyphify);
  glyphify(document.getElementById('clock'));
}
function unglyphifyAll() {
  document.querySelectorAll('.glyphs:not(.hud-cell .glyphs)').forEach((g) => g.remove());
  document.querySelectorAll('.glyph-src').forEach((el) => { el.classList.remove('glyph-src'); delete el.dataset.glyphText; });
}

// Clock ticks and GitHub cards arrive later: keep their glyphs current while Thermal is on
const watcher = new MutationObserver(() => { if (root.classList.contains('thermal')) glyphifyAll(); });

/* ---------- Targeting dots ---------- */
const reticle = document.querySelector('.hud-reticle');
let rx = -100, ry = -100, tx = -100, ty = -100, raf = 0;
function moveReticle() {
  rx += (tx - rx) * 0.25; ry += (ty - ry) * 0.25;
  reticle.style.transform = `translate(${rx}px, ${ry}px)`;
  raf = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.5 ? requestAnimationFrame(moveReticle) : 0;
}
function onPointer(e) {
  tx = e.clientX; ty = e.clientY;
  reticle.classList.toggle('locked', Boolean(e.target.closest?.('a, button, select, .repo, .file-card, input')));
  if (!raf) raf = requestAnimationFrame(moveReticle);
}

/* ---------- Wrist device: page depth, the section in view, and a ticking counter ---------- */
const cells = ['hud-depth', 'hud-section', 'hud-tick'].map((id) => document.getElementById(id));
const sections = [...document.querySelectorAll('main > section')];
const show = (cell, text) => cell.replaceChildren(glyphRow(text));
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  show(cells[0], String(Math.round((scrollY / Math.max(1, max)) * 100)).padStart(3, '0'));
  const current = sections.findLastIndex((sec) => sec.getBoundingClientRect().top < innerHeight * 0.4);
  show(cells[1], String(Math.max(0, current)).padStart(2, '0'));
}
let ticker = 0;
function tick() { show(cells[2], String(new Date().getSeconds()).padStart(2, '0')); }

/* ---------- Switching ---------- */
function setThermal(on) {
  root.classList.toggle('thermal', on);
  if (on) {
    glyphifyAll();
    watcher.observe(document.body, { subtree: true, childList: true, characterData: true });
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    tick();
    if (!reducedMotion()) ticker = setInterval(tick, 1000);
    if (finePointer() && !reducedMotion()) addEventListener('pointermove', onPointer, { passive: true });
  } else {
    watcher.disconnect();
    unglyphifyAll();
    removeEventListener('scroll', onScroll);
    removeEventListener('pointermove', onPointer);
    clearInterval(ticker);
  }
}

function save(theme) {
  try { localStorage.setItem('bas_theme', theme); } catch { /* ignore */ }
}

export function initTheme(announce) {
  let theme = 'noir';
  try { theme = localStorage.getItem('bas_theme') || 'noir'; } catch { /* ignore */ }
  if (theme === 'zone') theme = 'noir'; // the 16-Bit Zone is its own page; this page shows Neon Noir
  select.value = theme;
  setThermal(theme === 'thermal');
  select.addEventListener('change', () => {
    const next = select.value;
    if (next === 'zone') {
      save('zone');
      location.href = '16-bit/';
      return;
    }
    save(next);
    setThermal(next === 'thermal');
    if (next === 'thermal') sfx('hunt');
    announce(tr(next === 'thermal' ? 'themeThermalStatus' : 'themeNoirStatus'));
  });
}
