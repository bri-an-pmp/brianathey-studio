// English and Spanish text. Page elements use data-i18n="key".
export const T = {
  en: {
    skip: 'Skip to main content',
    siteTheme: 'Theme',
    themeNoir: 'Neon Noir',
    themeAlien: 'Alien',
    themeZone: '16-Bit Zone',
    hudTime: 'TIME',
    hudRecords: 'RECORDS',
    langButton: 'Español',
    langButtonLabel: 'Ver el sitio en español',
    soundOff: 'Effects off',
    soundOn: 'Effects on',
    musicOff: 'Music off',
    musicOn: 'Music on',
    playTheme: 'Play theme music',
    stopTheme: 'Stop theme music',
    musicOnStatus: 'Theme music playing.',
    musicOffStatus: 'Theme music stopped.',
    musicError: 'The music couldn’t start in this browser. Try another browser or update this one.',
    tagline: 'Music · Code · Photography · Translation',
    pressStart: 'PRESS START',
    bizLink: 'Need a translation? Go straight to Notary Confi',
    selectZone: 'SELECT ZONE',
    zoneMusic: 'MUSIC ZONE',
    zoneMusicSub: 'Albums, singles and my band',
    zoneCode: 'CODE ZONE',
    zoneCodeSub: 'Projects on GitHub',
    zonePhoto: 'PHOTO ZONE',
    zonePhotoSub: 'Bonus stage: photography',
    zoneTranslation: 'TRANSLATION ZONE',
    zoneTranslationSub: 'Notary Confi · Spanish ⇄ English',
    act1: 'ACT 1',
    act2: 'ACT 2',
    bonus: 'BONUS STAGE',
    musicIntro: 'My own music. Pick a platform and press Load player to listen here, or open it in your favorite app.',
    bandIntro: 'The band I played in while living in Argentina.',
    openIn: 'Open in',
    loadPlayer: '▶ LOAD PLAYER',
    loadPlayerLabel: 'Load the {name} player',
    playerLoaded: '{name} player loaded.',
    codeAct: 'Projects',
    codeIntro: 'Things I build, pulled live from my GitHub.',
    loadingRepos: 'Loading projects…',
    reposError: 'GitHub didn’t respond, so here is a saved list. Use the button below to see the latest.',
    noDescription: 'No description yet.',
    updated: 'Updated',
    star: 'star',
    stars: 'stars',
    allGithub: 'See everything on GitHub',
    photoAct: 'Photography',
    photoIntro: 'A gallery of my photography is on its way.',
    photoSoon: 'PHOTO COMING SOON',
    translationIntro: 'My translation company, Notary Confi, offers professional translation between Spanish and English.',
    esToEn: 'Spanish to English',
    enToEs: 'English to Spanish',
    quote: 'Visit Notary Confi to request a quote',
    continue: 'CONTINUE? ▲ Back to start',
    collectLabel: 'Collect a gold record',
    collected: 'Gold record collected: {n} of {total}.',
    allCollected: 'You collected every gold record. Nice!',
    soundOnStatus: 'Sound effects on.',
    soundOffStatus: 'Sound effects off.',
  },
  es: {
    skip: 'Saltar al contenido principal',
    siteTheme: 'Tema',
    themeNoir: 'Neón Noir',
    themeAlien: 'Alienígena',
    themeZone: 'Zona 16 bits',
    hudTime: 'TIEMPO',
    hudRecords: 'DISCOS',
    langButton: 'English',
    langButtonLabel: 'View the site in English',
    soundOff: 'Efectos apagados',
    soundOn: 'Efectos encendidos',
    musicOff: 'Música apagada',
    musicOn: 'Música encendida',
    playTheme: 'Escuchar la música del tema',
    stopTheme: 'Detener la música del tema',
    musicOnStatus: 'La música del tema está sonando.',
    musicOffStatus: 'Se detuvo la música del tema.',
    musicError: 'La música no pudo iniciar en este navegador. Pruebe con otro navegador o actualice este.',
    tagline: 'Música · Código · Fotografía · Traducción',
    pressStart: 'PULSE START',
    bizLink: '¿Necesita una traducción? Vaya directo a Notary Confi',
    selectZone: 'ELIJA UNA ZONA',
    zoneMusic: 'ZONA MÚSICA',
    zoneMusicSub: 'Álbumes, sencillos y mi banda',
    zoneCode: 'ZONA CÓDIGO',
    zoneCodeSub: 'Proyectos en GitHub',
    zonePhoto: 'ZONA FOTO',
    zonePhotoSub: 'Etapa extra: fotografía',
    zoneTranslation: 'ZONA TRADUCCIÓN',
    zoneTranslationSub: 'Notary Confi · español ⇄ inglés',
    act1: 'ACTO 1',
    act2: 'ACTO 2',
    bonus: 'ETAPA EXTRA',
    musicIntro: 'Mi propia música. Elija una plataforma y pulse Cargar reproductor para escuchar aquí, o ábrala en su aplicación favorita.',
    bandIntro: 'La banda en la que toqué cuando vivía en Argentina.',
    openIn: 'Abrir en',
    loadPlayer: '▶ CARGAR REPRODUCTOR',
    loadPlayerLabel: 'Cargar el reproductor de {name}',
    playerLoaded: 'Reproductor de {name} cargado.',
    codeAct: 'Proyectos',
    codeIntro: 'Lo que construyo, tomado en vivo de mi GitHub.',
    loadingRepos: 'Cargando proyectos…',
    reposError: 'GitHub no respondió, así que esta es una lista guardada. Use el botón de abajo para ver lo más reciente.',
    noDescription: 'Todavía sin descripción.',
    updated: 'Actualizado',
    star: 'estrella',
    stars: 'estrellas',
    allGithub: 'Ver todo en GitHub',
    photoAct: 'Fotografía',
    photoIntro: 'Pronto habrá aquí una galería de mis fotografías.',
    photoSoon: 'FOTO PRÓXIMAMENTE',
    translationIntro: 'Mi empresa de traducción, Notary Confi, ofrece traducción profesional entre español e inglés.',
    esToEn: 'Español a inglés',
    enToEs: 'Inglés a español',
    quote: 'Visite Notary Confi para pedir una cotización',
    continue: '¿CONTINUAR? ▲ Volver al inicio',
    collectLabel: 'Recoger un disco de oro',
    collected: 'Disco de oro recogido: {n} de {total}.',
    allCollected: 'Recogió todos los discos de oro. ¡Excelente!',
    soundOnStatus: 'Efectos de sonido encendidos.',
    soundOffStatus: 'Efectos de sonido apagados.',
  },
};

let lang = 'en';
try {
  const saved = localStorage.getItem('bas_lang');
  if (saved === 'en' || saved === 'es') lang = saved;
  else if ((navigator.language || '').toLowerCase().startsWith('es')) lang = 'es';
} catch {
  if ((navigator.language || '').toLowerCase().startsWith('es')) lang = 'es';
}

export const getLang = () => lang;

export function tr(key, vars = {}) {
  const text = T[lang][key] ?? T.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : ''));
}

export function setLang(next) {
  lang = next === 'es' ? 'es' : 'en';
  try { localStorage.setItem('bas_lang', lang); } catch { /* private mode: ignore */ }
  applyPage();
}

export function applyPage() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.dataset.i18n);
  });
}
