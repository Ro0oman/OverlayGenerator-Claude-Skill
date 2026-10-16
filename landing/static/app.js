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
