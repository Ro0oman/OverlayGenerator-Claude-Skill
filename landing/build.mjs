// Builds the static, pre-translated landing site into dist/.
// One page per language (English at "/", the rest at "/<lang>/"), plus sitemap, robots, manifest and 404.
//   node landing/build.mjs [outDir]
// Env: SITE_URL (default https://overlays.romandev.app), UMAMI_SRC + UMAMI_ID (optional analytics).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { I18N, LOCALES, HREFLANG } = createRequire(import.meta.url)('./i18n.cjs');
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
    GALLERY: GALLERY.map(([f, w, h, k]) => `<figure><video data-src="/media/${f}.mp4" poster="/media/${f}.webp" width="${w}" height="${h}" muted loop playsinline aria-label="${attr(text(d[k]))}"></video><figcaption>${d[k]}</figcaption></figure>`).join('\n    '),
  };
  const tpl = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`Missing key "${k}" for ${l}`);
    return vars[k];
  });
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
fs.writeFileSync(path.join(out, '404.html'), notFound());
fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(out, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log(`Built ${LANGS.length} pages for ${SITE} into ${out}`);
