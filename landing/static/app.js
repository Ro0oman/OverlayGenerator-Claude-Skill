// Language selector: each language has its own static page.
const sel = document.getElementById('lang');
if (sel) sel.addEventListener('change', () => {
  try { localStorage.setItem('lang', sel.value); } catch (e) {}
  location.href = sel.selectedOptions[0].dataset.href + location.hash;
});

// Install tabs.
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', x === t));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + t.dataset.t));
}));

// Copy buttons.
document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', () => {
  const txt = b.parentElement.firstChild.textContent.trim();
  navigator.clipboard.writeText(txt).then(() => {
    b.textContent = OVG.copied;
    setTimeout(() => b.textContent = OVG.copy, 1500);
  });
}));

// Load videos and the demo iframe only when they scroll into view.
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target;
  io.unobserve(el);
  if (el.tagName === 'VIDEO') { el.src = el.dataset.src; el.play().catch(() => {}); }
  else if (matchMedia('(min-width:1000px)').matches) {
    const f = el.querySelector('iframe');
    f.src = f.dataset.src;
    el.classList.add('live');
  }
}), { rootMargin: '200px' });
document.querySelectorAll('video[data-src], .demo-frame').forEach(el => io.observe(el));

// Live GitHub stars and release downloads.
(async () => {
  const api = 'https://api.github.com/repos/Ro0oman/OverlayGenerator-Claude-Skill';
  try {
    const [repo, rels] = await Promise.all([fetch(api).then(r => r.json()), fetch(api + '/releases').then(r => r.json())]);
    if (typeof repo.stargazers_count !== 'number') return;
    const dl = Array.isArray(rels) ? rels.flatMap(r => r.assets || []).reduce((n, a) => n + a.download_count, 0) : 0;
    const fmt = new Intl.NumberFormat(document.documentElement.lang);
    document.getElementById('st-stars').textContent = fmt.format(repo.stargazers_count);
    document.getElementById('st-dl').textContent = fmt.format(dl);
    document.getElementById('stats').hidden = false;
  } catch (e) {}
})();

// Hero background: a slowly drifting neural network. Paused off-screen and for reduced motion.
(() => {
  const c = document.getElementById('net');
  if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = c.getContext('2d');
  const COLORS = ['145,70,255', '217,119,87', '184,146,255'];
  const LINK = 170;
  let w, h, dpr, nodes = [], pulses = [], running = true, mouse = null;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (w * h) / 11000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: 1 + Math.random() * 1.8, col: COLORS[Math.random() * 3 | 0],
    }));
    pulses = [];
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of nodes) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    // Links between nearby nodes (and the cursor).
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${a.col},${(1 - d / LINK) * .55})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (pulses.length < 14 && Math.random() < .0008) pulses.push({ a, b, t: 0 });
        }
      }
      if (mouse) {
        const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (d < LINK * 1.3) {
          ctx.strokeStyle = `rgba(${a.col},${(1 - d / (LINK * 1.3)) * .5})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    // Signals travelling along links.
    pulses = pulses.filter(p => (p.t += .012) < 1);
    for (const p of pulses) {
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
      g.addColorStop(0, `rgba(${p.a.col},.9)`); g.addColorStop(1, `rgba(${p.a.col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
    }
    for (const p of nodes) {
      ctx.fillStyle = `rgba(${p.col},.8)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  const hero = c.parentElement;
  hero.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  hero.addEventListener('pointerleave', () => mouse = null);
  new IntersectionObserver(([e]) => {
    const was = running; running = e.isIntersecting;
    if (running && !was) requestAnimationFrame(frame);
  }).observe(c);
  addEventListener('resize', resize);
  resize(); requestAnimationFrame(frame);
})();
