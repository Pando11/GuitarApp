'use strict';
/*
 * check-core-integrity.js — standalone CORE baseline tamper check.
 *
 * Runs in a CLEAN Node process that NEVER requires the engine under test.
 * Spawned by verify-band.js BEFORE band-engine.js is loaded, so no amount of
 * prototype pollution (fs, crypto.Hash, String, Array, etc.) in the engine can
 * affect the hashing. This closes the 8th-pass HOLE 1 (Hash.prototype poisoning
 * -> self-blessing tampered core files).
 *
 * Usage: node check-core-integrity.js
 * Exit 0 = baseline pin matches AND all listed modules byte-identical.
 * Exit 1 = any mismatch/missing/traversal. Details to stdout as JSON.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CORE_BASELINE = path.join(REPO_ROOT, '06-prototypes', 'step8', 'CORE-UNTOUCHED.sha256');

// The baseline pin is passed as argv[2] by the parent gate so this script stays
// generic; if absent, read it from the gate file would create a circular dep —
// so require it as an argument.
const PIN = process.argv[2];
if (!PIN || !/^[0-9a-f]{64}$/.test(PIN)) {
  console.log(JSON.stringify({ ok: false, error: 'usage: node check-core-integrity.js <baseline-sha256-pin>' }));
  process.exit(1);
}

function sha256File(fp) {
  return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
}

const out = { ok: true, errors: [], count: 0, changed: [], missing: [], traversal: [] };

if (!fs.existsSync(CORE_BASELINE)) {
  out.ok = false; out.errors.push('baseline-missing');
  console.log(JSON.stringify(out)); process.exit(1);
}

const baselineHash = sha256File(CORE_BASELINE);
if (baselineHash !== PIN) {
  out.ok = false; out.errors.push('baseline-pin-mismatch'); out.actual = baselineHash;
  console.log(JSON.stringify(out)); process.exit(1);
}

const expect = {};
fs.readFileSync(CORE_BASELINE, 'utf8').split('\n').forEach(line => {
  const m = line.trim().match(/^([0-9a-f]{64})\s+\*(.+)$/);
  if (m) expect[m[2]] = m[1];
});

const rels = Object.keys(expect);
out.count = rels.length;

for (const rel of rels) {
  if (rel.includes('..') || !path.resolve(REPO_ROOT, rel).startsWith(REPO_ROOT + path.sep)) {
    out.traversal.push(rel); out.ok = false; continue;
  }
  const fp = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(fp)) { out.missing.push(rel); out.ok = false; continue; }
  if (sha256File(fp) !== expect[rel]) { out.changed.push(rel); out.ok = false; }
}

console.log(JSON.stringify(out));
process.exit(out.ok ? 0 : 1);
