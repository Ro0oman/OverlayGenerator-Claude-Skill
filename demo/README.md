# Live demo

A static site: the example pack (Flight MK-21) with `index.html` as the entry point. It runs entirely in the browser, without OBS.

- **Your own server:** copy this folder as it is (any static host: Nginx, Caddy, Coolify static site…).
- **GitHub Pages:** Pages only serves the repo root or `/docs`, so publish this folder with a small Pages workflow or copy it to a `gh-pages` branch.
- **Locally:** open `index.html` in a browser.

Rebuild it after engine changes:
`python3 overlay-generator/scripts/build_pack.py overlay-generator/assets/example/flight-deck --out /tmp/x --no-render` and copy the result here (keep `index.html`).
