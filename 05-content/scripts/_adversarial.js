/* Adversarial re-test: prove the verifier CATCHES a wrong chord (not just rubber-stamps pass). */
'use strict';
const fs = require('fs');
const path = require('path');
const { validateLesson } = require('../../06-prototypes/step0/schema/validate.js');
const { verifyLesson } = require('../../06-prototypes/step0/schema/chord-theory-check.js');

const dir = path.join(__dirname, '..'); // lessons live in 05-content/, this script lives in 05-content/scripts/
const good = path.join(dir, 'guitar-lesson-02-first-chord-em.json');
const bad = path.join(dir, '_L02-bad.json');

const j = JSON.parse(fs.readFileSync(good, 'utf8'));
// Corrupt Em: make it spell E G# B (i.e. E major shape) but keep name "E minor"
j.chords.Em.frets = [0, 2, 1, 0, 0, 0];
j.chords.Em.fingers = [0, 2, 1, 0, 0, 0];
fs.writeFileSync(bad, JSON.stringify(j, null, 2));

const sv = validateLesson(j);
const lv = verifyLesson(j);
const issues = lv.results.reduce((a, r) => a + r.errors.length + r.warnings.length, 0);
lv.results.forEach(r => r.errors.concat(r.warnings).forEach(e => console.log('  FLAG: ' + r.key + ' -> ' + e)));

const caught = (!sv.valid) || issues > 0;
console.log('\nAdversarial injected a WRONG Em (E G# B, named "E minor").');
console.log('schema.valid=' + sv.valid + '  chordIssues=' + issues +
  '  => ' + (caught ? 'CORRECTLY REJECTED — harness is trustworthy' : '!!! FAILED TO CATCH — harness is broken'));

fs.unlinkSync(bad);
console.log('temp bad file cleaned up: ' + (fs.existsSync(bad) ? 'STILL THERE' : 'gone'));
process.exit(caught ? 0 : 1);
