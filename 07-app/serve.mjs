// serve.mjs — zero-dep static file server so the PWA (service worker + fetch) works.
// Run: node serve.mjs  →  open http://localhost:8080 on desktop, or your-machine-IP:8080 on phone.
// (A PWA's fetch + service worker require http(s), not file://. This serves 07-app/.)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

let ROOT = fileURLToPath(new URL('.', import.meta.url));
while (ROOT.endsWith('/') || ROOT.endsWith('\\')) ROOT = ROOT.slice(0, -1);
const PORT = process.env.PORT || 8080;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json', '.png':'image/png' };

createServer(async (req, res) => {
  try {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';
    const path = resolve(ROOT, '.' + url);
    if (!(path === ROOT || path.startsWith(ROOT + sep))) { res.writeHead(403); res.end('forbidden'); return; }
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
}).listen(PORT, () => {
  console.log('GuitarApp PWA on http://localhost:' + PORT + '  (ROOT=' + ROOT + ')');
  console.log('Phone / LAN install URLs — open WITH ?dogfood=1 for full free access:');
  const nics = networkInterfaces();
  for (const name of Object.keys(nics)) {
    for (const ni of nics[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) {
        console.log('  Open on your phone: http://' + ni.address + ':' + PORT + '/?dogfood=1');
      }
    }
  }
});
