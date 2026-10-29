# The guide (GUIDE.md)

The streamer reads this, not you. Write it **in the pack's language**, friendly, second person, no code, no jargon. Name the file in that language if it reads better (`GUIA.md`, `ANLEITUNG.md`…); the build accepts guide/guía/leeme/anleitung/guida/readme names.

Use the menu names OBS shows in that language when you are sure of them; otherwise use the English names in bold. Example: `assets/example/flight-deck/GUIDE.md`.

## Sections, in this order

1. **Hello + the idea in one sentence** ("every stream is a flight…"). Tell them to double-click **preview.html** first.
2. **Put the folder somewhere permanent.** Example path. Not Downloads, not inside the zip, not OneDrive/Dropbox.
3. **Turn on the OBS WebSocket.** Tools → WebSocket Server Settings → Enable → Show Connect Info → copy the password.
4. **Add the panel to OBS.** Docks → Custom Browser Docks → name + `file:///…/panel.html` → Apply.
5. **Connect and install.** Setup tab → password → Connect → Install / repair. List the scenes it creates and, per scene, its sources (one per piece). Tell them they can **move and resize each source freely** (drag it, or Alt-drag to crop) and that Install / repair keeps their changes. Then: "add your camera and game **below** the overlay", with the exact camera size and position of each scene that has one.
6. **Hotkeys** (if any): Settings → Hotkeys → entries starting with ⌨ → key on **Show**, Hide empty. Table key → what it does. The borderless-window tip.
7. **Chat commands** (if any): Chat tab → channel → Listen. Table command → who → what.
8. **Every stream**: the "new stream" action if the pack has one, **keep the panel open** (minimised is fine; if it closes the overlay says so), what counts by itself (subs add time…).
9. **Follows / donations / channel points** (only if they asked for them): those need a login, so keep only those alerts in StreamElements or Streamlabs, styled close to the pack.
10. **Want changes?** Send Claude the `pack.json` and ask; unzip the new pack over the folder; counters stay.

Keep it under ~120 lines. Tables for keys and commands; numbered steps for setup.
