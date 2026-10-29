# Updating a pack

The user brings a zip made by this skill (or just its `pack.json`) and asks for changes: "update it", "add a boss counter", "the alerts are too small", "translate it".

1. **Read `pack.json` first**: concept, scenes, state, actions, alerts. If they sent the zip, unzip it into a work folder; the overlay pages and fonts are in it.
2. **Keep what makes the pack stable**:
   - the same `id` and `short` (OBS scene names come from them),
   - the same file names in `overlays/`,
   - existing state keys and their meaning (the streamer's counters are stored by key). Add new keys; don't rename old ones. If a key must go, leave it in state unused.
   - existing hotkey `key`s and chat `cmd`s, unless the user asks to change them.
3. **Keep the concept.** New pieces speak the same visual language; run the swap test on them too.
4. Bump `version`, rebuild with `build_pack.py`, fix every FAIL, look at the screenshots.
5. **If only pack.json came** (no overlay pages): you can't rebuild the pages. Ask for the zip; if they don't have it, rebuild the pages from the concept and say that the look may differ slightly.
6. Tell the user how to apply it:
   - unzip the new pack **over** the old folder (same place),
   - if there are new scenes, sources or hotkeys: panel → Setup → **Install / repair in OBS** (it keeps where they moved each source; a pack that moves from one full-screen source to `sources` loses the old one),
   - packs made before `scenes[].sources` existed: add them on the next update, so each piece becomes its own source,
   - their counters and settings stay.

The engine itself is always copied fresh from the skill, so updates also bring engine fixes. The panel merges new state keys with the saved state on start.
