// validate-practice-lessons.mjs
// Verifies the generated practice lessons honor the curriculum §5.1 matching rule:
//   practice chord set == teaching chord set + cumulative; every 1-min exercise's
//   chord_pair is a subset of chords_in_scope; no new chord introduced.
// Run: node 06-prototypes/practice-engine/validate-practice-lessons.mjs

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pairKey } from './pair-key.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dirname, '..', '..', '05-content');
const PRAC = join(CONTENT, 'practice');

const TEACHING = [
  'guitar-lesson-01-welcome-anatomy-tuning','guitar-lesson-02-first-chord-em','guitar-lesson-03-second-chord-first-song',
  'guitar-lesson-04-strumming-in-time','guitar-lesson-05-chord-changes-em-easyc','guitar-lesson-06-new-chord-g',
  'guitar-lesson-07-new-chord-d','guitar-lesson-08-new-chord-a','guitar-lesson-09-new-chord-am-big-four',
  'guitar-lesson-10-four-chord-songs','guitar-lesson-11-up-strums','guitar-lesson-12-strumming-patterns',
  'guitar-lesson-13-dynamics-alternating-bass','guitar-lesson-14-capo-basics','guitar-lesson-15-faster-chord-changes',
  'guitar-lesson-16-new-chord-e','guitar-lesson-17-minor-progressions-dm','guitar-lesson-18-fingerpicking-travis',
  'guitar-lesson-19-read-chord-chart-tab','guitar-lesson-20-consolidation-performance',
];

let failures = 0;
const cumulative = [];
let count = 0;

for (const tid of TEACHING) {
  const tPath = join(CONTENT, `${tid}.json`);
  const pId = tid.replace(/^guitar-lesson-(\d+)-/, 'guitar-practice-$1-');
  const pPath = join(PRAC, `${pId}.json`);
  if (!existsSync(pPath)) { console.log(`FAIL ${pId} missing`); failures++; continue; }
  const teaching = JSON.parse(readFileSync(tPath, 'utf-8'));
  const practice = JSON.parse(readFileSync(pPath, 'utf-8'));

  const taughtNow = Object.keys(teaching.chords || {}).filter((k) => k !== '_schema');
  for (const c of taughtNow) if (!cumulative.includes(c)) cumulative.push(c);

  const scope = practice.lesson.chords_in_scope;
  // (a) scope must equal cumulative exactly
  const scopeSet = [...scope].sort().join(',');
  const cumSet = [...cumulative].sort().join(',');
  if (scopeSet !== cumSet) { console.log(`FAIL ${pId}: scope [${scopeSet}] != cumulative [${cumSet}]`); failures++; }
  // (b) every chords_in_scope must exist in the practice chords block
  for (const c of scope) if (!practice.chords[c]) { console.log(`FAIL ${pId}: chord ${c} in scope but not in chords block`); failures++; }
  // (c) every one-minute-changes chord_pair subset of scope
  for (const ex of practice.exercises) {
    if (ex.practice_type === 'one-minute-changes') {
      const [a, b] = ex.params.chord_pair;
      if (!scope.includes(a) || !scope.includes(b)) {
        console.log(`FAIL ${pId}: 1-min pair ${a}/${b} not in scope`); failures++;
      }
      // pairKey sanity
      if (pairKey(a, b) !== pairKey(b, a)) { console.log(`FAIL pairKey not symmetric`); failures++; }
    }
  }
  count++;
}

console.log(`\nValidated ${count} practice lessons. Failures: ${failures}`);
if (failures > 0) process.exit(1);
console.log('ALL PRACTICE LESSONS MATCH THE TEACHING SPINE (curriculum §5.1).');
