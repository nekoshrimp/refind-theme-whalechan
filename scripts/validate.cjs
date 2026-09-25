const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function validate(theme = path.join(root, 'whalechan')) {
  const map = JSON.parse(fs.readFileSync(path.join(root, 'assets/icon-map.json'), 'utf8'));
  const themeFiles = ['background.png', 'icons', 'selection_big.png', 'selection_small.png', 'theme.conf'].sort();
  if (JSON.stringify(fs.readdirSync(theme).sort()) !== JSON.stringify(themeFiles)) throw new Error('Theme directory must contain only runtime assets');
  const names = fs.readdirSync(path.join(theme, 'icons')).filter(n => n.endsWith('.png')).sort();
  const expected = [...map.map(e => e.file), 'arrow_left.png', 'arrow_right.png', 'mouse.png', 'transparent.png'].sort();
  if (new Set(expected).size !== 106 || JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('Missing, extra or duplicate icon names');
  for (const name of names) {
    const file = path.join(theme, 'icons', name);
    const m = await sharp(file).metadata();
    await sharp(file).stats();
    const size = /^(os_|boot_)/.test(name) ? 192 : /^(func_|tool_)/.test(name) ? 96 : name === 'mouse.png' ? 32 : 48;
    if (m.width !== size || m.height !== size || !m.hasAlpha || m.isProgressive) throw new Error('Bad PNG format: ' + name);
  }
  const blank = await sharp(path.join(theme, 'icons/transparent.png')).stats();
  if (blank.channels[3].max !== 0) throw new Error('Transparent placeholder contains pixels');
  for (const line of fs.readFileSync(path.join(theme, 'theme.conf'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(banner|icons_dir|selection_big|selection_small)\s+themes\/whalechan\/(.+)$/);
    if (m && !fs.existsSync(path.join(theme, m[2]))) throw new Error('Broken configuration reference: ' + m[2]);
    if (/^(scanfor|menuentry|loader|options|timeout|default_selection|showtools)\s/.test(line)) throw new Error('Unexpected boot-policy override');
  }
  for (const e of map.filter(e => /^(func_|tool_|vol_)/.test(e.file))) {
    if (!e.badge || !e.cornerBadge || e.badgePosition !== 'bottom-right') throw new Error('Missing function badge: ' + e.file);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/manifest.json'), 'utf8'));
  for (const e of manifest) {
    const p = path.resolve(root, e.file);
    if (!p.startsWith(root + path.sep) || !fs.existsSync(p)) throw new Error('Invalid source path: ' + e.file);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    if (hash !== e.sha256) throw new Error('Source changed; review and update assets/manifest.json: ' + e.file);
  }
  console.log('PASS: 106 icons, PNG sizes/alpha, configuration, 23 badges and source hashes. UEFI not tested.');
}
module.exports = { validate };
if (require.main === module) validate(process.argv[2] ? path.resolve(process.argv[2]) : undefined).catch(e => { console.error(e.message); process.exitCode = 1; });
