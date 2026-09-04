#!/usr/bin/env node
// Backfill re-sequencer for 05-content/ (AMENDMENT-15 mapping).
// 05-content is the OLD 20-lesson authoring spine (OLD order 1..20). The shipping
// set was resequenced to NEW order 1..25; this brings 05-content to the SAME NEW
// order and inserts the 5 orphan lessons (copied verbatim from shipping, which are
// already numbered in the NEW scheme). Mirrors tools/resequence-curriculum.js.
// DRY-RUN by default: pass --commit to actually write.
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '..'); // 05-content
const SHIP = path.resolve(__dirname, '..', '..', '07-app', 'content', 'lessons');
const slugOf = f => f.replace(/^guitar-lesson-\d+-/, '').replace(/\.json$/, '');

// OLD order (pre-resequence, 25 slots). Slots 21..25 are the 5 orphans.
const OLD_ORDER = [
  'welcome-anatomy-tuning', 'first-chord-em', 'second-chord-first-song', 'strumming-in-time',
  'chord-changes-em-easyc', 'new-chord-g', 'new-chord-d', 'new-chord-a', 'new-chord-am-big-four',
  'four-chord-songs', 'up-strums', 'strumming-patterns', 'dynamics-alternating-bass', 'capo-basics',
  'faster-chord-changes', 'new-chord-e', 'minor-progressions-dm', 'fingerpicking-travis',
  'read-chord-chart-tab', 'consolidation-performance', 'holding-the-pick', 'switching-em-and-c',
  'first-three-chord-song', 'new-chord-f', 'new-chord-a7'
];
// NEW order (post-AMENDMENT-15).
const NEW_ORDER = [
  'welcome-anatomy-tuning', 'holding-the-pick', 'first-chord-em', 'second-chord-first-song',
  'strumming-in-time', 'switching-em-and-c', 'chord-changes-em-easyc', 'new-chord-g',
  'first-three-chord-song', 'new-chord-d', 'new-chord-a', 'new-chord-am-big-four', 'four-chord-songs',
  'up-strums', 'strumming-patterns', 'faster-chord-changes', 'new-chord-f', 'new-chord-e',
  'new-chord-a7', 'minor-progressions-dm', 'dynamics-alternating-bass', 'capo-basics',
  'fingerpicking-travis', 'read-chord-chart-tab', 'consolidation-performance'
];
const pad = n => String(n).padStart(2, '0');

// OLD position -> NEW position (1..25)
const numMap = {};
OLD_ORDER.forEach((s, i) => { numMap[i + 1] = NEW_ORDER.indexOf(s) + 1; });
const idMap = {};
Object.entries(numMap).forEach(([o, n]) => { idMap['L' + pad(o)] = 'L' + pad(n); });

function rewriteRefs(text) {
  // Do NOT rewrite "L02.json" style references (prose pointing at a project file,
  // not a lesson cross-ref). Only bare lesson ids (L02, (L02), L02-L08, …) map.
  let t = text.replace(/\bL(\d{2})\b(?!\.json)/g, (m, d) => numMap[parseInt(d, 10)] ? '@@' + numMap[parseInt(d, 10)] + '@@' : m);
  return t.replace(/@@(\d+)@@/g, (m, d) => 'L' + pad(parseInt(d, 10)));
}

const existing = fs.readdirSync(DIR).filter(f => /^guitar-lesson-\d+-.*\.json$/.test(f)).sort();
const staged = [];
const seenNew = new Set();
for (const oldName of existing) {
  const oldNum = parseInt(oldName.match(/^guitar-lesson-(\d+)/)[1], 10);
  const slug = slugOf(oldName);
  const newNum = numMap[oldNum];
  if (!newNum) { console.error('ABORT: no new slot for ' + oldName); process.exit(1); }
  let body = rewriteRefs(fs.readFileSync(path.join(DIR, oldName), 'utf8'));
  const doc = JSON.parse(body);
  const oldId = 'L' + pad(oldNum);
  if (doc.lesson && typeof doc.lesson.id === 'string') doc.lesson.id = doc.lesson.id.replace(/^L\d{2}/, idMap[oldId]);
  body = JSON.stringify(doc, null, 2) + '\n';
  const newName = 'guitar-lesson-' + pad(newNum) + '-' + slug + '.json';
  if (seenNew.has(newName)) { console.error('ABORT: collision on ' + newName); process.exit(1); }
  seenNew.add(newName);
  staged.push({ oldName, newName, body, fromShipping: false });
}

// Verbatim copy of the 5 orphans from shipping (already NEW-numbered).
const ORPHANS = ['02-holding-the-pick', '06-switching-em-and-c', '09-first-three-chord-song', '17-new-chord-f', '19-new-chord-a7'];
for (const o of ORPHANS) {
  const src = path.join(SHIP, 'guitar-lesson-' + o + '.json');
  if (!fs.existsSync(src)) { console.error('ABORT: orphan missing ' + src); process.exit(1); }
  // confirm it is already NEW-numbered and not already present
  const doc = JSON.parse(fs.readFileSync(src, 'utf8'));
  const id = doc.lesson && doc.lesson.id;
  const expectId = 'L' + o.split('-')[0] + '-' + o.split('-').slice(1).join('-');
  if (id !== expectId) console.warn('  WARN orphan id ' + id + ' != expected ' + expectId);
  const newName = 'guitar-lesson-' + o + '.json';
  if (seenNew.has(newName)) { console.error('ABORT: orphan collision ' + newName); process.exit(1); }
  seenNew.add(newName);
  staged.push({ oldName: '(shipping) ' + newName, newName, body: fs.readFileSync(src, 'utf8'), fromShipping: true });
}

console.log('DRY-RUN — ' + staged.length + ' files would be produced in 05-content/ (NEW order 1..25):');
for (const s of staged) console.log('  ' + (s.fromShipping ? '[COPY] ' : '[MV/rewrite] ') + s.newName + (s.oldName.startsWith('(shipping)') ? '' : '   <=' + s.oldName));

if (process.argv.includes('--commit')) {
  // remove all current lesson files first to avoid stale leftovers
  for (const f of existing) fs.rmSync(path.join(DIR, f));
  for (const s of staged) fs.writeFileSync(path.join(DIR, s.newName), s.body, 'utf8');
  console.log('\nCOMMITTED: 05-content now has ' + staged.length + ' lessons in NEW order.');
} else {
  console.log('\n(no changes made — pass --commit to apply)');
}
