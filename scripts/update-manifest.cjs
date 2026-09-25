// Run explicitly after reviewing intentional edits to existing source assets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets/manifest.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const entry of manifest) {
  const source = path.resolve(root, entry.file);
  if (!source.startsWith(root + path.sep)) throw new Error('Source outside repository');
  const bytes = fs.readFileSync(source);
  entry.bytes = bytes.length;
  entry.sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
}
fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Updated ${manifest.length} reviewed source hashes.`);
