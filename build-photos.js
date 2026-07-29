/**
 * Fetches the placeholder photography from Pexels and writes optimised WebP
 * into photos/. Run with:  node build-photos.js
 *
 * These are free-licence stock images standing in until Ben has his own shots.
 * They are illustrative only — nothing here is presented as a photo of our own
 * work, which is why there is no before/after pair in this list.
 * Pexels licence: free for commercial use, no attribution required.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Benjamin/AppData/Local/npm-cache/_npx/76dc10efc80ca823/node_modules/sharp');

const OUT = path.join(__dirname, 'photos');
fs.mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { id: '22696514', name: 'garden-shed',  w: 1050, h: 1400, note: 'British back garden, shed and fence' },
  { id: '31792186', name: 'dog-lawn',     w: 1400, h: 1050, note: 'Golden labrador on a daisy lawn' },
  { id: '136097',   name: 'lawn-clean',   w: 1400, h: 1050, note: 'Striped lawn beside a fence' },
  { id: '34424159', name: 'dog-senior',   w: 1050, h: 1400, note: 'Older dog resting on grass' },
  { id: '1303829',  name: 'dogs-garden',  w: 1400, h: 1050, note: 'Two dogs in a walled garden' },
  { id: '8195888',  name: 'dog-close',    w: 1400, h: 1050, note: 'Retriever lying on the grass' }
];

const url = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

(async () => {
  for (const s of SHOTS) {
    const res = await fetch(url(s.id));
    if (!res.ok) { console.log('FAILED', s.name, res.status); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf)
      .resize(s.w, s.h, { fit: 'cover', position: 'attention' })
      .webp({ quality: 70, effort: 6 })
      .toFile(path.join(OUT, s.name + '.webp'));
    const kb = Math.round(fs.statSync(path.join(OUT, s.name + '.webp')).size / 1024);
    console.log(`${s.name}.webp  ${s.w}x${s.h}  ${kb}KB  — ${s.note}`);
  }
})();
