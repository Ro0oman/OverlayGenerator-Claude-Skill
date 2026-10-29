// measure_sources.js · OverlayGenerator
// Measures the box [x, y, width, height] of every scenes[].sources entry that has no hand-written "box":
// the union of its pieces (and their children) in the plain scene, with every sample alert and every event,
// plus a margin for shadows. Install in OBS creates each source with that size at that position.
//   NODE_PATH=$(npm root -g) node measure_sources.js <built-pack-folder>
// Prints {"<scene>": {"<source>": [x, y, w, h]}} as JSON. Exit 3 if Playwright is not available.
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { process.exit(3); }
const path = require('path'), fs = require('fs');
const dir = path.resolve(process.argv[2] || '.');
const PACK = JSON.parse(fs.readFileSync(path.join(dir, 'pack.json'), 'utf8'));
const MARGIN = 24;

(async () => {
  let browser;
  try { browser = await chromium.launch(); } catch (e) { process.exit(3); }
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const out = {};
  for (const s of PACK.scenes || []) {
    const todo = (s.sources || []).filter(x => !x.box);
    if (!todo.length) continue;
    const variants = ['&noalert=1']
      .concat(s.alerts === false ? [] : Object.keys(PACK.alerts || {}).map(a => '&alert=' + a))
      .concat((s.events || []).map(e => '&noalert=1&event=' + e));
    const rects = {};
    for (const v of variants) {
      await page.goto('file://' + path.join(dir, s.file) + '?demo=1&freeze=1' + v);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const got = await page.evaluate(() => {
        const r = {};
        document.querySelectorAll('[data-piece]').forEach(p => {
          [p, ...p.querySelectorAll('*')].forEach(e => {
            const b = e.getBoundingClientRect();
            if (!b.width || !b.height) return;
            const u = r[p.dataset.piece] || (r[p.dataset.piece] = { l: b.left, t: b.top, r: b.right, b: b.bottom });
            u.l = Math.min(u.l, b.left); u.t = Math.min(u.t, b.top); u.r = Math.max(u.r, b.right); u.b = Math.max(u.b, b.bottom);
          });
        });
        return r;
      });
      for (const [k, b] of Object.entries(got)) {
        const u = rects[k] || (rects[k] = { ...b });
        u.l = Math.min(u.l, b.l); u.t = Math.min(u.t, b.t); u.r = Math.max(u.r, b.r); u.b = Math.max(u.b, b.b);
      }
    }
    out[s.id] = {};
    for (const x of todo) {
      const rs = (x.pieces || []).map(p => rects[p]).filter(Boolean);
      if (!rs.length) continue;
      const l = Math.max(0, Math.floor(Math.min(...rs.map(r => r.l)) - MARGIN));
      const t = Math.max(0, Math.floor(Math.min(...rs.map(r => r.t)) - MARGIN));
      const r = Math.min(1920, Math.ceil(Math.max(...rs.map(q => q.r)) + MARGIN));
      const b = Math.min(1080, Math.ceil(Math.max(...rs.map(q => q.b)) + MARGIN));
      out[s.id][x.id] = [l, t, r - l, b - t];
    }
  }
  console.log(JSON.stringify(out));
  await browser.close();
})();
