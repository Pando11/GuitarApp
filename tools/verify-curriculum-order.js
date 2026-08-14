#!/usr/bin/env node
// Curriculum-order ship gate (AMENDMENT-15).
// A hostile reviewer found that F/A7 and three absolute-beginner lessons had been APPENDED
// after the graduate capstone — nothing checked lesson ORDER, only chord arithmetic. After the
// re-sequence, this gate makes the ordering invariants permanent so an appended lesson or a
// hand-edited manifest can't silently produce an incoherent curriculum again.
//
// Run: node tools/verify-curriculum-order.js   (0 errors required to ship)
'use strict';
const fs = require('fs');
const path = require('path');
const LDIR = path.join(__dirname, '..', '07-app', 'content', 'lessons');
const files = JSON.parse(fs.readFileSync(path.join(LDIR, 'manifest.json'), 'utf8')).files
  .filter(f => /^guitar-lesson.*\.json$/.test(f));

let errs = 0;
const fail = m => { console.log('  ERROR: ' + m); errs++; };
const pad = n => String(n).padStart(2, '0');
const slugOf = f => f.replace(/^guitar-lesson-\d+-/, '').replace(/\.json$/, '');

const pos = {};                       // slug -> 1-based position
files.forEach((f, i) => { pos[slugOf(f)] = i + 1; });
const docs = files.map(f => JSON.parse(fs.readFileSync(path.join(LDIR, f), 'utf8')));

// 1. filename number, manifest position and internal lesson id must all agree.
files.forEach((f, i) => {
  const n = parseInt(f.match(/^guitar-lesson-(\d+)/)[1], 10);
  if (n !== i + 1) fail(f + ': filename says lesson ' + n + ' but it is at manifest position ' + (i + 1));
  const id = (docs[i].lesson || {}).id || '';
  if (!id.startsWith('L' + pad(i + 1))) {
    fail(f + ': internal lesson.id "' + id + '" does not match position L' + pad(i + 1));
  }
});

// 2. no prerequisite may point at a LATER lesson, and no reference may be out of range.
docs.forEach((d, i) => {
  const n = i + 1;
  for (const pre of (d.lesson || {}).prerequisites || []) {
    for (const m of String(pre).matchAll(/\bL(\d{2})\b/g)) {
      const r = parseInt(m[1], 10);
      if (r > files.length) fail('L' + pad(n) + ': prerequisite references L' + m[1] + ' which does not exist');
      else if (r >= n) fail('L' + pad(n) + ' (' + slugOf(files[i]) + '): prerequisite points FORWARD to L' +
        pad(r) + ' (' + slugOf(files[r - 1]) + ') — "' + pre + '"');
    }
  }
  for (const m of JSON.stringify(d).matchAll(/\bL(\d{2})\b/g)) {
    const r = parseInt(m[1], 10);
    if (r < 1 || r > files.length) fail('L' + pad(n) + ': reference L' + m[1] + ' is out of range');
  }
});

// 3. pedagogical ordering invariants. These encode the owner-approved shape: foundations first,
//    every chord taught before it is used, capstone last.
const must = [
  ['welcome-anatomy-tuning', 'holding-the-pick', 'tune the guitar before picking technique'],
  ['holding-the-pick', 'first-chord-em', 'hold a pick before the first chord'],
  ['first-chord-em', 'second-chord-first-song', 'first chord before the second'],
  ['second-chord-first-song', 'switching-em-and-c', 'know both chords before drilling the change'],
  ['new-chord-g', 'first-three-chord-song', 'G is required by the 3-chord song'],
  ['new-chord-d', 'four-chord-songs', 'D is required by the 4-chord loop'],
  ['new-chord-am-big-four', 'minor-progressions-dm', 'Am before minor progressions'],
  ['faster-chord-changes', 'new-chord-f', 'change speed before the hardest beginner chord'],
  ['new-chord-a', 'new-chord-a7', 'A major before A7 (A7 is taught as a subtraction from A)'],
  ['new-chord-f', 'new-chord-a7', 'F before A7 (A7 lesson builds on it)'],
  ['new-chord-e', 'minor-progressions-dm', 'E before the minor-progression work'],
  ['read-chord-chart-tab', 'consolidation-performance', 'read charts before the capstone'],
  ['new-chord-a7', 'consolidation-performance', 'all core chords before the capstone'],
  ['new-chord-f', 'consolidation-performance', 'F before the capstone — a student must not "perform" before F']
];
for (const [a, b, why] of must) {
  if (!(a in pos)) { fail('ordering rule references missing lesson "' + a + '"'); continue; }
  if (!(b in pos)) { fail('ordering rule references missing lesson "' + b + '"'); continue; }
  if (pos[a] >= pos[b]) fail('L' + pad(pos[a]) + ' ' + a + ' must come BEFORE L' + pad(pos[b]) + ' ' + b + ' — ' + why);
}

// 4. the capstone must be the final lesson, and nothing may be appended after it.
const last = slugOf(files[files.length - 1]);
if (last !== 'consolidation-performance') {
  fail('the last lesson is "' + last + '" — the consolidation/performance capstone must be LAST. ' +
       'Do not append new lessons after it; insert them and re-run tools/resequence-curriculum.js.');
}

// 5. an absolute-beginner lesson must not appear after the first 'graduate' lesson.
const gradAt = docs.findIndex(d => ((d.lesson || {}).level || '') === 'graduate');
if (gradAt >= 0) {
  docs.forEach((d, i) => {
    if (i > gradAt && ((d.lesson || {}).level || '') === 'absolute-beginner') {
      fail('L' + pad(i + 1) + ' (' + slugOf(files[i]) + ') is level "absolute-beginner" but sits after the ' +
           'graduate lesson L' + pad(gradAt + 1) + ' — this is the defect AMENDMENT-15 fixed.');
    }
  });
}

console.log('\n' + files.length + ' lessons | ' + errs + ' errors');
console.log(errs === 0 ? 'CURRICULUM-ORDER-VERIFIED-OK' : 'CURRICULUM ORDER BROKEN');
process.exit(errs === 0 ? 0 : 1);
