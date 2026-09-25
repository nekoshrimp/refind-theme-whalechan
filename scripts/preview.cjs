const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const theme = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'whalechan');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const map = JSON.parse(fs.readFileSync(path.join(root, 'assets/icon-map.json'), 'utf8'));
const cards = map.map(e => {
  const size = /^(os_|boot_)/.test(e.file) ? 192 : e.file.startsWith('vol_') ? 48 : 96;
  const image = fs.readFileSync(path.join(theme, 'icons', e.file)).toString('base64');
  return `<article><div class="image"><img width="${size}" height="${size}" src="data:image/png;base64,${image}"></div><h3>${escape(e.label || e.file.slice(0,-4))}</h3><code>${escape(e.file)}</code><p>${size}px</p></article>`;
}).join('');
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Whale-chan 图标图鉴</title><style>body{margin:28px;background:#edf3fa;color:#243e59;font-family:sans-serif}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}article{background:white;border-radius:18px;padding:16px;text-align:center}.image{height:192px;display:grid;place-items:center}h3{font-size:17px}code,p{font-size:12px;color:#607b95}</style><h1>Whale-chan for rEFInd</h1><p>全部系统与功能图标；按实际像素尺寸显示，请使用浏览器 100% 缩放。</p><main>${cards}</main></html>`;
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/icon-catalog.html'), html);
console.log('Updated docs/icon-catalog.html');
