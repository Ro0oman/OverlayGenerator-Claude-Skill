# Translating the README

Thanks for helping! The English [README](../README.md) is the source. Every other language lives in [`docs/i18n/`](i18n/) as `README.<code>.md`.

## Fix an existing translation

1. Open the file in [`docs/i18n/`](i18n/) and click the ✏️ pencil on GitHub.
2. Fix it and open a pull request. That's all.

## Add a new language

1. Copy [`docs/i18n/README.es.md`](i18n/README.es.md) to `docs/i18n/README.<code>.md`. Use a [BCP 47](https://en.wikipedia.org/wiki/IETF_language_tag) code: `pl`, `tr`, `uk`, `zh-TW`…
   Copy a file from `docs/i18n/` rather than the root README, so the image and link paths (`../assets/…`) are already correct.
2. Translate the text. Keep these as they are:
   - image paths, file names (`panel.html`, `pack.json`) and code blocks;
   - chat commands like `!death`. You can translate them as examples, since packs use commands in the channel's language;
   - the badges' URLs, except the label text if you want.
3. **OBS menu names:** use the exact names from OBS in your language if you're sure of them. If you're not, keep the English ones in bold.
4. Update the **language bar** in the new file. The current language goes in **bold** with no link.
5. Add your language to the language bar of **every** README: the root one and all those in `docs/i18n/`.
6. Check the links in the short menu under the badges. GitHub builds each `#anchor` from the heading text, so translated headings need translated anchors. The simplest check is to open the file preview in your pull request and click each link.
7. Open a pull request with the title `docs(i18n): add <Language>`.

## Keeping translations up to date

When the English README changes, translations may fall behind for a while. That's fine. The README says so, and pull requests that bring a translation up to date are always welcome.
