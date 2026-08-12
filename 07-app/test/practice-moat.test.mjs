// practice-moat.test.mjs — locks in the curriculum-review root-cause fix and
// the practice-lesson generation. Run: node test/practice-moat.test.mjs
import { measureOneMinute } from '../../06-prototypes/practice-engine/one-minute-changes.mjs';
import { createFluencyStore } from '../../06-prototypes/practice-engine/fluency-store.mjs';
import { pairKey } from '../../06-prototypes/practice-engine/pair-key.mjs';
import { canonChord, canonPairKey, displayChord } from '../core/chord-canon.js';
import { validateLesson } from '../core/schema/validate.js';
import { PracticeStore } from '../core/practiceStore.js';
import fs from 'node:fs';
import path from 'node:path';

let pass = 0;
const fail = [];
function ok(n, c) { if (c) pass++; else { fail.push(n); console.log('FAIL:', n); } }

// 1) ROOT-CAUSE FIX: easyC and C collapse to ONE pair key (moat no longer splits)
ok('canonPairKey merges easyC/C into one key', canonPairKey('easyC', 'Em') === canonPairKey('C', 'Em'));
ok('prototype pairKey merges easyC/C', pairKey('easyC', 'Em') === pairKey('C', 'Em'));
ok('displayChord("C") still surfaces easyC for early learner', displayChord('C') === 'easyC');

// 2) fluency memory does NOT split easyC vs C
const store = createFluencyStore({ knownPairs: [['easyC', 'Em'], ['C', 'Em']], now: () => Date.now() });
store.record(canonPairKey('easyC', 'Em'), { ratePerMin: 25 });
store.record(canonPairKey('C', 'Em'), { ratePerMin: 55 });
const snap = store.snapshot();
ok('fluency store: only ONE Em slot', snap.filter((s) => s.pair.includes('Em')).length === 1);
const em = snap.find((s) => s.pair.includes('Em'));
ok('fluency merged between 25 and 55 /min', em.fluency > 25 / 60 && em.fluency < 55 / 60);

// 3) production PracticeStore merges easyC+C into one skill slot
const ps = new PracticeStore({});
const s1 = ps.startSession('L03'); ps.logAttempt(s1, { chordName: 'easyC', verdict: 'pass', ts: Date.now() });
const s2 = ps.startSession('L08'); ps.logAttempt(s2, { chordName: 'C', verdict: 'fail', ts: Date.now() });
const map = ps.getSkillMap();
ok('PracticeStore merges easyC+C into ONE skill slot', Object.keys(map).filter((k) => k === 'C').length === 1 && !('easyC' in map));

// 4) 30/60 engine sanity (40 alternating confident strums => 39 changes, advance)
const ev = []; let t = 0; for (let i = 0; i < 40; i++) { t += 1000; ev.push({ chord: i % 2 ? 'Em' : 'C', confident: true, t }); }
const m = measureOneMinute(['Em', 'C'], ev);
ok('engine counts 39 changes from 40 alt strums', m.changes === 39);
ok('engine reports advance at 39/min', m.advance === true);

// 5) generated practice lessons exist, count, and all pass validateLesson
const idxPath = path.resolve('content/practice/index.json');
ok('practice index exists', fs.existsSync(idxPath));
const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
ok('28 canonical practice pairs generated', idx.pairs.length === 28);
let bad = 0;
for (const p of idx.pairs) {
  const v = validateLesson(JSON.parse(fs.readFileSync(path.resolve('content/practice/' + p.file), 'utf8')));
  if (!v.valid) bad++;
}
ok('all 28 practice lessons schema-valid', bad === 0);
// every pair key MUST be canonical (no raw easyC in any pair file)
let rawEasyC = 0;
for (const p of idx.pairs) {
  const lp = JSON.parse(fs.readFileSync(path.resolve('content/practice/' + p.file), 'utf8'));
  const cp = lp.exercises[0].params.chord_pair;
  if (cp.some((c) => c === 'easyC')) rawEasyC++;
}
ok('no practice lesson emits raw easyC in chord_pair (all canonical)', rawEasyC === 0);

console.log(`\nPRACTICE MOAT TEST: ${pass} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
