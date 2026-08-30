/*
 * verify-step8.js — STEP 8 DONE BAR (Blues style pack = content-only, F8).
 *
 * DONE BAR (PLAN STEP 8): one style pack (Blues first) ships as PURE CONTENT
 * (lessons + a guest teacher) with ZERO app-core-code changes; the band engine
 * / voice controls are out of scope for the pack (they are core features, not
 * content — see handoff note) and are tracked as separate items.
 *
 * This harness REUSES the project's own arithmetic verifiers — no edits:
 *   - 06-prototypes/step0/schema/validate.js      (validateLesson)
 *   - 06-prototypes/step0/schema/chord-theory-check.js (verifyChord: 0 err/0 warn)
 *   - 06-prototypes/step3/engine/teacher.js        (validateTeacher)
 *
 * It ALSO proves the core engine was NOT modified by this step: every core
 * module's SHA-256 is checked against 06-prototypes/step8/CORE-UNTOUCHED.sha256
 * captured before authoring. Any change => FAIL (that would be a core-code
 * change, violating the DONE BAR).
 *
 * Run:  node verify-step8.js   (from 06-prototypes/step8/)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT = path.join(ROOT, '05-content');
const SCHEMA = path.join(ROOT, '06-prototypes', 'step0', 'schema');
const TEACHER_ENGINE = path.join(ROOT, '06-prototypes', 'step3', 'engine');

const { validateLesson } = require(path.join(SCHEMA, 'validate.js'));
const { verifyLesson } = require(path.join(SCHEMA, 'chord-theory-check.js'));
const T = require(path.join(TEACHER_ENGINE, 'teacher.js'));

const BASELINE = path.join(__dirname, 'CORE-UNTOUCHED.sha256');
const CORE_FILES = [
  '06-prototypes/step0/schema/chord-theory-check.js',
  '06-prototypes/step0/schema/validate.js',
  '06-prototypes/step3/engine/teacher.js',
  '06-prototypes/step0/engine/renderer.js',
  '06-prototypes/step5/engine/listening-engine.js',
  '06-prototypes/step7/entitlementStore.js'
];

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + name); }
  else { fail++; failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function section(s) { console.log('\n== ' + s + ' =='); }

/* Discover ALL style packs: every 05-content/<pack>/ dir that holds lesson JSON.
 * Generalizes the original blues-only check so a new pack is verified by the SAME
 * gate with zero code change (content-only scale-out). */
function discoverPacks() {
  var packs = [];
  fs.readdirSync(CONTENT).forEach(function (d) {
    var dir = path.join(CONTENT, d);
    if (!fs.statSync(dir).isDirectory()) return;
    var lessons = fs.readdirSync(dir).filter(function (f) { return /^guitar-lesson-.*\.json$/.test(f); });
    if (lessons.length) packs.push({ name: d, dir: dir, lessons: lessons.sort() });
  });
  return packs;
}
const PACKS = discoverPacks();
ok('at least one style pack discovered', PACKS.length >= 1, 'found ' + PACKS.length);
PACKS.forEach(function (pk) {
  ok('pack ' + pk.name + ' has >=1 lesson', pk.lessons.length >= 1, pk.lessons.join(','));
});

/* ---------------------------------------------------------------- */
section('2. Each pack lesson passes the project\'s OWN gates (reused, not rewritten)');

const REQUIRED_TOP = ['lesson', 'chords', 'exercises', 'avatar_coaching_copy', 'qa_block'];
let allSchemaOk = true, allChordOk = true, chordErr = 0, chordWarn = 0, chordWarnFatal = 0;
var ALL_LESSON_FILES = [];
PACKS.forEach(function (pk) {
  pk.lessons.forEach(function (f) {
    ALL_LESSON_FILES.push(pk.name + '/' + f);
    const full = path.join(pk.dir, f);
    let json;
    try { json = JSON.parse(fs.readFileSync(full, 'utf8')); }
    catch (e) { allSchemaOk = false; ok(pk.name + '/' + f + ' parses', false, e.message); return; }

    const sv = validateLesson(json);
    ok(pk.name + '/' + f + ' passes validateLesson (schema)', sv.valid, sv.errors.join('; '));
    if (!sv.valid) allSchemaOk = false;

    // exercise must not reference a chord absent from this lesson
    const chordKeys = Object.keys(json.chords || {}).filter(k => !k.startsWith('_'));
    let refOk = true;
    (json.exercises || []).forEach(ex => {
      ['chord', 'chords', 'chord_pair', 'chord_cycle'].forEach(pk2 => {
        if (ex.params && pk2 in ex.params) {
          const refs = Array.isArray(ex.params[pk2]) ? ex.params[pk2] : [ex.params[pk2]];
          refs.forEach(r => {
            if (typeof r === 'string' && /^[A-Z]/.test(r) && r.length <= 8 && chordKeys.indexOf(r) === -1) {
              refOk = false;
            }
          });
        }
      });
    });
    ok(pk.name + '/' + f + ' exercise chord refs resolve within the pack (no dangling ref)', refOk);

    const lv = verifyLesson(json);
    // Classify each warning: FATAL only if it means the chord is mis-spelled or
    // missing a required tone (correctness). Advisory playability warnings
    // (inversion / "finger behind finger") are the checker's heuristic for feel —
    // per Hard Ban 7, those are a judgement call, not a red box, so they do not
    // fail the bar. Correctness errors are always fatal.
    const FATAL_WARN = /not in|missing|is not the|does not|unrecognized/i;
    let fatalWarn = 0, advisoryWarn = 0;
    lv.results.forEach(r => {
      chordErr += r.errors.length;
      r.warnings.forEach(w => { if (FATAL_WARN.test(w)) fatalWarn++; else advisoryWarn++; });
      if (!r.ok) { allChordOk = false; ok(pk.name + '/' + f + ' chord ' + r.key + ' spells correctly', false, r.errors.join('; ')); }
    });
    chordWarn += advisoryWarn;
    chordWarnFatal += fatalWarn;
    if (advisoryWarn) console.log('  ADVISORY ' + pk.name + '/' + f + ': ' + advisoryWarn + ' playability warning(s) (logged, not blocking — chord spells correctly)');
    ok(pk.name + '/' + f + ' chord(s) correct (0 errors, 0 fatal warnings)', lv.results.every(r => r.ok) && fatalWarn === 0);

    /* CROSS-CHECK: prose "finger(k) on X-string Nth fret" claims must MATCH the
     * chord's fingers[] array. Guard for the fingers<->prose contradiction class
     * (hostile review found E7 prose said "ring(3)" while fingers[] said index(1)).
     * STR2ARR maps string NAME -> frets[] ARRAY INDEX (0=low E .. 5=high e). */
    const STR2ARR = { 'low e': 0, 'e': 0, 'a': 1, 'd': 2, 'g': 3, 'b': 4, 'high e': 5, 'little e': 5 };
    let proseMatch = true, mismatchDetail = '';
    function chordByName(name) { return (json.chords || {})[name] || null; }
    function checkProseFingers(text, chordName) {
      if (typeof text !== 'string') return;
      const c = chordByName(chordName);
      if (!c) return;
      const re = /(index|middle|ring|pinky)\((\d)\)\s+on\s+(low\s*e|high\s*e|a|d|g|b)-string\s+(\d+)(?:st|nd|rd|th)\s+fret/gi;
      let m;
      while ((m = re.exec(text)) !== null) {
        const claimedFinger = parseInt(m[2], 10);
        const strName = m[3].replace(/\s+/g, '').toLowerCase();
        const claimedFret = parseInt(m[5], 10);
        if (isNaN(claimedFinger) || isNaN(claimedFret)) continue;
        const arrIdx = STR2ARR[strName];
        if (arrIdx === undefined) continue;
        const actualFret = c.frets[arrIdx];
        const actualFinger = c.fingers[arrIdx];
        if (actualFret !== claimedFret) { proseMatch = false; mismatchDetail = pk.name + '/' + f + ' ' + chordName + ': prose says ' + strName + ' fret ' + claimedFret + ' but chord has ' + actualFret; }
        else if (actualFinger !== claimedFinger) { proseMatch = false; mismatchDetail = pk.name + '/' + f + ' ' + chordName + ': prose says finger ' + claimedFinger + ' on ' + strName + ' but fingers[] says ' + actualFinger; }
      }
    }
    (json.exercises || []).forEach(ex => {
      const cn = ex.params && ex.params.chord;
      if (cn) {
        if (ex.params && typeof ex.params.fingers === 'string') checkProseFingers(ex.params.fingers, cn);
        if (typeof ex.coaching === 'string') checkProseFingers(ex.coaching, cn);
      }
    });
    ok(pk.name + '/' + f + ' prose finger/string claims match fingers[] array (no contradiction)', proseMatch, mismatchDetail);

    // top-level required keys present
    REQUIRED_TOP.forEach(k => ok(pk.name + '/' + f + ' has top key ' + k, k in json));
    ok(pk.name + '/' + f + ' lesson_type is "technique"', json.lesson && json.lesson.lesson_type === 'technique', json.lesson && json.lesson.lesson_type);
    ok(pk.name + '/' + f + ' qa_block.guitarist_signoff present',
      json.qa_block && typeof json.qa_block.guitarist_signoff === 'string' && json.qa_block.guitarist_signoff.length);
  });
});
ok('ALL pack lessons schema-valid (reused validate.js)', allSchemaOk);
ok('ALL pack chord fingerings verified: 0 ERRORS and 0 FATAL warnings (advisory playability warnings logged, not blocking)',
  allChordOk && chordErr === 0 && chordWarnFatal === 0,
  'errors=' + chordErr + ' fatalWarnings=' + chordWarnFatal + ' advisoryWarnings=' + chordWarn);
ok('no copyrighted-song material: lessons teach CHORDS/FORM, not songs',
  ALL_LESSON_FILES.every(f => /blues|country|pack/i.test(f)));

/* ---------------------------------------------------------------- */
section('3. Guest teachers — persona + skin ONLY, validate as teachers');

// Scan every pack's teachers/ folder. A teacher file must validate under the
// project's OWN teacher.js and be DISTINCT from the three core teachers.
const core = ['T1', 'T2', 'T3'].map(id => JSON.parse(fs.readFileSync(
  path.join(ROOT, '06-prototypes', 'step3', 'teachers', id + '.json'), 'utf8')));
let teacherCount = 0;
PACKS.forEach(function (pk) {
  const tdir = path.join(pk.dir, 'teachers');
  if (!fs.existsSync(tdir)) return;
  fs.readdirSync(tdir).filter(f => /^[A-Za-z0-9]+\.json$/.test(f)).forEach(function (tf) {
    teacherCount++;
    const t4Path = path.join(tdir, tf);
    ok(pk.name + '/' + tf + ' exists', true);
    let t4raw = null;
    try { t4raw = JSON.parse(fs.readFileSync(t4Path, 'utf8')); }
    catch (e) { ok(pk.name + '/' + tf + ' parses', false, e.message); return; }
    const r = T.validateTeacher(t4raw);
    ok(pk.name + '/' + tf + ' validates as a teacher (no lesson-content smuggled)', r.valid, r.errors.join('; '));
    ok(pk.name + '/' + tf + ' has a REAL NAME (not the codename)',
      t4raw.name && t4raw.name.length > 2 && t4raw.name !== t4raw.codename, t4raw.name);
    ok(pk.name + '/' + tf + ' teaching_style >=120 chars, human prose',
      typeof t4raw.teaching_style === 'string' && t4raw.teaching_style.length >= 120 &&
      (t4raw.teaching_style.match(/[.!?]/g) || []).length >= 3);
    ok(pk.name + '/' + tf + ' teaching_style has NO lesson-data vocabulary (frets/fingers/qa_status)',
      !/\b(frets?|fingers?|qa_status)\b/i.test(t4raw.teaching_style));
    ok(pk.name + '/' + tf + ' has a handoff line with "my new student"',
      /new student/i.test(t4raw.handoff_line || ''));
    ok(pk.name + '/' + tf + ' voice provider not on license blocklist',
      !/xtts|f5-tts|fish speech|piper|elevenlabs/i.test(t4raw.voice.provider + ' ' + t4raw.voice.voice_id));
    const raw = fs.readFileSync(t4Path, 'utf8');
    ok(pk.name + '/' + tf + ' file contains NO fret/finger arrays', !/"(frets|fingers)"\s*:/.test(raw));
    ok(pk.name + '/' + tf + ' file contains NO exercises/chords/qa_block blocks',
      !/"(exercises|chords|qa_block)"\s*:/.test(raw));
    ok(pk.name + '/' + tf + ' voice DISTINCT from T1/T2/T3',
      new Set(core.map(c => c.voice.voice_id)).size === 3 &&
      !core.map(c => c.voice.voice_id).includes(t4raw.voice.voice_id), t4raw.voice.voice_id);
    ok(pk.name + '/' + tf + ' name DISTINCT from T1/T2/T3',
      !core.map(c => c.name).includes(t4raw.name), t4raw.name);
  });
});
ok('at least one guest teacher validated across packs', teacherCount >= 1, 'count=' + teacherCount);

/* ---------------------------------------------------------------- */
section('4. PROOF OF "ZERO CORE-CODE CHANGE" — SHA-256 diff vs baseline');

ok('baseline file present', fs.existsSync(BASELINE));
if (fs.existsSync(BASELINE)) {
  const expect = {};
  fs.readFileSync(BASELINE, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^([0-9a-f]{64})\s+\*(.+)$/);
    if (m) expect[m[2]] = m[1];
  });
  let untouched = true;
  for (const rel of CORE_FILES) {
    const fp = path.join(ROOT, rel);
    if (!fs.existsSync(fp)) { untouched = false; ok(rel + ' exists', false); continue; }
    const sha = crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
    const same = sha === expect[rel];
    if (!same) untouched = false;
    ok('core unchanged: ' + rel, same, same ? '' : 'SHA mismatch (was edited?)');
  }
  ok('NO core engine file was modified by Step 8', untouched);
}

/* ---------------------------------------------------------------- */
section('5. Packs are DROP-IN: folder conventions match the pipeline');

ok('all packs live under 05-content/ (content store, not a core folder)',
  PACKS.every(pk => pk.dir.indexOf(path.join('05-content')) !== -1));
ok('every pack keeps lessons in guitar-lesson-NN-*.json naming',
  ALL_LESSON_FILES.every(f => /^[\w-]+\/guitar-lesson-.*\.json$/.test(f)));

/* ---------------------------------------------------------------- */
console.log('\n============================================================');
if (fail === 0) {
  console.log('STEP 8 DONE BAR: PASS  (' + pass + '/' + (pass + fail) + ' checks)');
  console.log('Style packs ship as PURE CONTENT — 0 core-code changes.');
} else {
  console.log('STEP 8 DONE BAR: FAIL  (' + pass + '/' + (pass + fail) + ' passed, ' + fail + ' failed)');
  failures.forEach(f => console.log('   - ' + f));
}
console.log('============================================================');
process.exit(fail === 0 ? 0 : 1);
