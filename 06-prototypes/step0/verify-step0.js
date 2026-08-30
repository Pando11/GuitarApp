// STEP 0 EVALUATOR — written by the evaluator, NOT by any builder.
// Judges the DONE BAR from 02-spec/PLAN-from-locked-spec-2026-08-07.md STEP 0:
//   (a) renderer ingests 3 distinct lesson JSONs and renders all UI (fretboard, captions, pacing)
//       with ZERO hand-built scenes;
//   (b) schema rejects a malformed JSON with a LOUD error;
//   (c) every emitted manifest's chord data matches the lesson JSON chord data EXACTLY.
// Run:  node verify-step0.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const p = (...a) => path.join(ROOT, ...a);
let fails = 0, checks = 0;
function ok(name, cond, detail) {
  checks++;
  if (cond) { console.log('  PASS  ' + name); }
  else { fails++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}
function section(t) { console.log('\n== ' + t + ' =='); }

section('0. Required files exist');
const required = [
  'CONTRACT.md', 'schema/lesson.schema.json', 'schema/validate.js',
  'engine/renderer.js', 'player.html',
  'lessons/L01.json', 'lessons/L02.json', 'lessons/L03.json', 'lessons/BROKEN.json'
];
for (const f of required) ok('exists ' + f, fs.existsSync(p(f)));
if (fails) { console.log('\nSTEP 0 RESULT: FAIL (missing files)'); process.exit(1); }

section('1. Zero npm dependencies / no node_modules');
ok('no node_modules dir', !fs.existsSync(p('node_modules')));
const rsrc = fs.readFileSync(p('engine/renderer.js'), 'utf8');
const vsrc = fs.readFileSync(p('schema/validate.js'), 'utf8');
const reqs = [...(rsrc + vsrc).matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1]);
ok('all requires are relative/builtin', reqs.every(r => r.startsWith('.') || ['fs','path'].includes(r)), reqs.join(','));
ok('renderer.js touches no DOM', !/\b(document|window)\b\./.test(rsrc));

section('2. Hard bans (8) — content scan of all step0 files');
const banned = /\b(camera|webcam|mediapipe|hand[- ]tracking|handtracking|getUserMedia|transcription|upload audio|audio upload|rive\.app|elevenlabs)\b/i;
function scanDir(d) {
  let hits = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) { hits = hits.concat(scanDir(full)); continue; }
    if (!/\.(js|json|html|md)$/.test(e.name)) continue;
    if (e.name === 'verify-step0.js' || e.name === 'CONTRACT.md') continue; // this file & contract name the bans on purpose
    const txt = fs.readFileSync(full, 'utf8');
    txt.split('\n').forEach((ln, i) => { if (banned.test(ln)) hits.push(path.relative(ROOT, full) + ':' + (i + 1) + ': ' + ln.trim().slice(0, 90)); });
  }
  return hits;
}
const banHits = scanDir(ROOT);
ok('no banned-feature references', banHits.length === 0, '\n        ' + banHits.join('\n        '));

section('3. Validator rejects malformed JSON LOUDLY');
const { validateLesson } = require('./schema/validate.js');
const broken = JSON.parse(fs.readFileSync(p('lessons/BROKEN.json'), 'utf8'));
const bres = validateLesson(broken);
ok('BROKEN.json reported invalid', bres && bres.valid === false);
ok('BROKEN.json yields >=3 specific errors', bres && Array.isArray(bres.errors) && bres.errors.length >= 3,
   bres && JSON.stringify(bres.errors));
if (bres && bres.errors) bres.errors.forEach(e => console.log('        error: ' + e));
const eres = validateLesson({});
ok('empty object reported invalid', eres && eres.valid === false);

section('3b. GOOD lessons must also PASS the validator (2026-08-08 review: bar never checked this)');
for (const n of ['L01', 'L02', 'L03']) {
  const j = JSON.parse(fs.readFileSync(p('lessons/' + n + '.json'), 'utf8'));
  const r = validateLesson(j);
  ok(n + ': passes schema validator', r.valid === true, r.errors && r.errors.join('; '));
}

section('3c. Chord-library regression suite must pass (known-correct and known-wrong chords)');
{
  const { execFileSync } = require('child_process');
  let suiteOk = true, out = '';
  try { out = execFileSync(process.execPath, [p('tests/test-chord-library.js')], { encoding: 'utf8' }); }
  catch (e) { suiteOk = false; out = (e.stdout || '') + (e.stderr || ''); }
  ok('tests/test-chord-library.js exits 0', suiteOk, out.split('\n').slice(-6).join(' | '));
}

section('4. Renderer ingests 3 distinct lessons, zero hand-built scenes');
const { buildManifest } = require('./engine/renderer.js');
const lessons = ['L01', 'L02', 'L03'].map(n => ({ n, j: JSON.parse(fs.readFileSync(p('lessons/' + n + '.json'), 'utf8')) }));
const ids = new Set(lessons.map(l => l.j.lesson && l.j.lesson.id));
ok('3 lessons have distinct ids', ids.size === 3, [...ids].join(','));
// zero hand-built scenes: renderer source must not contain any lesson id
const hardcoded = [...ids].filter(id => id && rsrc.includes(id));
ok('renderer hardcodes no lesson id', hardcoded.length === 0, hardcoded.join(','));

const manifests = {};
for (const { n, j } of lessons) {
  let m = null, err = null;
  try { m = buildManifest(j); } catch (e) { err = e.message; }
  ok(n + ': buildManifest succeeded', !!m, err);
  if (!m) continue;
  manifests[n] = m;
  const kinds = m.scenes.map(s => s.kind);
  ok(n + ': has intro first and wrap last', kinds[0] === 'intro' && kinds[kinds.length - 1] === 'wrap', kinds.join('>'));
  const chordCount = Object.keys(j.chords).filter(k => !k.startsWith('_')).length;
  const exCount = j.exercises.length;
  ok(n + ': one scene per chord (' + chordCount + ')', kinds.filter(k => k === 'chord').length === chordCount);
  ok(n + ': one scene per exercise (' + exCount + ')', kinds.filter(k => k === 'exercise').length === exCount);
  ok(n + ': every scene has a non-empty caption', m.scenes.every(s => typeof s.caption === 'string' && s.caption.trim().length > 0));
  ok(n + ': pacing present (all durationMs > 0)', m.scenes.every(s => typeof s.durationMs === 'number' && s.durationMs > 0));
  ok(n + ': totalDurationMs == sum(scenes)', m.totalDurationMs === m.scenes.reduce((a, s) => a + s.durationMs, 0), String(m.totalDurationMs));
}

section('5. FRETBOARD-DATA-CONSISTENT — manifest chords match lesson JSON exactly');
for (const { n, j } of lessons) {
  const m = manifests[n];
  if (!m) { ok(n + ': fretboard check', false, 'no manifest'); continue; }
  let bad = [];
  for (const s of m.scenes.filter(s => s.kind === 'chord')) {
    const src = Object.entries(j.chords).find(([k, v]) => !k.startsWith('_') && v.name === s.chord.name);
    if (!src) { bad.push(s.chord.name + ' not found in lesson.chords'); continue; }
    const a = src[1], b = s.chord;
    if (JSON.stringify(a.frets) !== JSON.stringify(b.frets)) bad.push(s.chord.name + ' frets ' + JSON.stringify(b.frets) + ' != ' + JSON.stringify(a.frets));
    if (JSON.stringify(a.fingers) !== JSON.stringify(b.fingers)) bad.push(s.chord.name + ' fingers mismatch');
    if (a.qa_status !== b.qa_status) bad.push(s.chord.name + ' qa_status mismatch');
    if (!Array.isArray(b.frets) || b.frets.length !== 6) bad.push(s.chord.name + ' frets not length 6');
  }
  ok(n + ': FRETBOARD-DATA-CONSISTENT-OK', bad.length === 0, bad.join(' | '));
}

section('6. Chord correctness (replaces human QA — Hard Ban 7 satisfied by arithmetic)');
const { verifyLesson } = require('./schema/chord-theory-check.js');
for (const { n, j } of lessons) {
  ok(n + ': every chord carries qa_status', Object.entries(j.chords).filter(([k]) => !k.startsWith('_')).every(([, c]) => typeof c.qa_status === 'string' && c.qa_status.length));
  ok(n + ': qa_block.must_verify non-empty', j.qa_block && Array.isArray(j.qa_block.must_verify) && j.qa_block.must_verify.length > 0);
  // 2026-08-08 review: exercise qa_status was never inspected.
  ok(n + ': every exercise carries a non-QA-PENDING qa_status', j.exercises.every(x => typeof x.qa_status === 'string' && x.qa_status.length && x.qa_status !== 'QA-PENDING'),
     j.exercises.filter(x => x.qa_status === 'QA-PENDING').map(x => x.id).join(','));
  const vr = verifyLesson(j);
  const bad = vr.results.filter(r => !r.ok);
  const warned = vr.results.filter(r => r.warnings.length);
  ok(n + ': all chords spell their own name (0 errors)', bad.length === 0,
     bad.map(b => b.key + ': ' + b.errors.join('/')).join(' | '));
  ok(n + ': all chords physically playable (0 warnings)', warned.length === 0,
     warned.map(b => b.key + ': ' + b.warnings.join('/')).join(' | '));
}

section('7. player.html — self-contained file:// deliverable');
const html = fs.readFileSync(p('player.html'), 'utf8');
ok('no CDN / external http(s) resources', !/(src|href)\s*=\s*["']https?:/i.test(html));
ok('no localhost server reference', !/localhost|127\.0\.0\.1|http\.server/i.test(html));
ok('has <script> logic inlined', /<script[\s\S]*<\/script>/i.test(html));
ok('renders svg fretboard', /<svg|createElementNS/i.test(html));
ok('has a loud error path', /SCHEMA INVALID|INVALID|error/i.test(html));
const opens = (html.match(/<div/g) || []).length, closes = (html.match(/<\/div>/g) || []).length;
ok('div tags balanced (' + opens + '/' + closes + ')', opens === closes);
// corruption = a hex colour immediately followed by NON-hex letters (e.g. #6f7governing, #2b3category)
const corrupt = [...html.matchAll(/#[0-9a-fA-F]{3,6}[g-zG-Z]{3,}/g)].map(m => m[0]);
ok('no corrupt tokens in css/js', corrupt.length === 0, corrupt.join(','));

console.log('\n=============================================');
console.log('STEP 0 DONE BAR: ' + (fails === 0 ? 'PASS' : 'FAIL') + '   (' + (checks - fails) + '/' + checks + ' checks passed)');
console.log('=============================================');
process.exit(fails === 0 ? 0 : 1);
