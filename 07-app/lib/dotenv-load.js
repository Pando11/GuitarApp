// dotenv-load.js — zero-dependency .env reader for the GuitarApp server.
// A paid app keeps its synthesis key SERVER-SIDE only (never in the client
// bundle). This loads OPENAI_API_KEY / CHATTERBOX_API_URL / CHATTERBOX_API_KEY
// from a local .env so the API voice is configurable by copying env.example ->
// .env, without exporting shell vars every launch.
//
// Pure + testable: loadDotEnvFile(path) parses and returns the key/value map,
// applying each to process.env ONLY when the key is currently undefined (so a
// real shell export always wins). No network, no side effects beyond env.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Parse a .env file's text into a plain object. Skips blank lines and # comments,
// strips optional surrounding quotes. Exposed so it can be unit-tested alone.
export function parseDotEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    out[m[1]] = val;
  }
  return out;
}

// Loads .env (default: <cwd>/.env) into process.env (without clobbering existing
// keys). Returns the parsed map. Never throws if the file is missing.
export function loadDotEnv(path) {
  let parsed = {};
  try {
    const target = path ? path : resolve(process.cwd(), '.env');
    parsed = parseDotEnv(readFileSync(target, 'utf8'));
  } catch { return parsed; } // no .env present — caller falls back to shell env
  for (const k of Object.keys(parsed)) {
    if (process.env[k] === undefined) process.env[k] = parsed[k];
  }
  return parsed;
}
