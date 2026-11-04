# Updating a pack

The user brings a zip made by this skill (or just its `pack.json`) and asks for changes: "update it", "add a boss counter", "the alerts are too small", "translate it".

1. **Read `pack.json` first**: concept, scenes, state, actions, alerts. If they sent the zip, unzip it into a work folder; the overlay pages and fonts are in it.
2. **Keep what makes the pack stable**:
   - the same `id` and `short` (OBS scene names come from them),
   - the same file names in `overlays/`,
   - existing state keys and their meaning (the streamer's counters are stored by key). Add new keys; don't rename old ones. If a key must go, leave it in state unused.
   - existing hotkey `key`s and chat `cmd`s, unless the user asks to change them.
3. **Keep the concept.** New pieces speak the same visual language; run the swap test on them too.
4. Bump `version`, **rebuild with `build_pack.py`**, fix every FAIL, look at the screenshots. Always rebuild, even for a one-line change:
   - edit the pack **source** (`pack.json`, `overlays/`, the guide) and let the build write the rest. Never edit `engine/pack.js` or the engine files by hand: the build generates them.
   - the build re-measures every source's box. That is what gives a new piece its own source size (instead of 1920×1080) and keeps a piece that moved or grew from being cut off. Don't copy or type boxes; if something will grow later, use `reserve`.
   - when you move a piece on the page, check its source screenshot (`src-<scene>-<source>.png`) and the boxes printed under `== source boxes` (a changed box shows `was …`).
5. **If only pack.json came** (no overlay pages): you can't rebuild the pages. Ask for the zip; if they don't have it, rebuild the pages from the concept and say that the look may differ slightly.
6. Tell the user how to apply it:
   - unzip the new pack **over** the old folder (same place),
   - if there are new scenes, sources or hotkeys, or any box changed: panel → Setup → **Install / repair in OBS**. It keeps where they moved and how they scaled each source, also when its size changes (it moves it so the pieces stay put; only a rotated source or one with a bounding box needs checking by hand). A pack that moves from one full-screen source to `sources` loses the old one,
   - packs made before `scenes[].sources` existed: add them on the next update, so each piece becomes its own source,
   - their counters and settings stay.

The engine itself is always copied fresh from the skill, so updates also bring engine fixes. The panel merges new state keys with the saved state on start.
