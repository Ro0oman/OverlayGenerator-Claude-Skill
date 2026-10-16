// Use-case landing pages, one per stream format. English and Spanish.
// Pages: /use-cases/<slug>/ (en) and /es/use-cases/<slug>/ (es). Hub: /use-cases/ and /es/use-cases/.
const HUB = {
  en: { metaTitle: 'OBS overlays by stream format · OverlayGenerator',
    metaDesc: 'Soulslike no-hit runs, subathons, Just Chatting, Minecraft hardcore, game shows and VTubers: see how OverlayGenerator designs an OBS overlay pack for each kind of stream.',
    eyebrow: 'Use cases', h1: 'An overlay pack for every kind of stream',
    lead: 'Claude designs each pack around what your stream actually is. These are some of the formats it handles, and what a pack looks like for each.',
    more: 'See the full page →', back: '← OverlayGenerator', related: 'Other stream formats', cta: 'Get the skill', ctaAlt: 'How to install it',
    pieces: 'What the pack includes', prompt: 'Ask Claude something like', faq: 'Questions', crumb: 'Use cases', home: 'Home' },
  es: { metaTitle: 'Overlays de OBS por tipo de directo · OverlayGenerator',
    metaDesc: 'Runs no-hit de soulslikes, subathons, Just Chatting, Minecraft hardcore, concursos y VTubers: así diseña OverlayGenerator un pack de overlays de OBS para cada tipo de directo.',
    eyebrow: 'Casos de uso', h1: 'Un pack de overlays para cada tipo de directo',
    lead: 'Claude diseña cada pack a partir de lo que es tu directo. Estos son algunos de los formatos que cubre y cómo queda el pack en cada uno.',
    more: 'Ver la página completa →', back: '← OverlayGenerator', related: 'Otros tipos de directo', cta: 'Conseguir la skill', ctaAlt: 'Cómo instalarla',
    pieces: 'Qué incluye el pack', prompt: 'Pídele a Claude algo así', faq: 'Preguntas', crumb: 'Casos de uso', home: 'Inicio' },
};

const CASES = [
{
  slug: 'soulslike-no-hit', media: 'alert-nohit', w: 560, h: 176,
  en: {
    card: 'Soulslike & no-hit runs',
    metaTitle: 'OBS overlay for Elden Ring, Dark Souls & no-hit runs · OverlayGenerator',
    metaDesc: 'An OBS overlay pack for soulslike and no-hit streams: hit counter, death counter, boss tracker and alerts that wait until the boss is down. Designed for your channel by Claude.',
    h1: 'OBS overlays for soulslike and no-hit runs',
    lead: 'In a no-hit run only one number matters. Your overlay should know that, stay away from the health bar and never cover the boss when it matters most.',
    pieces: [
      ['Hit counter that owns the screen', 'The zero is the hero. When you take a hit it turns red, and the rest of the pack reacts with it.'],
      ['Death counter and boss tracker', 'Attempts, personal best and which boss you are on, updated with a hotkey or a mod typing <code>!death</code> or <code>!next</code>.'],
      ['Alerts that respect the fight', 'Hold alerts during a boss with one click and release them when it is down. Banners stay thin and clear of the game HUD.'],
      ['Scenes in the same mood', 'Starting soon, BRB and ending screens that look like they belong to the same run, without using official logos or artwork.'],
    ],
    prompt: 'I do Elden Ring no-hit runs, Spanish-speaking chat. I want a hit counter, boss progress and alerts that don’t cover the fight.',
    faq: [
      ['Will it cover the health bar or the minimap?', 'No. Pieces are placed away from the game HUD, and if you send a screenshot of your stream Claude uses it to map where your HUD and camera are.'],
      ['Can I update the counter without leaving the game?', 'Yes. Each counter gets an OBS hotkey (it also works with a Stream Deck) and a chat command your mods can use.'],
    ],
  },
  es: {
    card: 'Soulslikes y runs no-hit',
    metaTitle: 'Overlay de OBS para Elden Ring, Dark Souls y runs no-hit · OverlayGenerator',
    metaDesc: 'Pack de overlays de OBS para directos de soulslikes y no-hit: contador de golpes, contador de muertes, tracker de jefes y alertas que esperan a que caiga el jefe. Diseñado para tu canal con Claude.',
    h1: 'Overlays de OBS para soulslikes y runs no-hit',
    lead: 'En una run no-hit solo importa un número. Tu overlay debería saberlo, quedarse lejos de la barra de vida y no tapar nunca al jefe en el peor momento.',
    pieces: [
      ['Un contador de golpes protagonista', 'El cero es el héroe. Cuando recibes un golpe se pone en rojo y el resto del pack reacciona con él.'],
      ['Contador de muertes y tracker de jefes', 'Intentos, récord personal y en qué jefe estás, actualizados con una hotkey o con un mod escribiendo <code>!death</code> o <code>!next</code>.'],
      ['Alertas que respetan el combate', 'Retén las alertas durante un jefe con un clic y suéltalas cuando caiga. Los banners son finos y no pisan el HUD del juego.'],
      ['Escenas con el mismo tono', 'Pantallas de empezando, vuelvo enseguida y final que parecen parte de la misma run, sin usar logos ni arte oficial.'],
    ],
    prompt: 'Hago runs no-hit de Elden Ring, chat hispanohablante. Quiero un contador de golpes, el progreso de jefes y alertas que no tapen el combate.',
    faq: [
      ['¿Tapará la barra de vida o el minimapa?', 'No. Las piezas se colocan lejos del HUD del juego y, si mandas una captura de tu directo, Claude la usa para saber dónde están tu HUD y tu cámara.'],
      ['¿Puedo actualizar el contador sin salir del juego?', 'Sí. Cada contador tiene una hotkey de OBS (también funciona con Stream Deck) y un comando de chat para tus mods.'],
    ],
  },
},
{
  slug: 'subathon', media: 'alert-receipt', w: 560, h: 508,
  en: {
    card: 'Subathons',
    metaTitle: 'Subathon overlay for OBS with timer and sub alerts · OverlayGenerator',
    metaDesc: 'An OBS overlay pack for subathons: a timer that grows with every sub, alerts that say how much time they add, sponsor spots and a sub goal. Designed for your channel by Claude.',
    h1: 'Subathon overlays for OBS',
    lead: 'A subathon lives on its timer. Every sub, gift and bit should feel like it moves the clock, and the overlay has to survive days of streaming without getting tiring.',
    pieces: [
      ['A timer at the centre of the pack', 'The subathon clock is part of the design, not a widget pasted on top. Alerts show how much time each sub adds.'],
      ['Alerts for every kind of support', 'Sub, resub, gifted sub, sub bombs, raids and bits, each written in your channel’s language and humour.'],
      ['Sponsor spots that fit in', 'Codes and sponsor messages styled like the rest of the pack, so they don’t look like ads.'],
      ['Calm when nothing happens', 'Nothing loops forever; only events move. Easy on viewers who stay for hours.'],
    ],
    prompt: 'I’m doing a 7-day subathon, each sub adds 10 minutes. I have two sponsors with discount codes.',
    faq: [
      ['Does the timer add time automatically?', 'The pack reads Twitch chat anonymously, which covers subs, resubs, gifts, sub bombs and bits, and the panel lets you adjust the time by hand.'],
      ['Does it handle donations?', 'Not on its own yet. The guide shows how to keep donation alerts in StreamElements or Streamlabs, styled to match.'],
    ],
  },
  es: {
    card: 'Subathons',
    metaTitle: 'Overlay de subathon para OBS con temporizador y alertas · OverlayGenerator',
    metaDesc: 'Pack de overlays de OBS para subathons: un temporizador que crece con cada sub, alertas que dicen cuánto tiempo suman, espacios para sponsors y objetivo de subs. Diseñado para tu canal con Claude.',
    h1: 'Overlays de subathon para OBS',
    lead: 'Un subathon vive de su temporizador. Cada sub, regalo y bit tiene que sentirse como que mueve el reloj, y el overlay tiene que aguantar días de directo sin cansar.',
    pieces: [
      ['El temporizador como centro del pack', 'El reloj del subathon forma parte del diseño, no es un widget pegado encima. Las alertas muestran cuánto tiempo suma cada sub.'],
      ['Alertas para cada tipo de apoyo', 'Sub, resub, sub regalada, sub bomb, raid y bits, escritas con el idioma y el humor de tu canal.'],
      ['Sponsors que encajan', 'Códigos y mensajes de patrocinadores con el estilo del resto del pack, para que no parezcan anuncios.'],
      ['Tranquilo cuando no pasa nada', 'Nada se repite en bucle; solo se mueven los eventos. Agradable para quien se queda horas.'],
    ],
    prompt: 'Voy a hacer un subathon de 7 días, cada sub suma 10 minutos. Tengo dos sponsors con códigos de descuento.',
    faq: [
      ['¿El temporizador suma tiempo solo?', 'El pack lee el chat de Twitch de forma anónima, lo que cubre subs, resubs, regalos, sub bombs y bits, y desde el panel puedes ajustar el tiempo a mano.'],
      ['¿Funciona con donaciones?', 'Todavía no por sí solo. La guía explica cómo mantener las alertas de donaciones en StreamElements o Streamlabs con el mismo estilo.'],
    ],
  },
},
{
  slug: 'just-chatting', media: 'alert-metro', w: 560, h: 186,
  en: {
    card: 'Just Chatting & talk shows',
    metaTitle: 'Just Chatting overlay for OBS with topic agenda · OverlayGenerator',
    metaDesc: 'An OBS overlay pack for Just Chatting and talk streams: a topic agenda your mods can advance, news-style lower thirds, chat on screen and alerts in your voice. Designed by Claude.',
    h1: 'OBS overlays for Just Chatting and talk streams',
    lead: 'When the stream is a conversation, the overlay is the set. It should tell new viewers what you are talking about and where the stream is going next.',
    pieces: [
      ['A topic agenda', 'Today’s topics on screen, with the current one highlighted. You or a mod move to the next with a hotkey or <code>!next</code>.'],
      ['Lower thirds and tickers', 'News-desk style titles for each segment, so someone arriving mid-stream knows what is going on.'],
      ['Chat as part of the set', 'On-screen chat, camera frame and sub goal designed together, not stacked on top of each other.'],
      ['Alerts in your voice', 'Subs and raids written the way you and your chat talk, in your language.'],
    ],
    prompt: 'I do a weekly talk show about tech news, 4–5 topics per stream. I want a topic list my mods can move forward.',
    faq: [
      ['Can my mods change the topic?', 'Yes. Mods can use chat commands from the pack; commands from other viewers are ignored and logged.'],
      ['Do I need a camera?', 'No. Claude asks whether you use a camera or a VTuber model and designs the layout around it.'],
    ],
  },
  es: {
    card: 'Just Chatting y tertulias',
    metaTitle: 'Overlay de Just Chatting para OBS con agenda de temas · OverlayGenerator',
    metaDesc: 'Pack de overlays de OBS para Just Chatting y directos de charla: agenda de temas que tus mods pueden avanzar, rótulos tipo informativo, chat en pantalla y alertas con tu tono. Diseñado con Claude.',
    h1: 'Overlays de OBS para Just Chatting y directos de charla',
    lead: 'Cuando el directo es una conversación, el overlay es el plató. Tiene que contar a quien llega de qué se está hablando y hacia dónde va el directo.',
    pieces: [
      ['Una agenda de temas', 'Los temas del día en pantalla, con el actual destacado. Tú o un mod pasáis al siguiente con una hotkey o con <code>!next</code>.'],
      ['Rótulos y ticker', 'Títulos tipo informativo para cada bloque, para que quien entra a mitad sepa qué está pasando.'],
      ['El chat como parte del plató', 'Chat en pantalla, marco de cámara y objetivo de subs diseñados juntos, no amontonados.'],
      ['Alertas con tu tono', 'Subs y raids escritas como habláis tú y tu chat, en tu idioma.'],
    ],
    prompt: 'Hago una tertulia semanal de noticias de tecnología, 4 o 5 temas por directo. Quiero una lista de temas que mis mods puedan avanzar.',
    faq: [
      ['¿Mis mods pueden cambiar de tema?', 'Sí. Los mods pueden usar los comandos de chat del pack; los del resto de espectadores se ignoran y quedan registrados.'],
      ['¿Necesito cámara?', 'No. Claude te pregunta si usas cámara o modelo de VTuber y diseña la composición en función de eso.'],
    ],
  },
},
{
  slug: 'minecraft-hardcore', media: 'panel-live', w: 460, h: 230,
  en: {
    card: 'Minecraft hardcore',
    metaTitle: 'Minecraft hardcore overlay for OBS with day counter · OverlayGenerator',
    metaDesc: 'An OBS overlay pack for Minecraft hardcore series: a day counter, run goals, a sub goal and alerts that match your world. Designed for your channel by Claude, no code.',
    h1: 'OBS overlays for Minecraft hardcore',
    lead: 'A hardcore series is a story told in days. The overlay should keep count, celebrate milestones and stay out of the hotbar.',
    pieces: [
      ['Day counter', 'How many days the world has survived, updated with a hotkey or a mod command at the start of each stream.'],
      ['Goals for the run', 'Run objectives and a sub goal on screen, designed as part of the same world.'],
      ['Clear of the hotbar', 'Pieces avoid the hotbar, hearts and chat area of the game, and take only a small part of the screen.'],
      ['Scenes for the whole series', 'Starting soon, BRB and ending screens you can reuse every episode.'],
    ],
    prompt: 'I stream Minecraft hardcore in French, chill vibe. I want a day counter and a goal for 10 subs.',
    faq: [
      ['Will it use Minecraft textures or logos?', 'No. A pack can evoke your game, but it never uses official logos, characters, artwork or fonts.'],
      ['Can I change the pack later?', 'Yes. Send Claude your pack and ask for changes; unzip the new one over the old one and your counters are kept.'],
    ],
  },
  es: {
    card: 'Minecraft hardcore',
    metaTitle: 'Overlay de Minecraft hardcore para OBS con contador de días · OverlayGenerator',
    metaDesc: 'Pack de overlays de OBS para series de Minecraft hardcore: contador de días, objetivos de la run, objetivo de subs y alertas a juego con tu mundo. Diseñado para tu canal con Claude, sin código.',
    h1: 'Overlays de OBS para Minecraft hardcore',
    lead: 'Una serie hardcore es una historia contada en días. El overlay tiene que llevar la cuenta, celebrar los hitos y no pisar la barra de objetos.',
    pieces: [
      ['Contador de días', 'Cuántos días lleva vivo el mundo, actualizado con una hotkey o un comando de mod al empezar cada directo.'],
      ['Objetivos de la run', 'Objetivos de la serie y objetivo de subs en pantalla, diseñados como parte del mismo mundo.'],
      ['Lejos de la barra de objetos', 'Las piezas evitan la hotbar, los corazones y la zona de chat del juego, y ocupan poca pantalla.'],
      ['Escenas para toda la serie', 'Pantallas de empezando, vuelvo enseguida y final que puedes reutilizar en cada episodio.'],
    ],
    prompt: 'Hago Minecraft hardcore en español, rollo tranquilo. Quiero un contador de días y un objetivo de 10 subs.',
    faq: [
      ['¿Usará texturas o logos de Minecraft?', 'No. Un pack puede evocar tu juego, pero nunca usa logos, personajes, arte ni tipografías oficiales.'],
      ['¿Puedo cambiar el pack después?', 'Sí. Mándale tu pack a Claude y pide los cambios; descomprime el nuevo encima del viejo y tus contadores se conservan.'],
    ],
  },
},
{
  slug: 'game-show', media: 'alert-gameshow', w: 560, h: 322,
  en: {
    card: 'Game shows & quizzes',
    metaTitle: 'Game show and quiz overlay for OBS streams · OverlayGenerator',
    metaDesc: 'An OBS overlay pack for game show and quiz streams: scoreboards, a jackpot-style sub goal, studio lower thirds and alerts with lights and confetti. Designed by Claude.',
    h1: 'OBS overlays for game shows and quiz streams',
    lead: 'If you host your own shows, your overlay is the studio: scoreboard, lights and a big moment every time someone subs.',
    pieces: [
      ['Scoreboards', 'Player or team scores you update from the panel, with hotkeys or chat commands for your co-hosts.'],
      ['A jackpot sub goal', 'The sub goal becomes part of the show, like a prize that grows with your chat.'],
      ['Studio lower thirds', 'Titles for each round and each guest, in the style of a TV set.'],
      ['Alerts with a show', '“We have a sub!” with marquee lights and confetti, written in your channel’s humour.'],
    ],
    prompt: 'I host a weekly quiz show with two teams from chat. I want a scoreboard and big TV-style alerts.',
    faq: [
      ['Can co-hosts control the scoreboard?', 'Yes. Anyone with mod rights can use the pack’s chat commands, and you can drive everything from the panel inside OBS.'],
      ['Can I preview it before going live?', 'Yes. Double-click <code>preview.html</code> in the pack to see every scene and alert without opening OBS.'],
    ],
  },
  es: {
    card: 'Concursos y quizzes',
    metaTitle: 'Overlay de concurso y quiz para directos en OBS · OverlayGenerator',
    metaDesc: 'Pack de overlays de OBS para concursos y quizzes en directo: marcadores, objetivo de subs tipo bote, rótulos de plató y alertas con luces y confeti. Diseñado con Claude.',
    h1: 'Overlays de OBS para concursos y quizzes en directo',
    lead: 'Si presentas tus propios concursos, tu overlay es el plató: marcador, luces y un gran momento cada vez que alguien se suscribe.',
    pieces: [
      ['Marcadores', 'Puntuaciones de jugadores o equipos que actualizas desde el panel, con hotkeys o comandos de chat para tus copresentadores.'],
      ['Un bote como objetivo de subs', 'El objetivo de subs se convierte en parte del concurso, como un premio que crece con tu chat.'],
      ['Rótulos de plató', 'Títulos para cada ronda y cada invitado, con estilo de programa de televisión.'],
      ['Alertas con espectáculo', '“¡Tenemos un sub!” con luces de marquesina y confeti, escrito con el humor de tu canal.'],
    ],
    prompt: 'Presento un concurso semanal con dos equipos del chat. Quiero un marcador y alertas grandes tipo tele.',
    faq: [
      ['¿Los copresentadores pueden manejar el marcador?', 'Sí. Cualquiera con permisos de mod puede usar los comandos de chat del pack, y tú lo controlas todo desde el panel dentro de OBS.'],
      ['¿Puedo verlo antes de emitir?', 'Sí. Haz doble clic en <code>preview.html</code> dentro del pack para ver todas las escenas y alertas sin abrir OBS.'],
    ],
  },
},
{
  slug: 'vtuber', media: 'alert-tar', w: 560, h: 254,
  en: {
    card: 'VTubers',
    metaTitle: 'VTuber overlay for OBS designed around your model · OverlayGenerator',
    metaDesc: 'An OBS overlay pack for VTubers: layouts that leave room for your model, alerts in your character’s voice, chat and sub goal that match your lore. Designed for your channel by Claude.',
    h1: 'OBS overlays for VTubers',
    lead: 'Your model and your lore are the channel. The overlay should frame them, not compete with them, and the alerts should sound like your character.',
    pieces: [
      ['Room for your model', 'Claude asks whether you use a camera or a VTuber model and lays out every scene around it.'],
      ['Alerts in character', 'Subs, gifts and raids written the way your character talks, in your stream’s language.'],
      ['A set that matches your lore', 'Starting soon, BRB and ending screens that fit your world instead of a generic theme.'],
      ['Readable on a phone', 'Large text and strong contrast, checked automatically on every scene.'],
    ],
    prompt: 'I’m a VTuber, my character is a sleepy witch who runs a potion shop. I mostly play cozy games.',
    faq: [
      ['Does it work with VTube Studio or other tracking apps?', 'The pack is a set of OBS scenes and browser sources, so it works alongside whatever you use to capture your model.'],
      ['Is my data sent anywhere?', 'No. Everything runs in your OBS on your computer; Twitch chat is read anonymously.'],
    ],
  },
  es: {
    card: 'VTubers',
    metaTitle: 'Overlay para VTubers en OBS diseñado alrededor de tu modelo · OverlayGenerator',
    metaDesc: 'Pack de overlays de OBS para VTubers: composiciones que dejan sitio a tu modelo, alertas con la voz de tu personaje, chat y objetivo de subs a juego con tu lore. Diseñado con Claude.',
    h1: 'Overlays de OBS para VTubers',
    lead: 'Tu modelo y tu lore son el canal. El overlay tiene que enmarcarlos, no competir con ellos, y las alertas tienen que sonar como tu personaje.',
    pieces: [
      ['Sitio para tu modelo', 'Claude te pregunta si usas cámara o modelo de VTuber y compone cada escena en función de eso.'],
      ['Alertas en personaje', 'Subs, regalos y raids escritos como habla tu personaje, en el idioma de tu directo.'],
      ['Un plató a juego con tu lore', 'Pantallas de empezando, vuelvo enseguida y final que encajan con tu mundo en vez de un tema genérico.'],
      ['Legible en el móvil', 'Texto grande y buen contraste, comprobados automáticamente en cada escena.'],
    ],
    prompt: 'Soy VTuber, mi personaje es una bruja dormilona que lleva una tienda de pociones. Juego sobre todo a juegos cozy.',
    faq: [
      ['¿Funciona con VTube Studio u otras apps de tracking?', 'El pack es un conjunto de escenas y fuentes de navegador de OBS, así que funciona junto a lo que uses para capturar tu modelo.'],
      ['¿Se envían mis datos a algún sitio?', 'No. Todo funciona en tu OBS, en tu ordenador; el chat de Twitch se lee de forma anónima.'],
    ],
  },
},
];

module.exports = { HUB, CASES, UC_LANGS: ['en', 'es'] };
