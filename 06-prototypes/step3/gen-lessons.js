/*
 * STEP 3 — LESSON BLOCK GENERATOR
 * player3.html is file://, so it cannot fetch ../step0/lessons/*.json.
 * Rather than HAND-COPY the lesson content (which silently diverged once and
 * invented wrong chords), the inline LESSONS block is GENERATED from the real
 * lesson JSON via the Step 0 renderer, and parity-check.js proves it matches.
 *
 * Run: node gen-lessons.js       (rewrites the LESSONS block in player3.html)
 */
'use strict';

var fs = require('fs');
var path = require('path');
var renderer = require('../step0/engine/renderer.js');

var KEYS = ['id', 'kind', 'caption', 'chord', 'tempoBpm', 'beats', 'durationMs'];
var LESSON_IDS = ['L01', 'L02', 'L03'];

var out = {};
LESSON_IDS.forEach(function (k) {
  var lesson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'step0', 'lessons', k + '.json'), 'utf8'));
  var m = renderer.buildManifest(lesson);
  out[k] = {
    lessonId: m.lessonId,
    title: m.title,
    estimatedMinutes: m.estimatedMinutes,
    totalDurationMs: m.totalDurationMs,
    scenes: m.scenes.map(function (s) {
      var o = {};
      KEYS.forEach(function (x) { o[x] = s[x]; });
      return o;
    })
  };
});

var HEADER =
  '/* ---------- LESSON CONTENT ----------\n' +
  ' * GENERATED from ../step0/lessons/*.json by gen-lessons.js via the Step 0\n' +
  ' * renderer (buildManifest). DO NOT HAND-EDIT — a hand copy silently diverged\n' +
  ' * once and invented wrong chords. parity-check.js proves this block is\n' +
  ' * byte-identical to the engine manifest. */\n';

var block = HEADER + 'var LESSONS = ' + JSON.stringify(out, null, 2) + ';\n';

var htmlPath = path.join(__dirname, 'player3.html');
var html = fs.readFileSync(htmlPath, 'utf8');

var BEGIN = '/* @@LESSONS-BEGIN@@ */';
var END = '/* @@LESSONS-END@@ */';
var b = html.indexOf(BEGIN);
var e = html.indexOf(END);
if (b === -1 || e === -1) {
  throw new Error('player3.html is missing the @@LESSONS-BEGIN@@ / @@LESSONS-END@@ markers');
}

var updated = html.slice(0, b + BEGIN.length) + '\n' + block + html.slice(e);
fs.writeFileSync(htmlPath, updated);
console.log('LESSONS block regenerated from step0 lessons: ' + LESSON_IDS.join(', ') +
  ' (' + block.length + ' chars)');
