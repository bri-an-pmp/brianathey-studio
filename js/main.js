import { tr, getLang, setLang, applyPage } from './i18n.js';
import { sfx, setSound, soundEnabled } from './sound.js';
import { startMusic, stopMusic, musicPlaying, onMusicChange } from './music.js';
import { startRain } from './rain.js';
import { startSpinners } from './spinners.js';
import { ALBUMS, photoSrc } from './albums.js';
import { openAlbum, refreshGallery } from './gallery.js';

const GITHUB_USER = 'bri-an-pmp';
// Repositories to leave out of the Code section.
const HIDDEN_REPOS = ['Agile-Bud'];

// Music players load only when the visitor asks (faster page, no tracking until then).
const EMBEDS = {
  'spotify-solo': {
    name: 'Spotify',
    src: 'https://open.spotify.com/embed/artist/2guWNPvgF5ltdCS2ia94FI?theme=0',
    height: 352,
  },
  'spotify-band': {
    name: 'Spotify',
    src: 'https://open.spotify.com/embed/artist/1dkXeNw0SlSWuEIjlAeQAf?theme=0',
    height: 352,
  },
  apple: {
    name: 'Apple Music',
    src: 'https://embed.music.apple.com/us/album/1008-w-25th-st/1570236871',
    height: 450,
    sandbox: 'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation',
  },
  youtube: {
    name: 'YouTube',
    src: 'https://www.youtube-nocookie.com/embed/videoseries?list=OLAK5uy_nm7WH1wzca9GumA-9pk5EoQIsvH75X6fM',
    height: 315,
  },
  amazon: {
    name: 'Amazon Music',
    src: 'https://music.amazon.com/embed/B096DX88Z7',
    height: 352,
  },
  // Pandora doesn't allow its player inside other sites, so this tile links out.
  pandora: {
    name: 'Pandora',
    link: 'https://www.pandora.com/AL:10506770',
  },
  tidal: {
    name: 'TIDAL',
    src: 'https://embed.tidal.com/albums/186270151',
    height: 352,
  },
  deezer: {
    name: 'Deezer',
    src: 'https://widget.deezer.com/widget/dark/album/234173262',
    height: 352,
  },
  // Red Sun (Smoke Sale)
  'apple-band': {
    name: 'Apple Music',
    src: 'https://embed.music.apple.com/us/album/smoke-sale/1524150287',
    height: 450,
    sandbox: 'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation',
  },
  'amazon-band': {
    name: 'Amazon Music',
    src: 'https://music.amazon.com/embed/B08D8BC8Z5',
    height: 352,
  },
  'pandora-band': {
    name: 'Pandora',
    link: 'https://www.pandora.com/AL:6130021',
  },
  soundcloud: {
    name: 'SoundCloud',
    src: 'https://w.soundcloud.com/player/?url=' + encodeURIComponent('https://soundcloud.com/user-473502514') +
      '&color=%23ff4058&auto_play=false&hide_related=true&show_comments=false&show_reposts=false&visual=false',
    height: 400,
  },
};

// Shown if the GitHub API can't be reached (it limits visitors to 60 requests an hour).
const FALLBACK_REPOS = [
  { name: 'the-morning-frequency', description: 'Ambient journaling app: write a paragraph, press Enter twice, hear choir-and-organ music for its mood.', language: 'JavaScript' },
  { name: 'Brian-AI-Agent-Career', description: '', language: 'Python' },
  { name: 'claude-skills', description: 'A collection of Claude skills.', language: 'JavaScript' },
  { name: 'twilioquest-extension-template', description: 'TwilioQuest mission: the Notary Confi appointment-confirmation workflow (mock scenario).', language: 'JavaScript' },
];

const PHOTO_PLACEHOLDERS = 6;

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

/* ---------- Sound effects ---------- */
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

/* ---------- Soundtrack ---------- */
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

/* ---------- Archive terminal ---------- */
// Values "type" in one after another (the full text is always there for screen readers).
let typeRun = 0;
function typeArchive() {
  const run = ++typeRun; // a newer run (e.g. after a language switch) cancels this one
  const fields = [...document.querySelectorAll('.archive .type')];
  const texts = fields.map((el) => (el.dataset.textKey ? tr(el.dataset.textKey) : el.dataset.text));
  if (reducedMotion()) { fields.forEach((el, i) => { el.textContent = texts[i]; }); return; }
  fields.forEach((el) => { el.textContent = ''; el.classList.remove('typing'); });
  let field = 0;
  let char = 0;
  const step = () => {
    if (run !== typeRun || field >= fields.length) return;
    const el = fields[field];
    el.classList.add('typing');
    char += 1;
    el.textContent = texts[field].slice(0, char);
    if (char >= texts[field].length) {
      el.classList.remove('typing');
      field += 1;
      char = 0;
      setTimeout(step, 280);
    } else {
      setTimeout(step, 45);
    }
  };
  setTimeout(step, 600);
}
// A slowly changing genetic-style sequence readout along the bottom.
const seq = document.getElementById('archive-seq');
const BASES = 'ACGT';
function tickSequence() {
  let line = '';
  for (let i = 0; i < 48; i++) line += i % 6 === 5 ? ' ' : BASES[Math.floor(Math.random() * 4)];
  seq.textContent = line;
}
tickSequence();
if (!reducedMotion()) setInterval(tickSequence, 900);

/* ---------- Dust: the amber view fades in as the Code section arrives ---------- */
const codeSection = document.getElementById('code');
function updateDust() {
  const vh = window.innerHeight;
  const top = codeSection.getBoundingClientRect().top;
  // 0 while Code is below the screen, 1 once its top reaches 20% from the top.
  const p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.8)));
  document.documentElement.style.setProperty('--dust', p.toFixed(3));
  document.documentElement.classList.toggle('dusty', p > 0.5);
}
window.addEventListener('scroll', updateDust, { passive: true }); // one cheap measurement per scroll
window.addEventListener('resize', updateDust);
updateDust();

/* ---------- Clock ---------- */
const clock = document.getElementById('clock');
function tickClock() {
  const now = new Date();
  clock.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0')).join(':');
  clock.dateTime = now.toISOString();
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- File transitions + navigation ---------- */
const access = document.getElementById('access');
const accessFile = document.getElementById('access-file');
const FILE_KEYS = { sound: 'fileSound', code: 'fileCode', memories: 'fileMemories', translation: 'fileTranslation', social: 'fileSocial' };
let accessTimer = 0;

function jumpTo(id, smooth) {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  history.replaceState(null, '', `#${id}`);
  section.querySelector('h2')?.focus({ preventScroll: true });
}

function openFile(id) {
  sfx('select');
  if (reducedMotion() || !FILE_KEYS[id]) { jumpTo(id, false); return; }
  accessFile.textContent = tr(FILE_KEYS[id]);
  access.classList.remove('show');
  void access.offsetWidth; // restart the animation
  access.classList.add('show');
  clearTimeout(accessTimer);
  setTimeout(() => jumpTo(id, false), 550); // jump while the screen is covered
  accessTimer = setTimeout(() => access.classList.remove('show'), 1400);
}

document.querySelectorAll('[data-file]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openFile(link.dataset.file);
  });
});

document.getElementById('enter').addEventListener('click', () => {
  sfx('start');
  jumpTo('index', !reducedMotion());
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
      if (embed.sandbox) frame.setAttribute('sandbox', embed.sandbox);
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
  grid.replaceChildren(...repos.map((r, i) => {
    const li = document.createElement('li');
    li.className = 'repo';
    const id = document.createElement('span');
    id.className = 'repo-id';
    id.textContent = `REC-${String(i + 1).padStart(3, '0')}`;
    id.setAttribute('aria-hidden', 'true');
    const h = document.createElement('h4');
    const a = document.createElement('a');
    a.href = `https://github.com/${GITHUB_USER}/${encodeURIComponent(r.name)}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = r.name.replace(/[-_]/g, ' ');
    h.appendChild(a);
    const p = document.createElement('p');
    p.textContent = r.description || tr('noDescription');
    const meta = document.createElement('div');
    meta.className = 'repo-meta';
    if (r.language) {
      const lang = document.createElement('span');
      lang.className = 'repo-lang';
      lang.textContent = r.language;
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
    li.append(id, h, p, meta);
    return li;
  }));
}

/* ---------- Photo collections ---------- */
function renderPhotos() {
  const grid = document.getElementById('photo-grid');
  const lang = getLang();
  const tiles = ALBUMS.map((album, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'album-tile';
    const cover = document.createElement('span');
    cover.className = 'album-cover';
    // Stack of preview photos that slowly cross-fade (see cyclePreviews).
    const picks = (album.preview || [album.cover]).map((n) => n - 1).filter((n) => album.photos[n]);
    picks.forEach((c, k) => {
      const im = document.createElement('img');
      im.src = photoSrc(album, c, true);
      im.width = album.photos[c].tw;
      im.height = album.photos[c].th;
      im.alt = '';
      im.loading = 'lazy';
      if (k === 0) im.classList.add('on');
      cover.append(im);
    });
    const meta = document.createElement('span');
    meta.className = 'album-meta';
    const label = document.createElement('span');
    label.className = 'readout';
    label.textContent = `${tr('collection')} ${String(i + 1).padStart(2, '0')} · ${tr('photoCount', { n: album.photos.length })}`;
    const title = document.createElement('span');
    title.className = 'album-title';
    title.textContent = album.title[lang] || album.title.en;
    const sub = document.createElement('span');
    sub.className = 'album-sub';
    sub.textContent = album.subtitle[lang] || album.subtitle.en;
    const open = document.createElement('span');
    open.className = 'album-open';
    open.textContent = `${tr('openGallery')} →`;
    meta.append(label, title, sub, open);
    btn.append(cover, meta);
    btn.addEventListener('click', () => { sfx('select'); openAlbum(album); });
    li.append(btn);
    return li;
  });
  const pending = document.createElement('li');
  pending.className = 'photo-slot';
  pending.textContent = tr('photoSoon');
  grid.replaceChildren(...tiles, pending);
}

// Each collection tile cycles through its preview photos every few seconds.
setInterval(() => {
  if (reducedMotion() || document.hidden) return;
  document.querySelectorAll('.album-cover').forEach((cover) => {
    const imgs = cover.querySelectorAll('img');
    if (imgs.length < 2) return;
    const cur = [...imgs].findIndex((im) => im.classList.contains('on'));
    imgs[cur]?.classList.remove('on');
    imgs[(cur + 1) % imgs.length].classList.add('on');
  });
}, 3800);

/* ---------- Start ---------- */
function refreshAll() {
  applyPage();
  typeArchive();
  refreshLangButton();
  refreshSoundButton();
  refreshMusicButtons();
  renderPlayers();
  renderRepos();
  renderPhotos();
  refreshGallery();
}

document.getElementById('year').textContent = String(new Date().getFullYear());
refreshAll();
loadRepos();
if (!reducedMotion()) startRain(document.getElementById('rain'));
startSpinners(document.getElementById('spinners'), { still: reducedMotion() });
