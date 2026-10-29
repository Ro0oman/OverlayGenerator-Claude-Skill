/* panel.js · OverlayGenerator engine · control panel
   The panel is the brain of the pack: it keeps the state, runs actions (buttons, hotkeys, chat
   commands), reads Twitch events, queues alerts, saves everything inside OBS and tells the overlays.
   Everything it shows comes from window.PACK (pack.json). ?demo=1 runs it without OBS. */
(function () {
  const P = new URLSearchParams(location.search);
  const PACK = window.PACK, C = window.OVGCore;
  const STR = window.OVG_STR || { en: {} };          // panel-strings.js; pack.json "ui" overrides any of them
  const DEMO = P.get('demo') === '1';
  const ACTIONS = PACK.actions || {};
  const ALERTS = PACK.alerts || {};
  const AS = Object.assign({ duration: 7, gap: 1.5, volume: 70 }, PACK.alertSettings || {});
  const SKEY = 'ovg:' + PACK.id + ':state', MKEY = 'ovg:' + PACK.id + ':panel';
  const SLOT = { slotName: 'ovg:' + PACK.id, realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE' };
  const SHORT = PACK.short || PACK.name;
  const CTRL = SHORT + ' · ' + t('controls');

  /* ---------- strings ---------- */
  function t(k, v) {
    const L = (PACK.lang || 'en').slice(0, 2);
    const s = (PACK.ui && PACK.ui[k]) || (STR[L] && STR[L][k]) || STR.en[k] || k;
    return v ? C.text(s, v) : s;
  }

  /* ---------- state ---------- */
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  let state = Object.assign(C.clone(PACK.state || {}), DEMO ? C.clone(PACK.demoState || {}) : load(SKEY, {}));
  const startTimers = s => { Object.keys(s).forEach(k => { const v = s[k]; if (v && typeof v === 'object' && ('left' in v || 'rate' in v) && v.running && !v.at) v.at = Date.now(); }); return s; };
  startTimers(state);
  const hadLocal = !DEMO && !!load(SKEY, null);
  let meta = Object.assign({ pw: '', channel: PACK.channel || '', alertsOn: {}, hold: true, volume: AS.volume, duration: AS.duration, credit: !!(PACK.credit && PACK.credit.enabled), lastKey: {}, savedAt: 0 }, DEMO ? {} : load(MKEY, {}));
  C.ALERT_TYPES.forEach(a => { if (ALERTS[a] && meta.alertsOn[a] === undefined) meta.alertsOn[a] = ALERTS[a].enabled !== false; });
  if (DEMO) { meta.savedAt = Date.now() - 3000; meta.lastKey = Object.fromEntries(Object.keys(ACTIONS).filter(a => ACTIONS[a].key).slice(0, 2).map((a, i) => [a, Date.now() - (i ? 26 : 2) * 60e3])); }

  let link = null, obsOk = DEMO, chat = null, chatOk = DEMO, currentScene = ((PACK.scenes || []).find(s => s.format === 'game') || (PACK.scenes || [])[0] || {}).id;
  const pages = {};                       // overlay pages that said hello recently
  const queue = []; let busyUntil = 0;
  const log = [];
  let current = P.get('tab') || 'live', persistT = null, installLog = [], helperIds = {};

  function saveAll() {
    meta.savedAt = Date.now();
    if (DEMO) return;
    store(SKEY, state); store(MKEY, meta);
    clearTimeout(persistT);
    persistT = setTimeout(() => { if (link && link.ready) link.request('SetPersistentData', Object.assign({ slotValue: { state, meta: Object.assign({}, meta, { pw: '' }) } }, SLOT)); }, 400);
  }
  function send(msg) {
    if (DEMO) { if (window.parent !== window) window.parent.postMessage({ ovg: 'msg', msg, from: 'panel' }, '*'); return; }
    if (link) link.send(msg);
  }
  const broadcast = () => send({ type: 'state', state, credit: !!meta.credit });

  /* ---------- actions ---------- */
  function run(id, origin, ctx) {
    const A = ACTIONS[id]; if (!A) return;
    const r = C.apply(state, A.do || [], ctx || {}, PACK.state);
    state = r.state;
    if (origin === 'key') meta.lastKey[id] = Date.now();
    saveAll(); broadcast();
    r.events.forEach(name => send({ type: 'event', name }));
    if (r.scene) switchScene(r.scene);
    render();
    flash(id);
  }
  function flash(id) { document.querySelectorAll('[data-act="' + id + '"]').forEach(b => { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }); }

  /* ---------- alerts ---------- */
  function onTwitch(ev) {
    if (ev.type === 'chat') return onChat(ev);
    const def = ALERTS[ev.type]; if (!def) return;
    const ctx = Object.assign({}, ev);
    if (ev.type === 'bits') ctx.count = ev.amount; else if (ev.type === 'raid') ctx.count = ev.viewers; else if (ctx.count === undefined) ctx.count = 1;
    if (def.effects) { const r = C.apply(state, def.effects, ctx, PACK.state); state = r.state; r.events.forEach(n => send({ type: 'event', name: n })); saveAll(); broadcast(); }
    if (!meta.alertsOn[ev.type]) return render();
    if (def.min && (ctx.count || 0) < def.min) return render();
    enqueue(ev, false);
    addLog('ok', (def.icon || '★') + ' ' + ev.name + ' · ' + label(ev.type));
    render();
  }
  function enqueue(ev, front) {
    const def = ALERTS[ev.type] || {};
    const a = C.buildAlert(def, ev, Object.assign({}, C.SAMPLE, PACK.sample || {}));
    a.type = ev.type; a.duration = meta.duration; a.volume = meta.volume / 100; a.test = !!ev.test;
    if (front) queue.unshift(a); else queue.push(a);
    pump();
  }
  const held = () => meta.hold && AS.holdWhen && C.test(state, AS.holdWhen);
  function pump() {
    if (!queue.length || Date.now() < busyUntil) return;
    if (held() && !queue[0].test) return;
    const a = queue.shift();
    busyUntil = Date.now() + (a.duration + AS.gap) * 1000;
    send({ type: 'alert', alert: a });
    setTimeout(() => { pump(); render(); }, (a.duration + AS.gap) * 1000 + 50);
    render();
  }
  setInterval(pump, 1000);

  /* ---------- chat commands ---------- */
  const cool = {};
  function allowed(perm, r) {
    if (r.broadcaster) return true;
    if (perm === 'all') return true;
    if (perm === 'subs') return r.sub || r.vip || r.mod;
    if (perm === 'vip') return r.vip || r.mod;
    if (perm === 'mods') return r.mod;
    return false;                         // "me": only the streamer
  }
  function onChat(m) {
    const text = (m.text || '').trim(); if (text[0] !== '!') return;
    const [cmd, ...rest] = text.split(/\s+/); const c = cmd.toLowerCase();
    if (PACK.credit && meta.credit && c === (PACK.credit.command || '!overlay').toLowerCase()) {
      if (Date.now() - (cool.__credit || 0) > 60000) { cool.__credit = Date.now(); send({ type: 'credit' }); addLog('ok', m.name + ' ' + c); }
      return;
    }
    const id = Object.keys(ACTIONS).find(k => (ACTIONS[k].cmd || '').toLowerCase() === c); if (!id) return;
    const A = ACTIONS[id];
    if (!allowed(A.perm || 'mods', m.role || {})) return addLog('no', m.name + ' ' + c + ' · ' + t('notAllowed'));
    const cd = (A.cooldown !== undefined ? A.cooldown : (A.perm === 'all' ? 10 : 2)) * 1000;
    if (Date.now() - (cool[id] || 0) < cd) return;
    cool[id] = Date.now();
    run(id, 'chat', { args: rest.join(' '), name: m.name });
    addLog('ok', m.name + ' ' + c + ' → ' + A.label);
  }
  function addLog(kind, txt) { log.unshift({ kind, txt, at: Date.now() }); log.length = Math.min(log.length, 40); if (current === 'chat') renderPage('chat'); }
  function listen() {
    if (chat) chat.close();
    chatOk = false;
    if (!meta.channel || DEMO) { chatOk = DEMO; return render(); }
    chat = OVGTwitch.connect(meta.channel, onTwitch, s => { chatOk = s === 'joined'; renderHeader(); }, { lang: PACK.lang });
  }

  /* ---------- OBS ---------- */
  function connectOBS() {
    if (DEMO) return;
    link = new ObsLink({
      password: meta.pw,
      onStatus: async s => {
        obsOk = s.state === 'connected'; obsState = s.state;
        renderHeader(); if (current === 'setup') renderPage('setup');
        if (!obsOk) return;
        if (!hadLocal && !restored) {
          const r = await link.request('GetPersistentData', SLOT);
          const v = r.ok && r.data.slotValue;
          if (v && v.state) { state = Object.assign(C.clone(PACK.state || {}), v.state); meta = Object.assign(meta, v.meta || {}, { pw: meta.pw }); store(SKEY, state); store(MKEY, meta); }
        }
        restored = true;
        const sc = await link.request('GetCurrentProgramScene', {});
        if (sc.ok) setCurrentFromObs(sc.data.currentProgramSceneName || sc.data.sceneName);
        await mapHelpers();
        broadcast(); render();
      },
      onMessage: msg => {
        if (msg.type === 'hello' || msg.type === 'here') { pages[msg.page] = Date.now(); if (msg.type === 'hello') broadcast(); renderHeader(); }
      },
      onEvent: (type, d) => {
        if (type === 'CurrentProgramSceneChanged') { setCurrentFromObs(d.sceneName); renderPage('live'); }
        if (type === 'SceneItemEnableStateChanged' && d.sceneName === CTRL && d.sceneItemEnabled && helperIds[d.sceneItemId]) {
          run(helperIds[d.sceneItemId], 'key');
          link.request('SetSceneItemEnabled', { sceneName: CTRL, sceneItemId: d.sceneItemId, sceneItemEnabled: false });
        }
      }
    });
  }
  let restored = false, obsState = DEMO ? 'connected' : 'connecting';
  const obsSceneName = s => SHORT + ' · ' + s.label;
  function setCurrentFromObs(name) { const s = (PACK.scenes || []).find(x => obsSceneName(x) === name); currentScene = s ? s.id : null; }
  function switchScene(id) {
    currentScene = id; render();
    if (DEMO) send({ type: 'scene', id });
    const s = (PACK.scenes || []).find(x => x.id === id);
    if (s && link && link.ready) link.request('SetCurrentProgramScene', { sceneName: obsSceneName(s) });
  }
  const hotkeyActions = () => Object.keys(ACTIONS).filter(a => ACTIONS[a].key);
  const helperName = id => '⌨ ' + SHORT + ' · ' + ACTIONS[id].label;
  async function mapHelpers() {
    helperIds = {};
    const r = await link.request('GetSceneItemList', { sceneName: CTRL });
    if (!r.ok) return;
    const byName = Object.fromEntries(hotkeyActions().map(a => [helperName(a), a]));
    for (const it of r.data.sceneItems || []) {
      if (byName[it.sourceName]) {
        helperIds[it.sceneItemId] = byName[it.sourceName];
        if (it.sceneItemEnabled) link.request('SetSceneItemEnabled', { sceneName: CTRL, sceneItemId: it.sceneItemId, sceneItemEnabled: false });
      }
    }
  }
  function baseUrl() { return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, ''); }
  function overlayUrl(file, extra) {
    const q = [meta.pw ? 'pw=' + encodeURIComponent(meta.pw) : '', extra || ''].filter(Boolean).join('&');
    return baseUrl() + file + (q ? '?' + q : '');
  }
  // The OBS browser sources of a scene: one per entry of scene.sources (each at its own box), or one full-screen source.
  function sceneSources(s) {
    const scene = obsSceneName(s), FULL = [0, 0, 1920, 1080];
    if (!(s.sources && s.sources.length)) return [{ name: scene + ' · overlay', label: s.label, extra: '', box: FULL, legacy: true }];
    return s.sources.map(x => ({ name: scene + ' · ' + x.label, label: s.label + ' · ' + x.label, extra: 'src=' + encodeURIComponent(x.id), box: x.box || FULL }));
  }

  async function install() {
    installLog = []; renderPage('setup');
    const note = (kind, txt) => { installLog.push({ kind, txt }); renderPage('setup'); };
    const step = async (label, type, data, okCodes) => {
      const r = await link.request(type, data);
      if (r.ok) note('ok', label);
      else if ((okCodes || []).includes(r.code)) note('dotl', label + ' · ' + t('exists'));
      else { note('x', label + ' · ' + (r.comment || r.code)); throw r; }
      return r;
    };
    try {
      for (const s of PACK.scenes || []) {
        const scene = obsSceneName(s), srcs = sceneSources(s);
        await step(t('scene') + ' “' + scene + '”', 'CreateScene', { sceneName: scene }, [601]);
        // A pack that moved to one source per piece: the old full-screen source would duplicate everything.
        if (!srcs[0].legacy) {
          const old = scene + ' · overlay';
          if ((await link.request('GetSceneItemId', { sceneName: scene, sourceName: old })).ok) await step('− “' + old + '”', 'RemoveInput', { inputName: old });
        }
        for (const src of srcs) {
          const b = src.box;
          const settings = { url: overlayUrl(s.file, src.extra), is_local_file: false, width: b[2], height: b[3], shutdown: false, restart_when_active: false, fps_custom: false };
          const r = await step('overlay “' + src.label + '”', 'CreateInput', { sceneName: scene, inputName: src.name, inputKind: 'browser_source', inputSettings: settings, sceneItemEnabled: true }, [601]);
          if (r.code === 601) await link.request('SetInputSettings', { inputName: src.name, inputSettings: settings });
          const id = await link.request('GetSceneItemId', { sceneName: scene, sourceName: src.name });
          const fresh = r.ok || !id.ok;
          if (!id.ok) await link.request('CreateSceneItem', { sceneName: scene, sourceName: src.name, sceneItemEnabled: true });
          const list = await link.request('GetSceneItemList', { sceneName: scene });
          const item = (list.data.sceneItems || []).find(i => i.sourceName === src.name);
          if (!item) continue;
          await link.request('SetSceneItemIndex', { sceneName: scene, sceneItemId: item.sceneItemId, sceneItemIndex: (list.data.sceneItems || []).length - 1 });
          // Place it where the design puts it, but only the first time: after that the streamer may have moved or scaled it.
          if (fresh || src.legacy) await link.request('SetSceneItemTransform', { sceneName: scene, sceneItemId: item.sceneItemId, sceneItemTransform: { positionX: b[0], positionY: b[1], scaleX: 1, scaleY: 1, rotation: 0, boundsType: 'OBS_BOUNDS_NONE' } });
        }
      }
      const keys = hotkeyActions();
      if (keys.length) {
        await step(t('scene') + ' “' + CTRL + '”', 'CreateScene', { sceneName: CTRL }, [601]);
        const kinds = (await link.request('GetInputKindList', {})).data.inputKinds || [];
        const colorKind = kinds.filter(k => k.startsWith('color_source')).sort().pop() || 'color_source_v3';
        for (const a of keys) await step('⌨ ' + ACTIONS[a].label, 'CreateInput', { sceneName: CTRL, inputName: helperName(a), inputKind: colorKind, inputSettings: { width: 4, height: 4, color: 0 }, sceneItemEnabled: false }, [601]);
        await mapHelpers();
      }
      const first = (PACK.scenes || []).find(s => s.id === currentScene) || (PACK.scenes || []).find(s => s.format === 'game') || (PACK.scenes || [])[0];
      if (first) await step(t('switchTo') + ' “' + obsSceneName(first) + '”', 'SetCurrentProgramScene', { sceneName: obsSceneName(first) });
      note('ok', t('installDone'));
    } catch (e) { note('x', t('installStopped')); }
  }

  /* ---------- rendering ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ago = ms => { if (!ms) return '—'; const s = Math.round((Date.now() - ms) / 1000); return s < 60 ? t('secAgo', { n: s }) : s < 3600 ? t('minAgo', { n: Math.round(s / 60) }) : t('hAgo', { n: Math.round(s / 3600) }); };
  const label = type => (ALERTS[type] && ALERTS[type].label) || t('alert_' + type);
  const tx = tpl => esc(C.text(tpl, state));
  function badge(id) {
    const A = ACTIONS[id], out = [];
    if (A.key) out.push('⌨ ' + esc(A.key)); if (A.cmd) out.push('💬 ' + esc(A.cmd));
    return out.length ? '<span class="k">' + out.join(' · ') + '</span>' : '';
  }
  const btn = id => ACTIONS[id] ? '<button class="btn ' + (ACTIONS[id].primary ? 'pri' : '') + '" data-act="' + id + '">' + esc(ACTIONS[id].label) + badge(id) + '</button>' : '';

  function renderHeader() {
    $('#logo').textContent = PACK.logo || (PACK.name || '?').trim()[0];
    $('#packName').textContent = PACK.name;
    $('#packSub').textContent = (PACK.channel ? 'twitch.tv/' + PACK.channel + ' · ' : '') + 'pack ' + (PACK.version || PACK.engine || '1.0.0');
    const n = (PACK.scenes || []).length, live = DEMO ? n : Object.values(pages).filter(x => Date.now() - x < 25000).length;
    const dot = ok => '<i class="dot ' + (ok ? '' : 'off') + '"></i>';
    $('#pills').innerHTML =
      '<span class="pill">' + dot(obsOk) + 'OBS <b>' + (obsOk ? t('connected') : t('st_' + obsState)) + '</b></span>' +
      '<span class="pill">' + (meta.channel ? dot(chatOk) + '<b>#' + esc(meta.channel) + '</b>' : dot(false) + t('noChannel')) + '</span>' +
      '<span class="pill">' + dot(live > 0) + t('overlays') + ' <b>' + live + '/' + n + '</b></span>' +
      '<span class="pill">💾 <b>' + ago(meta.savedAt) + '</b></span>';
    const tabs = [['live', t('tab_live')], ['alerts', t('tab_alerts'), queue.length], ['chat', t('tab_chat')], ['keys', t('tab_keys')], ['setup', t('tab_setup')]];
    $('#tabs').innerHTML = tabs.map(([id, l, q]) => '<button class="tab ' + (id === current ? 'on' : '') + '" data-tab="' + id + '">' + l + (q ? '<span class="n">' + q + '</span>' : '') + '</button>').join('');
  }

  function widget(w) {
    const v = String(w.key || '').split('.').reduce((o, k) => (o == null ? undefined : o[k]), state);   // "distancia.running" reads a field
    switch (w.type) {
      case 'big': {
        const danger = w.danger && C.test(state, Object.assign({ key: w.key }, w.danger));
        return '<div class="big"><div class="num ' + (danger ? 'danger' : '') + '">' + esc(v) + '</div>' + (w.facts ? facts(w.facts) : '') + '</div>';
      }
      case 'facts': return facts(w.rows);
      case 'timer': return '<div class="timer" data-timer="' + w.key + '">' + C.fmt(C.timerLeft(v)) + '<small>' + esc(w.suffix || '') + '</small></div>' +
        (w.max ? '<div class="bar"><i style="width:' + Math.min(100, C.timerLeft(v) / w.max * 100) + '%"></i></div>' : '');
      case 'progress': {
        const max = typeof w.max === 'string' ? state[w.max] : w.max;
        return '<div class="row"><b class="grow">' + esc(v) + ' / ' + esc(max) + '</b>' + (w.edit ? '<button class="btn inl" data-edit="' + w.max + '">' + t('edit') + '</button>' : '') + '</div>' +
          '<div class="bar"><i style="width:' + Math.min(100, (v || 0) / (max || 1) * 100) + '%"></i></div>' + editor(w.max, 'number');
      }
      case 'list': {
        const arr = v || [], i = state[w.index] || 0;
        return '<ul class="list">' + arr.map((x, k) => '<li class="' + (k < i ? 'done' : k === i ? 'now' : '') + '">' + esc(x) + (k === i && w.since && state[w.since] ? '<span class="t">' + Math.max(0, Math.round((Date.now() - state[w.since]) / 60e3)) + ' min</span>' : '') + '</li>').join('') + '</ul>' +
          (w.edit ? '<button class="btn inl" data-edit="' + w.key + '">' + t('editList') + '</button>' + editor(w.key, 'list') : '');
      }
      case 'text': return '<div class="row"><b class="grow">' + esc(v || '—') + '</b>' + (w.edit ? '<button class="btn inl" data-edit="' + w.key + '">' + t('edit') + '</button>' : '') + '</div>' + editor(w.key, 'text');
      case 'note': return '<div class="note">' + tx(w.text) + '</div>';
      case 'meter': return '<div class="meters">' + (w.rows || [w]).map(r => '<div class="mt"><span>' + esc(r.label || '') + '</span><b data-meter="' + r.key + '" data-fmt="' + (r.format || '') + '" data-dec="' + (r.decimals || 0) + '" data-factor="' + (r.factor || 1) + '" data-field="' + (r.field || 'value') + '">' + meterText(r) + '</b><small>' + esc(r.unit || '') + '</small></div>').join('') + '</div>';
      case 'flag': return '<div class="flag ' + (v ? 'on' : '') + '"><i></i>' + esc(v ? w.on : w.off) + '</div>';
      default: return '';
    }
  }
  function meterText(r) {
    const m = state[r.key] || {};
    const v = (r.field === 'rate' ? Number(m.rate) || 0 : C.meterValue(m)) * (Number(r.factor) || 1);
    return r.format === 'clock' ? C.fmt(v * 3600) : C.num(v, Number(r.decimals) || 0, PACK.lang);
  }
  function facts(rows) {
    return '<div class="facts">' + rows.map(r => '<span>' + esc(r[0]) + '</span><b>' + tx(r[1]) + (r[2] && C.test(state, r[2].if) ? '<span class="tag">' + esc(r[2].tag) + '</span>' : '') + '</b>').join('') + '</div>';
  }
  function editor(key, kind) {
    const v = state[key];
    const field = kind === 'list' ? '<textarea data-field="' + key + '">' + esc((v || []).join('\n')) + '</textarea>' : '<input data-field="' + key + '" type="' + (kind === 'number' ? 'number' : 'text') + '" value="' + esc(v) + '">';
    return '<div class="edit" data-editor="' + key + '">' + (kind === 'list' ? '<div class="when">' + t('onePerLine') + '</div>' : '') + field +
      '<div class="row"><button class="btn inl pri" data-save="' + key + '" data-kind="' + kind + '">' + t('save') + '</button><button class="btn inl" data-edit="' + key + '">' + t('cancel') + '</button></div></div>';
  }

  function pageLive() {
    const scenes = '<div class="card"><div class="ct"><h2>' + t('scene') + '</h2><span class="meta">' + t('clickToSwitch') + '</span></div><div class="scenes">' +
      (PACK.scenes || []).map(s => '<button class="sc ' + (s.id === currentScene ? 'live' : '') + '" data-live="' + t('live') + '" data-scene="' + s.id + '"><i>' + esc(s.icon || '▣') + '</i>' + esc(s.label) + '</button>').join('') + '</div></div>';
    const pieces = (PACK.panel || []).map(p => {
      const bts = (p.buttons || []).filter(b => ACTIONS[b]);
      return '<div class="card"><div class="ct"><h2>' + esc(p.title) + '</h2><span class="meta">' + tx(p.meta || '') + '</span></div>' +
        (p.widgets || []).map(widget).join('') +
        (bts.length ? '<div class="bts ' + (bts.length === 3 ? 'n3' : bts.length === 1 ? 'n1' : '') + '">' + bts.map(btn).join('') + '</div>' : '') +
        (p.note ? '<div class="note">' + tx(p.note) + '</div>' : '') + '</div>';
    }).join('');
    return scenes + pieces;
  }

  function pageAlerts() {
    const rows = C.ALERT_TYPES.filter(a => ALERTS[a]).map(a => {
      const d = ALERTS[a], sample = C.buildAlert(d, { type: a }, Object.assign({}, C.SAMPLE, PACK.sample || {}));
      return '<div class="al"><div class="nm"><span class="ic">' + esc(d.icon || '★') + '</span><div class="grow"><b>' + esc(label(a)) + (d.min ? ' <span class="when">≥ ' + d.min + '</span>' : '') + '</b><small>' + esc(sample.lines.join(' · ')) + '</small></div></div>' +
        '<button class="test" data-test="' + a + '">' + t('test') + '</button><span class="sw ' + (meta.alertsOn[a] ? 'on' : '') + '" data-sw="' + a + '"></span></div>';
    }).join('');
    const hold = AS.holdWhen ? '<div class="opt"><span><b>' + esc(AS.holdLabel || t('holdAlerts')) + '</b>' + esc(AS.holdHint || '') + '</span><span class="sw ' + (meta.hold ? 'on' : '') + '" data-sw="__hold"></span></div>' : '';
    return '<div class="card"><div class="ct"><h2>' + t('testToggle') + '</h2><span class="meta">' + t('viewersSeeTests') + '</span></div>' + rows + '</div>' +
      '<div class="card"><div class="ct"><h2>' + t('queue') + '</h2><span class="meta">' + t('waiting', { n: queue.length }) + (held() ? ' · ' + t('held') : '') + '</span></div>' + hold +
      '<div class="row" style="margin-top:6px"><button class="btn grow" data-q="release">' + t('playNow') + '</button><button class="btn grow" data-q="clear">' + t('clearQueue') + '</button></div></div>' +
      '<div class="card"><div class="ct"><h2>' + t('lookSound') + '</h2></div>' +
      '<div class="range">' + t('volume') + '<input type="range" min="0" max="100" value="' + meta.volume + '" data-range="volume"><output>' + meta.volume + '%</output></div>' +
      '<div class="range">' + t('onScreen') + '<input type="range" min="3" max="15" value="' + meta.duration + '" data-range="duration"><output>' + meta.duration + ' s</output></div></div>';
  }

  function pageChat() {
    const P2 = { mods: t('perm_mods'), all: t('perm_all'), me: t('perm_me'), vip: t('perm_vip'), subs: t('perm_subs') };
    const rows = Object.keys(ACTIONS).filter(k => ACTIONS[k].cmd).map(k => { const A = ACTIONS[k], p = A.perm || 'mods'; return '<tr><td><code>' + esc(A.cmd) + (A.args ? ' ' + esc(A.args) : '') + '</code></td><td>' + esc(A.label) + '</td><td><span class="perm ' + p + '">' + P2[p] + '</span></td></tr>'; });
    if (PACK.credit) rows.push('<tr><td><code>' + esc(PACK.credit.command || '!overlay') + '</code></td><td>' + t('creditCmd') + '</td><td><span class="perm all">' + (meta.credit ? P2.all : t('off')) + '</span></td></tr>');
    const firstCmd = Object.values(ACTIONS).find(x => x.cmd && x.perm === 'mods') || Object.values(ACTIONS).find(x => x.cmd);
    const sample = DEMO && !log.length && firstCmd ? [{ kind: 'ok', txt: 'nightowl_mod ' + firstCmd.cmd + ' → ' + firstCmd.label, at: Date.now() - 60e3 }, { kind: 'no', txt: 'random_viewer ' + firstCmd.cmd + ' · ' + t('notAllowed'), at: Date.now() - 9 * 60e3 }] : log;
    return '<div class="card"><div class="ct"><h2>Twitch</h2><span class="meta">' + t('readOnly') + '</span></div><div class="row"><input data-field="__channel" placeholder="' + t('yourChannel') + '" value="' + esc(meta.channel) + '"><button class="btn inl" data-listen>' + (chatOk ? '<i class="dot"></i>' + t('listening') : t('listen')) + '</button></div></div>' +
      '<div class="card"><div class="ct"><h2>' + t('commands') + '</h2><span class="meta">' + t('othersIgnored') + '</span></div><table><tr><th>' + t('command') + '</th><th>' + t('does') + '</th><th>' + t('who') + '</th></tr>' + rows.join('') + '</table></div>' +
      '<div class="card"><div class="ct"><h2>' + t('recent') + '</h2></div><div class="log">' + (sample.length ? sample.map(l => '<div class="' + (l.kind === 'no' ? 'no' : '') + '">' + (l.kind === 'no' ? '✗' : '<span class="okc">✓</span>') + ' ' + new Date(l.at).toTimeString().slice(0, 5) + ' ' + esc(l.txt) + '</div>').join('') : '<span class="no">' + t('nothingYet') + '</span>') + '</div></div>';
  }

  function pageKeys() {
    const ks = hotkeyActions();
    const rows = ks.map(id => { const A = ACTIONS[id]; return '<tr><td><span class="key">' + esc(A.key) + '</span></td><td>' + esc(A.label) + '<div class="when">' + (meta.lastKey[id] ? t('lastUsed', { when: ago(meta.lastKey[id]) }) : t('notUsed')) + '</div></td><td class="when">' + esc(t('showEntry', { name: helperName(id) })) + '</td><td><button class="test" data-act="' + id + '">' + t('test') + '</button></td></tr>'; }).join('');
    return '<div class="card"><div class="ct"><h2>' + t('tab_keys') + '</h2><span class="meta">' + t('anyScene') + '</span></div>' +
      (ks.length ? '<table><tr><th>' + t('suggested') + '</th><th>' + t('action') + '</th><th>' + t('obsEntry') + '</th><th></th></tr>' + rows + '</table>' : '<div class="when">—</div>') +
      '<div class="tip">⌨️<div>' + t('keysHelp') + '</div></div></div>';
  }

  function pageSetup() {
    const okSet = obsOk ? '<i class="dot"></i>' + t('connected') : t('connect');
    const scenes = (PACK.scenes || []).length, keys = hotkeyActions().length;
    const lines = installLog.length ? installLog.map(l => '<li class="' + (l.kind === 'ok' ? '' : l.kind) + '">' + esc(l.txt) + '</li>').join('') :
      '<li class="dotl"><b>' + scenes + ' ' + t('scenes') + '</b>&nbsp;' + esc((PACK.scenes || []).map(s => s.label).join(', ')) + '</li>' + (keys ? '<li class="dotl"><b>' + keys + ' ' + t('hotkeySources') + '</b>&nbsp;“' + esc(CTRL) + '”</li>' : '') + '<li class="dotl">' + t('safeRepeat') + '</li>';
    const credit = PACK.credit ? '<div class="opt"><span><b>' + t('creditTitle') + '</b>' + t('creditHint', { cmd: PACK.credit.command || '!overlay' }) + '</span><span class="sw ' + (meta.credit ? 'on' : '') + '" data-sw="__credit"></span></div>' : '';
    return '<div class="card"><div class="ct"><h2>' + t('obsConnection') + '</h2><span class="meta">obs-websocket 5</span></div>' +
      '<div class="row"><input type="password" data-field="__pw" placeholder="' + t('wsPassword') + '" value="' + esc(DEMO ? 'demo-password-123' : meta.pw) + '"><button class="btn inl" data-connect>' + okSet + '</button></div>' +
      (obsState === 'bad-password' ? '<div class="banner bad">' + t('badPw') + '</div>' : obsState === 'disconnected' ? '<div class="banner">' + t('obsNotFound') + '</div>' : '') + '</div>' +
      '<div class="card"><div class="ct"><h2>' + t('installTitle') + '</h2><span class="meta">' + t('safeShort') + '</span></div><button class="btn pri wide" data-install ' + (obsOk && !DEMO ? '' : (DEMO ? '' : 'disabled')) + '>⚙ ' + t('install') + '</button><ul class="check">' + lines + '</ul></div>' +
      '<div class="card"><div class="ct"><h2>' + t('backup') + '</h2><span class="meta">' + t('savedInObs', { when: ago(meta.savedAt) }) + '</span></div>' + credit +
      '<div class="row" style="margin-top:6px"><button class="btn grow" data-edit="__export">⬇ ' + t('export') + '</button><button class="btn grow" data-edit="__import">⬆ ' + t('import') + '</button><button class="btn grow" data-reset>↺ ' + (resetArmed ? t('confirmReset') : t('reset')) + '</button></div>' +
      '<div class="edit" data-editor="__export"><div class="when">' + t('exportHint') + '</div><textarea readonly>' + esc(JSON.stringify({ pack: PACK.id, state, meta: Object.assign({}, meta, { pw: '' }) })) + '</textarea></div>' +
      '<div class="edit" data-editor="__import"><div class="when">' + t('importHint') + '</div><textarea data-field="__import"></textarea><div class="row"><button class="btn inl pri" data-import>' + t('import') + '</button></div></div>' +
      '<div class="tip">🔄<div>' + t('updateHint') + '</div></div></div>' +
      '<div class="foot">OverlayGenerator · engine ' + esc(PACK.engine || '1.0.0') + ' · pack “' + esc(PACK.id) + '”</div>';
  }

  const PAGES = { live: pageLive, alerts: pageAlerts, chat: pageChat, keys: pageKeys, setup: pageSetup };
  const openEditors = new Set();
  function renderPage(id) {
    const el = document.getElementById('p-' + id);
    if (!el || el.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    el.innerHTML = PAGES[id]();
    openEditors.forEach(k => { const e = el.querySelector('[data-editor="' + k + '"]'); if (e) e.classList.add('on'); });
  }
  function render() {
    renderHeader();
    Object.keys(PAGES).forEach(id => { const el = document.getElementById('p-' + id); el.classList.toggle('on', id === current); if (id === current) renderPage(id); });
  }
  let resetArmed = false;

  /* ---------- input ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-tab],[data-act],[data-scene],[data-test],[data-sw],[data-q],[data-edit],[data-save],[data-listen],[data-connect],[data-install],[data-reset],[data-import]');
    if (!el) return;
    const d = el.dataset;
    if (d.tab) { current = d.tab; return render(); }
    if (d.act) return run(d.act, 'button');
    if (d.scene) return switchScene(d.scene);
    if (d.test) { enqueue({ type: d.test, test: true }, true); el.classList.add('sent'); el.textContent = t('sent'); setTimeout(render, 1500); return; }
    if (d.sw) {
      if (d.sw === '__hold') meta.hold = !meta.hold; else if (d.sw === '__credit') { meta.credit = !meta.credit; broadcast(); } else meta.alertsOn[d.sw] = !meta.alertsOn[d.sw];
      saveAll(); pump(); return render();
    }
    if (d.q === 'release') { busyUntil = 0; const h = meta.hold; meta.hold = false; pump(); meta.hold = h; return render(); }
    if (d.q === 'clear') { queue.length = 0; return render(); }
    if (d.edit !== undefined) { openEditors.has(d.edit) ? openEditors.delete(d.edit) : openEditors.add(d.edit); return renderPage(current); }
    if (d.save) {
      const f = document.querySelector('[data-field="' + d.save + '"]'); let v = f.value;
      if (d.kind === 'list') v = v.split('\n').map(x => x.trim()).filter(Boolean); else if (d.kind === 'number') v = Number(v) || 0;
      state[d.save] = v; openEditors.delete(d.save); saveAll(); broadcast(); return render();
    }
    if (d.listen !== undefined) { meta.channel = OVGTwitch.clean(document.querySelector('[data-field="__channel"]').value); saveAll(); return listen(); }
    if (d.connect !== undefined) { meta.pw = document.querySelector('[data-field="__pw"]').value; saveAll(); if (link) link.setPassword(meta.pw); else connectOBS(); return; }
    if (d.install !== undefined) { if (!DEMO) install(); return; }
    if (d.reset !== undefined) {
      if (!resetArmed) { resetArmed = true; setTimeout(() => { resetArmed = false; renderPage('setup'); }, 4000); return renderPage('setup'); }
      resetArmed = false; state = startTimers(C.clone(PACK.state || {})); saveAll(); broadcast(); return render();
    }
    if (d.import !== undefined) {
      try { const j = JSON.parse(document.querySelector('[data-field="__import"]').value); if (j.state) state = Object.assign(C.clone(PACK.state || {}), j.state); if (j.meta) meta = Object.assign(meta, j.meta, { pw: meta.pw }); openEditors.delete('__import'); saveAll(); broadcast(); render(); }
      catch (err) { addLog('err', t('importBad')); }
    }
  });
  document.addEventListener('input', e => {
    const r = e.target.dataset && e.target.dataset.range; if (!r) return;
    meta[r] = Number(e.target.value); e.target.nextElementSibling.textContent = meta[r] + (r === 'volume' ? '%' : ' s'); saveAll();
  });

  /* ---------- timers, heartbeat ---------- */
  setInterval(() => {
    document.querySelectorAll('[data-timer]').forEach(el => { el.firstChild.textContent = C.fmt(C.timerLeft(state[el.dataset.timer])); });
    document.querySelectorAll('[data-meter]').forEach(el => { const d = el.dataset; el.textContent = meterText({ key: d.meter, format: d.fmt, decimals: d.dec, factor: d.factor, field: d.field }); });
    if (current === 'live' && Math.random() < 0.05) renderPage('live');   // refresh "x min" counters now and then
  }, 1000);
  setInterval(() => { send({ type: 'beat' }); renderHeader(); }, 4000);

  /* ---------- demo host messages ---------- */
  window.addEventListener('message', e => { const d = e.data || {}; if (d.ovg === 'msg' && d.msg && d.msg.type === 'hello') broadcast(); if (d.ovg === 'run') run(d.id, d.origin || 'button'); if (d.ovg === 'test') enqueue({ type: d.id, test: true }, true); if (d.ovg === 'scene') { currentScene = d.id; render(); } });

  /* ---------- styles from the pack ---------- */
  function hexA(h, a) { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return null; const n = parseInt(m[1], 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  const th = PACK.theme || {};
  if (th.accent) {
    const R = document.documentElement.style;
    R.setProperty('--acc', th.accent); R.setProperty('--acc2', th.accent2 || th.accent);
    R.setProperty('--acc-soft', hexA(th.accent, 0.16)); R.setProperty('--acc-glow', hexA(th.accent, 0.6));
    if (th.onAccent) R.setProperty('--on-acc', th.onAccent);
  }
  document.title = PACK.name + ' · ' + t('panel');

  window.panel = { run, render, get state() { return state; }, get queue() { return queue.length; }, enqueue, simulate: onTwitch, showTab: id => { current = id; render(); } };
  render();
  if (!DEMO) { connectOBS(); listen(); } else broadcast();

})();
