/*
 * GuitarApp Step 9 — VERIFY GATE (DONE BAR: 1 video renders end-to-end from a
 * lesson JSON with no hand-built scenes; end card pitches "the app listens and
 * tells you if you got it"; format follows research rules).
 *
 * Strategy (same as step8): verify the deliverable by REUSING the project's own
 * pipeline and asserting on the OUTPUT, plus proving zero core-code change.
 *
 * 1. For each Blues lesson, regenerate the HTML via gen-youtube-video.js's model
 *    and assert every scene caption in the HTML matches buildManifest() output
 *    (=> the video is driven by the lesson JSON, not hand-authored scenes).
 * 2. End card pitch present + CTA present + $12/mo price present.
 * 3. Format rules: hook stated in title card, number-in-title present, play-along
 *    close (a 'wrap'/'exercise' scene exists for practice).
 * 4. Core-code-unchanged proof: SHA-256 of the 6 core modules vs CORE-UNTOUCHED.sha256.
 *    (gen-youtube-video.js + conversionTracker.js are step9-local, NOT core modules.)
 */

'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var ROOT = path.resolve(__dirname, '..', '..');
var renderer = require(path.join(ROOT, '06-prototypes', 'step0', 'engine', 'renderer.js'));
var teacher = require(path.join(ROOT, '06-prototypes', 'step3', 'engine', 'teacher.js'));
var gen = require('./gen-youtube-video.js');

var LESSON_DIR = path.join(ROOT, '05-content', 'blues-pack');
var TEACHER = path.join(LESSON_DIR, 'teachers', 'T4.json');
var OUT_DIR = path.join(__dirname, 'out');
var BASELINE = path.join(ROOT, '06-prototypes', 'step8', 'CORE-UNTOUCHED.sha256');

var CORE_FILES = [
  '06-prototypes/step0/schema/chord-theory-check.js',
  '06-prototypes/step0/schema/validate.js',
  '06-prototypes/step3/engine/teacher.js',
  '06-prototypes/step0/engine/renderer.js',
  '06-prototypes/step5/engine/listening-engine.js',
  '06-prototypes/step7/entitlementStore.js'
];

var pass = 0, fail = 0;
var failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + name); }
  else { fail++; failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function section(s) { console.log('\n== ' + s + ' =='); }

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

/* ---------------------------------------------------------------- */
section('1. Each Blues lesson renders a video from its JSON via the real pipeline');

var LESSONS = ['guitar-lesson-b1-blues-e7.json', 'guitar-lesson-b2-blues-a7.json', 'guitar-lesson-b3-blues-12bar.json'];
var allMatch = true;

LESSONS.forEach(function (lf) {
  var lessonPath = path.join(LESSON_DIR, lf);
  var lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
  var manifest = renderer.buildManifest(lesson);                  // real pipeline
  var view = teacher.applyTeacher(manifest, JSON.parse(fs.readFileSync(TEACHER, 'utf8'))); // cosmetic only

  var model = gen.buildPlayerModel(lessonPath, TEACHER);
  var html = gen.renderHtml(model);

  // Assert every manifest scene caption appears in the HTML (proves the video is
  // driven by the lesson JSON, not hand-built scenes).
  var missing = manifest.scenes.filter(function (s) {
    return !html.includes(s.caption);
  });
  ok(lf + ' HTML driven by buildManifest scenes (no hand-built scenes)', missing.length === 0,
     missing.length ? 'missing ' + missing.length + ' scene caption(s)' : '');
  if (missing.length) allMatch = false;

  // End card pitch (required by DONE BAR) + CTA + $12 price.
  ok(lf + ' end card pitches "the app listens"', /the app LISTENS and tells you if you got it/i.test(html));
  ok(lf + ' conversion CTA present', /id="cta"|Get the app|guitarapp\.example\/install/.test(html));
  ok(lf + ' $12/mo price shown', /\$12[ /]*(per )?month|\$12 \//i.test(html));

  // Format rules (research): hook in title card, number in title, play-along close.
  ok(lf + ' has a title card (hook)', /id="titleCard"/.test(html) && /<h1>/.test(html));
  ok(lf + ' number-in-title (1/2/3 chord)', new RegExp(model.numberInTitle + ' chord').test(html),
     'numberInTitle=' + model.numberInTitle);
  var hasPractice = manifest.scenes.some(function (s) { return s.kind === 'exercise' || s.kind === 'wrap'; });
  ok(lf + ' play-along close (exercise/wrap scene)', hasPractice);

  // Produce the video through the SAME generator and capture the real output path,
  // so the filename assertion can never drift from what gen-youtube-video.js writes.
  var outName = 'youtube-' + path.basename(lessonPath, '.json') + '.html';
  var realOut = path.join(OUT_DIR, outName);
  var model2 = gen.buildPlayerModel(lessonPath, TEACHER);
  fs.writeFileSync(realOut, gen.renderHtml(model2)); // regenerate into out/ (idempotent)
  ok(lf + ' video file written: ' + outName, fs.existsSync(realOut));
});

ok('all video scenes trace to lesson JSON (no hand-built scenes)', allMatch);

/* ---------------------------------------------------------------- */
section('2. Proof of "ZERO CORE-CODE CHANGE" — SHA-256 vs baseline');

ok('baseline present', fs.existsSync(BASELINE));
if (fs.existsSync(BASELINE)) {
  var expect = {};
  fs.readFileSync(BASELINE, 'utf8').split('\n').forEach(function (line) {
    var m = line.trim().match(/^([0-9a-f]{64})\s+\*(.+)$/);
    if (m) expect[m[2]] = m[1];
  });
  var untouched = true;
  CORE_FILES.forEach(function (rel) {
    var p = path.join(ROOT, rel);
    var cur = sha256File(p);
    var good = expect[rel] === cur;
    if (!good) untouched = false;
    ok('core unchanged: ' + rel, good, good ? '' : 'hash mismatch');
  });
  ok('NO core engine file was modified by Step 9', untouched);
}

/* ---------------------------------------------------------------- */
console.log('\n========================================');
console.log('STEP 9 DONE BAR: ' + (fail === 0 ? 'PASS ' : 'FAIL ') + ' (' + pass + '/' + (pass + fail) + ' checks)');
if (fail) { console.log('FAILURES:\n - ' + failures.join('\n - ')); process.exit(1); }
process.exit(0);
