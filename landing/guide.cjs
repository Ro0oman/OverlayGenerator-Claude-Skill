// Full guide page: /guide/ (en) and /es/guide/ (es). Video chapters come from guide-chapters.json
// (generated from the final voiceover timings), so the timestamps always match the video.
const chapters = require('./guide-chapters.json'); // [{ key, at }] seconds into /media/guide.mp4

const STEPS = {
  es: {
    skill: ['Instala la skill', 'Descarga <b>overlay-generator.zip</b> de la <a href="https://github.com/Ro0oman/OverlayGenerator-Claude-Skill/releases/latest" target="_blank" rel="noopener">última versión</a>, sin descomprimirlo. En Claude, entra en <b>Ajustes → Capacidades</b> y activa la ejecución de código y la creación de archivos. Después, en <b>Personalizar → Skills</b>, sube el zip.', null],
    prompt: ['Pídeselo a Claude', 'Abre un chat nuevo y cuéntale tu directo: tu canal, tu juego y qué quieres mostrar. Si no sabes cómo escribirlo, usa el <a href="/es/#crear">generador de la web</a>: rellenas cuatro campos, copias la frase y la pegas en Claude.', null],
    pack: ['Elige tu estilo', 'Claude estudia tu canal, te hace un par de preguntas y te propone dos direcciones visuales. Eliges una y recibes el pack en un zip, con overlays, alertas, un panel de control y una guía.', null],
    unzip: ['Descomprime el pack', 'Botón derecho sobre el zip → <b>Extraer todo</b>, en una carpeta que no vayas a mover (OBS recordará la ruta). Dentro verás el motor, las fuentes, los overlays, <code>panel.html</code> y <code>preview.html</code>, que sirve para probarlo sin OBS.', ['unzip', 'folder']],
    ws: ['Activa el WebSocket de OBS', 'En <b>Herramientas → Ajustes del servidor WebSocket</b>, marca <b>Habilitar servidor WebSocket</b>, deja la autenticación activada y copia la contraseña. Es la llave de tu OBS: no la compartas ni la subas a ningún sitio.', ['ws']],
    dock: ['Añade el panel personalizado', 'En <b>Paneles → Paneles de navegador personalizados</b> escribe un nombre y pega la ruta de tu <code>panel.html</code> (<code>file:///C:/…/mi-pack/panel.html</code>, con %20 en lugar de los espacios). Pulsa <b>Aplicar</b>: el panel aparece dentro de OBS y puedes anclarlo donde quieras.', ['dock']],
    install: ['Instalar en OBS', 'En la pestaña <b>Setup</b> del panel pega la contraseña y pulsa <b>Conectar</b>. Después, <b>Instalar en OBS</b>: las escenas y las fuentes de navegador se crean solas. Puedes pulsarlo otra vez cuando quieras; repara y actualiza sin duplicar nada.', ['install', 'scenes']],
    hotkeys: ['Atajos de teclado', 'En <b>Ajustes → Atajos</b>, filtra por el nombre de tu pack. Cada acción tiene una fuente con un icono de teclado en la escena <i>Controles</i>. Asigna una tecla a <b>Mostrar</b> y esa tecla dispara la acción. Es lo mismo que usan Stream Deck y Streamer.bot.', ['hotkeys']],
    trans: ['Transiciones', 'La skill no crea transiciones: son un ajuste de OBS. En el dock <b>Transiciones de escena</b>, pulsa <b>+</b> y elige Deslizar, Stinger o la que prefieras. Ponle nombre, ajusta la duración y se usará al cambiar de escena.', ['trans', 'trans2']],
    live: ['En directo', 'Controlas el panel con un clic, con tus atajos, con tus mods desde el chat de Twitch, o con Stream Deck y Streamer.bot. Mira cómo se hace en el <a href="/es/cases/penitencia/">caso real de Penitencia</a>.', null],
  },
  en: {
    skill: ['Install the skill', 'Download <b>overlay-generator.zip</b> from the <a href="https://github.com/Ro0oman/OverlayGenerator-Claude-Skill/releases/latest" target="_blank" rel="noopener">latest release</a> and do not unzip it. In Claude, open <b>Settings → Capabilities</b> and turn on code execution and file creation. Then, in <b>Customize → Skills</b>, upload the zip.', null],
    prompt: ['Ask Claude', 'Open a new chat and describe your stream: your channel, your game and what you want to show. Not sure how to word it? Use the <a href="/#crear">generator on the site</a>: fill in four fields, copy the sentence and paste it into Claude.', null],
    pack: ['Pick your style', 'Claude studies your channel, asks a couple of questions and proposes two visual directions. You pick one and get the pack as a zip, with overlays, alerts, a control panel and a guide.', null],
    unzip: ['Unzip the pack', 'Right-click the zip → <b>Extract all</b>, into a folder you will not move (OBS remembers the path). Inside you will find the engine, fonts, overlays, <code>panel.html</code> and <code>preview.html</code>, which lets you try everything without OBS.', ['unzip', 'folder']],
    ws: ['Turn on the OBS WebSocket', 'In <b>Tools → WebSocket Server Settings</b>, tick <b>Enable WebSocket server</b>, keep authentication on and copy the password. It is the key to your OBS: never share it or upload it anywhere.', ['ws']],
    dock: ['Add the custom panel', 'In <b>Docks → Custom Browser Docks</b>, type a name and paste the path to your <code>panel.html</code> (<code>file:///C:/…/my-pack/panel.html</code>, with %20 instead of spaces). Press <b>Apply</b>: the panel shows up inside OBS and you can dock it anywhere.', ['dock']],
    install: ['Install in OBS', 'On the panel’s <b>Setup</b> tab, paste the password and press <b>Connect</b>. Then <b>Install in OBS</b>: scenes and browser sources are created for you. You can press it again any time; it repairs and updates without duplicating anything.', ['install', 'scenes']],
    hotkeys: ['Hotkeys', 'In <b>Settings → Hotkeys</b>, filter by your pack’s name. Every action has a source with a keyboard icon in the <i>Controls</i> scene. Assign a key to <b>Show</b> and that key triggers the action. It is the same thing Stream Deck and Streamer.bot use.', ['hotkeys']],
    trans: ['Transitions', 'The skill does not create transitions: they are an OBS setting. In the <b>Scene Transitions</b> dock, press <b>+</b> and choose Slide, Stinger or whichever you like. Give it a name, set the duration and it is used whenever you switch scenes.', ['trans', 'trans2']],
    live: ['Live', 'You control the panel with a click, with your hotkeys, with your mods from Twitch chat, or with Stream Deck and Streamer.bot. See it in the <a href="/cases/penitencia/">real Penitencia case</a>.', null],
  },
};

const T = {
  es: {
    crumb: 'Guía completa', metaTitle: 'Guía completa de OverlayGenerator: de cero a directo en OBS (vídeo y pasos)',
    metaDesc: 'Aprende a usar OverlayGenerator de principio a fin: instalar la skill en Claude, generar tu pack, conectarlo a OBS con WebSocket, añadir el panel personalizado, atajos de teclado y transiciones. Vídeo con capítulos y pasos escritos.',
    h1: 'De cero a directo: la guía completa', lead: 'Instalar la skill, generar tu pack, conectarlo a OBS, añadir el panel, los atajos y las transiciones. En vídeo con capítulos y por escrito.',
    chaptersT: 'Capítulos del vídeo', stepsT: 'Los pasos, por escrito', videoT: 'Guía completa en vídeo', step: 'Paso', cta: 'Prueba el generador', ctaL: 'Una frase y Claude te prepara el pack.', intro: 'Introducción',
  },
  en: {
    crumb: 'Full guide', metaTitle: 'OverlayGenerator full guide: from zero to live in OBS (video and steps)',
    metaDesc: 'Learn OverlayGenerator end to end: install the skill in Claude, generate your pack, connect it to OBS over WebSocket, add the custom panel, hotkeys and transitions. Chaptered video plus written steps.',
    h1: 'From zero to live: the complete guide', lead: 'Install the skill, generate your pack, connect it to OBS, add the panel, hotkeys and transitions. As a chaptered video and in writing.',
    chaptersT: 'Video chapters', stepsT: 'The steps, in writing', videoT: 'Full video guide', step: 'Step', cta: 'Try the generator', ctaL: 'One sentence and Claude builds your pack.', intro: 'Intro',
  },
};

const ORDER = ['skill', 'prompt', 'pack', 'unzip', 'ws', 'dock', 'install', 'hotkeys', 'trans', 'live'];
const GUIDE = { chapters, ORDER, STEPS, T, video: '/media/guide.mp4', poster: '/media/guide-poster.webp', img: k => `/media/guide/${k}.webp` };
module.exports = { GUIDE };
