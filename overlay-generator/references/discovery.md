# Discovery: ask, then research

## Ask the streamer first

Some things only the streamer knows. Ask in one short message (their language), with a default for each so they can just say "ok":

1. **Channel** (twitch.tv/…), or what they stream if they have no channel yet.
2. **1–2 screenshots** of a real stream: one in game, one talking. They fix the HUD zones and the camera size. Without them, everything about the HUD is an assumption and the checker will say so.
3. **Camera**: webcam, VTuber model (cut-out, no rectangle), or no camera. Do they already have an illustrated background?
4. **Goals and sponsors**: do they want a sub goal on screen? Is there a sponsor with contract requirements (logo size, command)? Use only material they provide.
5. **Sensitive topics**: anything about health, body, voice or private life the concept must not lean on.
6. **Credit command**: may the pack include `!overlay` (shows "made with OverlayGenerator" for a few seconds)? Default: no.

If they can't answer, continue and mark every assumption.

## Research the channel

Use web search. Useful pages (they change; use what loads): the channel page and its "about", `streamscharts.com/channels/<name>` and `/streams`, `twitchtracker.com/<name>`, `decapi.me/twitch/title/<name>` (current title), the creator's YouTube, X or Wikipedia if they are known.

Write down, with the source next to each fact:

- **What they actually do**: categories and roughly how many hours each over the last 30–60 days (not just the last stream), stream titles, recurring formats, chat commands (`!something`), challenges, subathons, sponsors, collaborations.
- **The hook**: what makes the channel different ("never takes a hit", "plays while walking on a treadmill", "a shop that never closes"). It is usually in the titles.
- **Games, identified in their store** (Steam, eShop…), not only by category name. If a game has Twitch integration (chat controls something), reserve that area and show its commands.
- **Recurring formats**: anything in 2+ recent titles is a candidate for its own piece or state, before generic counters.
- **Scenes it needs**: only categories with 2+ streams or 20 %+ of the hours in the last 60 days. Marginal stuff gets no scene.
- **Trend**: compare the last 14 days with the last 60. If the main category changed, the main scene is the recent one.
- **Size**: average viewers and followers. It changes alerts and goals (see design.md).
- **Language**: the pack goes in that language.
- **Titles table**: date × category × title of recent streams. If one title repeats for days or across categories, it cannot be the hook or a main piece; if a piece uses it, a mod command or hotkey must be able to override it.

### Honesty rules
- You cannot watch the videos. Do not invent what is not in a source.
- Separate **verified** (source) from **assumed** (your inference). If two sources disagree, say so.
- Facts the concept depends on need the source's own words. If the source says "planned to be", don't write "is".
- No dates, records or events you can't back with a source.

## When there is no channel

Interview instead (max 4 questions, each with a default): what they play or talk about, the vibe in three words, the moment their chat waits for, and what they'd like to count or show. Build the hook from those answers.
