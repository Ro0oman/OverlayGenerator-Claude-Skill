# OverlayGenerator · Diseño (v1.1)

> Cimientos de la skill. v1.1 incorpora la revisión externa (`REVISION-externa.md`) y las decisiones tomadas después.

## 1. Qué es

Una skill para Claude (la app de Claude; también funciona en Claude Code). Cualquier streamer le cuenta qué directos hace, o pega su canal de Twitch, y recibe un **pack de overlays para OBS** hecho a medida, con:

- un **panel de control** dentro de OBS,
- un botón **"Instalar en OBS"** que monta escenas y fuentes solo,
- una **vista previa** que se abre con doble clic,
- una **guía paso a paso** sin código.

## 2. Flujo de la conversación

1. **Descubrir: "pega tu canal y busco".**
   - Claude busca el canal en la web y lee lo que encuentre: juegos, idioma, estilo, bio.
   - Si el entorno lo permite, también consulta fuentes directas (página "about", decapi).
   - Resume lo que ha visto y **lo confirma con la persona**. Si encuentra poco, hace una entrevista.
   - El idioma del pack se deduce del canal y se confirma.
2. **Entrevista corta.** Como mucho 4 preguntas con opción por defecto: estilo, colores o marca, piezas, metas.
3. **Propuesta visual.** 2 direcciones con nombre, paleta, tipografías y una vista previa. Se elige una.
4. **Generar.** Claude escribe la *receta* del pack (§5). El script monta el pack con el motor.
5. **Entregar.** Zip + `vista-previa.html` + `GUIA.md`.

## 3. Arquitectura (probada en OBS 32)

```
 Panel (dock de OBS) ──► WebSocket de OBS (4455) ──► overlays (fuentes de navegador)
      │  ▲                     │
      │  └── eventos de OBS ───┘  (atajos de teclado, ver §6)
      └──► crea escenas y fuentes ("Instalar en OBS")
 Chat de Twitch (anónimo) ──► panel (comandos, contador) y overlays (alertas, chat)
```

- **Cartero:** el WebSocket que trae OBS (v5), sin Python.
  - El panel manda `BroadcastCustomEvent` y los overlays lo reciben como `CustomEvent`.
  - El panel se suscribe solo a los eventos *General* y *SceneItems*.
- **Contraseña:** la del WebSocket de OBS. El panel la guarda y la pone en las URL de los overlays (`?pw=`).
  - **Decisión:** se acepta, porque solo da acceso desde la red local.
  - **Si se filtra:** se genera otra en OBS y se vuelve a pulsar "Instalar en OBS", que reescribe las URL.
- **"Instalar en OBS":**
  - Crea las escenas del pack y las fuentes de navegador ya colocadas, con tamaño y ajustes correctos ("apagar si no visible" desactivado).
  - Crea las fuentes invisibles para los atajos (§6).
  - Se puede repetir sin duplicar: así se repara o se actualiza.
- **El panel es el cerebro:**
  - guarda la configuración y el estado,
  - cuenta, ejecuta acciones y reparte el estado,
  - guarda una copia dentro de OBS (`SetPersistentData`) para sobrevivir a "limpiar caché".
- **El panel tiene que estar abierto durante el directo**, como dock (puede estar minimizado) o en el navegador. La guía lo dice en grande, y el overlay avisa si deja de recibir señal (§10).
- **Overlays:**
  - Cada uno lee el chat de Twitch por su cuenta para alertas y chat.
  - Guardan el último estado por si el panel no está.
  - El chat siempre se pinta como texto, nunca como HTML.
- **Requisitos para el usuario:** OBS 28 o superior, activar el WebSocket una vez y descomprimir el pack en una carpeta fija (no en Descargas, ni dentro del zip, ni en OneDrive).

## 4. Diseño visual: hecho a medida para cada juego, nunca genérico

**Principio:** el motor solo aporta el *comportamiento* (datos, eventos, animaciones de entrada y salida, panel). **El aspecto lo diseña Claude desde cero para cada pack**, a partir del lenguaje visual del juego o del programa concreto. No hay estilos por defecto, y las plantillas solo existen como esqueleto técnico de referencia.

### 4.1 Investigación del lenguaje visual
Antes de proponer nada, Claude estudia el juego como haría un diseñador:

- **Interfaz del juego (HUD):** formas, ángulos, cómo muestra la información.
- **Paleta.**
- **Sensación tipográfica.**
- **Iconografía y texturas.**
- **Ritmo del movimiento.**
- **Momentos icónicos** que el público reconoce.

Ejemplos de lo que tiene que salir (y por qué un pergamino no vale):

| Juego | Lenguaje visual | Cómo se traduce |
|---|---|---|
| Rocket League | estadio neón, coches, marcador de partido, barra de boost, explosiones de gol | meta de subs = **barra de boost** que se llena; alerta = repetición de **"¡GOL!"** con estela; escenas = marcador del estadio |
| Valorant | UI táctica, cortes en diagonal, rojo y blanco roto, tipografía condensada | alerta = banner de **eliminación** con corte diagonal; meta = **rondas ganadas**; escena BRB = fase de compra |
| CS2 | HUD militar sobrio, dinero, rondas, kill feed | alertas como entradas del **kill feed**; sub = "MVP de la ronda"; meta = **$ del equipo** |
| Dark Souls | gótico, brasas, silencio, mensajes en el suelo | contador de muertes "HAS MUERTO" evocado; alertas como **mensajes de otros jugadores** |
| Minecraft | bloques, píxel, logros | alertas = **"¡Logro conseguido!"**; meta = barra de experiencia |
| Noticiero | rótulos de TV, sobriedad, jerarquía | tercios inferiores, ticker y escaleta de informativo |

### 4.2 Metáforas por pieza
Cada pieza se reinterpreta en el idioma del juego: no es "una meta con otro color", es *la barra de boost* o *el marcador de rondas*. El motor da los datos (progreso 3/5, último sub…). Claude decide qué forma tienen.

### 4.3 Libertad total de forma, con un contrato técnico
- Claude escribe el **HTML de cada pieza, su CSS, sus SVG y sus animaciones**.
- El contrato fija solo lo técnico:
  - dónde llegan los datos (atributos `data-*` y eventos del motor),
  - qué clases indican los estados (`entrando`, `visible`, `saliendo`),
  - que no hay JavaScript propio (el motor lo pone).
- `validate_pack.py` comprueba el contrato:
  - HTML y CSS bien formados,
  - sin recursos externos salvo Google Fonts,
  - contraste mínimo,
  - legibilidad a 720p,
  - todas las piezas con todos sus estados.

### 4.4 Reglas contra lo genérico
- **Prueba del intercambio:** si cambias el nombre del juego y el diseño seguiría valiendo para otro, es genérico y se rehace.
- **Cada decisión** (paleta, forma, movimiento, metáfora) se justifica con algo concreto del juego o del streamer.
- **Las 2 propuestas** son dos direcciones distintas *dentro del universo del juego*. Por ejemplo, en Valorant: "Protocolo táctico" (sobrio, de agente) frente a "Definitiva cargada" (energético, de habilidad).
- **Vista previa obligatoria antes de construir:** las piezas clave renderizadas. La persona aprueba o pide cambios.
- **Propiedad intelectual:** se evoca el lenguaje visual (formas, ritmo, paleta, tipografías libres parecidas) sin logos, personajes, iconos, arte ni fuentes oficiales.

### 4.5 Voz
Textos de alertas, escenas y rótulos en el tono del juego y del streamer, **con variantes obligatorias**: sub nueva, resub (con meses), regalo y regalo en bloque.

### 4.6 Reglas de producción
Salen de la crítica de un especialista sobre la primera prueba con canales reales (`plantillas/CRITICA-experta.md`). El concepto acertaba, pero fallaba "cómo es su pantalla". La mayoría de estas reglas las comprueba `validate_pack.py` sobre un render.

1. **Mapa del HUD primero.**
   - Antes de colocar nada, Claude marca las zonas que ocupa la interfaz de cada juego del canal (vida, minimapa, marcador, barra de jefe, inventario) a partir de capturas reales.
   - Ninguna pieza permanente puede solaparse con esas zonas.
   - En canales de variedad: una escena por juego, o las zonas libres comunes.
2. **Presupuesto de pantalla por formato** (piezas permanentes, sin contar la cámara):

   | Formato | Límite |
   |---|---|
   | Juego | 15 % como máximo |
   | Código | 5 % como máximo |
   | Charla | la cámara es el contenido (40 % del ancho o más) |

   El validador lo mide y no deja pasar un pack que se pase.
3. **Primero los eventos del canal.**
   - Antes de la alerta de sub se diseña el momento propio del canal: el golpe que rompe la run, la muerte que acelera la cinta, el cambio de tema…
   - Las alertas nunca cruzan el centro de la acción, y se pueden pausar en momentos críticos (jefe, ronda decisiva).
4. **Escala según el canal.**
   - El tamaño del canal se lee en la investigación.
   - Canal grande: alertas condensadas y solo para regalos en bloque o hitos; metas en cientos o miles.
   - Canal pequeño: metas alcanzables (mensuales).
5. **Una sola fuente por dato**, con su origen declarado: Twitch, comando de chat, atajo o dispositivo.
   - Dos piezas que muestran lo mismo leen el mismo estado.
   - Si un dato depende de que el streamer pulse algo con las manos ocupadas, se descarta o se pasa a comando de chat o atajo de teclado.
6. **Legibilidad comprobada.**
   - Texto de 24 px como mínimo y dato principal de 48 px o más (a 1080p).
   - Contraste de 4,5:1 o más contra el propio panel o contra un velo oscuro. Sin velo, se prueba sobre un fondo claro y otro oscuro.
   - Revisión en render a 720p y a ancho de móvil.
7. **Movimiento con significado.** Las piezas permanentes son estáticas; solo se animan durante un evento. Nada de `infinite` fuera de las alertas.
8. **Imagen limpia.**
   - Nada semitransparente encima del vídeo de la cámara: los efectos van solo en el marco.
   - Sin patrones de menos de 4 px ni texturas de ruido, porque la compresión de Twitch los destroza.

**Control de calidad:** validador automático, capturas automáticas cuando el entorno tiene navegador, y vista previa que la persona aprueba.

## 5. La receta (`pack.json`) y cómo se actualiza un pack

Cada pack lleva su receta completa: versión del motor, id del pack, tema, piezas y variantes, textos, acciones y firma.

**Actualizar o cambiar un pack:**
1. La persona le pasa a Claude el zip (o `pack.json`) y le dice "actualízalo" o "cámbiale X".
2. La skill lee la receta, aplica los cambios y regenera el pack con el motor actual, **con los mismos nombres de archivo e id**.
3. La persona descomprime **encima** de la carpeta. OBS sigue apuntando a las mismas rutas y el estado se conserva, porque se guarda por id de pack.
4. Si hay piezas nuevas, pulsa otra vez "Instalar en OBS".

**Además:**
- El motor está versionado y el panel migra estados antiguos.
- El panel permite exportar e importar la configuración.

## 6. Acciones a medida

Cada pieza declara las acciones que admite. Ejemplos:

- **Contador:** +1, −1, reset.
- **Jefe:** siguiente jefe, intento +1, derrotado.
- **Escaleta:** siguiente bloque.
- **Rótulos:** siguiente titular, mostrar/ocultar nombre y cargo.

**Claude decide, según el directo, qué acciones exponer y por qué vía:**

| Vía | Cómo funciona | Cuándo |
|---|---|---|
| Botón en el panel | directo | siempre |
| Comando de chat | `!muerte`, `!jefe`… con permiso configurable (streamer, mods, VIP, todos) | cuando hay mods, o para interacción con el público |
| Atajo de teclado | "Instalar en OBS" crea una fuente invisible por acción. El atajo "Mostrar" de OBS la activa, el panel lo detecta, ejecuta la acción y la vuelve a ocultar. Sirve también para Stream Deck | juegos a pantalla completa |

## 7. Catálogo de piezas (v1)

- **Para todos:**
  - alertas propias (sub, resub, regalo, lluvia de subs, raid, bits),
  - chat, meta de subs, marco de webcam,
  - escenas empezando/BRB/fin, créditos, historial.
- **Charla y programas:** agenda de temas, rótulo del tema actual.
- **Noticiero:**
  - escaleta (bloques, bloque en curso, tiempo),
  - rótulo de nombre y cargo con cola de invitados,
  - titular con cola, ticker, reloj, mosca de programa, "EN DIRECTO",
  - márgenes de seguridad y animaciones sobrias.
- **Souls-like:** contador de muertes, jefe actual con intentos.
- **Battle royale:** victorias y kills de la sesión (manuales, se dice claramente), retos.
- **Sandbox (Minecraft…):** objetivos del día, contador de días.

## 8. Alertas: propias hasta donde se pueda

- **Propias:** sub, resub, regalo, lluvia de subs, raid y bits (chat anónimo de Twitch).
- **Lo que Twitch no da sin iniciar sesión** (follows, donaciones, puntos de canal):
  - la guía explica cómo dejar solo esas alertas en StreamElements o Streamlabs, con estilo parecido;
  - más adelante, integración opcional.

## 9. Reglas

- **Solo Twitch en la v1.** YouTube y Kick después.
- **Propiedad intelectual:** evocar el juego sin logos, personajes, arte ni fuentes oficiales.
- **Idiomas:** README en inglés (principal) con selector de idioma y traducciones (`docs/i18n/`). Packs en el idioma del canal.
- **Sin código para el usuario final.**
- `build_pack.py` en Python puro, sin dependencias, para que funcione en la app de Claude.

## 10. Pendiente de validar

**Validado en OBS 32 (Windows, 15/10/2026, prueba 2):** "Instalar en OBS"; atajos con otra escena activa y con otra app en primer plano; `!mas`/`!menos` desde el chat; persistencia tras "limpiar caché" y tras reiniciar OBS; el aviso "panel cerrado" aparece y se quita al reabrir el panel.

| Qué | Cómo |
|---|---|
| macOS y Linux | Más adelante |

**Decidido:**
- **Juegos a pantalla completa exclusiva o con antitrampas:** no se prueba aparte. La guía dice que, si un atajo no responde dentro del juego, se ponga el juego en "ventana sin bordes".
- **Aviso "Panel cerrado":** se queda como está, visible en el directo. Así el público puede avisar al streamer.

## 11. Estructura del repo

```
overlay-generator/
├── SKILL.md
├── references/   descubrir-canal.md · entrevista.md · estilos.md · piezas.md · acciones.md · guia-plantilla.md · actualizar.md
├── assets/engine/   obs-link.js · twitch.js · panel/ · piezas/ (con variantes) · base.css
├── assets/themes/   ejemplos: terminal, souls, noticiero, battle-royale, sandbox
└── scripts/   build_pack.py · validate_pack.py
README.md (EN + ES) · DESIGN.md · evals/evals.json
```

## 12. Pruebas de la skill

Casos de prueba:

1. Dark Souls.
2. Noticiero matutino.
3. Fortnite.
4. Minecraft.
5. Solo una URL de canal.
6. "Actualízame este pack" con un pack anterior.

Para cada uno se comprueba:

- la receta es válida y el pack se monta,
- no hay errores de JavaScript,
- el panel conecta e instala contra el OBS simulado,
- se generan capturas para revisar.
