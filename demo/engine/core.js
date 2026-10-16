/* core.js · OverlayGenerator engine
   Shared by the panel and the overlays: text templates, timers and the small action language.
   Everything here is pure (no DOM, no network) so it is easy to test.

   Action ops (pack.json → actions.<id>.do, alerts.<id>.effects):
     { op:'add',   key, value=1, min, max }          numbers; min/max can be numbers or "$stateKey"
     { op:'set',   key, value }                       value: literal, "$stateKey", "@eventVar" or "text {templ}"
     { op:'toggle',key }
     { op:'push',  key, value, limit }                arrays; keeps the last <limit> items
     { op:'pop',   key }
     { op:'next' | 'prev', key, list }               index over an array in state[list]
     { op:'stamp', key }                              state[key] = now (ms)
     { op:'reset', key }                              back to the pack's initial value
     { op:'timer.add', key, value }                   seconds; negative to subtract
     { op:'timer.set', key, value }
     { op:'timer.toggle' | 'timer.start' | 'timer.stop', key }
     { op:'event', name }                             tells the overlays to play an event (e.g. "hit")
     { op:'scene', id }                               switch OBS to one of the pack's scenes
   Any op can carry  times: number|"@var"|"$key"  and  per: n  → value × floor(times / per)
   Any op can carry  if: { key, eq | ne | gt | lt }  → only runs when the condition holds.
*/
(function () {
  const now = () => Date.now();
  const clone = o => JSON.parse(JSON.stringify(o));

  function get(state, ctx, ref) {
    if (typeof ref !== 'string') return ref;
    if (ref[0] === '$') return state[ref.slice(1)];
    if (ref[0] === '@') return ctx ? ctx[ref.slice(1)] : undefined;
    if (ref.indexOf('{') >= 0) return text(ref, Object.assign({}, state, ctx || {}));
    return ref;
  }

  // "{name} · {months} months" → fills from vars. Arrays are joined with " · ", timers are formatted,
  // and {stops@stop} picks item number state.stop from the list state.stops.
  function text(tpl, vars) {
    return String(tpl == null ? '' : tpl).replace(/\{([\w.]+)(?:@(\w+))?\}/g, (m, k, idx) => {
      let v = vars ? vars[k] : undefined;
      if (idx !== undefined) v = Array.isArray(v) ? v[Number(vars[idx]) || 0] : undefined;   // {list@index}
      if (v == null) return '';
      if (Array.isArray(v)) return v.join(' · ');
      if (typeof v === 'object' && 'left' in v) return fmt(timerLeft(v));
      return String(v);
    });
  }

  function timerLeft(t) {
    if (!t || typeof t !== 'object') return 0;
    const left = t.running ? t.left - (now() - (t.at || now())) / 1000 : t.left;
    return Math.max(0, Math.round(left));
  }
  function fmt(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }
  function timerFreeze(t) { return { left: timerLeft(t), running: !!t.running, at: now() }; }

  function test(state, cond) {
    if (!cond) return true;
    const v = state[cond.key];
    if ('eq' in cond) return v === cond.eq;
    if ('ne' in cond) return v !== cond.ne;
    if ('gt' in cond) return v > cond.gt;
    if ('lt' in cond) return v < cond.lt;
    return !!v;
  }

  /* Runs ops on a copy of the state. Returns { state, events:[names], scene:id|null, changed:[keys] } */
  function apply(state, ops, ctx, initial) {
    const S = clone(state), out = { state: S, events: [], scene: null, changed: [] };
    (ops || []).forEach(o => {
      if (!test(S, o.if)) return;
      let val = o.value === undefined ? 1 : get(S, ctx, o.value);
      if (o.times !== undefined) {
        let times = Number(get(S, ctx, o.times)) || 0;
        if (o.per) times = Math.floor(times / o.per);
        val = Number(val) * times;
      }
      const k = o.key, lim = (x, d) => (x === undefined ? d : Number(get(S, ctx, x)));
      switch (o.op) {
        case 'add': S[k] = Math.min(lim(o.max, Infinity), Math.max(lim(o.min, -Infinity), (Number(S[k]) || 0) + Number(val))); break;
        case 'set': S[k] = o.value === undefined ? null : get(S, ctx, o.value); break;
        case 'toggle': S[k] = !S[k]; break;
        case 'push': S[k] = (Array.isArray(S[k]) ? S[k] : []).concat([val]); if (o.limit) S[k] = S[k].slice(-o.limit); break;
        case 'pop': if (Array.isArray(S[k])) S[k] = S[k].slice(0, -1); break;
        case 'next': case 'prev': {
          const n = (S[o.list] || []).length;
          const i = (Number(S[k]) || 0) + (o.op === 'next' ? 1 : -1);
          S[k] = Math.max(0, Math.min(n - 1, i)); break;
        }
        case 'stamp': S[k] = now(); break;
        case 'reset': if (initial && k in initial) S[k] = clone(initial[k]); break;
        case 'timer.add': { const t = timerFreeze(S[k] || {}); t.left = Math.max(0, t.left + Number(val)); S[k] = t; break; }
        case 'timer.set': { const t = timerFreeze(S[k] || {}); t.left = Math.max(0, Number(val)); S[k] = t; break; }
        case 'timer.toggle': case 'timer.start': case 'timer.stop': {
          const t = timerFreeze(S[k] || {});
          t.running = o.op === 'timer.toggle' ? !t.running : o.op === 'timer.start';
          S[k] = t; break;
        }
        case 'event': out.events.push(o.name); return;
        case 'scene': out.scene = o.id; return;
        default: console.warn('OVG: unknown op', o.op); return;
      }
      if (k && out.changed.indexOf(k) < 0) out.changed.push(k);
    });
    return out;
  }

  /* Builds the alert the overlays receive from a Twitch event + the pack's alert definition */
  function buildAlert(def, ev, sample) {
    const vars = Object.assign({}, sample || {}, ev);
    if (ev.type === 'bits') vars.count = vars.amount;          // {count} always means "how many" for the event
    else if (ev.type === 'raid') vars.count = vars.viewers;
    return Object.assign({}, vars, { lines: (def.lines || ['{name}']).map(l => text(l, vars)) });
  }

  const ALERT_TYPES = ['sub', 'resub', 'gift', 'bomb', 'raid', 'bits'];
  const SAMPLE = { name: 'marta_dev', months: 7, to: 'nightowl', count: 5, amount: 500, viewers: 42 };

  window.OVGCore = { apply, text, fmt, timerLeft, timerFreeze, buildAlert, test, clone, ALERT_TYPES, SAMPLE };
})();
