#!/usr/bin/env python3
"""validate_pack.py · OverlayGenerator

Static checks for a pack source folder (pack.json + overlays/ + fonts/ + guide).
Pure Python 3, no dependencies.

    python3 validate_pack.py <pack-folder>            # prints a report, exit code 1 if anything FAILS

The render checks (screen space, HUD overlap, text size, contrast) live in check_render.js
and need Node + Playwright; build_pack.py runs them when they are available.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, '..', 'assets', 'engine')

FORMATS = {'game', 'talk', 'code', 'screen'}
ALERT_TYPES = ['sub', 'resub', 'gift', 'bomb', 'raid', 'bits']
REQUIRED_ALERTS = ['sub', 'resub', 'gift', 'bomb']           # the four copy variants are mandatory
PERMS = {'me', 'mods', 'vip', 'subs', 'all'}
OPS = {'add', 'set', 'toggle', 'push', 'pop', 'next', 'prev', 'stamp', 'reset',
       'timer.add', 'timer.set', 'timer.toggle', 'timer.start', 'timer.stop', 'event', 'scene',
       'meter.rate', 'meter.add', 'meter.set', 'meter.toggle', 'meter.start', 'meter.stop'}
METER_OPS = {'meter.rate', 'meter.add', 'meter.set', 'meter.toggle', 'meter.start', 'meter.stop'}
TIMER_OPS = {'timer.add', 'timer.set', 'timer.toggle', 'timer.start', 'timer.stop'}
WIDGETS = {'big', 'facts', 'timer', 'progress', 'list', 'text', 'note', 'flag', 'meter'}
EVENT_VARS = {'name', 'months', 'to', 'count', 'amount', 'viewers', 'plan', 'text', 'args', 'type'}
ENGINE_ORDER = ['pack.js', 'core.js', 'obs-link.js', 'ovg.js']
SLUG = re.compile(r'^[a-z0-9][a-z0-9-]{1,40}$')


class Report:
    def __init__(self):
        self.fails, self.warns, self.oks = [], [], []
    def fail(self, m): self.fails.append(m)
    def warn(self, m): self.warns.append(m)
    def ok(self, m): self.oks.append(m)
    def print(self):
        for m in self.oks: print('  OK    ' + m)
        for m in self.warns: print('  WARN  ' + m)
        for m in self.fails: print('  FAIL  ' + m)
        print('\n%s · %d warnings' % ('ALL STATIC CHECKS PASS' if not self.fails else '%d checks FAIL' % len(self.fails), len(self.warns)))


def panel_string_keys():
    try:
        src = open(os.path.join(ENGINE, 'panel-strings.js'), encoding='utf-8').read()
        en = src.split('es:')[0]
        return set(re.findall(r"'?([\w-]+)'?\s*:\s*'", en))
    except OSError:
        return set()


def template_vars(t):
    return [m[0] for m in re.findall(r'\{([\w.]+)(@\w+)?\}', str(t))]


SRC_ID = re.compile(r'^[a-z0-9][a-z0-9-]{0,30}$')


def check_sources(R, s, html):
    """scenes[].sources: one OBS browser source per group of pieces, so the streamer can move and resize each one."""
    sid, srcs = s.get('id', '?'), s.get('sources')
    pieces = list(dict.fromkeys(re.findall(r'data-piece="([^"]+)"', html)))
    if srcs is None:
        if len(pieces) > 1:
            R.warn('scene "%s": one full-screen OBS source for %d pieces. Add "sources" so the streamer can move and resize each piece' % (sid, len(pieces)))
        return
    where = 'scene "%s" sources' % sid
    if not isinstance(srcs, list) or not srcs:
        return R.fail(where + ': must be a non-empty list')
    m = re.search(r'ovg\.js"[^>]*data-page="([^"]+)"', html)
    page = m.group(1) if m else os.path.splitext(os.path.basename(s.get('file', '')))[0]
    if page != sid:
        R.fail('%s: data-page "%s" must be the scene id "%s" (each source finds its pieces through it)' % (s.get('file'), page, sid))
    ids, owner = set(), {}
    for x in srcs:
        xid = x.get('id', '')
        if not SRC_ID.match(xid): R.fail('%s: id "%s" must be lowercase letters, digits and dashes' % (where, xid))
        if xid in ids: R.fail('%s: id "%s" is repeated' % (where, xid))
        ids.add(xid)
        if not x.get('label'): R.fail('%s: "%s" needs a label (its name in OBS)' % (where, xid))
        elif len(x['label']) > 30: R.warn('%s: label of "%s" longer than 30 characters' % (where, xid))
        ps = x.get('pieces')
        if not isinstance(ps, list) or not ps:
            R.fail('%s: "%s" needs a list of pieces' % (where, xid)); continue
        for p in ps:
            if p not in pieces: R.fail('%s: piece "%s" of "%s" is not a data-piece of %s' % (where, p, xid, s.get('file')))
            elif p in owner: R.fail('%s: piece "%s" is in "%s" and "%s"' % (where, p, owner[p], xid))
            else: owner[p] = xid
        b = x.get('box')
        if b is not None:
            if not (isinstance(b, list) and len(b) == 4 and all(isinstance(v, (int, float)) for v in b)
                    and b[2] > 0 and b[3] > 0 and b[0] >= 0 and b[1] >= 0 and b[0] + b[2] <= 1920 and b[1] + b[3] <= 1080):
                R.fail('%s: box of "%s" must be [x, y, width, height] inside 1920×1080' % (where, xid))
    lost = [p for p in pieces if p not in owner]
    if lost: R.fail('%s: pieces in no source never show in OBS: %s' % (where, ', '.join(lost)))


def check_ops(R, where, ops, state, pack, event_ctx=False):
    if not isinstance(ops, list):
        return R.fail('%s: "do"/"effects" must be a list of ops' % where)
    for i, o in enumerate(ops):
        w = '%s op %d' % (where, i + 1)
        op = o.get('op')
        if op not in OPS:
            R.fail('%s: unknown op "%s"' % (w, op)); continue
        if op == 'event':
            if not o.get('name'): R.fail(w + ': event needs "name"')
            elif o['name'] not in (pack.get('events') or {}): R.warn('%s: event "%s" is not described in pack.events (no preview state)' % (w, o['name']))
            continue
        if op == 'scene':
            if o.get('id') not in [s.get('id') for s in pack.get('scenes', [])]: R.fail('%s: scene "%s" does not exist' % (w, o.get('id')))
            continue
        k = o.get('key')
        if not k: R.fail(w + ': missing "key"'); continue
        if k not in state: R.fail('%s: state has no "%s"' % (w, k))
        elif op in TIMER_OPS and not (isinstance(state[k], dict) and 'left' in state[k]):
            R.fail('%s: "%s" is not a timer ({"left": seconds, "running": bool, "at": 0})' % (w, k))
        elif op in METER_OPS and not (isinstance(state[k], dict) and 'rate' in state[k]):
            R.fail('%s: "%s" is not a meter ({"value": 0, "rate": per hour, "running": bool, "at": 0})' % (w, k))
        if op in ('next', 'prev') and o.get('list') not in state: R.fail('%s: list "%s" not in state' % (w, o.get('list')))
        for ref_field in ('value', 'times', 'max', 'min'):
            v = o.get(ref_field)
            if isinstance(v, str) and v.startswith('$') and v[1:] not in state: R.fail('%s: %s refers to missing state "%s"' % (w, ref_field, v))
            if isinstance(v, str) and v.startswith('@') and v[1:] not in EVENT_VARS: R.warn('%s: %s uses unknown event value "%s"' % (w, ref_field, v))
        if 'if' in o and o['if'].get('key') not in state: R.fail('%s: condition on missing state "%s"' % (w, o['if'].get('key')))


def scripts_of(html):
    return [os.path.basename(s) for s in re.findall(r'<script[^>]+src="([^"]+)"', html)]


def validate(folder):
    R = Report()
    pj = os.path.join(folder, 'pack.json')
    try:
        pack = json.load(open(pj, encoding='utf-8'))
    except FileNotFoundError:
        R.fail('pack.json not found in ' + folder); return R, None
    except json.JSONDecodeError as e:
        R.fail('pack.json is not valid JSON: %s' % e); return R, None

    # ---- identity ----
    for k in ('engine', 'id', 'name', 'lang', 'scenes', 'state'):
        if k not in pack: R.fail('pack.json: missing "%s"' % k)
    if 'id' in pack and not SLUG.match(pack['id']): R.fail('id "%s" must be lowercase letters, digits and dashes' % pack.get('id'))
    if not pack.get('channel'): R.warn('no "channel": the streamer types it in the panel')
    state = pack.get('state', {})
    if not isinstance(state, dict): R.fail('"state" must be an object'); state = {}

    # ---- scenes and overlay files ----
    ids = set()
    for s in pack.get('scenes', []):
        sid = s.get('id', '?')
        if sid in ids: R.fail('scene id "%s" is repeated' % sid)
        ids.add(sid)
        if not s.get('label'): R.fail('scene "%s": missing label' % sid)
        if s.get('format') not in FORMATS: R.fail('scene "%s": format must be one of %s' % (sid, sorted(FORMATS)))
        f = os.path.join(folder, s.get('file', ''))
        if not s.get('file') or not os.path.isfile(f):
            R.fail('scene "%s": file "%s" not found' % (sid, s.get('file'))); continue
        html = open(f, encoding='utf-8').read()
        sc = scripts_of(html)
        missing = [x for x in ENGINE_ORDER if x not in sc]
        if missing: R.fail('%s: missing engine scripts %s' % (s['file'], missing))
        elif [x for x in sc if x in ENGINE_ORDER] != ENGINE_ORDER: R.fail('%s: engine scripts must load in this order: %s' % (s['file'], ENGINE_ORDER))
        if 'OVG.onChat' in html and 'twitch.js' not in sc: R.fail('%s: uses OVG.onChat but does not load twitch.js' % s['file'])
        if 'OVG.onChat' in html and re.search(r'innerHTML[^;\n]*\b(m|msg|ev)\.(text|name)\b', html): R.fail('%s: chat text goes into innerHTML; use textContent or OVG.esc()' % s['file'])
        if 'data-piece="alert"' not in html and s.get('alerts', True):
            R.warn('%s: no element with data-piece="alert" (alerts will not show here; set "alerts": false on the scene if that is on purpose)' % s['file'])
        if s.get('format') == 'game' and 'data-hud' not in html: R.warn('%s: game scene without data-hud zones' % s['file'])
        if s.get('format') == 'game' and 'data-hud-source="screenshot"' not in html:
            R.warn('%s: every HUD zone is assumed. Confirm with a screenshot of the stream' % s['file'])
        if not s.get('backdrop'): R.warn('scene "%s": no "backdrop" for the preview' % sid)
        check_sources(R, s, html)
    R.ok('%d scenes, overlay files found' % len(ids))

    # ---- external resources, fonts ----
    for root, _, files in os.walk(folder):
        for fn in files:
            if not fn.endswith(('.html', '.css', '.js')): continue
            p = os.path.join(root, fn); txt = open(p, encoding='utf-8', errors='ignore').read()
            rel = os.path.relpath(p, folder)
            for url in re.findall(r'(?:src|href)\s*=\s*"(https?://[^"]+)"|url\(\s*[\'"]?(https?://[^)\'"]+)', txt):
                R.fail('%s: external resource %s (bundle everything in the pack)' % (rel, [u for u in url if u][0]))
            for u in re.findall(r'url\(\s*[\'"]?([^)\'"]+\.(?:woff2?|ttf|otf|png|jpg|svg|webp|mp3|ogg|wav))', txt):
                if u.startswith(('data:', 'http')): continue
                if not os.path.isfile(os.path.normpath(os.path.join(root, u))): R.fail('%s: file not found: %s' % (rel, u))
            if re.search(r'\beval\s*\(|new Function\s*\(', txt): R.fail('%s: eval/new Function is not allowed' % rel)

    # ---- actions ----
    actions = pack.get('actions', {})
    cmds, keys = {}, {}
    for aid, a in actions.items():
        if not a.get('label'): R.fail('action "%s": missing label' % aid)
        elif len(a['label']) > 28: R.warn('action "%s": label longer than 28 characters' % aid)
        check_ops(R, 'action "%s"' % aid, a.get('do', []), state, pack)
        if a.get('cmd'):
            c = a['cmd']
            if not re.match(r'^![a-z0-9_]{1,24}$', c): R.fail('action "%s": command "%s" must look like !word (lowercase)' % (aid, c))
            if c in cmds: R.fail('command %s used by "%s" and "%s"' % (c, cmds[c], aid))
            cmds[c] = aid
        if a.get('perm', 'mods') not in PERMS: R.fail('action "%s": perm must be one of %s' % (aid, sorted(PERMS)))
        if a.get('cmd') and a.get('perm') == 'all' and any(o.get('op') in ('add', 'set', 'reset', 'timer.add', 'timer.set') for o in a.get('do', [])):
            R.warn('action "%s": anyone in chat can change "%s". Is that intended?' % (aid, a.get('cmd')))
        if a.get('key'):
            if a['key'] in keys: R.fail('hotkey %s suggested for "%s" and "%s"' % (a['key'], keys[a['key']], aid))
            keys[a['key']] = aid
    credit_cmd = (pack.get('credit') or {}).get('command')
    if credit_cmd and credit_cmd in cmds: R.fail('credit command %s clashes with action "%s"' % (credit_cmd, cmds[credit_cmd]))
    R.ok('%d actions · %d chat commands · %d hotkeys' % (len(actions), len(cmds), len(keys)))

    # ---- panel ----
    for i, p in enumerate(pack.get('panel', [])):
        w = 'panel card %d ("%s")' % (i + 1, p.get('title', '?'))
        for b in p.get('buttons', []):
            if b not in actions: R.fail('%s: button "%s" is not an action' % (w, b))
        for wd in p.get('widgets', []):
            if wd.get('type') not in WIDGETS: R.fail('%s: unknown widget "%s"' % (w, wd.get('type'))); continue
            for k in ('key', 'index', 'since'):
                if wd.get(k) and str(wd[k]).split('.')[0] not in state: R.fail('%s: %s "%s" not in state' % (w, k, wd[k]))
            if wd.get('type') == 'meter':
                for r in wd.get('rows', [wd]):
                    if not (isinstance(state.get(r.get('key')), dict) and 'rate' in state[r.get('key')]): R.fail('%s: meter "%s" is not a meter in state' % (w, r.get('key')))
            if wd.get('type') == 'progress' and isinstance(wd.get('max'), str) and wd['max'] not in state: R.fail('%s: max "%s" not in state' % (w, wd['max']))
            for row in [r for r in wd.get('facts', []) + wd.get('rows', []) if isinstance(r, (list, tuple))]:
                for v in template_vars(row[1]):
                    if v.split('.')[0] not in state: R.fail('%s: "{%s}" not in state' % (w, v))
    used = set(b for p in pack.get('panel', []) for b in p.get('buttons', []))
    orphan = [a for a in actions if a not in used and not actions[a].get('cmd') and not actions[a].get('key')]
    if orphan: R.warn('actions nobody can trigger (no button, command or hotkey): %s' % orphan)

    # ---- alerts ----
    alerts = pack.get('alerts', {})
    for t in alerts:
        if t not in ALERT_TYPES: R.fail('alert "%s": type must be one of %s' % (t, ALERT_TYPES))
    for t in REQUIRED_ALERTS:
        if t not in alerts: R.fail('alert "%s" missing: sub, resub, gift and bomb need their own copy' % t)
    for t, a in alerts.items():
        lines = a.get('lines') or []
        if not lines: R.fail('alert "%s": no lines' % t)
        for l in lines:
            for v in template_vars(l):
                if v not in EVENT_VARS and v not in state: R.fail('alert "%s": "{%s}" is not an event value or state key' % (t, v))
        if t == 'resub' and not any('{months}' in l for l in lines): R.warn('alert "resub" never mentions {months}')
        if t == 'bomb' and not any('{count}' in l for l in lines): R.warn('alert "bomb" never mentions {count}')
        if t == 'gift' and not any('{to}' in l for l in lines): R.warn('alert "gift" never mentions who receives it ({to})')
        check_ops(R, 'alert "%s" effects' % t, a.get('effects', []), state, pack, True)
    if len(set(tuple(a.get('lines', [])[1:2]) for a in alerts.values())) < len(alerts):
        R.warn('two alerts share the same second line: each event should read differently')
    hw = (pack.get('alertSettings') or {}).get('holdWhen')
    if hw and hw.get('key') not in state: R.fail('alertSettings.holdWhen: "%s" not in state' % hw.get('key'))
    R.ok('%d alert types' % len(alerts))

    # ---- language ----
    lang = (pack.get('lang') or 'en')[:2]
    if lang not in ('en', 'es'):
        missing = sorted(panel_string_keys() - set((pack.get('ui') or {}).keys()))
        if missing: R.fail('lang "%s": pack.json "ui" must translate every panel string. Missing: %s' % (lang, ', '.join(missing)))
    # ---- credit ----
    if (pack.get('credit') or {}).get('enabled'): R.warn('credit is ON by default: only if the streamer said yes')
    # ---- guide ----
    guides = [f for f in os.listdir(folder) if f.lower().endswith('.md') and re.match(r'(guide|gu[ií]a|leeme|readme|anleitung|guida)', f.lower())]
    if not guides: R.fail('no guide (GUIDE.md or the equivalent in the pack language)')
    else: R.ok('guide: ' + ', '.join(guides))
    return R, pack


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    rep, _ = validate(sys.argv[1])
    rep.print()
    sys.exit(1 if rep.fails else 0)
