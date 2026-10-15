# pack.json

The recipe of the pack. `build_pack.py` validates it, copies it into the pack and turns it into `engine/pack.js` (`window.PACK`) for the panel and overlays. Keep `id` and file names stable across versions: that is what lets a new version be unzipped over the old one.

Full working example: `assets/example/flight-deck/pack.json`.

## Top level

```jsonc
{
  "engine": "1.0.0",              // filled in by the build
  "version": "1.0.0",             // the pack's own version; bump it on updates
  "id": "mika-flight-deck",       // lowercase, digits, dashes. Never changes.
  "name": "Flight MK-21",         // shown in the panel header
  "short": "MK-21",               // prefix of the OBS scene names ("MK-21 · Lounge"); short and unique
  "logo": "✈",                    // one character for the panel header (optional)
  "channel": "mika_aloft",        // Twitch login, lowercase
  "lang": "en",                   // pack language (BCP 47). en and es have built-in panel strings
  "concept": "…",                 // one or two sentences; helps future updates keep the idea
  "theme": { "accent": "#ffc72c", "accent2": "#ffe08a", "onAccent": "#1a1400" },   // panel colours
  "credit": { "enabled": false, "command": "!overlay" },   // opt-in only
  "scenes": [ … ], "state": { … }, "actions": { … }, "panel": [ … ],
  "alerts": { … }, "alertSettings": { … }, "events": { … },
  "demoState": { … }, "sample": { … }, "sampleChat": [ … ],
  "ui": { … }                     // panel strings; required for languages other than en/es
}
```

## scenes

```jsonc
{ "id": "flight", "label": "In flight", "icon": "🎮", "file": "overlays/flight.html",
  "format": "game",               // game | talk | code | screen  (sets the screen budget the checker applies)
  "events": ["turbulence"],       // events the checker should render in this scene
  "alerts": true,                 // false if the scene intentionally shows no alerts (e.g. ending)
  "backdrop": "linear-gradient(…)"// preview background only; the overlay stays transparent
}
```
OBS scene names become `<short> · <label>`; the browser source is `<short> · <label> · overlay`.

## state

Every value shown or changed lives here, with its starting value. Kinds:
- numbers, booleans, strings, arrays (e.g. a list of topics);
- **timers**: `{ "left": 10800, "running": true, "at": 0 }` (seconds left; the engine starts the clock).

Use the same key everywhere the same thing is shown.

## actions

```jsonc
"turbulence": {
  "label": "+1 turbulence",       // button text, ≤ 28 characters
  "primary": true,                // highlighted button
  "key": "F9",                    // suggested hotkey → creates the hidden helper source in OBS
  "cmd": "!turb",                 // chat command: lowercase !word, unique
  "perm": "mods",                 // me (streamer only) | mods | vip | subs | all. The streamer can always.
  "cooldown": 2,                  // seconds between uses from chat (default 2, or 10 for "all")
  "do": [ { "op": "add", "key": "turbulence", "value": 1 }, { "op": "event", "name": "turbulence" } ]
}
```

### Ops

| op | fields | does |
|---|---|---|
| `add` | key, value=1, min, max | add to a number; min/max may be `"$otherKey"` |
| `set` | key, value | value: literal, `"$key"`, `"@eventValue"` or a template `"B{boss}"` |
| `toggle` | key | flip a boolean |
| `push` / `pop` | key, value, limit | append to / remove the last of an array |
| `next` / `prev` | key, list | move an index over `state[list]` |
| `stamp` | key | `state[key] = now` (ms), e.g. when a topic started |
| `reset` | key | back to the starting value |
| `timer.add` / `timer.set` | key, value (s) | negative to subtract |
| `timer.start` / `timer.stop` / `timer.toggle` | key | |
| `event` | name | the overlays play this event (`OVG.onEvent`) |
| `scene` | id | switch OBS to one of the pack's scenes |

Any op can carry:
- `"times": number | "@count" | "$key"` and `"per": n` → `value × floor(times / per)` (e.g. 1:00 per 100 bits);
- `"if": { "key": "approach", "eq": true }` (also `ne`, `gt`, `lt`).

Event values available as `@…` in alert effects and chat commands: `name, months, to, count, amount, viewers, plan, args` (`args` = text after a chat command).

### Choosing triggers

- Panel button: always.
- `key`: anything the streamer needs while playing fullscreen (death, next boss, undo). Suggest F8–F12 or keys they name.
- `cmd`: for mods, so they can help without the streamer touching anything; or `perm: "all"` for audience interaction (keep those harmless: show something, never change counts).
- Every action needs at least one trigger (the validator warns otherwise).

## panel

Cards on the panel's **Live** tab, top to bottom. Each card:

```jsonc
{ "title": "Turbulence", "meta": "{flight}", "note": "optional small text",
  "widgets": [ … ], "buttons": ["turbulence", "approach", "calm"] }
```

| widget | fields |
|---|---|
| `big` | key, `danger: {gt: 0}` (red when true), `facts: [[label, template], …]` beside the number |
| `facts` | rows: `[[label, template, {if, tag}], …]` |
| `timer` | key, suffix, max (seconds, draws a bar) |
| `progress` | key, max (number or state key), edit (lets the streamer change the target) |
| `list` | key, index, since (stamp key, shows minutes), edit (edit the list, one per line) |
| `text` | key, edit |
| `flag` | key, on, off (texts for true/false) |
| `note` | text (template) |

Templates: `{key}` (arrays join with " · ", timers format as h:mm:ss) and `{list@index}` (the current item).

The **Alerts**, **Chat**, **Hotkeys** and **Setup** tabs are generated from `alerts` and `actions`; you don't describe them.

## alerts

```jsonc
"sub":   { "icon": "🎫", "label": "Sub", "lines": ["{name}", "boarding pass issued", "+5:00 fuel"],
           "effects": [ { "op": "timer.add", "key": "fuel", "value": 300 }, { "op": "add", "key": "seats", "value": 1 } ] },
"resub": { …, "lines": ["{name}", "frequent flyer · {months} months"] },
"gift":  { …, "lines": ["{name}", "upgrades {to} to first class"] },
"bomb":  { …, "lines": ["{name}", "charters {count} seats"], "effects": [ { "op": "add", "key": "seats", "value": 1, "times": "@count" } ] },
"raid":  { …, "min": 2, "lines": ["{name}", "connecting flight · {count} passengers"] },
"bits":  { …, "min": 100, "lines": ["{name}", "duty-free · {count} bits"] }
```
- `sub`, `resub`, `gift`, `bomb` are required. `raid`, `bits` optional.
- `lines` are what the overlay prints; `{count}` = bomb size, raid viewers or bits.
- `effects` always run (even if the streamer turns that alert's display off); `min` skips the alert, not the effects.
- Gifts inside a bomb don't fire separate `gift` alerts.

```jsonc
"alertSettings": { "duration": 7, "gap": 1.5, "volume": 70,
  "holdWhen": { "key": "approach", "eq": true },          // queue alerts while true
  "holdLabel": "Hold alerts on final approach", "holdHint": "Turn on before a boss fight" }
```

## events, demo and samples

```jsonc
"events": { "turbulence": { "label": "Turbulence (death)", "state": { "turbulence": 7 } } },   // state used for ?event= previews
"demoState": { "manifest": ["marta_dev", "nightowl"] },     // merged into state in the preview only
"sample": { "name": "marta_dev", "months": 7, "to": "nightowl", "count": 5, "amount": 500, "viewers": 42 },
"sampleChat": [["nightowl_mod", "gg", true], ["marta_dev", "that dodge was clean"]]   // [name, text, isMod]
```
Sample names are invented. Never use real viewers' names.

## ui (panel strings)

English and Spanish are built in (`assets/engine/panel-strings.js`). For any other `lang`, copy every key of the `en` block into `ui` and translate it; the validator lists missing keys. You can also override single strings in en/es (e.g. a themed `panelClosed`).
