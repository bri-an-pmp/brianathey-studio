// Theme menu (top right): Neon Noir (default), Thermal (heat vision on this page) and
// 16-Bit Zone (a separate version of the site at /16-bit/). Remembered per browser.
import { tr } from './i18n.js?v=20261026145436';
import { sfx } from './sound.js?v=20261026145436';

const root = document.documentElement;
const select = document.getElementById('theme-select');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(pointer: fine)').matches;

/* ---------- Original glyphs ----------
   Each digit is a slanted spine with four marks; a mark on the right is a 1 bit,
   a dot on the left is a 0 bit (top = 8, bottom = 1). Drawn here, not from any font. */
const NS = 'http://www.w3.org/2000/svg';
function glyph(ch) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 10 18');
  svg.setAttribute('class', 'glyph');
  const add = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    svg.append(n);
  };
  if (ch === ':') {
    add('circle', { cx: 5, cy: 6, r: 1.2 });
    add('circle', { cx: 5, cy: 12, r: 1.2 });
    return svg;
  }
  if (ch === '▲') { // three-dot mark used in place of letters
    add('circle', { cx: 5, cy: 4, r: 1.5 }); add('circle', { cx: 2.2, cy: 13, r: 1.5 }); add('circle', { cx: 7.8, cy: 13, r: 1.5 });
    return svg;
  }
  const d = Number(ch);
  if (!Number.isInteger(d)) return null;
  add('path', { d: 'M3.5 1 L6.5 17', class: 'spine' });
  [8, 4, 2, 1].forEach((bit, i) => {
    const y = 3.5 + i * 3.6, x = 3.5 + (y - 1) * (3 / 16);
    if (d & bit) add('path', { d: `M${x} ${y} l3.6 -1.6`, class: 'tick' });
    else add('circle', { cx: x - 1.8, cy: y, r: 0.9 });
  });
  if (d === 0) add('path', { d: 'M2 17 h6', class: 'tick' });
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
  document.querySelectorAll('.glyphs:not(#hud-depth .glyphs)').forEach((g) => g.remove());
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

/* ---------- Wrist readout: how far down the page you are ---------- */
const depth = document.getElementById('hud-depth');
const heat = document.getElementById('hud-heat-bar');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const pct = Math.round((scrollY / Math.max(1, max)) * 100);
  depth.replaceChildren(glyphRow(String(pct).padStart(3, '0')));
  heat.style.width = `${pct}%`;
}

/* ---------- Switching ---------- */
function setThermal(on) {
  root.classList.toggle('thermal', on);
  if (on) {
    glyphifyAll();
    watcher.observe(document.body, { subtree: true, childList: true, characterData: true });
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (finePointer() && !reducedMotion()) addEventListener('pointermove', onPointer, { passive: true });
  } else {
    watcher.disconnect();
    unglyphifyAll();
    removeEventListener('scroll', onScroll);
    removeEventListener('pointermove', onPointer);
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
