# Overlay pages: the contract

One HTML page per scene, in `overlays/`. They are what OBS shows on top of the game or camera. Look at `assets/example/flight-deck/overlays/flight.html` for a complete one.

## Skeleton

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Pack · Scene</title>
<link rel="stylesheet" href="look.css">          <!-- the pack's own shared look (optional) -->
<style>/* this scene's layout */</style>
</head>
<body>
  <div data-hud="health" data-hud-source="screenshot" style="left:40px;top:28px;width:560px;height:120px"></div>
  <div class="cam" data-piece="camera">…frame only…</div>
  <div class="…" data-piece="run">…</div>
  <div class="…" data-piece="hit" data-event>…</div>   <!-- an event's visual -->
  <div class="…" data-piece="alert" id="alert">…</div>

<script src="../engine/pack.js"></script>
<script src="../engine/core.js"></script>
<script src="../engine/obs-link.js"></script>
<script src="../engine/twitch.js"></script>          <!-- only if the page shows chat -->
<script src="../engine/ovg.js" data-page="flight"></script>
<script src="look.js"></script>                       <!-- the pack's shared helpers (optional) -->
<script>
  OVG.onState(s => { /* draw every value from s */ });
  OVG.onAlert(a => { /* show a.lines for a.duration seconds */ });
  OVG.onEvent((name, s) => { /* play the channel's event */ });
  OVG.onChat(m => { /* m.name, m.text, m.role.mod… use textContent */ });
</script>
</body>
</html>
```

## Page rules

- `html, body` are exactly **1920×1080**, `overflow: hidden`, **transparent background**. Pieces are absolutely positioned.
- Every visible piece has `data-piece="<name>"`. The camera frame is `data-piece="camera"` (hole stays transparent: frame only); VTuber anchors add `data-kind="vtuber"`. Alerts are `data-piece="alert"`. Elements that only appear during an event also get `data-event`.
- If the game or screen share does not fill the screen (the layout reserves columns for camera and pieces), mark its area with an invisible `<div data-zone="content" style="left:…;top:…;width:…;height:…">`. The screen budget then counts only what covers that area. Without it, the whole screen is the content.
- HUD zones of the game (game scenes): `data-hud="<name>"` + `data-hud-source="screenshot"` or `"assumed"`. They are invisible in OBS and outlined with `?hud=1`.
- Purely decorative text (unlit LED segments behind digits, texture letters) goes in an element with `aria-hidden="true"`: the checker skips it for size and contrast.
- Fonts are bundled in `../fonts/` with `@font-face`. **No external URLs** of any kind (fonts, images, scripts).
- No `eval`, no third-party libraries. Plain HTML/CSS/JS.
- The page must look right with only the state: no hard-coded numbers or names in the markup.

## The OVG API (from ovg.js)

| | |
|---|---|
| `OVG.onState(fn)` | called at start and on every change with the whole state object |
| `OVG.onAlert(fn)` | `a.type` (sub/resub/gift/bomb/raid/bits), `a.lines` (copy, already filled), `a.name`, `a.months`, `a.count`, `a.to`, `a.duration` (s), `a.volume` (0–1), `a.test` |
| `OVG.onEvent(fn)` | `(name, state)` for the pack's events |
| `OVG.onChat(fn)` | starts reading the channel's chat (needs twitch.js). `m.name`, `m.text`, `m.color`, `m.role.{broadcaster,mod,vip,sub}` |
| `OVG.timer(t)` / `OVG.fmt(sec)` | seconds left of a state timer / "h:mm:ss" |
| `OVG.meter(m)` / `OVG.num(v, decimals)` | current value of a meter / a number with the pack language's decimal mark ("2,65" in Spanish) |
| `OVG.text(tpl, vars)` | fill `{key}` templates from the state |
| `OVG.esc(str)` | HTML-escape |
| `OVG.frozen` | true with `?freeze=1` (checker/screenshots): skip intro animations, show final frames |
| `OVG.demo` | true in the preview |
| `OVG.creditOn` | whether the credit command is on |
| `OVG.PACK` | the pack recipe |

The engine draws two things itself: the **"panel closed"** notice (top right) and the opt-in **credit** note (bottom left).

**Alerts.** The panel sends one alert at a time and waits `duration + gap` before the next, so the page just shows each alert for `a.duration` seconds. Show `a.lines`; you may style lines differently per `a.type`. Play a sound only from a bundled file (`new Audio('../sounds/x.mp3')`, `volume = a.volume`).

**Timers.** Re-draw them every second from `OVG.timer(state.key)`, without an intro animation each tick.

**Chat.** Only ever insert chat text with `textContent` or `OVG.esc()`. Keep the last N lines.

## URL parameters

`pw` (OBS password, set by Install in OBS) · `demo=1` (preview, no OBS) · `freeze=1` (no animations) · `alert=<type>` (show a sample alert) · `event=<name>` (apply `events.<name>.state` and play it) · `noalert=1` · `hud=1` (outline HUD and pieces) · `state=<json>` (override state keys).

## Checks it must pass (check_render.js)

Per scene: screen budget by format, camera width in talk scenes, no overlap with HUD zones, smallest text ≥ 24 px, contrast against the piece's own solid background, no text leaving its box, nothing off screen, no endless animations outside alerts, no JS errors. Per alert and event: not in the central area (480–1440 × 270–810).

Contrast is measured against the first solid background behind the text (or the lightest colour of a gradient). Give text a solid plate of its own.
