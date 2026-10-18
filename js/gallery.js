// Full-screen photo gallery. Opens as a swipeable carousel with a filmstrip of
// thumbnails; "All photos" switches to a grid. Built on <dialog> for focus handling.
import { tr, getLang } from './i18n.js?v=20261018000723';
import { photoSrc } from './albums.js?v=20261018000723';

const dialog = document.getElementById('gallery');
const titleEl = document.getElementById('gallery-title');
const countEl = document.getElementById('gal-count');
const toggleBtn = document.getElementById('gal-toggle');
const grid = document.getElementById('gal-grid');
const viewer = document.getElementById('viewer');
const carousel = document.getElementById('carousel');
const track = document.getElementById('track');
const film = document.getElementById('filmstrip');
const posEl = document.getElementById('viewer-pos');
const capEl = document.getElementById('viewer-cap');
const status = document.getElementById('status');

let album = null;
let index = 0;
let announceTimer = 0;
let target = null; // photo we're scrolling to with the buttons, until we arrive
let targetTimer = 0;

const caption = (p) => p[getLang()] || p.en;
const pad = (n) => String(n).padStart(2, '0');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const announce = (msg) => { status.textContent = ''; requestAnimationFrame(() => { status.textContent = msg; }); };
const inGrid = () => !grid.hidden;

function thumbImg(i) {
  const p = album.photos[i];
  const t = document.createElement('img');
  t.src = photoSrc(album, i, true);
  t.width = p.tw;
  t.height = p.th;
  t.alt = '';
  t.loading = 'lazy';
  t.decoding = 'async';
  return t;
}

function build() {
  // Carousel slides (large photos load as they come near the screen).
  track.replaceChildren(...album.photos.map((p, i) => {
    const li = document.createElement('div');
    li.className = 'slide';
    li.setAttribute('role', 'group');
    li.setAttribute('aria-roledescription', 'slide');
    li.lang = 'es'; // captions are written in Spanish
    const im = document.createElement('img');
    im.src = photoSrc(album, i);
    im.width = p.w;
    im.height = p.h;
    im.alt = caption(p);
    im.loading = i < 2 ? 'eager' : 'lazy';
    im.decoding = 'async';
    im.addEventListener('error', () => announce(tr('photoError')), { once: true });
    li.append(im);
    return li;
  }));
  // Filmstrip under the carousel.
  film.replaceChildren(...album.photos.map((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'film-thumb';
    b.lang = 'es';
    b.append(thumbImg(i));
    b.addEventListener('click', () => goTo(i));
    li.append(b);
    return li;
  }));
  // Grid of every photo.
  grid.replaceChildren(...album.photos.map((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gal-thumb';
    b.lang = 'es';
    b.append(thumbImg(i));
    b.addEventListener('click', () => { showCarousel(); goTo(i, false); toggleBtn.focus(); });
    li.append(b);
    return li;
  }));
  carousel.setAttribute('aria-label', album.title[getLang()] || album.title.en);
}

function renderText() {
  if (!album) return;
  const n = album.photos.length;
  titleEl.textContent = album.title[getLang()] || album.title.en;
  titleEl.lang = 'es';
  countEl.textContent = tr('photoCount', { n });
  toggleBtn.textContent = inGrid() ? tr('toCarousel') : tr('backToGrid');
  document.getElementById('gal-close').setAttribute('aria-label', tr('closeGallery'));
  document.getElementById('viewer-prev').setAttribute('aria-label', tr('prevPhoto'));
  document.getElementById('viewer-next').setAttribute('aria-label', tr('nextPhoto'));
  album.photos.forEach((p, i) => {
    const label = `${caption(p)} (${tr('slideOf', { n: i + 1, total: n })})`;
    track.children[i]?.setAttribute('aria-label', tr('slideOf', { n: i + 1, total: n }));
    track.children[i]?.querySelector('img')?.setAttribute('alt', caption(p));
    film.children[i]?.firstChild.setAttribute('aria-label', label);
    grid.children[i]?.firstChild.setAttribute('aria-label', label);
  });
  updateCurrent(index, false);
}

// Show which photo is in view: caption, counter and the highlighted filmstrip thumb.
function updateCurrent(i, announceIt = true) {
  const n = album.photos.length;
  index = Math.max(0, Math.min(n - 1, i));
  const p = album.photos[index];
  posEl.textContent = `${tr('memory')} ${pad(index + 1)} / ${pad(n)}`;
  capEl.textContent = caption(p);
  capEl.lang = 'es';
  [...film.children].forEach((li, j) => {
    const b = li.firstChild;
    if (j === index) {
      b.setAttribute('aria-current', 'true');
      b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    } else {
      b.removeAttribute('aria-current');
    }
  });
  if (announceIt) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => announce(`${caption(p)}. ${tr('slideOf', { n: index + 1, total: n })}`), 350);
  }
}

function goTo(i, smooth = !reducedMotion()) {
  const n = album.photos.length;
  const wrapped = (i + n) % n;
  // Wrapping from last to first (or back) jumps instead of racing past every photo.
  const jump = Math.abs(wrapped - index) > 1;
  target = wrapped;
  clearTimeout(targetTimer);
  targetTimer = setTimeout(() => { target = null; }, 900);
  carousel.scrollTo({ left: wrapped * carousel.clientWidth, behavior: smooth && !jump ? 'smooth' : 'instant' });
  updateCurrent(wrapped);
}

let scrollFrame = 0;
carousel.addEventListener('scroll', () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    const w = Math.max(carousel.clientWidth, 1);
    // While a button-driven slide is animating, don't let the in-between positions change the counter.
    if (target !== null) {
      if (Math.abs(carousel.scrollLeft - target * w) < 2) target = null;
      return;
    }
    const i = Math.round(carousel.scrollLeft / w);
    if (i !== index) updateCurrent(i);
  });
});
// Keep the same photo in view when the window changes size or the phone rotates.
new ResizeObserver(() => {
  if (album && !viewer.hidden) carousel.scrollTo({ left: index * carousel.clientWidth, behavior: 'instant' });
}).observe(carousel);

function showCarousel() {
  grid.hidden = true;
  viewer.hidden = false;
  toggleBtn.textContent = tr('backToGrid');
}

function showGrid() {
  viewer.hidden = true;
  grid.hidden = false;
  toggleBtn.textContent = tr('toCarousel');
  grid.children[index]?.firstChild.focus();
}

export function openAlbum(a, start = 0) {
  album = a;
  index = start;
  build();
  showCarousel();
  renderText();
  document.documentElement.classList.add('gallery-open');
  dialog.showModal();
  requestAnimationFrame(() => {
    carousel.scrollTo({ left: start * carousel.clientWidth, behavior: 'instant' });
    updateCurrent(start);
    toggleBtn.focus(); // arrow keys still move the carousel from anywhere in the gallery
  });
}

export const refreshGallery = renderText;

document.getElementById('gal-close').addEventListener('click', () => {
  dialog.close();
  document.documentElement.classList.remove('gallery-open');
});
toggleBtn.addEventListener('click', () => {
  if (inGrid()) {
    showCarousel();
    goTo(index, false);
  } else {
    showGrid();
  }
});
document.getElementById('viewer-prev').addEventListener('click', () => goTo(index - 1));
document.getElementById('viewer-next').addEventListener('click', () => goTo(index + 1));
dialog.addEventListener('close', () => document.documentElement.classList.remove('gallery-open'));
dialog.addEventListener('keydown', (e) => {
  if (viewer.hidden) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
});
