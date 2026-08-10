// tts-route-smoke.mjs — boots serve.mjs as a child process, probes POST /api/tts for
// every provider/error shape, and asserts the route contract. Run:
//   node 07-app/test/tts-route-smoke.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // 07-app/
const serve = resolve(root, 'serve.mjs');

const srv = spawn(process.execPath, [serve], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: '8098' } });

async function waitForPort(url, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); return r; } catch { await new Promise(r => setTimeout(r, 100)); }
  }
  throw new Error('server never came up');
}

const base = 'http://localhost:8098';
let failures = 0;
function expect(name, got, want) {
  const ok = got === want;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + '  (got ' + got + ', want ' + want + ')');
  if (!ok) failures++;
}

try {
  await waitForPort(base + '/');
  const post = (body) => fetch(base + '/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  let r = await post({ provider: 'openai-tts', voice_id: 'onyx', text: 'hi' });
  expect('openai-tts no key → 501', r.status, 501);

  r = await post({ provider: 'chatterbox', voice_id: 'maggie', text: 'hi' });
  expect('chatterbox no endpoint → 501', r.status, 501);

  r = await post({ provider: 'openai-tts', text: '   ' });
  expect('empty text → 400', r.status, 400);

  r = await post({ provider: 'elevenlabs', text: 'hi' });
  expect('unknown provider → 400', r.status, 400);

  r = await fetch(base + '/');
  expect('static index → 200', r.status, 200);
} catch (e) {
  console.error('SMOKE ERROR', e);
  failures++;
} finally {
  srv.kill('SIGKILL');
}

console.log(failures === 0 ? '\ntts-route-smoke: ALL PASSED' : '\ntts-route-smoke: ' + failures + ' FAILED');
process.exit(failures === 0 ? 0 : 1);
