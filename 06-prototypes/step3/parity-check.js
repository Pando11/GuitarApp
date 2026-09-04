/*
 * STEP 3 — INLINE-vs-ENGINE PARITY CHECK
 * The known Step 0 defect was player.html's inline validator silently diverging
 * from schema/validate.js. This proves player3.html's inline logic produces
 * BYTE-IDENTICAL results to engine/teacher.js and engine/lipsync.js.
 * Run: node parity-check.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var T = require('./engine/teacher.js');
var L = require('./engine/lipsync.js');
var renderer = require('../step0/engine/renderer.js');

var pass = 0, fail = 0;
function ok(n, c, d) {
  if (c) { pass++; console.log('  OK   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); }
}

/* ---- extract the inline script from player3.html and run it headless ---- */
var html = fs.readFileSync(path.join(__dirname, 'player3.html'), 'utf8');
var m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { throw new Error('no inline <script> found in player3.html'); }
var src = m[1];

/* strip the DOM-dependent tail (everything from the render/controls section on)
 * so we can exercise the PURE logic: TEACHERS, LESSONS, applyTeacher, lipsyncFrames */
var cut = src.indexOf('/* ---------- fretboard SVG');
var pure = cut > 0 ? src.slice(0, cut) : src;

var sandbox = { console: console, Math: Math, JSON: JSON, Array: Array, Object: Object,
                parseInt: parseInt, isFinite: isFinite, module: {}, exports: {}, __out: null };
vm.createContext(sandbox);
vm.runInContext(pure + '\n;__out = {TEACHERS:TEACHERS, LESSONS:LESSONS, applyTeacher:applyTeacher,' +
  ' lipsyncFrames:lipsyncFrames, lessonContentProjection:lessonContentProjection};', sandbox);
var P = sandbox.__out;

console.log('== inline player3.html vs engine/*.js parity ==');

/* 1. teacher data parity */
['T1', 'T2', 'T3'].forEach(function (id) {
  var disk = JSON.parse(fs.readFileSync(path.join(__dirname, 'teachers', id + '.json'), 'utf8'));
  delete disk._note; delete disk.name_status;
  var inline = JSON.parse(JSON.stringify(P.TEACHERS[id]));
  ok(id + ': inline teacher data == teachers/' + id + '.json',
    JSON.stringify(disk) === JSON.stringify(inline),
    JSON.stringify(inline));
});

/* 2. inline teacher objects pass the REAL validator */
['T1', 'T2', 'T3'].forEach(function (id) {
  var r = T.validateTeacher(P.TEACHERS[id]);
  ok(id + ': inline teacher passes engine validateTeacher()', r.valid, (r.errors || []).join('; '));
});

/* 3. inline LESSONS content == real manifest, for EVERY lesson */
['L01', 'L02', 'L03'].forEach(function (key) {
  var lsn = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'step0', 'lessons', key + '.json'), 'utf8'));
  var rm = renderer.buildManifest(lsn);
  var im = P.LESSONS[key];
  ok(key + ': present in the inline block', !!im);
  if (!im) { return; }
  ok(key + ': inline lessonId matches the engine manifest', im.lessonId === rm.lessonId);
  ok(key + ': inline scene count matches', im.scenes.length === rm.scenes.length);
  ok(key + ': inline totalDurationMs matches', im.totalDurationMs === rm.totalDurationMs);
  ok(key + ': inline lesson-content projection IDENTICAL to the engine manifest',
    JSON.stringify(T.lessonContentProjection(im)) === JSON.stringify(T.lessonContentProjection(rm)));
  ok(key + ': inline FRETBOARD data byte-identical to the engine manifest',
    frets(im) === frets(rm));
});

var lesson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'step0', 'lessons', 'L01.json'), 'utf8'));
var realManifest = renderer.buildManifest(lesson);
var inlineManifest = P.LESSONS.L01;

function frets(mf) {
  return JSON.stringify(mf.scenes.filter(function (s) { return s.chord; })
    .map(function (s) { return [s.chord.name, s.chord.frets, s.chord.fingers, s.chord.qa_status]; }));
}

/* 4. applyTeacher parity */
['T1', 'T2', 'T3'].forEach(function (id) {
  var a = P.applyTeacher(inlineManifest, P.TEACHERS[id]);
  var b = T.applyTeacher(realManifest, T.loadTeacher(id));
  ok(id + ': inline applyTeacher() output == engine applyTeacher() output',
    JSON.stringify(a.scenes) === JSON.stringify(b.scenes));
});

/* 5. lipsync parity */
function sig(n, f) { var a = []; for (var i = 0; i < n; i++) { a.push(Math.sin(2 * Math.PI * f * i / 8000) * 0.6); } return a; }
[[sig(4000, 180), 8000, 30], [new Array(3000).fill(0), 8000, 30], [sig(1200, 90), 24000, 30]]
  .forEach(function (c, i) {
    ok('lipsync case ' + (i + 1) + ': inline frames == engine frames',
      JSON.stringify(P.lipsyncFrames(c[0], c[1], c[2])) === JSON.stringify(L.lipsyncFrames(c[0], c[1], c[2])));
  });

console.log('\n' + (fail === 0
  ? 'INLINE-ENGINE-PARITY-OK (' + pass + '/' + (pass + fail) + ')'
  : 'PARITY FAIL (' + pass + '/' + (pass + fail) + ', ' + fail + ' failed)'));
process.exit(fail === 0 ? 0 : 1);
