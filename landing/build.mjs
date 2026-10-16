// Builds the static, pre-translated landing site into dist/.
// One page per language (English at "/", the rest at "/<lang>/"), plus sitemap, robots, manifest and 404.
//   node landing/build.mjs [outDir]
// Env: SITE_URL (default https://overlays.romandev.app), UMAMI_SRC + UMAMI_ID (optional analytics).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { I18N, LOCALES, HREFLANG } = require('./i18n.cjs');
const { HUB, CASES, UC_LANGS } = require('./usecases.cjs');
const out = path.resolve(process.argv[2] || path.join(here, 'dist'));
const SITE = (process.env.SITE_URL || 'https://overlays.romandev.app').replace(/\/$/, '');
const REPO = 'https://github.com/Ro0oman/OverlayGenerator-Claude-Skill';
const DEFAULT = 'en';
const LANGS = Object.keys(I18N);
const NAMES = { es:'Español', en:'English', pt:'Português', fr:'Français', de:'Deutsch', it:'Italiano', ja:'日本語', ko:'한국어', zh:'简体中文' };
const today = new Date().toISOString().slice(0, 10);

const urlPath = l => (l === DEFAULT ? '/' : `/${l}/`);
const abs = l => SITE + urlPath(l);
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const text = s => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const GALLERY = [
  ['alert-receipt', 560, 508, 'g1'], ['alert-gameshow', 560, 322, 'g2'], ['alert-metro', 560, 186, 'g3'],
  ['alert-tar', 560, 254, 'g4'], ['alert-nohit', 560, 176, 'g5'], ['panel-live', 460, 230, 'g6'],
];

function head(l, d) {
  const alts = LANGS.map(x => `<link rel="alternate" hreflang="${HREFLANG[x]}" href="${abs(x)}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${abs(DEFAULT)}">`;
  const ogAlts = LANGS.filter(x => x !== l).map(x => `<meta property="og:locale:alternate" content="${LOCALES[x]}">`).join('\n');
  const img = `${SITE}/media/og-image.jpg`;
  const faq = [1, 2, 3, 4, 5, 6].map(i => ({
    '@type': 'Question', name: text(d['q' + i]),
    acceptedAnswer: { '@type': 'Answer', text: text(d['a' + i].replace(/<\/li>/g, '. ')) },
  }));
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'OverlayGenerator', inLanguage: LANGS.map(x => HREFLANG[x]) },
      { '@type': 'WebPage', '@id': abs(l) + '#webpage', url: abs(l), name: text(d.metaTitle), description: text(d.metaDesc),
        inLanguage: HREFLANG[l], isPartOf: { '@id': SITE + '/#website' }, about: { '@id': SITE + '/#app' },
        primaryImageOfPage: { '@type': 'ImageObject', url: img, width: 1200, height: 630 } },
      { '@type': 'SoftwareApplication', '@id': SITE + '/#app', name: 'OverlayGenerator',
        applicationCategory: 'MultimediaApplication', applicationSubCategory: 'Streaming overlays',
        operatingSystem: 'Windows', softwareVersion: '1.0 beta', description: text(d.metaDesc), url: abs(l),
        downloadUrl: REPO + '/releases/latest', codeRepository: REPO, image: img,
        screenshot: [SITE + '/media/hero.webp', SITE + '/media/obs-dock.webp'],
        softwareRequirements: 'OBS Studio 28+, Claude account with code execution',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Person', name: 'Ro0oman', url: 'https://github.com/Ro0oman' } },
      { '@type': 'FAQPage', '@id': abs(l) + '#faq', inLanguage: HREFLANG[l], mainEntity: faq },
    ],
  };
  const umami = process.env.UMAMI_SRC && process.env.UMAMI_ID
    ? `\n<script defer src="${attr(process.env.UMAMI_SRC)}" data-website-id="${attr(process.env.UMAMI_ID)}"></script>` : '';
  // Root page only: send first-time visitors to their browser language. Crawlers and returning visitors stay put.
  const redirect = l !== DEFAULT ? '' : `
<script>(function(){var L=${JSON.stringify(LANGS.filter(x => x !== DEFAULT))},s;try{s=localStorage.getItem('lang')}catch(e){}
if(s){if(L.indexOf(s)>=0)location.replace('/'+s+'/'+location.hash);return}
var n=(navigator.languages||[navigator.language||'']);for(var i=0;i<n.length;i++){var b=(n[i]||'').toLowerCase().split('-')[0];
if(b==='${DEFAULT}')return;if(L.indexOf(b)>=0){location.replace('/'+b+'/'+location.hash);return}}})();</script>`;

  return `<link rel="canonical" href="${abs(l)}">
${alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="OverlayGenerator">
<meta property="og:url" content="${abs(l)}">
<meta property="og:title" content="${attr(d.metaTitle)}">
<meta property="og:description" content="${attr(d.metaDesc)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(d.metaTitle)}">
<meta property="og:locale" content="${LOCALES[l]}">
${ogAlts}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(d.metaTitle)}">
<meta name="twitter:description" content="${attr(d.metaDesc)}">
<meta name="twitter:image" content="${img}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>${umami}${redirect}`;
}

function page(l) {
  const d = { ...I18N[DEFAULT], ...I18N[l] };
  const vars = {
    ...d,
    htmlLang: HREFLANG[l], home: urlPath(l),
    metaTitle: attr(d.metaTitle), metaDesc: attr(d.metaDesc), demoT: attr(d.demoT), o4t: attr(d.o4t),
    copyJs: d.copy.replace(/"/g, '\\"'), copiedJs: d.copied.replace(/"/g, '\\"'),
    HEAD: head(l, d),
    LANGOPTS: LANGS.map(x => `<option value="${x}" data-href="${urlPath(x)}"${x === l ? ' selected' : ''}>${x.toUpperCase()} · ${NAMES[x]}</option>`).join(''),
    LANGLINKS: LANGS.map(x => `<a href="${urlPath(x)}" hreflang="${HREFLANG[x]}" lang="${HREFLANG[x]}">${NAMES[x]}</a>`).join(''),
    USECASES: useCaseSection(l),
    GALLERY: GALLERY.map(([f, w, h, k]) => `<figure><video data-src="/media/${f}.mp4" poster="/media/${f}.webp" width="${w}" height="${h}" muted loop playsinline aria-label="${attr(text(d[k]))}"></video><figcaption>${d[k]}</figcaption></figure>`).join('\n    '),
  };
  const tpl = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`Missing key "${k}" for ${l}`);
    return vars[k];
  });
}

// ---- Use-case pages ----
const UC_SECTION = {
  es: ['Casos de uso', 'Para cada tipo de directo'], en: ['Use cases', 'Made for every kind of stream'],
  pt: ['Casos de uso', 'Para cada tipo de live'], fr: ['Cas d’usage', 'Pour chaque type de stream'],
  de: ['Anwendungsfälle', 'Für jede Art von Stream'], it: ['Casi d’uso', 'Per ogni tipo di live'],
  ja: ['ユースケース', 'あらゆる配信スタイルに'], ko: ['활용 사례', '모든 방송 형식에 맞춰'], zh: ['使用场景', '适合各种直播形式'],
};
const ucLang = l => (UC_LANGS.includes(l) ? l : 'en');
const ucHub = l => (l === 'en' ? '/use-cases/' : `/${l}/use-cases/`);
const ucPath = (l, slug) => ucHub(l) + slug + '/';

function useCaseCards(l, skip) {
  return CASES.filter(c => c.slug !== skip).map(c => `<a class="uc-card" href="${ucPath(l, c.slug)}">
      <img src="/media/${c.media}.webp" width="${c.w}" height="${c.h}" alt="" loading="lazy">
      <span><b>${c[l].card}</b>${c[l].lead.split('. ')[0]}.</span></a>`).join('\n    ');
}

function useCaseSection(l) {
  const [ey, title] = UC_SECTION[l];
  return `<section id="casos"><div class="wrap">
  <div class="eyebrow">${ey}</div>
  <h2>${title}</h2>
  <div class="uc-grid">
    ${useCaseCards(ucLang(l))}
  </div>
</div></section>`;
}

function shell(l, { title, desc, url, alts, ld, body }) {
  const h = HUB[l];
  const altLinks = Object.entries(alts).map(([x, u]) => `<link rel="alternate" hreflang="${HREFLANG[x]}" href="${SITE + u}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${SITE + alts.en}">`;
  const other = UC_LANGS.filter(x => x !== l).map(x => `<a class="btn btn-ghost btn-sm" href="${alts[x]}" hreflang="${HREFLANG[x]}">${x.toUpperCase()}</a>`).join('');
  const umami = process.env.UMAMI_SRC && process.env.UMAMI_ID
    ? `\n<script defer src="${attr(process.env.UMAMI_SRC)}" data-website-id="${attr(process.env.UMAMI_ID)}"></script>` : '';
  return `<!doctype html>
<html lang="${HREFLANG[l]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${SITE + url}">
${altLinks}
<meta property="og:type" content="article">
<meta property="og:site_name" content="OverlayGenerator">
<meta property="og:url" content="${SITE + url}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:image" content="${SITE}/media/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${LOCALES[l]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(desc)}">
<meta name="twitter:image" content="${SITE}/media/og-image.jpg">
<script type="application/ld+json">${JSON.stringify(ld)}</script>${umami}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#9146ff">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<nav><div class="wrap">
  <a class="logo" href="${urlPath(l)}"><span></span>OverlayGenerator</a>
  <div class="nav-r">${other}<a class="btn btn-ghost btn-sm" href="${REPO}" target="_blank" rel="noopener">★ GitHub</a></div>
</div></nav>
<main>
${body}
</main>
<footer>${I18N[l].foot}</footer>
<script src="/app.js" defer></script>
</body>
</html>`;
}

function crumbs(l, items) {
  const h = HUB[l];
  const html = `<nav class="crumbs" aria-label="Breadcrumb"><a href="${urlPath(l)}">${h.home}</a>` +
    items.map(([n, u]) => u ? ` / <a href="${u}">${n}</a>` : ` / <span>${n}</span>`).join('') + '</nav>';
  const ld = { '@type': 'BreadcrumbList', itemListElement: [[h.home, urlPath(l)], ...items].map(([n, u], i) => ({
    '@type': 'ListItem', position: i + 1, name: text(n), ...(u ? { item: SITE + u } : {}) })) };
  return { html, ld };
}

function ctaBlock(l) {
  const h = HUB[l];
  return `<div class="ctas" style="justify-content:flex-start;margin-top:28px">
    <a class="btn btn-primary" href="${REPO}/releases/latest" target="_blank" rel="noopener">${h.cta}</a>
    <a class="btn btn-ghost" href="${urlPath(l)}#start">${h.ctaAlt}</a>
    <a class="btn btn-ghost" href="/demo/" target="_blank" rel="noopener">Demo →</a>
  </div>`;
}

function useCasePage(l, c) {
  const h = HUB[l], d = c[l], url = ucPath(l, c.slug);
  const bc = crumbs(l, [[h.crumb, ucHub(l)], [d.card]]);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', url: SITE + url, name: d.metaTitle, description: d.metaDesc, inLanguage: HREFLANG[l],
      isPartOf: { '@id': SITE + '/#website' }, about: { '@id': SITE + '/#app' }, primaryImageOfPage: SITE + `/media/${c.media}.webp` },
    bc.ld,
    { '@type': 'FAQPage', inLanguage: HREFLANG[l], mainEntity: d.faq.map(([q, a]) => ({ '@type': 'Question', name: text(q), acceptedAnswer: { '@type': 'Answer', text: text(a) } })) },
  ] };
  const body = `<header class="hero uc-hero"><div class="wrap">
  ${bc.html}
  <div class="eyebrow">${h.eyebrow}</div>
  <h1>${d.h1}</h1>
  <p class="lead">${d.lead}</p>
  ${ctaBlock(l)}
</div></header>
<section style="padding-top:20px"><div class="wrap uc-split">
  <div>
    <h2>${h.pieces}</h2>
    <div class="uc-pieces">${d.pieces.map(([t, p]) => `<div class="card"><h3>${t}</h3><p>${p}</p></div>`).join('')}</div>
  </div>
  <figure class="uc-media"><video data-src="/media/${c.media}.mp4" poster="/media/${c.media}.webp" width="${c.w}" height="${c.h}" muted loop playsinline aria-label="${attr(d.card)}"></video></figure>
</div></section>
<section class="alt"><div class="wrap">
  <h2>${h.prompt}</h2>
  <div class="prompt" style="margin-top:20px;max-width:760px">“${d.prompt}”</div>
  ${ctaBlock(l)}
</div></section>
<section><div class="wrap">
  <h2>${h.faq}</h2>
  ${d.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n  ')}
</div></section>
<section class="alt"><div class="wrap">
  <h2>${h.related}</h2>
  <div class="uc-grid">${useCaseCards(l, c.slug)}</div>
</div></section>`;
  const alts = Object.fromEntries(UC_LANGS.map(x => [x, ucPath(x, c.slug)]));
  return shell(l, { title: d.metaTitle, desc: d.metaDesc, url, alts, ld, body });
}

function useCaseHub(l) {
  const h = HUB[l], url = ucHub(l);
  const bc = crumbs(l, [[h.crumb]]);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', url: SITE + url, name: h.metaTitle, description: h.metaDesc, inLanguage: HREFLANG[l], isPartOf: { '@id': SITE + '/#website' } },
    bc.ld,
    { '@type': 'ItemList', itemListElement: CASES.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + ucPath(l, c.slug), name: c[l].card })) },
  ] };
  const body = `<header class="hero uc-hero"><div class="wrap">
  ${bc.html}
  <div class="eyebrow">${h.eyebrow}</div>
  <h1>${h.h1}</h1>
  <p class="lead">${h.lead}</p>
</div></header>
<section style="padding-top:20px"><div class="wrap">
  <div class="uc-grid">${useCaseCards(l)}</div>
  ${ctaBlock(l)}
</div></section>`;
  const alts = Object.fromEntries(UC_LANGS.map(x => [x, ucHub(x)]));
  return shell(l, { title: h.metaTitle, desc: h.metaDesc, url, alts, ld, body });
}

function writeUseCases() {
  for (const l of UC_LANGS) {
    const write = (u, html) => { const dir = path.join(out, u); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.html'), html); };
    write(ucHub(l), useCaseHub(l));
    for (const c of CASES) write(ucPath(l, c.slug), useCasePage(l, c));
  }
}

function useCaseUrls() {
  const entry = (u, alts, pr) => `  <url>\n    <loc>${SITE + u}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${pr}</priority>\n` +
    Object.entries(alts).map(([x, a]) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[x]}" href="${SITE + a}"/>`).join('\n') +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + alts.en}"/>\n  </url>`;
  const urls = [];
  for (const l of UC_LANGS) {
    urls.push(entry(ucHub(l), Object.fromEntries(UC_LANGS.map(x => [x, ucHub(x)])), '0.8'));
    for (const c of CASES) urls.push(entry(ucPath(l, c.slug), Object.fromEntries(UC_LANGS.map(x => [x, ucPath(x, c.slug)])), '0.8'));
  }
  return urls;
}

function notFound() {
  const t = Object.fromEntries(LANGS.map(l => [l, { t: I18N[l].nfT, p: I18N[l].nfP, b: I18N[l].nfBtn, h: urlPath(l) }]));
  const e = t[DEFAULT];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 · OverlayGenerator</title><meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/styles.css">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head><body><main class="nf"><div class="wrap">
<div class="big">404</div><h1 id="t" style="margin:12px 0">${e.t}</h1><p class="lead" id="p" style="margin:0 auto 28px">${e.p}</p>
<a class="btn btn-primary" id="b" href="/">${e.b}</a></div></main>
<script>(function(){var T=${JSON.stringify(t)},n=navigator.languages||[navigator.language||''];
for(var i=0;i<n.length;i++){var x=T[(n[i]||'').toLowerCase().split('-')[0]];if(x){document.documentElement.lang=n[i];
document.getElementById('t').textContent=x.t;document.getElementById('p').textContent=x.p;var b=document.getElementById('b');b.textContent=x.b;b.href=x.h;return}}})();</script>
</body></html>`;
}

function sitemap() {
  const alts = LANGS.map(x => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[x]}" href="${abs(x)}"/>`).join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(DEFAULT)}"/>`;
  const urls = LANGS.map(l => `  <url>\n    <loc>${abs(l)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${l === DEFAULT ? '1.0' : '0.9'}</priority>\n${alts}\n  </url>`);
  urls.push(...useCaseUrls());
  urls.push(`  <url>\n    <loc>${SITE}/demo/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>0.6</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

const manifest = {
  name: 'OverlayGenerator', short_name: 'OverlayGen', description: text(I18N.en.metaDesc),
  start_url: '/', display: 'standalone', background_color: '#0d0b14', theme_color: '#9146ff',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
};

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(here, 'static'), out, { recursive: true });
for (const l of LANGS) {
  const dir = path.join(out, l === DEFAULT ? '' : l);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(l));
}
writeUseCases();
fs.writeFileSync(path.join(out, '404.html'), notFound());
fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(out, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log(`Built ${LANGS.length} pages for ${SITE} into ${out}`);
