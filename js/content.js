// Site data shared by every theme (the main page and the 16-Bit Zone page in /16-bit/):
// GitHub account, project descriptions, music players. Edit here once; both pages update.

export const GITHUB_USER = 'bri-an-pmp';
// Repositories to leave out of the Code section.
export const HIDDEN_REPOS = ['Agile-Bud'];

// Music players load only when the visitor asks (faster page, no tracking until then).
export const EMBEDS = {
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

// Descriptions written for this site, in both languages. They replace the one-line GitHub
// description for these projects; `steps` shows as a numbered list.
export const REPO_TEXT = {
  'translation-desk': {
    en: {
      text: 'My English ⇄ Spanish translation assistant, built on the Claude API and running on my own Mac. Claude drafts each passage and explains its judgment calls; I edit and approve every one before anything is delivered. Tested against my own past translations.',
      steps: [
        'Certified translations of official documents: reads photos and scans, keeps every seal and signature in brackets, and adds my certificate of accuracy',
        'Legal, museum, business and technical text, each with its own rules, in both directions',
        'Checks names, numbers, dates, glossary terms and character limits',
        'Keeps my glossary and remembers every passage I approve',
      ],
    },
    es: {
      text: 'Mi asistente de traducción inglés ⇄ español, creado con la API de Claude y que funciona en mi propia Mac. Claude redacta cada pasaje y explica sus decisiones; yo corrijo y apruebo cada uno antes de entregar. Probado con mis propias traducciones anteriores.',
      steps: [
        'Traducciones certificadas de documentos oficiales: lee fotos y escaneos, conserva cada sello y firma entre corchetes y agrega mi certificado de exactitud',
        'Textos legales, de museos, empresariales y técnicos, cada uno con sus propias reglas, en ambas direcciones',
        'Revisa nombres, números, fechas, términos del glosario y límites de caracteres',
        'Respeta mi glosario y recuerda cada pasaje que apruebo',
      ],
    },
  },
  'spanish-translation-skills': {
    en: {
      text: 'A Claude Code plugin for English ⇄ Spanish translators, built from my own translation practice. Tested with and without the plugin: on a question about Spanish usage rules, Claude was right 3 out of 3 times with it and 0 out of 3 without.',
      steps: [
        'translator-en-es: legal, technical, business and arts translations, with a glossary and notes on every judgment call',
        'rae-spanish: checks spelling and grammar against current Real Academia Española sources and cites them',
        'l10n-qa: catches broken placeholders, lost tags and buttons that are too long in translated app files',
      ],
    },
    es: {
      text: 'Un plugin de Claude Code para traductores de inglés ⇄ español, creado a partir de mi propia práctica como traductor. Probado con y sin el plugin: ante una consulta sobre las normas del español, Claude acertó 3 de 3 veces con él y 0 de 3 sin él.',
      steps: [
        'translator-en-es: traducciones jurídicas, técnicas, empresariales y de arte, con glosario y notas sobre cada decisión',
        'rae-spanish: revisa la ortografía y la gramática con fuentes vigentes de la Real Academia Española y las cita',
        'l10n-qa: detecta variables rotas, etiquetas perdidas y botones demasiado largos en los archivos traducidos de una app',
      ],
    },
  },
  'mi-ofrenda': {
    en: { text: 'Honor someone you love, and learn Spanish along the way. Build a Day of the Dead altar for a parent, a friend, a pet or a Mexican legend, and every candle, marigold and pan dulce you place speaks its name in Spanish. For every age and background, no Spanish needed. Free on the web and on the iPhone App Store.' },
    es: { text: 'Honre a alguien que quiere y aprenda español en el camino. Arme una ofrenda de Día de Muertos para su mamá, un amigo, su mascota o una leyenda de México, y cada vela, cempasúchil y pan dulce que coloque le dirá su nombre en español. Para todas las edades y orígenes, sin saber español. Gratis en la web y en la App Store para iPhone.' },
  },
  'brianathey-studio': {
    en: { text: 'The code behind this website: a bilingual personal site for music, code, photography and translation, built with plain HTML, CSS and JavaScript and published on GitHub Pages.' },
    es: { text: 'El código de este sitio: un sitio personal bilingüe de música, código, fotografía y traducción, hecho con HTML, CSS y JavaScript y publicado en GitHub Pages.' },
  },
  'Brian-AI-Agent-Career': {
    en: { text: 'An AI agent that answers questions about my career, grounded on my résumé. Built in Python with Gradio and OpenAI tool calling, it also logs questions it can’t answer and visitors who want to get in touch. Live on Hugging Face.' },
    es: { text: 'Un agente de IA que responde preguntas sobre mi carrera a partir de mi currículum. Hecho en Python con Gradio y llamadas a herramientas de OpenAI; además registra las preguntas que no puede responder y a los visitantes que quieren contactarme. En vivo en Hugging Face.' },
  },
  'twilioquest-extension-template': {
    en: {
      text: 'A TwilioQuest game mission based on Notary Confi’s appointment reminders. Practice only: nothing is really sent.',
      steps: [
        'Text message (SMS): send the appointment reminder',
        'WhatsApp: fill in the message template',
        'Text and email replies: sort clients’ answers in English or Spanish',
        'Fix the broken webhook to finish the mission',
      ],
    },
    es: {
      text: 'Una misión del juego TwilioQuest basada en los recordatorios de citas de Notary Confi. Solo es práctica: no se envía nada de verdad.',
      steps: [
        'Mensaje de texto (SMS): enviar el recordatorio de la cita',
        'WhatsApp: completar la plantilla del mensaje',
        'Respuestas por texto y por correo: clasificar las respuestas de los clientes en inglés o en español',
        'Reparar el webhook averiado para terminar la misión',
      ],
    },
  },
  'the-morning-frequency': {
    en: { text: 'Ambient journaling app: write a paragraph, press Enter twice, and hear choir-and-organ music tuned to your mood. Circle-of-fifths keys, 15 moods, streak sounds and story videos. Web + iPhone.' },
    es: { text: 'App de diario ambiental: escriba un párrafo, presione Enter dos veces y escuche música de coro y órgano según su estado de ánimo. Tonalidades del círculo de quintas, 15 estados de ánimo, sonidos de racha y videos para historias. Web + iPhone.' },
  },
  'claude-skills': {
    en: { text: 'A collection of Claude skills.' },
    es: { text: 'Una colección de skills (habilidades) para Claude.' },
  },
};

// Projects that are also an app in Apple's App Store (shown as a second button on the card)
export const REPO_STORE = {
  'mi-ofrenda': 'https://apps.apple.com/us/app/mi-ofrenda/id6824747905',
};

// Shown if the GitHub API can't be reached (it limits visitors to 60 requests an hour).
export const FALLBACK_REPOS = [
  { name: 'translation-desk', description: '', language: 'JavaScript' },
  { name: 'spanish-translation-skills', description: '', language: 'Python' },
  { name: 'mi-ofrenda', description: '', language: 'JavaScript', homepage: 'https://bri-an-pmp.github.io/mi-ofrenda/' },
  { name: 'the-morning-frequency', description: 'Ambient journaling app: write a paragraph, press Enter twice, hear choir-and-organ music for its mood.', language: 'JavaScript' },
  { name: 'Brian-AI-Agent-Career', description: '', language: 'Python' },
  { name: 'claude-skills', description: 'A collection of Claude skills.', language: 'JavaScript' },
  { name: 'twilioquest-extension-template', description: 'TwilioQuest mission: the Notary Confi appointment-confirmation workflow (mock scenario).', language: 'JavaScript' },
];
