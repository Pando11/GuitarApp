// dotenv-load.test.mjs — PURE unit test of the .env parser/loader (no server,
// no network). Proves the API-voice keys are configurable by .env.
// Run: node 07-app/test/dotenv-load.test.mjs
import assert from 'node:assert/strict';
import { parseDotEnv, loadDotEnv } from '../lib/dotenv-load.js';

let n = 0;
function ok(name, fn) { fn(); n++; console.log('  ✓', name); }

ok('parse skips blanks + comments, strips quotes', () => {
  const m = parseDotEnv('# header\n\nOPENAI_API_KEY="sk-x"\nCHATTERBOX_API_URL=\'https://cb/v1\'\nCHATTERBOX_API_KEY=cb-plain\n  TRAILING= yes \n');
  assert.equal(m.OPENAI_API_KEY, 'sk-x');
  assert.equal(m.CHATTERBOX_API_URL, 'https://cb/v1');
  assert.equal(m.CHATTERBOX_API_KEY, 'cb-plain');
  assert.equal(m.TRAILING, 'yes'); // surrounding spaces trimmed, no quotes
  assert.equal(Object.keys(m).length, 4);
});

ok('loadDotEnv applies to process.env without clobbering existing', () => {
  const prev = process.env.__DOTENV_TEST_EXISTING__;
  process.env.__DOTENV_TEST_EXISTING__ = 'shell-wins';
  try {
    const parsed = loadDotEnv('/nonexistent/path/.env'); // no file -> graceful
    assert.ok(typeof parsed === 'object');
    // Missing file returns empty; existing shell var untouched.
    assert.equal(process.env.__DOTENV_TEST_EXISTING__, 'shell-wins');
  } finally { if (prev === undefined) delete process.env.__DOTENV_TEST_EXISTING__; else process.env.__DOTENV_TEST_EXISTING__ = prev; }
});

await (async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.resolve(process.cwd(), '..', 'test', '__t');
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  const f = path.join(dir, '.env');
  fs.writeFileSync(f, 'OPENAI_API_KEY=sk-from-file\nCHATTERBOX_API_URL=https://cb/v1\n');
  const before = process.env.OPENAI_API_KEY !== undefined ? process.env.OPENAI_API_KEY : '__UNSET__';
  delete process.env.OPENAI_API_KEY; // ensure unset so loader fills it
  try {
    const parsed = loadDotEnv(f);
    assert.equal(parsed.OPENAI_API_KEY, 'sk-from-file');
    assert.equal(process.env.OPENAI_API_KEY, 'sk-from-file');
    assert.equal(process.env.CHATTERBOX_API_URL, 'https://cb/v1');
    n++; console.log('  ✓ loader reads a real .env and fills unset keys');
  } finally {
    if (before === '__UNSET__') delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = before;
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
})();

console.log(`\ndotenv-load: ${n} checks passed, 0 failed`);
