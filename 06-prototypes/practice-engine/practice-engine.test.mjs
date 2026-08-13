// practice-engine.test.mjs — dependency-free unit + integration tests.
// Run: node --test 06-prototypes/practice-engine/practice-engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { pairKey, parsePair } from './pair-key.mjs';
import { countChanges, measureOneMinute, ADVANCE_PER_MIN, GOAL_PER_MIN } from './one-minute-changes.mjs';
import { createFluencyStore } from './fluency-store.mjs';
import { simulateStrumStream } from './listener-sim.mjs';
import { createPracticeLoop } from './practice-loop.mjs';

// ---------- pair-key ----------
test('pairKey is order-independent', () => {
  assert.equal(pairKey('Em', 'C'), pairKey('C', 'Em'));
  assert.equal(pairKey('Em', 'C'), 'C::Em');
});
test('parsePair round-trips', () => {
  const { a, b } = parsePair(pairKey('G', 'D'));
  assert.deepEqual([a, b].sort(), ['D', 'G']);
});
test('pairKey rejects empty', () => {
  assert.throws(() => pairKey('Em', ''));
});

// ---------- counter ----------
test('counts alternating clean strums, ignores unclean', () => {
  // A B A B A B  -> 5 changes (6 strums, 5 transitions), all confident
  const evs = [
    { chord: 'A', confident: true, t: 0 },
    { chord: 'B', confident: true, t: 1000 },
    { chord: 'A', confident: true, t: 2000 },
    { chord: 'B', confident: true, t: 3000 },
    { chord: 'A', confident: true, t: 4000 },
    { chord: 'B', confident: true, t: 5000 },
  ];
  assert.equal(countChanges(evs, ['A', 'B']).changes, 5);
});

test('mashing one chord yields ZERO changes (anti-cheat)', () => {
  const evs = [
    { chord: 'A', confident: true, t: 0 },
    { chord: 'A', confident: true, t: 1000 },
    { chord: 'A', confident: true, t: 2000 },
    { chord: 'A', confident: true, t: 3000 },
  ];
  assert.equal(countChanges(evs, ['A', 'B']).changes, 0);
});

test('unclean strum between two different clean strums still counts as a change', () => {
  const evs = [
    { chord: 'A', confident: true, t: 0 },
    { chord: null, confident: false, t: 1000 }, // unclean, ignored but not resetting
    { chord: 'B', confident: true, t: 2000 },
  ];
  assert.equal(countChanges(evs, ['A', 'B']).changes, 1);
});

test('measureOneMinute: 30 clean/min => advance true, goal false', () => {
  // 46 strums alternating over 60s => 45 changes => rate 45 (>=30 advance, <60 goal)
  const evs = [];
  const intervalMs = 60000 / 46;
  for (let i = 0; i < 46; i++) {
    evs.push({ chord: i % 2 === 0 ? 'A' : 'B', confident: true, t: i * intervalMs });
  }
  const m = measureOneMinute(['A', 'B'], evs, 1.0);
  assert.equal(m.changes, 45);
  assert.ok(m.ratePerMin >= ADVANCE_PER_MIN);
  assert.ok(!m.goal);
});

test('measureOneMinute: 60 clean/min => goal true', () => {
  // 122 strums => 121 changes in 60s => rate 121 >= 60
  const evs = [];
  for (let i = 0; i < 122; i++) {
    evs.push({ chord: i % 2 === 0 ? 'A' : 'B', confident: true, t: i * (60000 / 122) });
  }
  const m = measureOneMinute(['A', 'B'], evs, 1.0);
  assert.ok(m.ratePerMin >= GOAL_PER_MIN);
  assert.ok(m.goal);
});

test('low confidence strums are excluded from count', () => {
  const evs = [
    { chord: 'A', confident: true, t: 0 },
    { chord: 'B', confident: false, t: 1000 }, // not counted
    { chord: 'B', confident: true, t: 2000 },
    { chord: 'A', confident: true, t: 3000 },
  ];
  // A->(B unclean ignored)->B clean->A clean => 2 changes (A->B, B->A)
  assert.equal(countChanges(evs, ['A', 'B']).changes, 2);
  assert.equal(countChanges(evs, ['A', 'B']).confidentStrums, 3);
});

// ---------- fluency store ----------
test('cold-start: known pairs exist at fluency 0 (bootstrap)', () => {
  const s = createFluencyStore({ knownPairs: [['Em', 'C'], ['Em', 'G']] });
  const snap = s.snapshot();
  assert.equal(snap.length, 2);
  assert.ok(snap.every((r) => r.fluency === 0));
});

test('record raises fluency toward score; low rate => low fluency', () => {
  const s = createFluencyStore({ knownPairs: [['Em', 'C']] });
  s.record(['Em', 'C'], { ratePerMin: 15 }); // 0.25 score
  const f = s.snapshot()[0].fluency;
  assert.ok(f > 0 && f < 0.3);
});

test('record high rate => high fluency', () => {
  const s = createFluencyStore({ knownPairs: [['Em', 'C']] });
  s.record(['Em', 'C'], { ratePerMin: 60 }); // 1.0 score
  assert.ok(s.snapshot()[0].fluency > 0.9);
});

test('decay lowers stale fluency (spacing effect)', () => {
  const now = () => 0;
  const s = createFluencyStore({ knownPairs: [['Em', 'C']], now });
  s.record(['Em', 'C'], { ratePerMin: 60 }, 0);
  const before = s.snapshot()[0].fluency;
  // 7 days later
  const after = s.snapshot(7 * 24 * 3600 * 1000).find((r) => r.pair === 'C::Em').fluency;
  assert.ok(after < before * 0.2, `expected ${after} << ${before}`);
});

test('selectWeakest returns K lowest-fluency pairs', () => {
  const s = createFluencyStore({ knownPairs: [['Em', 'C'], ['Em', 'G'], ['Em', 'D'], ['Em', 'A']] });
  s.record(['Em', 'C'], { ratePerMin: 60 });
  s.record(['Em', 'G'], { ratePerMin: 45 });
  s.record(['Em', 'D'], { ratePerMin: 30 });
  s.record(['Em', 'A'], { ratePerMin: 15 });
  const weak = s.selectWeakest(2).map((w) => w.pair);
  assert.deepEqual(weak, ['A::Em', 'D::Em']); // the two lowest
});

test('persistence round-trip (toJSON/load)', () => {
  const s = createFluencyStore({ knownPairs: [['Em', 'C']] });
  s.record(['Em', 'C'], { ratePerMin: 60 });
  const json = s.toJSON();
  const s2 = createFluencyStore();
  s2.load(json);
  assert.ok(s2.snapshot()[0].fluency > 0.9);
});

// ---------- integration: full loop (DECISION 1+2+3) ----------
test('INTEGRATION: a new chord measured against all prior pairs, weakest surfaced for review', () => {
  // technique spine so far: Em, easyC, G, D (already practiced). Now teaching Am (group 9).
  const priors = ['Em', 'easyC', 'G', 'D'];
  const loop = createPracticeLoop({ knownPairs: priors.flatMap((p) => (p === 'Em' ? [] : [['Em', p]])), K: 3 });

  // The prior pairs are ALREADY practiced at high fluency (realistic: they were
  // taught in earlier groups). Without this, the un-practiced prior pairs would
  // correctly be colder than the newly measured Am pairs.
  for (const p of ['easyC', 'G', 'D']) loop.store.record(['Em', p], { ratePerMin: 60 });

  // simulate: student is great at Am<->Em and Am<->easyC, weak at Am<->D and Am<->G
  const sim = (X, old) => {
    const skill = { Em: 1.0, easyC: 0.95, G: 0.45, D: 0.3 }[old] ?? 0.8;
    return simulateStrumStream({ A: X, B: old, skillA: 1.0, skillB: skill, cadencePerMin: 70, durationMin: 1.0, seed: 7 });
  };

  const { results, weakest } = loop.measureLessonPair('Am', priors, sim);

  // every prior pair got measured
  assert.equal(results.length, 4);
  // weakest should be the low-skill pair (D)
  assert.ok(weakest.pair.includes('D'), `weakest=${weakest.pair}`);

  // diagnostic (DECISION 1): even a weak pair does NOT throw/block
  const session = loop.buildReviewSession();
  assert.equal(session.pairs.length, 3); // K=3 (DECISION 3)
  assert.ok(session.pairs.includes(weakest.pair)); // weakest is in review
});

test('INTEGRATION: cold-start review returns taught pairs (bootstrap works)', () => {
  const known = [['Em', 'C'], ['Em', 'G'], ['Em', 'D']];
  const loop = createPracticeLoop({ knownPairs: known, K: 3 });
  const session = loop.buildReviewSession();
  assert.equal(session.pairs.length, 3);
  // all at fluency 0 => all surfaced initially
  assert.ok(session.pairs.includes('C::Em'));
});
