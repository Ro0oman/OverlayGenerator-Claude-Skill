/* twitch.js · OverlayGenerator engine
   Reads a Twitch chat anonymously (like a logged-out viewer) and turns it into simple events.

     const chat = OVGTwitch.connect('channel', ev => {...}, status => {...});
     chat.close();

   Events:
     { type:'chat',  id, user, name, color, text, action, emotes, role:{broadcaster,mod,vip,sub} }
     { type:'sub',   id, name, plan, text }
     { type:'resub', id, name, months, plan, text }
     { type:'gift',  id, name, to, plan }                     // single gifted sub (not part of a bomb)
     { type:'bomb',  id, name, count, plan }                  // "gifted N subs to the community"
     { type:'raid',  id, name, viewers }
     { type:'bits',  id, name, amount, text }
   Status: connecting · joined · closed
*/
(function () {
  function parseLine(line) {
    const tags = {};
    let rest = line;
    if (rest[0] === '@') {
      const i = rest.indexOf(' ');
      rest.slice(1, i).split(';').forEach(t => {
        const j = t.indexOf('=');
        if (j > 0) tags[t.slice(0, j)] = t.slice(j + 1).replace(/\\s/g, ' ').replace(/\\:/g, ';').replace(/\\\\/g, '\\');
      });
      rest = rest.slice(i + 1);
    }
    let prefix = '';
    if (rest[0] === ':') { const i = rest.indexOf(' '); prefix = rest.slice(1, i); rest = rest.slice(i + 1); }
    let trailing = '', head = rest;
    const ti = rest.indexOf(' :');
    if (ti >= 0) { trailing = rest.slice(ti + 2); head = rest.slice(0, ti); }
    const [cmd, ...args] = head.split(' ');
    return { tags, prefix, cmd, args, trailing };
  }

  function role(t) {
    const b = t.badges || '';
    const has = k => new RegExp('(^|,)' + k + '/').test(b);
    return { broadcaster: has('broadcaster'), mod: has('moderator') || t.mod === '1', vip: has('vip'), sub: has('subscriber') || has('founder') || t.subscriber === '1' };
  }

  const ANON = { en: 'Anonymous', es: 'Anónimo', pt: 'Anônimo', fr: 'Anonyme', de: 'Anonym', it: 'Anonimo' };

  function toEvents(m, lang) {
    const t = m.tags, out = [];
    const anonName = ANON[(lang || 'en').slice(0, 2)] || 'Anonymous';
    if (m.cmd === 'PRIVMSG') {
      const user = (m.prefix || '').split('!')[0];
      const name = t['display-name'] || user || 'anon';
      let text = m.trailing, action = false;
      if (text.startsWith('\u0001ACTION ')) { text = text.slice(8, -1); action = true; }
      out.push({ type: 'chat', id: t.id, user, name, color: t.color || '', text, action, emotes: t.emotes || '', role: role(t) });
      if (t.bits) out.push({ type: 'bits', id: (t.id || '') + ':b', name, amount: +t.bits || 0, text });
    } else if (m.cmd === 'USERNOTICE') {
      const kind = t['msg-id'] || '';
      const anon = kind.startsWith('anon');
      const name = anon ? anonName : (t['display-name'] || t.login || anonName);
      const plan = t['msg-param-sub-plan'] || '';
      const base = { id: t.id, name, plan };
      if (kind === 'sub') out.push({ ...base, type: 'sub', text: m.trailing });
      else if (kind === 'resub') out.push({ ...base, type: 'resub', months: +t['msg-param-cumulative-months'] || 1, text: m.trailing });
      else if ((kind === 'subgift' || kind === 'anonsubgift') && !t['msg-param-community-gift-id'])
        out.push({ ...base, type: 'gift', to: t['msg-param-recipient-display-name'] || t['msg-param-recipient-user-name'] || '' });
      else if (kind === 'submysterygift' || kind === 'anonsubmysterygift') out.push({ ...base, type: 'bomb', count: +t['msg-param-mass-gift-count'] || 1 });
      else if (kind === 'raid') out.push({ id: t.id, type: 'raid', name: t['msg-param-displayName'] || name, viewers: +t['msg-param-viewerCount'] || 0 });
    }
    return out;
  }

  function clean(channel) { return String(channel || '').toLowerCase().replace(/^.*twitch\.tv\//, '').replace(/[^a-z0-9_]/g, ''); }

  function connect(channel, onEvent, onStatus, opts) {
    channel = clean(channel);
    opts = opts || {};
    const st = onStatus || (() => {});
    let ws, closed = false, retry = 0;
    const seen = new Set();
    function open() {
      if (closed || !channel) return;
      st('connecting');
      ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
      ws.onopen = () => ['CAP REQ :twitch.tv/tags twitch.tv/commands', 'PASS SCHMOOPIIE', 'NICK justinfan' + Math.floor(10000 + Math.random() * 80000), 'JOIN #' + channel].forEach(l => ws.send(l));
      ws.onmessage = e => String(e.data).split('\r\n').filter(Boolean).forEach(raw => {
        if (raw.startsWith('PING')) return ws.send('PONG :tmi.twitch.tv');
        if (/ 366 /.test(raw)) { retry = 0; st('joined'); return; }
        let m; try { m = parseLine(raw); } catch (err) { return; }
        toEvents(m, opts.lang).forEach(ev => {
          if (ev.id) { if (seen.has(ev.id)) return; seen.add(ev.id); if (seen.size > 500) seen.delete(seen.values().next().value); }
          try { onEvent(ev); } catch (err) { console.error(err); }
        });
      });
      ws.onclose = () => { st('closed'); if (!closed) setTimeout(open, Math.min(15000, 2000 * ++retry)); };
      ws.onerror = () => {};
    }
    open();
    return { channel, close() { closed = true; try { ws && ws.close(); } catch (e) { /* ignore */ } } };
  }

  window.OVGTwitch = { connect, parseLine, toEvents, clean };
})();
