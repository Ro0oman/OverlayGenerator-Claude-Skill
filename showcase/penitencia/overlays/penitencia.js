/* Penitencia · ayudas compartidas por todas las escenas. */
(function () {
  // Palotes de la deuda: un grupo por muerte, con tantas rayas como flexiones por muerte.
  // Si no caben todos, los que sobran salen como «+N» (flexiones). Sin deuda, el surco queda vacío.
  const BAR = 8, GAP = 6, SET_GAP = 18, ROOM = 370, MORE = 72;
  function tally(el, deuda, fresh, per) {
    per = Math.max(1, per || 3); deuda = Math.max(0, deuda || 0);
    el.innerHTML = '';
    if (!deuda) return;
    const groups = []; for (let left = deuda; left > 0; left -= per) groups.push(Math.min(per, left));
    const w = n => n * BAR + (n - 1) * GAP;
    let used = 0, shown = 0;
    for (let i = 0; i < groups.length; i++) {
      const need = (shown ? SET_GAP : 0) + w(groups[i]);
      const last = i === groups.length - 1;
      if (used + need > ROOM - (last ? 0 : MORE)) break;
      used += need; shown++;
    }
    groups.slice(0, shown).forEach((n, i) => {
      const g = document.createElement('span'); g.className = 'set' + (fresh && i === shown - 1 && shown === groups.length ? ' new' : '');
      g.innerHTML = '<u></u>'.repeat(n); el.appendChild(g);
    });
    const rest = groups.slice(shown).reduce((a, n) => a + n, 0);
    if (rest) { const m = document.createElement('span'); m.className = 'more'; m.textContent = '+' + rest; el.appendChild(m); }
  }
  // Muestra una placa de evento unos segundos (en capturas congeladas se queda visible).
  const timers = new WeakMap();
  function flash(el, ms, others) {
    (others || []).forEach(o => { o.classList.remove('on'); clearTimeout(timers.get(o)); });
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(timers.get(el));
    if (!OVG.frozen) timers.set(el, setTimeout(() => el.classList.remove('on'), ms || 3500));
  }
  // Alerta común: cada escena solo decide dónde va.
  const KIND = { sub: 'Nuevo penitente', resub: 'Penitente fiel', gift: 'Ofrenda', bomb: 'Ofrenda en masa', raid: 'Llegan peregrinos', bits: 'A la hoguera' };
  function alertBox(root) {
    const kind = root.querySelector('.kind'), who = root.querySelector('.who'), what = root.querySelector('.what');
    let t;
    OVG.onAlert(a => {
      clearTimeout(t);
      kind.textContent = KIND[a.type] || 'Aviso';
      who.textContent = a.lines[0] || '';
      // los nombres de Twitch llegan a 25 caracteres: se encoge hasta caber en una línea, así la fuente de OBS no lo corta
      who.style.fontSize = ''; let fs = 44;
      while (who.scrollWidth > who.clientWidth && fs > 28) who.style.fontSize = (fs -= 2) + 'px';
      what.textContent = a.lines.slice(1).join(' · ');
      root.classList.add('show');
      t = setTimeout(() => root.classList.remove('show'), a.duration * 1000);
    });
  }
  // !comandos: lista de los comandos de chat del pack y quién puede usarlos.
  const WHO = { all: 'todos', mods: 'mods', vip: 'VIPs y mods', subs: 'subs, VIPs y mods', me: 'solo Roman' };
  const WHAT = { '!muerte': 'apunta una muerte', '!f': 'presenta tus respetos', '!comandos': 'enseña esta lista', '!overlay': 'quién hizo el overlay' };
  function commands(root) {
    const list = root.querySelector('.list');
    const draw = () => {
      const rows = Object.values(OVG.PACK.actions || {}).filter(a => a.cmd).map(a => [a.cmd, WHO[a.perm || 'mods'], WHAT[a.cmd] || a.label]);
      const cr = OVG.PACK.credit || {};
      if (OVG.creditOn && cr.command) rows.push([cr.command, WHO.all, WHAT[cr.command] || '']);
      list.innerHTML = '';
      rows.forEach(([c, who, what]) => {
        const d = document.createElement('div'); d.className = 'c';
        const top = document.createElement('div'); top.className = 'top';
        const b = document.createElement('b'); b.textContent = c;
        const e = document.createElement('em'); e.textContent = who;
        const s = document.createElement('span'); s.textContent = what;
        top.append(b, e); d.append(top, s); list.appendChild(d);
      });
    };
    OVG.onEvent(name => { if (name === 'comandos') { draw(); flash(root, 12000); } });
  }

  // !f: cada uno sube una baldosa con una F que se desvanece.
  function respects(root) {
    const spawn = (x, frozen) => {
      const f = document.createElement('i'); f.textContent = 'F';
      f.style.left = x + 'px'; root.appendChild(f);
      if (frozen) { f.classList.add('still'); return; }
      requestAnimationFrame(() => f.classList.add('go'));
      setTimeout(() => f.remove(), 2800);
    };
    OVG.onEvent(name => {
      if (name !== 'respetos') return;
      if (OVG.frozen) { [40, 180, 320].forEach(x => spawn(x, true)); return; }
      spawn(20 + Math.random() * (root.clientWidth - 80));
    });
  }

  // Logros por hitos de flexiones en total: la placa se queda 20 segundos.
  const HITOS = [[50, 'Medio centenar'], [100, 'Centenario'], [200, 'Doscientas'], [300, 'Espartano'], [500, 'Medio millar'], [1000, 'Mil penitencias']];
  function achievements(root) {
    const name = root.querySelector('.name'), what = root.querySelector('.what');
    const show = h => { name.textContent = h[1]; what.textContent = h[0] + ' flexiones en total'; flash(root, 20000); };
    let prev = null;
    OVG.onState(s => {
      const now = s.hechas || 0;
      if (prev !== null && now > prev) { const h = HITOS.filter(x => x[0] > prev && x[0] <= now).pop(); if (h) show(h); }
      prev = now;
    });
    OVG.onEvent((n, s) => { if (n === 'logro') { const h = HITOS.filter(x => x[0] <= (s.hechas || 0)).pop(); if (h) show(h); } });
  }

  // Tiempo sin morir, discreto: se cuenta desde la última muerte (o desde «Nuevo directo»).
  function sinceDeath(el) {
    let S = {};
    const draw = () => {
      let at = S.ultimaMuerte;
      if (!at && OVG.demo) at = Date.now() - 754000;           // solo en la vista previa
      el.parentElement.style.visibility = at ? '' : 'hidden';
      if (at) el.textContent = OVG.fmt(Math.max(0, Math.floor((Date.now() - at) / 1000)));
    };
    OVG.onState(s => { S = s; draw(); });
    setInterval(draw, 1000);
  }
  window.Pen = { tally, flash, alertBox, commands, respects, achievements, sinceDeath };
})();
