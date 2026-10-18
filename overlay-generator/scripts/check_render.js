// check_render.js · OverlayGenerator
// Renders every scene of a built pack and checks the production rules on the real pixels.
//   NODE_PATH=$(npm root -g) node check_render.js <built-pack-folder> [--out <dir>]
// Exit codes: 0 all good · 1 something FAILS · 3 Playwright not available.
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('Playwright not found'); process.exit(3); }
const path = require('path'), fs = require('fs');
const args = process.argv.slice(2);
const oi = args.indexOf('--out'); const out = oi >= 0 ? args.splice(oi, 2)[1] : null;
const dir = path.resolve(args[0] || '.');
const PACK = JSON.parse(fs.readFileSync(path.join(dir, 'pack.json'), 'utf8'));
const LIMIT = { game: 12, code: 5, screen: 5, talk: null };       // % of the screen for permanent pieces
const TOTAL_GAME = 20;                                             // % covered in game scenes, camera included
const MOBILE = 400 / 1920;                                         // a phone shows the stream ~400 px wide
if (out) fs.mkdirSync(out, { recursive: true });

(async () => {
  let browser;
  try { browser = await chromium.launch(); } catch (e) { console.log('Chromium could not start: ' + e.message.split('\n')[0]); process.exit(3); }
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  let fails = 0, warns = 0;

  async function open(file, q, backdrop) {
    await page.goto('file://' + path.join(dir, file) + '?demo=1&freeze=1' + q);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    if (backdrop) await page.evaluate(b => { document.documentElement.style.background = b; }, backdrop);
  }
  const measure = () => page.evaluate((MOBILE) => {
    const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05 && r.width > 0 && r.height > 0; };
    const R = e => e.getBoundingClientRect();
    const all = [...document.querySelectorAll('[data-piece]')].filter(vis);
    const cams = all.filter(e => e.dataset.piece === 'camera');
    const pieces = all.filter(e => e.dataset.piece !== 'camera');
    const perm = pieces.filter(e => e.dataset.piece !== 'alert' && e.dataset.event === undefined);
    // If the page marks where the game / screen share goes (data-zone="content"), only what covers it counts.
    const zones = [...document.querySelectorAll('[data-zone=content]')].map(R);
    const clipArea = r => zones.length ? zones.reduce((a, z) => a + Math.max(0, Math.min(r.right, z.right) - Math.max(r.left, z.left)) * Math.max(0, Math.min(r.bottom, z.bottom) - Math.max(r.top, z.top)), 0) : r.width * r.height;
    const area = rs => rs.reduce((a, r) => a + clipArea(r), 0) / 20736;
    const hud = [...document.querySelectorAll('[data-hud]')].map(e => ({ n: e.dataset.hud, r: R(e), src: e.dataset.hudSource }));
    const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const overlaps = []; all.forEach(p => hud.forEach(h => { if (inter(R(p), h.r) > 0) overlaps.push(p.dataset.piece + ' ↔ ' + h.n); }));
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(parseFloat); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
    const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    let min = 999, minTxt = ''; const low = [], unmeasured = new Set(), small32 = new Set(), overflow = [], mobile = [];
    pieces.forEach(p => {
      let maxFs = 0; const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let t;
      while ((t = w.nextNode())) {
        if (!t.textContent.trim()) continue; const el = t.parentElement; if (!vis(el) || el.closest('[aria-hidden=true]')) continue;   // decorative text is skipped
        const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
        if (fs < min) { min = fs; minTxt = t.textContent.trim().slice(0, 30); }
        maxFs = Math.max(maxFs, fs);
        if (p.dataset.piece !== 'alert' && fs < 32) small32.add(p.dataset.piece);
        const fg = parse(cs.color); let bg = null, n = el;
        while (n && n !== document.documentElement) {
          const ncs = getComputedStyle(n), b = parse(ncs.backgroundColor);
          if (b && b.a >= 0.75) { bg = b; break; }
          const gi = ncs.backgroundImage;
          if (gi && gi !== 'none') { const cols = [...gi.matchAll(/rgba?\([^)]+\)|#[0-9a-f]{6}/gi)].map(m => m[0]).map(c => c[0] === '#' ? { r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16), a: 1 } : parse(c)).filter(c => c && c.a >= 0.75); if (cols.length) { bg = cols.reduce((a, c) => lum(c) > lum(a) ? c : a); break; } unmeasured.add(p.dataset.piece); }
          n = n.parentElement;
        }
        if (!fg || !bg) { unmeasured.add(p.dataset.piece); continue; }
        const cr = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
        if (cr < (fs >= 48 ? 3 : 4.5)) low.push(p.dataset.piece + ': "' + t.textContent.trim().slice(0, 20) + '" ' + cr.toFixed(1) + ':1');
      }
      if (maxFs && maxFs * MOBILE < 10) mobile.push(p.dataset.piece + ' (' + maxFs + 'px → ' + (maxFs * MOBILE).toFixed(1) + 'px)');
      [p, ...p.querySelectorAll('*')].forEach(el => {
        if (!vis(el) || !el.textContent.trim()) return;
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'hidden') overflow.push(p.dataset.piece + ': "' + el.textContent.trim().slice(0, 25) + '"');
        const r = R(el), pr = R(p);
        if (el !== p && el.children.length === 0 && (r.right > pr.right + 2 || r.left < pr.left - 2 || r.bottom > pr.bottom + 2)) overflow.push(p.dataset.piece + ': "' + el.textContent.trim().slice(0, 25) + '" leaves its box');
      });
    });
    const offscreen = all.filter(e => { const r = R(e); return r.left < -1 || r.top < -1 || r.right > 1921 || r.bottom > 1081; }).map(e => e.dataset.piece);
    const infinite = [...document.querySelectorAll('[data-piece] *, [data-piece]')].filter(e => vis(e) && getComputedStyle(e).animationIterationCount === 'infinite' && !e.closest('[data-piece=alert]')).map(e => e.className || e.tagName);
    const C = { left: 480, right: 1440, top: 270, bottom: 810 };
    const central = pieces.filter(e => e.dataset.piece === 'alert' || e.dataset.event !== undefined).map(e => ({ n: e.dataset.piece, a: inter(R(e), C) })).filter(x => x.a > 0).map(x => x.n + ' (' + Math.round(x.a) + ' px²)');
    const camW = cams.length ? Math.max(...cams.map(c => R(c).width)) : 0;
    return { perm: area(perm.map(R)), total: area(all.filter(e => e.dataset.piece !== 'alert').map(R)), alert: area(pieces.filter(e => e.dataset.piece === 'alert').map(R)),
      cams: cams.length, vtuber: cams.some(c => c.dataset.kind === 'vtuber'), camW, overlaps: [...new Set(overlaps)], min, minTxt, low: [...new Set(low)], unmeasured: [...unmeasured],
      small32: [...small32], overflow: [...new Set(overflow)], mobile, offscreen, infinite: [...new Set(infinite)], central, hudN: hud.length, hudShot: hud.filter(h => h.src === 'screenshot').length };
  }, MOBILE);

  function report(title, m, fmt, full) {
    const res = [];
    if (full) {
      const lim = LIMIT[fmt];
      if (lim) res.push([m.perm <= lim, 'permanent pieces ' + m.perm.toFixed(1) + ' % of the screen (limit ' + lim + ' %)']);
      if (fmt === 'game') res.push([m.total <= TOTAL_GAME, 'total covered with camera ' + m.total.toFixed(1) + ' % (limit ' + TOTAL_GAME + ' %)']);
      if (fmt === 'talk' && m.cams && !m.vtuber) res.push([m.camW >= 768, 'camera ' + Math.round(m.camW) + ' px wide (talk: ≥ 768 px)']);
      res.push([m.infinite.length === 0, 'endless animations outside alerts: ' + (m.infinite.join(', ') || 'none')]);
    } else res.push([m.central.length === 0, 'alerts/events in the central area: ' + (m.central.join(', ') || 'none')]);
    res.push([m.overlaps.length === 0, 'overlaps with the game HUD: ' + (m.overlaps.join(', ') || 'none')]);
    if (m.min < 999) res.push([m.min >= 24, 'smallest text ' + m.min + 'px ("' + m.minTxt + '")']);
    res.push([m.low.length === 0, 'low contrast: ' + (m.low.slice(0, 5).join(' | ') || 'none')]);
    res.push([m.overflow.length === 0, 'text leaving its box: ' + (m.overflow.slice(0, 5).join(' | ') || 'none')]);
    res.push([m.offscreen.length === 0, 'pieces off screen: ' + (m.offscreen.join(', ') || 'none')]);
    console.log('\n== ' + title);
    res.forEach(([ok, t]) => { console.log((ok ? '  OK    ' : '  FAIL  ') + t); if (!ok) fails++; });
    if (full) {
      m.mobile.forEach(t => { console.log('  WARN  hard to read on a phone: ' + t); warns++; });
      if (fmt === 'game' && m.small32.length) { console.log('  WARN  text under 32 px in permanent game pieces (secondary info only): ' + m.small32.join(', ')); warns++; }
      if (m.unmeasured.length) { console.log('  WARN  contrast not measurable (no solid background): ' + m.unmeasured.join(', ')); warns++; }
      if (fmt === 'game') {
        if (!m.hudN) { console.log('  WARN  game scene without data-hud zones'); warns++; }
        else if (!m.hudShot) { console.log('  UNVERIFIED  all ' + m.hudN + ' HUD zones are assumed: confirm them with a screenshot of the stream'); warns++; }
        else console.log('  OK    HUD checked against a screenshot in ' + m.hudShot + ' of ' + m.hudN + ' zones');
      }
    }
  }

  const shot = async name => { if (out) await page.screenshot({ path: path.join(out, name + '.png') }); };
  for (const s of PACK.scenes) {
    await open(s.file, '&noalert=1', s.backdrop);
    report('scene "' + s.id + '" · ' + s.format, await measure(), s.format, true);
    await shot('scene-' + s.id);
    await open(s.file, '&noalert=1&hud=1', s.backdrop); await shot('hud-' + s.id);
    if (s.alerts !== false) for (const a of Object.keys(PACK.alerts || {})) {
      await open(s.file, '&alert=' + a, s.backdrop);
      const m = await measure();
      report('  alert "' + a + '" in "' + s.id + '" · ' + m.alert.toFixed(1) + ' %', m, s.format, false);
      await shot('alert-' + a + '-' + s.id);
    }
    for (const ev of s.events || []) {
      await open(s.file, '&noalert=1&event=' + ev, s.backdrop);
      await page.waitForTimeout(300);
      report('  event "' + ev + '" in "' + s.id + '"', await measure(), s.format, false);
      await shot('event-' + ev + '-' + s.id);
    }
  }
  console.log('\nJS errors: ' + ([...new Set(errs)].join(' | ') || 'none'));
  if (errs.length) fails++;
  console.log(fails ? '\n' + fails + ' render checks FAIL · ' + warns + ' warnings' : '\nALL RENDER CHECKS PASS · ' + warns + ' warnings');
  if (out) console.log('Screenshots: ' + out);
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
