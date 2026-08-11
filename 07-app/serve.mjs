// serve.mjs — zero-dep static server for the GuitarApp PWA.
// Run: node serve.mjs
//   - HTTP  on http://localhost:8080  (localhost counts as a secure context → mic works on desktop)
//   - HTTPS on https://localhost:8443 (needed for phone/LAN mic; uses cert.pem/key.pem if present)
// A PWA's service worker + the mic API (getUserMedia) require a "secure context".
// http://localhost is secure. Plain http://LAN-IP is NOT — that's why the mic throws
// "can't read properties of undefined" on the phone. Use the https:// LAN address for phones.
import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { buildUpstreamRequest } from './lib/tts-proxy.js';
import { loadDotEnv } from './lib/dotenv-load.js';

// A paid app keeps its synthesis key on the SERVER only (never in the client
// bundle). loadDotEnv() reads .env (OPENAI_API_KEY / CHATTERBOX_API_URL /
// CHATTERBOX_API_KEY) so the API voice is configurable without shell exports;
// existing shell env always wins. Must run BEFORE the PORT/key reads below.
loadDotEnv();

// Read a JSON request body (used by POST /api/tts).
function readBodyJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) { req.destroy(); reject(new Error('body too large')); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

let ROOT = fileURLToPath(new URL('.', import.meta.url));
while (ROOT.endsWith('/') || ROOT.endsWith('\\')) ROOT = ROOT.slice(0, -1);
const PORT = process.env.PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;

// Compute the LAN IPv4 so we can tell phones/others the exact secure URL to open.
function getLanIp() {
  const nics = networkInterfaces();
  for (const name of Object.keys(nics)) {
    for (const ni of nics[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) return ni.address;
    }
  }
  return 'localhost';
}
const LAN_IP = getLanIp();
const LAN_HTTPS = 'https://' + LAN_IP + ':' + HTTPS_PORT;
const LAN_HTTPS_DOGFOOD = LAN_HTTPS + '/?dogfood=1';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json', '.png':'image/png' };

const handler = async (req, res) => {
  // ---- Voice API: POST /api/tts -------------------------------------------------
  // The browser calls this same-origin so the synthesis key never ships in the client.
  // Steps: validate/resolve upstream via buildUpstreamRequest (pure, tested), call the
  // real provider with a server-side key, stream the audio back unchanged.
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/tts') {
    try {
      const body = await readBodyJson(req);
      const up = buildUpstreamRequest(body); // throws with .code if misconfigured
      const r = await fetch(up.url, { method: 'POST', headers: up.headers, body: JSON.stringify(up.payload) });
      if (!r.ok) { res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end('upstream TTS error ' + r.status); return; }
      const buf = Buffer.from(await r.arrayBuffer());
      res.writeHead(200, { 'Content-Type': up.contentType, 'Cache-Control': 'no-cache' });
      res.end(buf);
    } catch (e) {
      const status = e.code === 'EMPTY_TEXT' ? 400 : e.code === 'UNKNOWN_PROVIDER' ? 400 : 501;
      res.writeHead(status, { 'Content-Type': 'text/plain' });
      res.end('TTS unavailable: ' + (e.message || 'error'));
    }
    return;
  }
  try {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';
    const path = resolve(ROOT, '.' + url);
    if (!(path === ROOT || path.startsWith(ROOT + sep))) { res.writeHead(403); res.end('forbidden'); return; }
    let data = await readFile(path);
    const ctype = MIME[extname(path)] || 'application/octet-stream';
    // Inject the exact secure LAN URL into HTML so the app can tell users the
    // one correct address to open on a phone (avoids the insecure http://LAN-IP trap).
    if (extname(path) === '.html') {
      let html = data.toString('utf8');
      const inject = '<script>window.__LAN_HTTPS__=' + JSON.stringify(LAN_HTTPS) +
        ';window.__LAN_HTTPS_DOGFOOD__=' + JSON.stringify(LAN_HTTPS_DOGFOOD) + ';</script>';
      if (html.includes('</head>')) html = html.replace('</head>', inject + '</head>');
      else html += inject;
      data = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, { 'Content-Type': ctype, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
};

const httpServer = createServer(handler).listen(PORT, () => {
  console.log('GuitarApp PWA (HTTP)  → http://localhost:' + PORT + '/?dogfood=1');
});
// Fail SOFT like the HTTPS listener: a duplicate `start-lan.bat` click (port already
// in use) must NOT crash the whole process. Without this handler, an EADDRINUSE on
// :8080 throws an uncaught 'error' event → the server dies → the phone/desktop can't
// open the app at all. Match the HTTPS listener's resilience so re-running the launcher
// simply reports "already running" instead of taking the app down.
httpServer.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.warn('HTTP server not started (' + e.code + ' on :' + PORT + ') — an instance is already running. Leaving it alone.');
  } else {
    console.error('HTTP server error:', e);
  }
});

// HTTPS (optional — only if cert.pem/key.pem exist). Required for phone/LAN mic access.
let cert, key;
try { cert = readFileSync(resolve(ROOT, 'cert.pem')); key = readFileSync(resolve(ROOT, 'key.pem')); } catch {}
if (cert && key) {
  const httpsServer = createSecureServer({ cert, key }, handler);
  // Fail SOFT: a blocked/duplicate HTTPS port must NOT crash the whole server —
  // the HTTP server (used by the test harness and desktop) must stay up. An
  // unhandled 'error' event here would throw and kill every listener.
  httpsServer.on('error', (e) => {
    console.warn('HTTPS server not started (' + e.code + ' on :' + HTTPS_PORT + ') — phone mic over LAN needs this port free. HTTP server is unaffected.');
  });
  httpsServer.listen(HTTPS_PORT, () => {
    console.log('GuitarApp PWA (HTTPS, mic-enabled) → https://localhost:' + HTTPS_PORT + '/?dogfood=1');
    const nics = networkInterfaces();
    for (const name of Object.keys(nics)) {
      for (const ni of nics[name] || []) {
        if (ni.family === 'IPv4' && !ni.internal) {
          console.log('  Phone / LAN: https://' + ni.address + ':' + HTTPS_PORT + '/?dogfood=1');
          console.log('    (self-signed cert → tap "Advanced → Proceed" once; then the mic works)');
        }
      }
    }
  });
} else {
  console.log('No cert.pem/key.pem found — HTTPS not started. For phone mic access, generate a self-signed cert:');
  console.log('  openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=GuitarAppLocal" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"');
}
