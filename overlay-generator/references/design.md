# Design: concept and production rules

The goal: the streamer and their viewers feel the overlay **belongs to this channel**, and it works in a real stream (readable, never covering the game, never tiring).

## Concept

1. **One idea from the hook**, not from the game. A variety channel's concept comes from the person or the format, never from one game.
2. **A metaphor per piece.** Same data, the channel's form: the sub goal can be "seats filled", "the jackpot", "pilgrim seals"; a sub alert can be a boarding pass, a till receipt, a stamp. Write the mapping down.
3. **Palette** (4–6 named colours with a role each) and **type** (1–2 free families with intent). Avoid the defaults that make everything look alike: cream + serif + terracotta, black + one acid accent, every piece in identical rounded cards, spaced-out uppercase labels everywhere.
4. **Swap test, twice.**
   (a) Change the channel name: if the design would fit another channel, it is generic. Redo it.
   (b) Hide the channel's own pieces and events: if what remains (frames, panels, type, camera) could belong to anyone, push the concept into the containers too (edges, shapes, textures, how things are labelled).
5. **Variety of form**: no more than 2 pieces with the same kind of container in one scene.
6. **The metaphor is correct in its own language.** Music notation, chess notation, airport boards, printing… fans know them. A staff has 5 lines.
7. **Identity survives at 640×360**: what makes it recognisable can't depend on details that vanish when small.
8. **Never imitate game information.** No metaphor may look like a real readout of the game (health, evaluation bar, score, clock, minimap). If viewers could read it as game data, change it.
9. **Intellectual property**: evoke (shapes, rhythm, palette, free look-alike fonts). Never logos, characters, artwork, icons or official fonts of games, publishers, Twitch or sponsors (unless the streamer provides sponsor material for that purpose).

## Pieces and events

- Design **the channel's own event first** (the moment the chat waits for: a hit that ends a run, a death, a topic change, a goal). It is an `event` in pack.json and an animation in the overlay.
- Then the usual pieces that make sense here: alerts, goal, camera frame, chat, timers, agendas, counters.
- **Alert copy has variants**: new sub, resub (with months), gifted sub (with recipient), sub bomb (with count). Never "joins" for a resub.
- **Label = measure.** A piece says literally what it counts. Keep a small table for yourself: label | source (event, action, timer) | what it returns. "Subs this month" is wrong if you only count subs since the panel opened: say "subs today" and reset it with a "new stream" action.
- **Don't repeat what Twitch already shows** (the channel name on its own channel, the stream title over the game) unless it adds something.
- **Chat-triggered things**: a closed rule (an exact command, not "message contains X"), a cooldown, and permissions. Commands that change numbers are for mods or the streamer.
- **Data from titles**: test the rule on 5 real titles; if one gives nonsense, drop it.

## Production rules (the checker measures them)

If two rules clash, give way in this order (first wins): don't cover the game/HUD → readability → alerts out of the centre → minimum camera → piece budget. Example: camera ≥ 640 px and total ≤ 20 % don't fit → the camera stays, total may reach 24 %, permanent pieces drop to ≤ 6 %.

1. **HUD first.** In game scenes, mark the game interface (health, minimap, scoreboard, boss bar, inventory…) with `data-hud` elements, `data-hud-source="screenshot"` if taken from a real screenshot, `"assumed"` otherwise. No piece may overlap them. **Never shrink or move a HUD zone to make the check pass**: move the design.
2. **Screen budget.** Game: permanent pieces ≤ 12 % and total covered (camera included) ≤ 20 %; no opaque block taller than 450 px outside the camera. Code/screen share: pieces ≤ 5 %. Talk: the camera is the content (≥ 768 px wide). If the person is the product (reactions), the camera is ≥ 640 px wide in game scenes too.
3. **Alerts and events out of the centre** (25–75 % of width and height). If the game has critical moments, give the streamer a way to hold alerts (`alertSettings.holdWhen`). Each event has its own visual mark; two events never share a symbol.
4. **Scale with the channel.** Big channels (≥ 1,000 average viewers): single subs in a compact line, the big card for bombs or milestones, goals in hundreds. Small channels: every sub gets its moment, monthly goals that can be reached. Never invent figures: sample values are labelled as samples.
5. **One source per datum.** Two pieces showing the same thing read the same state key.
6. **Readability.** Text ≥ 24 px. In game scenes, essential text of permanent pieces ≥ 32 px; the main number ≥ 48 px. Contrast ≥ 4.5:1 (≥ 3:1 from 48 px) against the piece's **own solid background**; don't rely on shadows or the game behind.
7. **Motion means something.** Permanent pieces don't loop animations. Only events and alerts move.
8. **Clean image.** Nothing semi-transparent over the camera video (frame only). No patterns under 4 px or noise textures (Twitch compression destroys them).

## VTubers

The model is a cut-out: the "camera" is an **anchor** (a stage, a base, a name plate), not a closed frame. Mark it `data-piece="camera" data-kind="vtuber"`. In talk scenes the scene is background + model: ask whether they already have a background before designing one. Chat rules accept the channel's emotes.

## Scenes

Only formats the channel uses, plus starting / be right back / ending. Give each a `backdrop` (a CSS gradient suggesting the content) for the preview; the overlay itself stays transparent.
