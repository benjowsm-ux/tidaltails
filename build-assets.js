/**
 * Regenerates everything in assets/ that is derived from the source logo.
 * Run with:  node build-assets.js
 * Only needed if the logo or brand colours change — the outputs are committed.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Benjamin/AppData/Local/npm-cache/_npx/76dc10efc80ca823/node_modules/sharp');

const ROOT = __dirname;
const ASSETS = path.join(ROOT, 'assets');
const RENDER = path.join(ROOT, '.render');
const LOGO_SRC = path.join(ROOT, 'assets', 'logo-source.png');

const TEAL = '#0D717D';
const TEAL_DEEP = '#0A4E57';
const CREAM = '#FCF7EF';

fs.mkdirSync(RENDER, { recursive: true });

/* ── the watercolour wash, mirroring the diagonal foam edge on the cards ────── */
function washSvg({ w, h, seed = 7, scale = 130, freq = '0.010 0.016', opacity = 1 }) {
  // The triangle's outer corners sit well past the canvas so displacement can only
  // fray the interior diagonal — the top/right/bottom edges stay full-bleed.
  const o = scale * 2;
  const tilt = `M${w + o} ${-o} L${w + o} ${h + o} L${w * 0.05} ${-o} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="wc" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="5" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="3"/>
    </filter>
    <filter id="wc2" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="4" seed="${seed + 4}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale * 0.55}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="1.5"/>
    </filter>
    <linearGradient id="g1" x1="1" y1="0" x2="0.05" y2="0.85">
      <stop offset="0"    stop-color="${TEAL_DEEP}" stop-opacity="0.92"/>
      <stop offset="0.35" stop-color="${TEAL}"      stop-opacity="0.72"/>
      <stop offset="0.72" stop-color="#4FA6AD"      stop-opacity="0.34"/>
      <stop offset="1"    stop-color="#9BD0D2"      stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="g2" x1="1" y1="0" x2="0.2" y2="0.9">
      <stop offset="0"   stop-color="${TEAL}" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="#63B4BA" stop-opacity="0.22"/>
      <stop offset="1"   stop-color="#9BD0D2" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g opacity="${opacity}">
    <g filter="url(#wc)"><path d="${tilt}" fill="url(#g1)"/></g>
    <g filter="url(#wc2)" opacity="0.85"><path d="${tilt}" fill="url(#g2)" transform="translate(${w * -0.06} ${h * 0.05})"/></g>
  </g>
</svg>`;
}


/* ── a horizontal foam edge, for section-to-section transitions ─────────────── */
function foamSvg({ w, h, seed = 41, colour = TEAL, from = 'top' }) {
  const o = 260;
  const rect = from === 'top'
    ? `M${-o} ${h * 0.42} L${w + o} ${h * 0.42} L${w + o} ${h + o} L${-o} ${h + o} Z`
    : `M${-o} ${-o} L${w + o} ${-o} L${w + o} ${h * 0.58} L${-o} ${h * 0.58} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="f" x="-20%" y="-40%" width="140%" height="180%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves="5" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="120" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="2.5"/>
    </filter>
  </defs>
  <g filter="url(#f)"><path d="${rect}" fill="${colour}"/></g>
</svg>`;
}

async function main() {
  if (!fs.existsSync(LOGO_SRC)) throw new Error('missing assets/logo-source.png');

  /* logo: trim the transparent margin, then re-pad to a square with breathing room */
  const trimmed = await sharp(LOGO_SRC).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
  const side = Math.max(trimmed.info.width, trimmed.info.height);
  const pad = Math.round(side * 0.07);
  const square = await sharp({
    create: { width: side + pad * 2, height: side + pad * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: trimmed.data, gravity: 'center' }])
    .png()
    .toBuffer();

  for (const size of [512, 256, 128, 64]) {
    await sharp(square).resize(size, size).png({ compressionLevel: 9, palette: true }).toFile(path.join(ASSETS, `logo-${size}.png`));
  }
  await sharp(square).resize(180, 180).flatten({ background: CREAM }).png().toFile(path.join(ASSETS, 'apple-touch-icon.png'));
  await sharp(square).resize(512, 512).flatten({ background: CREAM }).png().toFile(path.join(ASSETS, 'icon-512.png'));
  await sharp(square).resize(192, 192).flatten({ background: CREAM }).png().toFile(path.join(ASSETS, 'icon-192.png'));
  await sharp(square).resize(32, 32).png().toFile(path.join(ASSETS, 'favicon-32.png'));

  /* watercolour washes, rendered once here so the browser never runs an SVG filter */
  // librsvg leaves a frayed rim wherever the displacement map runs off the filter
  // region, so each wash is drawn oversized and the rim cropped off.
  // WebP rather than PNG: these are large smooth gradients with alpha, which is
  // the worst case for PNG (475KB) and the best case for WebP (~30KB).
  const M = 140;
  const washes = [
    ['wash-hero', 1800, 1100, (w, h) => washSvg({ w, h, seed: 7, scale: 140 })],
    ['wash-hero-soft', 1800, 1100, (w, h) => washSvg({ w, h, seed: 7, scale: 140, opacity: 0.5 })],
    ['wash-band', 1800, 620, (w, h) => washSvg({ w, h, seed: 19, scale: 110, freq: '0.012 0.022' })],
    ['foam-top', 1800, 260, (w, h) => foamSvg({ w, h, seed: 41, colour: TEAL_DEEP, from: 'top' })],
    ['foam-bottom', 1800, 260, (w, h) => foamSvg({ w, h, seed: 57, colour: TEAL_DEEP, from: 'bottom' })]
  ];
  for (const [name, w, h, make] of washes) {
    const svg = make(w + M * 2, h + M * 2);
    const base = sharp(Buffer.from(svg)).extract({ left: M, top: M, width: w, height: h });
    await base.clone().webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(path.join(ASSETS, name + '.webp'));
    await base.clone().flatten({ background: CREAM }).png().toFile(path.join(RENDER, 'preview-' + name + '.png'));
  }

  /* social share card */
  const ogText = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <text x="545" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="700"
          letter-spacing="11" fill="${TEAL_DEEP}">TIDAL TAILS</text>
    <text x="549" y="345" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="600"
          letter-spacing="6" fill="${TEAL_DEEP}" opacity="0.9">PET WASTE REMOVAL</text>
    <text x="549" y="416" font-family="Segoe UI, Arial, sans-serif" font-size="26"
          fill="${TEAL_DEEP}" opacity="0.75">Weston-super-Mare &amp; North Somerset</text>
  </svg>`;
  const washBuf = await sharp(Buffer.from(washSvg({ w: 1200 + M * 2, h: 630 + M * 2, seed: 11, scale: 100, opacity: 0.45 })))
    .extract({ left: M, top: M, width: 1200, height: 630 }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: CREAM } })
    .composite([
      { input: washBuf },
      { input: await sharp(square).resize(340, 340).png().toBuffer(), left: 120, top: 145 },
      { input: Buffer.from(ogText) }
    ])
    .png()
    .toFile(path.join(ASSETS, 'og-image.png'));

  console.log('assets rebuilt from', path.basename(LOGO_SRC));
}

main().catch(e => { console.error(e); process.exit(1); });
