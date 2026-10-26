// English and Spanish text. Page elements use data-i18n="key".
// Content phrases come from the main site (js/i18n.js at the site root), so both pages always match.
// Only the game-style labels below are specific to this page.
import { T as SITE } from '../../js/i18n.js?v=20261026153026';

const ZONE = {
  en: {
    siteTheme: 'Theme',
    hudTime: 'TIME',
    hudRecords: 'RECORDS',
    musicOff: 'Music off',
    musicOn: 'Music on',
    playTheme: 'Play theme music',
    stopTheme: 'Stop theme music',
    musicOnStatus: 'Theme music playing.',
    musicOffStatus: 'Theme music stopped.',
    musicError: 'The music couldn’t start in this browser. Try another browser or update this one.',
    pressStart: 'PRESS START',
    selectZone: 'SELECT ZONE',
    zoneMusic: 'MUSIC ZONE',
    zoneCode: 'CODE ZONE',
    zonePhoto: 'PHOTO ZONE',
    zoneTranslation: 'TRANSLATION ZONE',
    zoneCareer: 'CAREER ZONE',
    zoneSocial: 'SOCIAL ZONE',
    act1: 'ACT 1',
    act2: 'ACT 2',
    bonus: 'BONUS STAGE',
    codeAct: 'Projects',
    photoAct: 'Photography',
    continue: 'CONTINUE? ▲ Back to start',
    collectLabel: 'Collect a gold record',
    collected: 'Gold record collected: {n} of {total}.',
    allCollected: 'You collected every gold record. Nice!',
  },
  es: {
    siteTheme: 'Tema',
    hudTime: 'TIEMPO',
    hudRecords: 'DISCOS',
    musicOff: 'Música apagada',
    musicOn: 'Música encendida',
    playTheme: 'Escuchar la música del tema',
    stopTheme: 'Detener la música del tema',
    musicOnStatus: 'La música del tema está sonando.',
    musicOffStatus: 'Se detuvo la música del tema.',
    musicError: 'La música no pudo iniciar en este navegador. Pruebe con otro navegador o actualice este.',
    pressStart: 'PULSE START',
    selectZone: 'ELIJA UNA ZONA',
    zoneMusic: 'ZONA MÚSICA',
    zoneCode: 'ZONA CÓDIGO',
    zonePhoto: 'ZONA FOTO',
    zoneTranslation: 'ZONA TRADUCCIÓN',
    zoneCareer: 'ZONA CARRERA',
    zoneSocial: 'ZONA REDES',
    act1: 'ACTO 1',
    act2: 'ACTO 2',
    bonus: 'ETAPA EXTRA',
    codeAct: 'Proyectos',
    photoAct: 'Fotografía',
    continue: '¿CONTINUAR? ▲ Volver al inicio',
    collectLabel: 'Recoger un disco de oro',
    collected: 'Disco de oro recogido: {n} de {total}.',
    allCollected: 'Recogió todos los discos de oro. ¡Excelente!',
  },
};

export const T = {
  en: { ...SITE.en, ...ZONE.en },
  es: { ...SITE.es, ...ZONE.es },
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
