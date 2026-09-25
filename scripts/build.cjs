// Recompose saved character art and editable SVG marks. No image API is used.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'whalechan');
const dest = path.join(root, 'build', 'whalechan');
const assets = path.join(root, 'assets');
const mapping = JSON.parse(fs.readFileSync(path.join(assets, 'icon-map.json'), 'utf8'));
const data = p => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 192 192">${body}</svg>`;
function frame(art, overlay = '') {
  return `<defs><clipPath id="card"><rect x="5" y="5" width="182" height="182" rx="29"/></clipPath></defs><rect x="5" y="5" width="182" height="182" rx="29" fill="#f2f8fc"/><g clip-path="url(#card)"><image x="10" y="10" width="172" height="172" xlink:href="${data(art)}"/>${overlay}</g><rect x="5" y="5" width="182" height="182" rx="29" fill="none" stroke="#b5d2e4" stroke-width="2"/>`;
}
const graphics = {
  network: '<circle cx="24" cy="24" r="19"/><ellipse cx="24" cy="24" rx="9" ry="19"/><path d="M5 24h38M9 12h30M9 36h30"/>',
  hwtest: '<rect x="11" y="11" width="26" height="26" rx="3"/><path d="M18 3v8m12-8v8M18 37v8m12-8v8M3 18h8m-8 12h8m26-12h8m-8 12h8"/>',
  clover: '<path d="M24 24C-5 20 7-3 24 14 40-3 53 20 24 24c29 4 16 27 0 10C7 51-5 28 24 24Zm0 0v22"/>'
};
async function build() {
  // Checked-in static assets are copied, never deleted or overwritten in place.
  fs.mkdirSync(dest, { recursive: true });
  for (const name of ['theme.conf', 'background.png', 'selection_big.png', 'selection_small.png', 'icons']) {
    fs.cpSync(path.join(base, name), path.join(dest, name), { recursive: true });
  }
  let rebuilt = 0;
  for (const entry of mapping) {
    let body, size;
    if (entry.file.startsWith('os_')) {
      size = 192;
      if (entry.art.startsWith('happy-heart-held-')) {
        body = frame(path.join(assets, 'art/os', entry.art.slice('happy-heart-held-'.length) + '.png'));
      } else if (entry.art === 'held-plaque') {
        const mark = entry.heldMark;
        let middle;
        if (mark.startsWith('rEFInd-minimal/')) {
          const logo = path.join(assets, 'os-logos', path.basename(mark));
          middle = `<image x="0" y="0" width="48" height="48" xlink:href="${data(logo)}"/>`;
        } else if (graphics[mark]) {
          middle = `<g fill="none" stroke="#315d83" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${graphics[mark]}</g>`;
        } else {
          const fontSize = mark.length > 5 ? 10 : mark.length > 3 ? 12 : mark.length > 2 ? 16 : 24;
          middle = `<text x="24" y="30" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-weight="bold" font-size="${fontSize}" fill="#315d83">${esc(mark)}</text>`;
        }
        body = frame(path.join(assets, 'art/os/holder.png'), `<g transform="translate(84 133) scale(.5)">${middle}</g>`);
      } else throw new Error('Unknown OS art: ' + entry.file);
    } else if (/^(func_|tool_|vol_)/.test(entry.file)) {
      const small = entry.file.startsWith('vol_');
      size = small ? 48 : 96;
      const b = small ? 78 : 66;
      const badge = fs.readFileSync(path.join(assets, 'badges', entry.badge + '.svg'), 'utf8')
        .replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      body = frame(path.join(assets, 'art/functions', entry.art + '.png'));
      body += `<g transform="translate(${190-b} ${190-b})"><rect width="${b}" height="${b}" rx="15" fill="white" stroke="#86aac8" stroke-width="2.5"/><g transform="translate(7 7) scale(${(b-14)/48})">${badge}</g></g>`;
    } else if (entry.file.startsWith('boot_')) continue;
    else throw new Error('Unmapped entry: ' + entry.file);
    await sharp(Buffer.from(svg(size, body))).ensureAlpha().png({ palette: false, progressive: false }).toFile(path.join(dest, 'icons', entry.file));
    rebuilt++;
  }
  for (const name of ['linux', 'win']) {
    fs.copyFileSync(path.join(dest, 'icons', `os_${name}.png`), path.join(dest, 'icons', `boot_${name}.png`));
    rebuilt++;
  }
  console.log(`Rebuilt ${rebuilt} icons in build/whalechan; static artwork copied from whalechan/.`);
  await require('./validate.cjs').validate(dest);
}
build().catch(error => { console.error(error.message); process.exitCode = 1; });
