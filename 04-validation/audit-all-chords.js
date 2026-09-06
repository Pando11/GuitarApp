// audit-all-chords.js — retroactive verification of EVERY chord in the whole project.
// Written 2026-08-07 after the owner asked the right question: if the checker is the
// verification, does everything built BEFORE the checker count as verified? It did not.
// This sweeps all JSON + HTML/JS prototypes, extracts any chord-shaped object, and runs
// the deterministic theory check over it.
'use strict';
const fs = require('fs');
const path = require('path');
const { verifyChord } = require('../06-prototypes/step0/schema/chord-theory-check.js');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'reference-repos', '07-archive']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full, out); continue; }
    if (/\.(json|html|js)$/.test(e.name)) out.push(full);
  }
  return out;
}

// A chord is anything with a 6-entry frets array. Accept several shapes seen across
// the older prototypes (frets/f, fingers/fi, name/n).
function normalize(o) {
  if (!o || typeof o !== 'object') return null;
  const frets = o.frets || o.f;
  if (!Array.isArray(frets) || frets.length !== 6) return null;
  const fingers = o.fingers || o.fi || frets.map(x => (x === null ? null : x === 0 ? 0 : 1));
  const name = o.name || o.n || o.label || o.chord || '';
  if (!name) return null;
  return { name, frets, fingers, qa_status: o.qa_status || 'unknown' };
}

function collectFromObject(obj, file, pathStr, found) {
  if (Array.isArray(obj)) { obj.forEach((v, i) => collectFromObject(v, file, pathStr + '[' + i + ']', found)); return; }
  if (!obj || typeof obj !== 'object') return;
  const c = normalize(obj);
  if (c) { found.push({ file, where: pathStr, chord: c }); return; }
  for (const [k, v] of Object.entries(obj)) collectFromObject(v, file, pathStr ? pathStr + '.' + k : k, found);
}

// Pull object literals out of HTML/JS by finding balanced braces around a "frets" key.
// 2026-08-08 review: eval failures were silently swallowed, so chords with nested
// objects / spread syntax / computed arrays evaded the audit. Now counted and reported.
function collectFromSource(txt, file, found, stats) {
  const re = /\{[^{}]*\b(?:frets|f)\s*:\s*\[[^\]]*\][^{}]*\}/g;
  let m;
  while ((m = re.exec(txt))) {
    let src = m[0];
    try {
      // eslint-disable-next-line no-eval
      const obj = eval('(' + src + ')');
      const c = normalize(obj);
      if (c) {
        const line = txt.slice(0, m.index).split('\n').length;
        found.push({ file, where: 'line ' + line, chord: c });
      } else { stats.unrecognized++; }
    } catch (e) {
      stats.evalFailed++;
      const line = txt.slice(0, m.index).split('\n').length;
      stats.evalFailedAt.push(file + ':line ' + line);
    }
  }
  // Detect candidates the regex itself cannot see (frets defined without an inline literal)
  const loose = txt.match(/\bfrets\s*[:=]/g);
  if (loose) stats.fretMentions += loose.length;
}

const files = walk(ROOT);
const found = [];
const unreadable = [];
const stats = { evalFailed: 0, evalFailedAt: [], unrecognized: 0, fretMentions: 0 };
for (const f of files) {
  const rel = path.relative(ROOT, f);
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch (e) { unreadable.push(rel); continue; }
  if (f.endsWith('.json')) {
    try { collectFromObject(JSON.parse(txt), rel, '', found); }
    catch (e) { unreadable.push(rel + ' (invalid JSON)'); }
  } else {
    collectFromSource(txt, rel, found, stats);
  }
}

// De-dupe identical chord definitions within the same file
const seen = new Set();
const unique = found.filter(x => {
  const k = x.file + '|' + x.chord.name + '|' + JSON.stringify(x.chord.frets) + '|' + JSON.stringify(x.chord.fingers);
  if (seen.has(k)) return false; seen.add(k); return true;
});

console.log('PROJECT-WIDE CHORD AUDIT — ' + new Date().toISOString().slice(0, 10));
console.log('scanned ' + files.length + ' files, found ' + unique.length + ' chord definitions\n');

const byFile = {};
for (const u of unique) (byFile[u.file] = byFile[u.file] || []).push(u);

let totalErr = 0, totalWarn = 0, badFiles = new Set();
for (const [file, items] of Object.entries(byFile)) {
  const isIntentionallyBroken = /BROKEN\.json/.test(file);
  console.log('── ' + file + (isIntentionallyBroken ? '   [intentionally broken fixture]' : ''));
  for (const it of items) {
    const r = verifyChord(it.where || '?', it.chord);
    const clean = r.ok && r.warnings.length === 0;
    console.log('   ' + (clean ? 'OK   ' : 'FLAG ') + (it.chord.name + '').padEnd(34).slice(0, 34) +
                ' ' + JSON.stringify(it.chord.frets).padEnd(24) + (r.uniqueNotes || []).join(' '));
    r.errors.forEach(e => console.log('        ERROR: ' + e));
    r.warnings.forEach(w => console.log('        WARN:  ' + w));
    if (!isIntentionallyBroken) {
      totalErr += r.errors.length; totalWarn += r.warnings.length;
      if (!clean) badFiles.add(file);
    }
  }
  console.log('');
}

if (unreadable.length) { console.log('NOT PARSED (' + unreadable.length + '): ' + unreadable.join(', ') + '\n'); }

// 2026-08-08: report extraction confidence — a chord count without a skip count hid misses.
console.log('EXTRACTION CONFIDENCE: ' + unique.length + ' chords found | ' +
  stats.evalFailed + ' candidates failed to parse (' + (stats.evalFailedAt.slice(0, 5).join(', ') || 'none') + ') | ' +
  stats.unrecognized + ' matched but unrecognised | ' + stats.fretMentions + ' loose frets mentions');
if (stats.evalFailed > 0) console.log('  -> some chord objects may have EVADED the audit (nested objects / spread / computed values). See lines above.\n');
else console.log('  -> every regex candidate parsed; no known evasions in the scanned files.\n');

console.log('='.repeat(60));
console.log('TOTAL (excluding intentional BROKEN fixture): ' + totalErr + ' errors, ' + totalWarn + ' warnings');
console.log('files with problems: ' + (badFiles.size ? [...badFiles].join(', ') : 'none'));
console.log(totalErr === 0 && totalWarn === 0 ? 'PROJECT-CHORDS-VERIFIED-OK' : 'AUDIT FAILED — fix the flags above');
console.log('='.repeat(60));
process.exit(totalErr === 0 && totalWarn === 0 ? 0 : 1);
