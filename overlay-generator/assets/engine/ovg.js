/* ovg.js · OverlayGenerator engine · overlay runtime
   Load order in every overlay page:
     <script src="../engine/pack.js"></script>      (window.PACK, written by build_pack.py)
     <script src="../engine/core.js"></script>
     <script src="../engine/obs-link.js"></script>
     <script src="../engine/twitch.js"></script>    (only needed if the page shows chat)
     <script src="../engine/ovg.js"></script>
   Then, in the page's own script:
     OVG.onState(s => render(s));           // every change, and once at start
     OVG.onAlert(a => showAlert(a));        // a.type, a.name, a.lines[], a.duration (s), a.months, a.count…
     OVG.onEvent((name, s) => play(name));  // the pack's own events, e.g. "hit"
     OVG.onChat(msg => addLine(msg));       // optional; msg.text is plain text: use OVG.esc() or textContent
   URL parameters (for OBS, the preview and the checker):
     pw=<obs password>   demo=1   freeze=1   alert=<type>   event=<name>   noalert=1   hud=1
     src=<source id>     shows only the pieces of that source (scenes[].sources) and moves its box to 0,0,
                         so each group of pieces can be its own OBS browser source, moved and resized freely
*/
(function () {
  const P = new URLSearchParams(location.search);
  const PACK = window.PACK || { id: 'pack', state: {}, alerts: {}, events: {}, ui: {} };
  const C = window.OVGCore;
  const page = (document.currentScript && document.currentScript.dataset.page) || location.pathname.split('/').pop().replace(/\.html?$/, '');
  const inOBS = !!window.obsstudio;
  const DEMO = P.get('demo') === '1' || (!inOBS && !P.has('pw'));
  const FREEZE = P.get('freeze') === '1';
  const KEY = 'ovg:' + PACK.id + ':state';
  const fns = { state: [], alert: [], event: [], chat: [] };
  let state = Object.assign(C.clone(PACK.state || {}), DEMO ? C.clone(PACK.demoState || {}) : {});
  let creditOn = !!(PACK.credit && PACK.credit.enabled);
  Object.keys(state).forEach(k => { const v = state[k]; if (v && typeof v === 'object' && ('left' in v || 'rate' in v) && v.running && !v.at) v.at = Date.now(); });
  try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && !DEMO) state = Object.assign(state, c); } catch (e) { /* ignore */ }
  let link = null, lastBeat = Date.now(), started = false;

  // One OBS browser source per group of pieces: ?src=<id> of scenes[].sources (see pack-format.md).
  const SCENE = (PACK.scenes || []).find(s => s.id === page) || null;
  const SOURCES = (SCENE && SCENE.sources) || [];
  const SRC = P.get('src') ? (SOURCES.find(x => x.id === P.get('src')) || null) : null;
  const MAIN = !SRC || SOURCES[0] === SRC;          // engine notices live in the scene's first source only

  const call = (list, ...a) => list.forEach(f => { try { f(...a); } catch (e) { console.error(e); } });
  const setState = s => { state = s; try { if (!DEMO) localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } call(fns.state, state); };

  function handle(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'state') { lastBeat = Date.now(); if (msg.credit !== undefined) creditOn = !!msg.credit; setState(msg.state); }
    else if (msg.type === 'beat') lastBeat = Date.now();
    else if (msg.type === 'alert') { if (P.get('noalert') !== '1') call(fns.alert, msg.alert); }
    else if (msg.type === 'event') call(fns.event, msg.name, state);
    else if (msg.type === 'credit') credit();
  }
  function send(msg) {
    if (link) link.send(msg);
    else if (DEMO && window.parent !== window) window.parent.postMessage({ ovg: 'msg', msg, from: page }, '*');
  }

  /* ---------- live: through OBS ---------- */
  function startLive() {
    link = new ObsLink({
      password: P.get('pw') || '',
      onStatus: s => { if (s.state === 'connected') { send({ type: 'hello', page }); lastBeat = Date.now(); } },
      onMessage: handle
    });
    setInterval(() => send({ type: 'here', page }), 10000);
    setInterval(() => warn(link.ready && Date.now() - lastBeat > 12000), 2000);
  }

  /* ---------- demo / preview: messages come from the host page ---------- */
  function startDemo() {
    window.addEventListener('message', e => { const d = e.data || {}; if (d.ovg === 'msg') handle(d.msg); });
    send({ type: 'hello', page });
    const a = P.get('alert'), ev = P.get('event');
    const extra = P.get('state');
    if (extra) { try { setState(Object.assign(C.clone(state), JSON.parse(extra))); } catch (e) { /* ignore */ } }
    if (ev && PACK.events && PACK.events[ev]) setState(Object.assign(C.clone(state), PACK.events[ev].state || {}));
    if (ev) setTimeout(() => call(fns.event, ev, state), 50);
    if (a && P.get('noalert') !== '1') setTimeout(() => call(fns.alert, OVG.sampleAlert(a, FREEZE ? 3600 : undefined)), 80);
  }

  /* ---------- engine-drawn bits: "panel closed" notice and the optional credit ---------- */
  let warnEl;
  function warn(on) {
    if (!MAIN) return;
    if (!warnEl) {
      warnEl = document.createElement('div');
      warnEl.setAttribute('data-ovg', 'warn');
      warnEl.style.cssText = 'position:fixed;top:24px;right:24px;z-index:99999;font:700 26px/1.2 system-ui,sans-serif;color:#fff;background:#8b1a1a;border-radius:10px;padding:10px 16px;display:none';
      warnEl.textContent = '⚠ ' + ((PACK.ui && PACK.ui.panelClosed) || 'Panel closed: open the panel dock in OBS');
      document.documentElement.appendChild(warnEl);   // outside <body>: stays put when ?src= shifts the body
    }
    warnEl.style.display = on ? 'block' : 'none';
  }
  function credit() {
    const c = PACK.credit || {};
    if (!creditOn || !MAIN) return;
    const el = document.createElement('div');
    el.setAttribute('data-ovg', 'credit');
    el.style.cssText = 'position:fixed;left:24px;bottom:24px;z-index:99998;font:600 24px/1.3 system-ui,sans-serif;color:#fff;background:rgba(10,10,14,.92);border-radius:10px;padding:10px 16px;opacity:0;transition:opacity .4s';
    el.textContent = c.text || 'Overlay made with OverlayGenerator · github.com/Ro0oman/OverlayGenerator-Claude-Skill';
    document.documentElement.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, 10000);
  }

  /* ---------- public API ---------- */
  const OVG = {
    PACK, page, params: P, demo: DEMO, frozen: FREEZE, source: SRC ? SRC.id : null,
    get state() { return state; },
    onState(f) { fns.state.push(f); if (started) f(state); return OVG; },
    onAlert(f) { fns.alert.push(f); return OVG; },
    onEvent(f) { fns.event.push(f); return OVG; },
    onChat(f) {
      fns.chat.push(f);
      if (fns.chat.length === 1 && window.OVGTwitch && PACK.channel && !DEMO) OVGTwitch.connect(PACK.channel, ev => { if (ev.type === 'chat') call(fns.chat, ev); }, null, { lang: PACK.lang });
      if (fns.chat.length === 1 && DEMO) demoChat();
      return OVG;
    },
    text: (tpl, vars) => C.text(tpl, Object.assign({}, state, vars || {})),
    timer: t => C.timerLeft(t),
    meter: m => C.meterValue(m),
    num: (v, d) => C.num(v, d, PACK.lang),
    fmt: s => C.fmt(s),
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    duration: () => ((PACK.alertSettings && PACK.alertSettings.duration) || 7),
    sampleAlert(type, duration) {
      const def = (PACK.alerts || {})[type] || { lines: ['{name}'] };
      const a = C.buildAlert(def, { type }, Object.assign({}, C.SAMPLE, PACK.sample || {}));
      a.type = type; a.duration = duration || OVG.duration();
      return a;
    },
    credit,
    get creditOn() { return creditOn; }
  };
  window.OVG = OVG;

  function demoChat() {
    const lines = (PACK.sampleChat && PACK.sampleChat.length) ? PACK.sampleChat : [['nightowl_mod', 'gg', true], ['marta_dev', 'that dodge was clean'], ['pixel_rain', 'one more try!']];
    lines.forEach((l, i) => setTimeout(() => call(fns.chat, { type: 'chat', id: 'demo' + i, name: l[0], user: l[0], text: l[1], color: '', role: { mod: !!l[2] } }), FREEZE ? 0 : 400 * i));
  }

  /* ---------- ?src=: keep only this source's pieces and move its box to the top-left corner ---------- */
  function showOnly(src) {
    const keep = (src.pieces || []).map(n => '[data-piece="' + String(n).replace(/["\\]/g, '\\$&') + '"]');
    const st = document.createElement('style');
    st.textContent = '[data-piece]' + (keep.length ? ':not(' + keep.join(',') + ')' : '') + '{display:none!important}[data-hud]{display:none!important}';
    document.head.appendChild(st);
    const b = src.box || [0, 0, 1920, 1080];
    document.body.style.transformOrigin = '0 0';
    document.body.style.transform = 'translate(' + (-b[0]) + 'px,' + (-b[1]) + 'px)';
  }

  /* ---------- page helpers: freeze animations, outline pieces/HUD ---------- */
  function boot() {
    const st = document.createElement('style');
    st.textContent =
      '[data-hud]{visibility:hidden}' +
      'html.ovg-hud [data-hud]{visibility:visible;outline:3px dashed rgba(255,80,80,.9);background:rgba(255,80,80,.18)}' +
      'html.ovg-hud [data-piece]{outline:3px solid rgba(80,200,255,.9)}' +
      'html.ovg-freeze *,html.ovg-freeze *:before,html.ovg-freeze *:after{animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important}';
    document.head.appendChild(st);
    if (FREEZE) document.documentElement.classList.add('ovg-freeze');
    if (P.get('hud') === '1') document.documentElement.classList.add('ovg-hud');
    if (SRC) showOnly(SRC);
    started = true;
    call(fns.state, state);
    if (DEMO) startDemo(); else startLive();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
