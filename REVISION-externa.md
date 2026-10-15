# Revisión externa del DESIGN.md (agente independiente)

Etiquetas: **[V]** comprobado con una fuente o una prueba. **[O]** opinión o sospecha del revisor.

## 1. Veredicto

La separación entre un motor fijo y un tema por usuario es correcta, y el prototipo demuestra que la comunicación funciona. Lo que no está resuelto es la experiencia de la persona sin conocimientos técnicos: activar el WebSocket, copiar la contraseña, sacar rutas `file:///`, crear las fuentes a mano y no cerrar el dock. Además, "Claude ve tu canal" no funciona como se describe en todas las superficies.

**El mayor riesgo es la contraseña de OBS repartida en la URL de cada overlay:** da control total de OBS.

## 2. Problemas bloqueantes

### B1. La contraseña del WebSocket está en las URL de los overlays (`?pw=`)

- **Qué permite.** Con ella se puede parar el directo, crear o cambiar fuentes y leer o cambiar el destino de emisión. [V] El protocolo v5 incluye `StopStream`, `CreateInput`, `Get/SetStreamServiceSettings`.
- **Riesgo probable.** [O] La clave de emisión se puede leer con `GetStreamServiceSettings`.
- **Cómo se filtra.**
  - [O] Al enseñar las propiedades de la fuente en directo.
  - [O] En capturas compartidas para pedir ayuda.
  - [O] En colecciones de escenas exportadas.
  - Si un mensaje de chat lograra ejecutar código en un overlay (XSS), tendría la contraseña.
- **Riesgo añadido.** Los usuarios desactivarán la autenticación "para simplificar".
- **Solución propuesta.**
  - Probar `BroadcastChannel` y `localStorage` entre el dock y las fuentes cargadas como `file:///`. [V] En el foro de OBS hay un caso de que funciona con `file:///` y no con "Archivo local".
  - Si funciona, los overlays dejan de necesitar contraseña. El WebSocket quedaría solo para el panel.
  - Pintar el chat siempre con `textContent`.
  - Prohibir en la guía desactivar la autenticación.

### B2. El montaje en OBS es demasiado para alguien sin conocimientos técnicos

- **El problema.** Hay que crear unas 8 fuentes con sus tamaños, ajustes y orden de capas. Además las rutas se rompen si se abre desde el zip, si la carpeta está en OneDrive o si se mueve.
- **Solución propuesta.**
  - Un botón **"Instalar en OBS"** en el panel que cree las escenas y fuentes ya colocadas con `CreateScene` y `CreateInput` [V].
  - Alternativa: que el panel genere una colección de escenas importable.
  - Que la guía diga: "descomprime en C:\Overlays".

### B3. "Claude accede a tu canal" no funciona en Claude.ai tal como está diseñado

- **Qué falla.**
  - [V] La herramienta de lectura web de Claude solo abre URL que ya han aparecido en la conversación y no ejecuta JavaScript. Una URL de decapi construida por Claude se rechazaría.
  - [V] streamscharts da datos contradictorios.
  - [O] Los canales pequeños probablemente no aparecen.
- **Solución propuesta.** Plantearlo como "pega tu canal y yo busco": búsqueda web, y si no basta, entrevista. Que sea un extra, no lo principal. En Claude Code hay más margen.

### B4. Las piezas estrella no se pueden manejar a mitad de partida

- **El problema.** El contador de muertes y los intentos contra un jefe obligan a hacer clic en el dock mientras se juega a pantalla completa. [V] obs-websocket no avisa cuando se pulsa un atajo de teclado.
- **Solución propuesta.**
  - Comandos de chat para moderadores (`!muerte`, `!jefe`).
  - Que un atajo de OBS muestre u oculte una fuente vacía y el panel escuche ese cambio (evento `SceneItemEnableStateChanged`).
  - Ser honesto en la guía: las kills de Fortnite son manuales.

## 3. Problemas importantes

- **I1. Un único "cerebro" y la persistencia.**
  - Sin el dock abierto no se cuentan subs.
  - La prueba de reiniciar OBS está sin hacer.
  - [V] Limpiar la caché borra `localStorage`.
  - Cada overlay lee el chat por su cuenta y puede descuadrarse.
  - **Solución propuesta:** quitar duplicados por id, un único contador, copia de seguridad del estado con `SetPersistentData` y aviso de "panel cerrado" en el overlay.
- **I2. Frente a StreamElements o Streamlabs.**
  - Faltan follows, donaciones, puntos de canal, TTS, YouTube y Kick.
  - **Solución propuesta:** presentarlo como complemento ("alertas en SE, escenas y rótulos aquí").
- **I3. Calidad visual de forma consistente.**
  - Si el tema solo lleva colores y fuentes, todos los packs se parecerán. Si Claude escribe CSS libre, se pierde fiabilidad.
  - **Solución propuesta:** 3–4 diseños curados por pieza, capturas automáticas y comprobación de contraste y legibilidad a 720p.
- **I4. El noticiero queda corto.** Necesita escaleta, cola de titulares, rótulos de nombre y cargo, márgenes de seguridad y quizá un operador. O se diseña bien, o fuera de la v1.
- **I5. Mantenimiento.**
  - No hay forma de actualizar packs ya instalados.
  - [V] Los `file://` comparten almacenamiento y chocan entre sí.
  - **Solución propuesta:** prefijo de pack y versión en el almacenamiento, "actualizar motor" y exportar/importar la configuración.
- **I6. Twitch cambia.**
  - [V] Recomienda pasar a EventSub.
  - [V] Cerró el WebSocket no cifrado en 2025. El motor ya usa `wss`.
  - **Solución propuesta:** aislar `twitch.js` y revisar el chat compartido.

## 4. Mejoras menores

- Suscribirse solo a la categoría General en el `Identify`.
- Meter las Google Fonts dentro del pack.
- Que el panel compruebe la instalación.
- Rutas de Mac y Linux en la guía.
- Preguntar el idioma en vez de deducirlo.

## 5. Supuestos sin verificar y cómo probarlos

| Supuesto | Cómo probarlo |
|---|---|
| El estado sobrevive al reinicio de OBS | Prueba 7, también tras limpiar la caché |
| Un dock cerrado u oculto sigue ejecutándose | Cerrarlo y meter un sub de prueba |
| `BroadcastChannel` funciona entre dock y fuente con `file:///` | Prototipo de 20 líneas |
| `GetStreamServiceSettings` devuelve la clave de emisión | Llamarlo desde el prototipo |
| El puerto 4455 escucha en toda la red local | `netstat -an \| find "4455"` |
| `build_pack.py` corre en Claude.ai y puede sacar capturas | Probar en Pro y Team |
| El descubrimiento funciona con canales pequeños | 5 canales de menos de 50 espectadores |
| Funciona en macOS y Linux | Probarlo |

## 6. Preguntas abiertas

1. ¿Transporte por WebSocket con contraseña, o local sin contraseña?
2. ¿Alertas propias, o delegarlas en StreamElements?
3. ¿Superficie principal Claude.ai o Claude Code?
4. ¿Qué piezas entran en la v1?
5. ¿Cómo se actualiza el motor de packs ya instalados?
6. ¿Quién da soporte un día de directo?

## Fuentes

- [Protocolo obs-websocket](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [Herramienta de lectura web de Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)
- [Ejecución de código y red en Claude.ai](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude)
- [Skills en Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude)
- [Migración de IRC de Twitch](https://dev.twitch.tv/docs/chat/irc-migration/)
- [Cierre del WebSocket no cifrado de Twitch](https://discuss.dev.twitch.com/t/decommission-of-non-secure-websocket-connections-to-twitch-irc-servers/64142)
- [Foro OBS: BroadcastChannel](https://obsproject.com/forum/threads/broadcastchannel-between-browser-docks-and-browsersource-local-files-no-longer-working.153644)
- [Foro OBS: localStorage](https://obsproject.com/forum/threads/does-localstorage-get-cleared-during-obs-updates.159835)
