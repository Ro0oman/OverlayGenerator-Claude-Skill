---
name: overlay-generator
description: Designs and builds a complete OBS overlay pack made for one specific Twitch channel (scenes, alerts, chat, goals, the channel's own pieces), with a control panel inside OBS, hotkeys, mod chat commands, one-click "Install in OBS", a browser preview and a step-by-step guide. Use when someone asks for stream overlays, OBS scenes or alerts, a Twitch overlay pack, or wants a pack made by this skill updated (they bring its zip or pack.json).
---

# OverlayGenerator

You design an overlay pack for **one** channel and build it with the engine in `assets/engine/`. The streamer gets a zip they can use without touching code. The design is never a template: it comes from what makes *this* channel different.

Read this file first. Then read the references when you reach the step that needs them:

| Step | Read |
|---|---|
| 1–2 Ask and research | `references/discovery.md` |
| 3 Concept and design rules | `references/design.md` |
| 4 pack.json | `references/pack-format.md` |
| 5 Overlay pages | `references/overlay-contract.md` |
| 7 The guide | `references/guide.md` |
| Updating an existing pack | `references/updating.md` |

A complete worked example lives in `assets/example/flight-deck/` (an invented streamer). Read its `pack.json` and one overlay page before writing your own: it shows every mechanism working together. **Do not copy its look**: the airport board belongs to that channel.

## How the pack works (so you can explain it)

- Each scene is one HTML page (1920×1080, transparent) loaded in OBS as a browser source.
- `panel.html` is docked in OBS. It is the brain: it keeps the state, runs actions from buttons, hotkeys and chat commands, reads Twitch chat anonymously for subs/gifts/raids/bits, queues alerts and saves everything inside OBS.
- Panel and overlays talk through the WebSocket server that OBS already has (obs-websocket v5). No Python, no server, no account.
- "Install in OBS" (in the panel) creates every scene and source, already placed, and the hidden sources that make hotkeys work. It can be clicked again safely.
- `preview.html` runs the panel and the overlays together in a browser, without OBS.
- Follows, donations and channel points are not readable anonymously. Do not promise them; the guide explains how to keep only those alerts in StreamElements or Streamlabs.

## Workflow

### 0. Settle the basics in one message
Ask, in the user's language, only what you cannot find yourself (see `references/discovery.md` for the full list):
1. Their Twitch channel (or a description of the stream if they have none).
2. **1–2 screenshots of their stream**, during a game and while talking. Without them, the game HUD and camera position are guesses.
3. Camera, VTuber model, or none.
4. Anything they want or don't want on screen (sub goal, sponsors, sensitive topics).
5. Whether the pack may include an **optional credit command** (`!overlay` shows "made with OverlayGenerator" for a few seconds). It is off unless they say yes.

If they can't answer now, continue with sensible defaults and list your assumptions at the end.

### 1. Research the channel
Follow `references/discovery.md`. Use web search; a channel URL is enough to start. Find the **hook** (what makes this channel different), the real formats and games of the last weeks, the language, the size, recurring bits and commands. Separate facts (with source) from guesses. Never invent facts about a real person.

### 2. Propose two directions
Two concepts, each with a name, the idea in one sentence, how 3–4 key pieces become metaphors of that idea, palette and fonts. Show one quick visual for each when the environment can render HTML (a single 1920×1080 still is enough). Ask the user to pick one or mix them. If they are not around, pick the stronger one and say why.

Rules for the concept are in `references/design.md`. The most important: **the swap test**. If you could change the channel name and the design would still fit another channel, it is generic. Start again.

### 3. Decide pieces, actions and alerts
Before drawing, decide what each scene shows and where every number comes from:
- Scenes: only the formats the channel really uses (plus starting/BRB/ending), max ~5.
- The channel's own **event** (a death, a goal, a topic change…) and its own **pieces** (counters, timers, agendas…).
- For each piece, the **actions** that change it and how the streamer triggers them: a panel button always; a **hotkey** if they play fullscreen; a **chat command** if they have mods (or for audience interaction). Choose by context: a souls player needs a death hotkey; a talk show needs "next topic" for a mod.
- Alerts: sub, resub, gift and bomb always have their own copy; raid and bits if they make sense. Effects (subathon time, goal +1) go on the alert, not in the overlay.

### 4. Write pack.json
Follow `references/pack-format.md`. Work in a fresh folder, e.g. `<workdir>/<pack-id>/`. Copy fonts in `fonts/` (free fonts only: `npm i @fontsource/<family>` and take the `latin` woff2 files; if npm is not reachable, use widely installed system fonts and say so).

### 5. Write the overlay pages
Follow `references/overlay-contract.md`: engine scripts in order, `OVG.onState/onAlert/onEvent/onChat`, `data-piece`, `data-hud`, transparent background, alerts outside the centre, chat as text never HTML. Shared CSS/JS of the pack can live next to the pages.

### 6. Build, check, look
```bash
python3 <skill>/scripts/build_pack.py <pack-folder> --out <out-dir>
```
It validates the recipe, copies the engine, writes `panel.html` and `preview.html`, runs the render checks when Node + Playwright exist (`NODE_PATH=$(npm root -g)`), and zips everything. Fix every **FAIL**. Warnings are fixed or explained to the user.

Then **open the screenshots** in `<out-dir>/<id>-checks/` and judge them as the channel's viewers would: is it readable in 3 seconds, does it cover the game, does it feel like *this* channel? If you can start an independent agent, ask it for a critique with only the screenshots and the concept (no context), and apply what makes sense.

Without a browser in the environment, the static validator still runs; tell the user the visual checks were skipped and ask them to open `preview.html`.

### 7. Write the guide and deliver
Write `GUIDE.md` in the pack's language with `references/guide.md` (rebuild after writing it). Deliver:
- the **zip** (as a file the user can download, or written to their folder in Claude Code),
- 2–3 screenshots of the key scenes and one alert,
- a short message: the concept in one sentence, how to start (unzip somewhere permanent → open `preview.html` → follow the guide), and the assumptions to confirm (HUD positions, camera size, anything you guessed).

## Non-negotiables

- **Made for this channel.** Concepts, metaphors and copy come from the channel's hook and language, not from the game's box art.
- **No official assets.** You may evoke a game (shapes, rhythm, palette, free look-alike fonts) but never use logos, characters, artwork, icons or official fonts. Never imitate the streamer's or sponsors' brands beyond what the streamer gives you.
- **Never cover the game's HUD**, keep alerts out of the centre, keep text ≥ 24 px with real contrast, no endless animations on permanent pieces. The checker enforces these; do not shrink HUD zones to make it pass.
- **Every number has a real source**: a Twitch event, an action (button/hotkey/command) or a timer. The label says exactly what is measured.
- **The pack language is the channel's language.** Panel strings for languages other than English and Spanish go in `pack.json → ui` (the validator lists the missing keys).
- **Credit is opt-in.** `credit.enabled` stays `false` unless the streamer said yes.
- **Talk to the user in their language** and keep the technical detail to what they need.
