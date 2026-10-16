/* Flight MK-21 · split-flap helpers shared by every scene of this pack. */
(function () {
  const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:·-+×./';
  const reduce = () => OVG.frozen;

  // Writes text into a .flaps element, one tile per character, padded to `len`.
  // Changed tiles cycle through a few random characters first, like a real board (quiet = no cycling).
  function flap(el, text, len, quiet) {
    text = String(text == null ? '' : text).toUpperCase();
    if (len) text = text.length > len ? text.slice(0, len - 1) + '…' : text.padEnd(len, ' ');
    while (el.children.length < text.length) el.appendChild(document.createElement('i'));
    while (el.children.length > text.length) el.lastChild.remove();
    [...text].forEach((ch, i) => {
      const tile = el.children[i];
      if (tile.dataset.c === ch) return;
      tile.dataset.c = ch;
      if (quiet || reduce() || !tile.textContent && ch === ' ') { tile.textContent = ch === ' ' ? '' : ch; return; }
      let n = 3 + Math.floor(Math.random() * 4) + Math.floor(i / 2);
      const step = () => {
        tile.classList.remove('flip'); void tile.offsetWidth; tile.classList.add('flip');
        if (n-- > 0) { tile.textContent = CHARS[Math.floor(Math.random() * CHARS.length)].trim(); setTimeout(step, 70); }
        else tile.textContent = ch === ' ' ? '' : ch;
      };
      setTimeout(step, i * 25);
    });
  }

  // Alert board shared by all scenes: same copy, each scene only decides where it sits.
  function alertBoard(root) {
    const head = root.querySelector('.head .label'), kind = root.querySelector('.head .kind');
    const name = root.querySelector('.row .flaps'), info = root.querySelector('.info .what'), plus = root.querySelector('.info .plus');
    const HEAD = { sub: 'Boarding pass', resub: 'Frequent flyer', gift: 'Upgrade', bomb: 'Charter flight', raid: 'Arrivals', bits: 'Duty free' };
    const KIND = { sub: 'Gate S', resub: 'Gate R', gift: 'Gate G', bomb: 'Gate C', raid: 'Gate A', bits: 'Gate D' };
    let timer;
    OVG.onAlert(a => {
      clearTimeout(timer);
      root.dataset.type = a.type;
      head.textContent = HEAD[a.type] || 'Notice';
      kind.textContent = KIND[a.type] || '';
      flap(name, a.lines[0], +name.dataset.len || 16);
      info.textContent = a.lines[1] || '';
      plus.textContent = a.lines[2] || '';
      root.classList.remove('out'); root.classList.add('show');
      timer = setTimeout(() => { root.classList.add('out'); setTimeout(() => root.classList.remove('show', 'out'), 500); }, a.duration * 1000);
    });
  }

  window.Board = { flap, alertBoard };
})();
