#!/usr/bin/env node
// One-shot curriculum re-sequencer (AMENDMENT-15, owner-approved 2026-08-14).
//
// WHY: a hostile reviewer flagged that F (L24) and A7 (L25) — foundational beginner chords —
// sat AFTER the L20 graduate "consolidation + performance" capstone, so a student "performed"
// before learning the chord that makes people quit. Investigating it surfaced a SECOND defect:
// L21 holding-the-pick, L22 switching-Em-and-C and L23 first-three-chord-song are all
// `absolute-beginner` level and were ALSO appended after the graduate capstone.
//
// WHAT: rewrites filenames, internal lesson ids, the manifest, and every "(L07)"-style
// cross-reference inside prose/prerequisites, from an explicit old->new mapping. Renaming files
// without rewriting the references would silently leave prerequisites pointing at the wrong
// lesson — the exact class of drift that made the prereq map untrustworthy before.
//
// Idempotent-ish: refuses to run unless the current manifest matches the expected OLD order.
'use strict';
const fs = require('fs');
const path = require('path');
const LDIR = path.join(__dirname, '..', '07-app', 'content', 'lessons');

// slug -> desired position. Slug = filename minus the "guitar-lesson-NN-" prefix and ".json".
const NEW_ORDER = [
  'welcome-anatomy-tuning',        //  1
  'holding-the-pick',              //  2  was 21 — absolute-beginner, belongs before any chord
  'first-chord-em',                //  3
  'second-chord-first-song',       //  4
  'strumming-in-time',             //  5
  'switching-em-and-c',            //  6  was 22 — absolute-beginner change drill
  'chord-changes-em-easyc',        //  7
  'new-chord-g',                   //  8
  'first-three-chord-song',        //  9  was 23 — needs G (now 8), pays off immediately
  'new-chord-d',                   // 10
  'new-chord-a',                   // 11
  'new-chord-am-big-four',         // 12
  'four-chord-songs',              // 13  MILESTONE
  'up-strums',                     // 14
  'strumming-patterns',            // 15
  'faster-chord-changes',          // 16  speed builder — the gate to F
  'new-chord-f',                   // 17  was 24 — F now mid-curriculum, per owner approval
  'new-chord-e',                   // 18
  'new-chord-a7',                  // 19  was 25 — A7 + 12-bar blues
  'minor-progressions-dm',         // 20
  'dynamics-alternating-bass',     // 21
  'capo-basics',                   // 22
  'fingerpicking-travis',          // 23
  'read-chord-chart-tab',          // 24
  'consolidation-performance'      // 25  capstone LAST, as a capstone must be
];

const manifestPath = path.join(LDIR, 'manifest.json');
const oldFiles = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files;
const slugOf = f => f.replace(/^guitar-lesson-\d+-/, '').replace(/\.json$/, '');

// --- safety: the mapping must be a permutation of exactly what is on disk ---
const oldSlugs = oldFiles.map(slugOf);
const missing = NEW_ORDER.filter(s => !oldSlugs.includes(s));
const extra = oldSlugs.filter(s => !NEW_ORDER.includes(s));
if (missing.length || extra.length) {
  console.error('ABORT: mapping does not match the manifest on disk.');
  if (missing.length) console.error('  in mapping but not on disk: ' + missing.join(', '));
  if (extra.length) console.error('  on disk but not in mapping: ' + extra.join(', '));
  process.exit(1);
}

const pad = n => String(n).padStart(2, '0');
// old lesson number -> new lesson number, and old id -> new id
const numMap = {}, idMap = {}, fileMap = {};
oldFiles.forEach((f, i) => {
  const slug = slugOf(f);
  const oldNum = i + 1;
  const newNum = NEW_ORDER.indexOf(slug) + 1;
  numMap[oldNum] = newNum;
  idMap['L' + pad(oldNum)] = 'L' + pad(newNum);
  fileMap[f] = 'guitar-lesson-' + pad(newNum) + '-' + slug + '.json';
});

// Rewrite every "L07" / "L07-new-chord-d" style reference using the map. Done on the raw JSON
// text so prose, objectives, prerequisites and ids are all covered in one pass. Two-phase
// (L07 -> @@7@@ -> L10) so a renumber can't cascade into an already-rewritten value.
function rewriteRefs(text) {
  let t = text.replace(/\bL(\d{2})\b/g, (m, d) => {
    const n = numMap[parseInt(d, 10)];
    return n ? '@@' + n + '@@' : m;
  });
  return t.replace(/@@(\d+)@@/g, (m, d) => 'L' + pad(parseInt(d, 10)));
}

// Read everything BEFORE writing anything, so a mid-run failure can't leave a half-renamed dir.
const staged = [];
for (const oldName of oldFiles) {
  const raw = fs.readFileSync(path.join(LDIR, oldName), 'utf8');
  staged.push({ oldName, newName: fileMap[oldName], body: rewriteRefs(raw) });
}
for (const s of staged) {
  const doc = JSON.parse(s.body);           // proves the rewrite kept valid JSON
  const newId = idMap['L' + s.oldName.match(/^guitar-lesson-(\d+)/)[1]];
  if (doc.lesson && typeof doc.lesson.id === 'string') {
    doc.lesson.id = doc.lesson.id.replace(/^L\d{2}/, newId);
  }
  s.body = JSON.stringify(doc, null, 2) + '\n';
}

for (const s of staged) {
  if (s.oldName !== s.newName) fs.rmSync(path.join(LDIR, s.oldName));
}
for (const s of staged) {
  fs.writeFileSync(path.join(LDIR, s.newName), s.body, 'utf8');
}
const newFiles = NEW_ORDER.map((slug, i) => 'guitar-lesson-' + pad(i + 1) + '-' + slug + '.json');
fs.writeFileSync(manifestPath, JSON.stringify({ files: newFiles }, null, 2) + '\n', 'utf8');

console.log('re-sequenced ' + newFiles.length + ' lessons');
for (const [oldN, newN] of Object.entries(numMap)) {
  if (Number(oldN) !== newN) console.log('  L' + pad(oldN) + ' -> L' + pad(newN) + '  ' + slugOf(oldFiles[oldN - 1]));
}
