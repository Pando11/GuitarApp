/*
 * STEP 3 — TEACHER BLOCK GENERATOR
 * player3.html is file://, so it cannot fetch teachers/T*.json.
 * The inline TEACHERS block is GENERATED from the real teacher files rather
 * than hand-copied (a hand copy of the lesson block silently invented wrong
 * content once — see PLAN Step 3 defect log). parity-check.js proves the
 * inline block matches the files on disk.
 *
 * Run: node gen-teachers.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var T = require('./engine/teacher.js');

var IDS = ['T1', 'T2', 'T3'];

var out = {};
IDS.forEach(function (id) {
  var o = JSON.parse(fs.readFileSync(path.join(__dirname, 'teachers', id + '.json'), 'utf8'));
  /* validate BEFORE inlining — never ship an invalid teacher into the player */
  var r = T.validateTeacher(o);
  if (!r.valid) {
    throw new Error('TEACHER ' + id + ' INVALID: ' + r.errors.join('; '));
  }
  delete o._note;
  delete o.name_status;
  out[id] = o;
});

var block =
  '/* ---------- TEACHERS — GENERATED from teachers/T*.json by gen-teachers.js.\n' +
  ' * ART + PERSONA ONLY. DO NOT HAND-EDIT. */\n' +
  'var TEACHERS = ' + JSON.stringify(out, null, 2) + ';\n';

var htmlPath = path.join(__dirname, 'player3.html');
var html = fs.readFileSync(htmlPath, 'utf8');

var BEGIN = '/* @@TEACHERS-BEGIN@@ */';
var END = '/* @@TEACHERS-END@@ */';
var b = html.indexOf(BEGIN);
var e = html.indexOf(END);
if (b === -1 || e === -1) {
  throw new Error('player3.html is missing the @@TEACHERS-BEGIN@@ / @@TEACHERS-END@@ markers');
}

fs.writeFileSync(htmlPath, html.slice(0, b + BEGIN.length) + '\n' + block + html.slice(e));
console.log('TEACHERS block regenerated from teachers/: ' + IDS.join(', ') +
  ' (' + block.length + ' chars)');
