import { tr, getLang, setLang, applyPage } from './i18n.js?v=20261026165411';
import { sfx, setSound, soundEnabled } from './sound.js?v=20261026165411';
import { startMusic, stopMusic, musicPlaying, onMusicChange } from './music.js?v=20261026165411';
// Shared with the main site, so every theme shows the same projects, players and photos
import { GITHUB_USER, HIDDEN_REPOS, EMBEDS, REPO_TEXT, REPO_STORE, FALLBACK_REPOS } from '../../js/content.js?v=20261026165411';
import { ALBUMS, photoSrc } from '../../js/albums.js?v=20261026165411';

const status = document.getElementById('status');
const announce = (msg) => {
  status.textContent = '';
  requestAnimationFrame(() => { status.textContent = msg; });
};
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Language ---------- */
const langBtn = document.getElementById('lang-toggle');
function refreshLangButton() {
  langBtn.textContent = tr('langButton');
  langBtn.lang = getLang() === 'en' ? 'es' : 'en';
  langBtn.setAttribute('aria-label', tr('langButtonLabel'));
}
langBtn.addEventListener('click', () => {
  setLang(getLang() === 'en' ? 'es' : 'en');
  refreshAll();
  sfx('select');
});

/* ---------- Sound ---------- */
const soundBtn = document.getElementById('sound-toggle');
function refreshSoundButton() {
  const on = soundEnabled();
  soundBtn.setAttribute('aria-pressed', String(on));
  const label = soundBtn.querySelector('.sound-label');
  label.dataset.i18n = on ? 'soundOn' : 'soundOff';
  label.textContent = tr(label.dataset.i18n);
}
soundBtn.addEventListener('click', () => {
  setSound(!soundEnabled());
  refreshSoundButton();
  announce(tr(soundEnabled() ? 'soundOnStatus' : 'soundOffStatus'));
  sfx('select');
});

/* ---------- Theme music ---------- */
const musicBtn = document.getElementById('music-toggle');
const themeBtn = document.getElementById('theme-play');
function refreshMusicButtons() {
  const on = musicPlaying();
  musicBtn.setAttribute('aria-pressed', String(on));
  const label = musicBtn.querySelector('.music-label');
  label.dataset.i18n = on ? 'musicOn' : 'musicOff';
  label.textContent = tr(label.dataset.i18n);
  themeBtn.setAttribute('aria-pressed', String(on));
  const themeLabel = document.getElementById('theme-play-label');
  themeLabel.dataset.i18n = on ? 'stopTheme' : 'playTheme';
  themeLabel.textContent = tr(themeLabel.dataset.i18n);
}
function toggleMusic() {
  if (musicPlaying()) {
    stopMusic();
    announce(tr('musicOffStatus'));
  } else if (startMusic()) {
    announce(tr('musicOnStatus'));
  } else {
    announce(tr('musicError'));
  }
}
musicBtn.addEventListener('click', toggleMusic);
themeBtn.addEventListener('click', toggleMusic);
onMusicChange(refreshMusicButtons);

/* ---------- HUD timer ---------- */
const timeEl = document.getElementById('hud-time');
const started = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now() - started) / 1000);
  timeEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}, 1000);

/* ---------- Gold records ---------- */
const RECORD_SPOTS = [
  [8, 30], [16, 22], [24, 30], [76, 28], [84, 20], [92, 28], [12, 62], [88, 60],
];
const recordsEl = document.getElementById('title-records');
const recordCount = document.getElementById('hud-records');
let collected = 0;
RECORD_SPOTS.forEach(([x, y]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'record';
  b.style.left = `calc(${x}% - 22px)`;
  b.style.top = `${y}%`;
  b.dataset.i18nLabel = 'collectLabel';
  b.setAttribute('aria-label', tr('collectLabel'));
  b.addEventListener('click', () => {
    if (b.classList.contains('collected')) return;
    b.classList.add('collected');
    collected += 1;
    recordCount.textContent = String(collected);
    sfx('record');
    announce(collected === RECORD_SPOTS.length
      ? tr('allCollected')
      : tr('collected', { n: collected, total: RECORD_SPOTS.length }));
    // Remove from tab order once picked up.
    setTimeout(() => { b.hidden = true; }, 500);
  });
  recordsEl.appendChild(b);
});

/* ---------- Zone title card + navigation ---------- */
const card = document.getElementById('title-card');
const cardZone = document.getElementById('tc-zone');
const ZONE_KEYS = { career: 'zoneCareer', music: 'zoneMusic', code: 'zoneCode', photo: 'zonePhoto', translation: 'zoneTranslation', social: 'zoneSocial' };
let cardTimer = 0;

function goTo(id) {
  const section = document.getElementById(id);
  if (!section) return;
  const heading = section.querySelector('h2');
  section.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' });
  history.replaceState(null, '', `#${id}`);
  heading?.focus({ preventScroll: true });
}

function enterZone(zone) {
  sfx('select');
  if (reducedMotion() || !ZONE_KEYS[zone]) { goTo(zone); return; }
  cardZone.textContent = tr(ZONE_KEYS[zone]);
  card.classList.remove('show');
  void card.offsetWidth; // restart the animation
  card.classList.add('show');
  clearTimeout(cardTimer);
  // Jump while the card covers the screen, then let it slide away.
  setTimeout(() => {
    const section = document.getElementById(zone);
    section?.scrollIntoView({ behavior: 'instant' });
    history.replaceState(null, '', `#${zone}`);
    section?.querySelector('h2')?.focus({ preventScroll: true });
  }, 500);
  cardTimer = setTimeout(() => card.classList.remove('show'), 1700);
}

document.querySelectorAll('[data-zone]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    enterZone(link.dataset.zone);
  });
});

document.getElementById('press-start').addEventListener('click', () => {
  sfx('start');
  goTo('zones');
});

/* ---------- Music players ---------- */
function renderPlayers() {
  document.querySelectorAll('.player-slot').forEach((slot) => {
    if (slot.querySelector('iframe')) return;
    const embed = EMBEDS[slot.dataset.embed];
    if (!embed) return;
    if (embed.link) {
      const a = document.createElement('a');
      a.className = 'load-btn';
      a.href = embed.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `${tr('listenOn')} ${embed.name} ↗`;
      slot.replaceChildren(a);
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'load-btn';
    btn.textContent = tr('loadPlayer');
    btn.setAttribute('aria-label', tr('loadPlayerLabel', { name: embed.name }));
    btn.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = embed.src;
      frame.height = String(embed.height);
      frame.title = `${embed.name} player`;
      frame.loading = 'lazy';
      frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      frame.setAttribute('sandbox', embed.sandbox || 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      slot.replaceChildren(frame);
      sfx('select');
      announce(tr('playerLoaded', { name: embed.name }));
    });
    slot.replaceChildren(btn);
  });
}

/* ---------- GitHub projects ---------- */
let repos = null;
let reposFailed = false;

// A project's live site from its GitHub "Website" field; only plain https links are used
function liveLink(url) {
  if (typeof url !== 'string') return '';
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

async function loadRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Unexpected reply');
    repos = data
      .filter((r) => r && !r.fork && typeof r.name === 'string' && !HIDDEN_REPOS.includes(r.name))
      .slice(0, 12)
      .map((r) => ({
        name: r.name,
        description: typeof r.description === 'string' ? r.description : '',
        language: typeof r.language === 'string' ? r.language : '',
        stars: Number.isFinite(r.stargazers_count) ? r.stargazers_count : 0,
        pushed: typeof r.pushed_at === 'string' ? r.pushed_at : '',
        homepage: liveLink(r.homepage),
      }));
    if (!repos.length) throw new Error('No repos');
  } catch {
    repos = FALLBACK_REPOS;
    reposFailed = true;
  }
  renderRepos();
}

function renderRepos() {
  const grid = document.getElementById('repo-grid');
  const line = document.getElementById('repo-status');
  if (!repos) return;
  if (reposFailed) {
    line.dataset.i18n = 'reposError';
    line.textContent = tr('reposError');
  } else {
    line.hidden = true;
  }
  const fmt = new Intl.DateTimeFormat(getLang() === 'es' ? 'es-419' : 'en-US', { year: 'numeric', month: 'short' });
  grid.replaceChildren(...repos.map((r) => {
    const li = document.createElement('li');
    li.className = 'repo';
    const h = document.createElement('h4');
    const a = document.createElement('a');
    a.href = `https://github.com/${GITHUB_USER}/${encodeURIComponent(r.name)}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = r.name.replace(/[-_]/g, ' ');
    h.appendChild(a);
    const own = REPO_TEXT[r.name]?.[getLang()];
    const p = document.createElement('p');
    p.textContent = own?.text || r.description || tr('noDescription');
    let steps = null;
    if (own?.steps) {
      steps = document.createElement('ol');
      steps.className = 'repo-steps';
      for (const step of own.steps) {
        const li2 = document.createElement('li');
        li2.textContent = step;
        steps.append(li2);
      }
    }
    const links = document.createElement('div');
    links.className = 'repo-links';
    const linkTo = (href, text, label) => {
      const l = document.createElement('a');
      l.className = 'btn btn-small';
      l.href = href;
      l.target = '_blank';
      l.rel = 'noopener';
      l.textContent = `${text} ↗`;
      l.setAttribute('aria-label', label);
      links.append(l);
    };
    const name = r.name.replace(/[-_]/g, ' ');
    if (r.homepage) linkTo(r.homepage, tr('liveDemo'), tr('liveDemoLabel', { name }));
    if (Object.hasOwn(REPO_STORE, r.name)) linkTo(REPO_STORE[r.name], tr('appStore'), tr('appStoreLabel', { name }));
    const meta = document.createElement('div');
    meta.className = 'repo-meta';
    if (r.language) {
      const lang = document.createElement('span');
      lang.className = 'repo-lang';
      lang.textContent = `● ${r.language}`;
      meta.appendChild(lang);
    }
    if (r.stars) {
      const s = document.createElement('span');
      s.textContent = `★ ${r.stars} ${tr(r.stars === 1 ? 'star' : 'stars')}`;
      meta.appendChild(s);
    }
    const when = r.pushed ? new Date(r.pushed) : null;
    if (when && !Number.isNaN(when.getTime())) {
      const u = document.createElement('span');
      u.textContent = `${tr('updated')} ${fmt.format(when)}`;
      meta.appendChild(u);
    }
    li.append(...[h, p, steps, links.childElementCount ? links : null, meta].filter(Boolean));
    return li;
  }));
}

/* ---------- Photos: the same collections as the main site, with a pixel-style viewer ---------- */
const src = (album, i, thumb) => `../${photoSrc(album, i, thumb)}`;
const viewer = document.getElementById('viewer');
const viewerImg = document.getElementById('viewer-img');
let viewing = null, viewIndex = 0;

function renderPhotos() {
  const grid = document.getElementById('album-grid');
  grid.replaceChildren(...ALBUMS.map((album, n) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'album-tile';
    const lang = getLang();
    const img = document.createElement('img');
    const cover = (album.cover || 1) - 1;
    img.src = src(album, cover, true);
    img.alt = '';
    img.loading = 'lazy';
    img.width = album.photos[cover].tw;
    img.height = album.photos[cover].th;
    const label = document.createElement('span');
    label.className = 'album-label';
    const count = document.createElement('span');
    count.className = 'album-count';
    count.textContent = `${tr('collection')} ${String(n + 1).padStart(2, '0')} · ${tr('photoCount', { n: album.photos.length })}`;
    const title = document.createElement('span');
    title.className = 'album-title';
    title.textContent = album.title[lang];
    const sub = document.createElement('span');
    sub.className = 'album-sub';
    sub.textContent = album.subtitle[lang];
    label.append(count, title, sub);
    btn.append(img, label);
    btn.setAttribute('aria-label', `${tr('openGallery')}: ${album.title[lang]}`);
    btn.addEventListener('click', () => openViewer(album, 0));
    li.append(btn);
    return li;
  }));
}

function showPhoto() {
  const lang = getLang();
  const photo = viewing.photos[viewIndex];
  viewerImg.src = src(viewing, viewIndex, false);
  viewerImg.width = photo.w;
  viewerImg.height = photo.h;
  viewerImg.alt = photo[lang];
  document.getElementById('viewer-caption').textContent = photo[lang];
  document.getElementById('viewer-count').textContent = tr('slideOf', { n: viewIndex + 1, total: viewing.photos.length });
  document.getElementById('viewer-title').textContent = viewing.title[lang];
}

function openViewer(album, i) {
  viewing = album;
  viewIndex = i;
  showPhoto();
  viewer.showModal();
  sfx('select');
}
function step(d) {
  viewIndex = (viewIndex + d + viewing.photos.length) % viewing.photos.length;
  showPhoto();
}
document.getElementById('viewer-prev').addEventListener('click', () => step(-1));
document.getElementById('viewer-next').addEventListener('click', () => step(1));
document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});
viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
viewerImg.addEventListener('error', () => { document.getElementById('viewer-caption').textContent = tr('photoError'); });

/* ---------- Links that open a new tab: screen readers hear it ---------- */
function markNewTabs() {
  document.querySelectorAll('a[target="_blank"]').forEach((a) => {
    let note = a.querySelector(':scope > .new-tab');
    if (!note) {
      note = document.createElement('span');
      note.className = 'sr-only new-tab';
      a.append(note);
    }
    note.textContent = ` (${tr('newTab')})`;
  });
}

/* ---------- Start ---------- */
function refreshAll() {
  applyPage();
  refreshLangButton();
  refreshSoundButton();
  refreshMusicButtons();
  document.querySelectorAll('[data-i18n-label]').forEach((el) => {
    el.setAttribute('aria-label', tr(el.dataset.i18nLabel));
  });
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.alt = tr(el.dataset.i18nAlt); });
  document.querySelectorAll('.load-btn').forEach((b) => b.remove());
  renderPlayers();
  renderRepos();
  renderPhotos();
  if (viewer.open) showPhoto();
  markNewTabs();
}

document.getElementById('year').textContent = String(new Date().getFullYear());
refreshAll();
loadRepos().then(markNewTabs);
document.getElementById('github-link').href = `https://github.com/${encodeURIComponent(GITHUB_USER)}`;

/* ---------- Theme menu: back to the main site in Neon Noir or Alien ---------- */
const siteTheme = document.getElementById('theme-select');
siteTheme.value = 'zone';
siteTheme.addEventListener('change', () => {
  if (siteTheme.value === 'zone') return;
  try { localStorage.setItem('bas_theme', siteTheme.value); } catch { /* ignore */ }
  location.href = '../';
});
