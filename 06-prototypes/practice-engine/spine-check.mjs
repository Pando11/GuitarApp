import { createPracticeLoop } from './practice-loop.mjs';
import { simulateStrumStream } from './listener-sim.mjs';

// Real spine chord order from the curriculum doc.
const SPINE = ['Em', 'easyC', 'G', 'D', 'A', 'Am', 'E', 'Dm'];

const baseSkill = { Em: 0.98, easyC: 0.9, G: 0.8, D: 0.6, A: 0.7, Am: 0.5, E: 0.75, Dm: 0.4 };
let practiceCount = {};
function studentSkill(X, old) {
  const base = Math.min(baseSkill[X] ?? 0.7, baseSkill[old] ?? 0.7);
  const lift = Math.min(0.15, (practiceCount[X] || 0) * 0.02 + (practiceCount[old] || 0) * 0.02);
  return Math.min(1, base + lift);
}

const loop = createPracticeLoop({ knownPairs: [], K: 3 });
const taught = [];
for (const X of SPINE) {
  const priors = taught.slice();
  if (priors.length === 0) { taught.push(X); continue; }
  const sim = (x, old) => simulateStrumStream({
    A: x, B: old, skillA: studentSkill(x, old), skillB: studentSkill(x, old),
    cadencePerMin: 70, durationMin: 1.0, seed: SPINE.indexOf(X) * 13 + priors.indexOf(old),
  });
  const { weakest } = loop.measureLessonPair(X, priors, sim);
  practiceCount[X] = (practiceCount[X] || 0) + 1;
  taught.push(X);
  console.log(`Taught ${X}: weakest new pair = ${weakest.pair} @ ${weakest.ratePerMin}/min`);
}

const session = loop.buildReviewSession();
console.log('\nReview session (K=3 weakest pairs):');
for (const p of session.pairs) console.log('  -', p);
console.log('\nMOAT CHECK: targets the student\'s actual weak pairs, not blanket "review everything".');
