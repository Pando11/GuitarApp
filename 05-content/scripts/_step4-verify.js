/*
 * _step4-verify.js — INDEPENDENT verification of the 20 Step 4 lesson files.
 * Does NOT depend on the generator. Loads the emitted JSON files directly and
 * runs the project's own gates: schema/validate.js (validateLesson) + the
 * chord-theory-check (verifyChord, requiring 0 errors AND 0 warnings).
 *
 * Run: node _step4-verify.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { validateLesson } = require('../../06-prototypes/step0/schema/validate.js');
const { verifyLesson } = require('../../06-prototypes/step0/schema/chord-theory-check.js');

const dir = path.join(__dirname, '..'); // lessons live in 05-content/, this script lives in 05-content/scripts/
const files = fs.readdirSync(dir)
  .filter(f => /^guitar-lesson-\d{2}-.*\.json$/.test(f))
  .sort();

const REQUIRED_TOP = ['lesson', 'chords', 'exercises', 'avatar_coaching_copy', 'qa_block'];
let totalFiles = 0, schemaBad = 0, chordErr = 0, chordWarn = 0, chordChecked = 0;
let qaMissingSignoff = 0, lessonsMissingTitle = 0;

console.log('STEP 4 VERIFICATION — ' + files.length + ' lesson files\n');

for (const f of files) {
  const full = path.join(dir, f);
  let json;
  try { json = JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch (e) { console.log('PARSE FAIL ' + f + ': ' + e.message); schemaBad++; continue; }

  totalFiles++;
  let fileOk = true;
  const flags = [];

  // 1) schema
  const sv = validateLesson(json);
  if (!sv.valid) { fileOk = false; schemaBad++; sv.errors.forEach(e => flags.push('SCHEMA: ' + e)); }

  // 2) every chord: 0 errors AND 0 warnings
  const lv = verifyLesson(json);
  lv.results.forEach(r => {
    chordChecked++;
    if (!r.ok) fileOk = false;
    chordErr += r.errors.length;
    chordWarn += r.warnings.length;
    r.errors.forEach(e => flags.push('CHORD ERR (' + r.key + '): ' + e));
    r.warnings.forEach(w => flags.push('CHORD WARN (' + r.key + '): ' + w));
  });

  // 3) qa_block must carry a guitarist_signoff entry (Hard Ban 7 evidence)
  if (!(json.qa_block && typeof json.qa_block.guitarist_signoff === 'string' && json.qa_block.guitarist_signoff.length)) {
    fileOk = false; qaMissingSignoff++; flags.push('QA: missing guitarist_signoff');
  }
  // 4) top-level required keys present (belt-and-suspenders vs schema)
  REQUIRED_TOP.forEach(k => { if (!(k in json)) { fileOk = false; flags.push('MISSING top key: ' + k); } });
  // 5) title present
  if (!(json.lesson && typeof json.lesson.title === 'string' && json.lesson.title.length)) { fileOk = false; lessonsMissingTitle++; flags.push('MISSING title'); }

  console.log((fileOk ? 'PASS ' : 'FAIL ') + f + (flags.length ? '  (' + flags.length + ' flag[s])' : ''));
  flags.forEach(x => console.log('        ' + x));
}

console.log('\n' + '='.repeat(60));
console.log('FILES: ' + totalFiles + '/20');
console.log('SCHEMA failures: ' + schemaBad);
console.log('CHORDS checked: ' + chordChecked + ' | errors: ' + chordErr + ' | warnings: ' + chordWarn);
console.log('QA signoff missing: ' + qaMissingSignoff + ' | title missing: ' + lessonsMissingTitle);
const allGreen = totalFiles === 20 && schemaBad === 0 && chordErr === 0 && chordWarn === 0 && qaMissingSignoff === 0 && lessonsMissingTitle === 0;
console.log(allGreen ? 'STEP-4-VERIFIED-OK — 20 lessons, all gates green' : 'STEP 4 FAILED — see flags above');
console.log('='.repeat(60));
process.exit(allGreen ? 0 : 1);
