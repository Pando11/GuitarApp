// practiceFluencyBridge.test.mjs — self-test for the Wave 2 task D bridge.
//
// Run: node 07-app/core/practiceFluencyBridge.test.mjs
//
// Covers: recording a drill result updates the right pair's fluency, decay
// after a simulated time gap, and getWeakPairs(3) returns the 3 weakest pairs
// correctly ordered. Style copied from telemetry.test.mjs's check() harness.

import { createPracticeFluencyBridge } from './practiceFluencyBridge.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== practiceFluencyBridge.js self-test ===');

// ---------------------------------------------------------------------------
// 1. recordDrillResult updates the right pair's fluency.
// ---------------------------------------------------------------------------
{
  const bridge = createPracticeFluencyBridge({ knownPairs: [['C', 'Em'], ['A', 'D']] });
  bridge.recordDrillResult({ pairKey: 'C::Em', ratePerMin: 60 });

  const weak = bridge.getWeakPairs(2);
  const cEm = weak.find((w) => w.pair === 'C::Em');
  const aD = weak.find((w) => w.pair === 'A::D');

  check('recordDrillResult raises the recorded pair above 0', cEm && cEm.fluency > 0);
  check('recordDrillResult does not touch the untouched pair', aD && aD.fluency === 0);
  check('recordDrillResult.60/min gives fluency 1 on first sample', cEm && Math.abs(cEm.fluency - 1) < 1e-9);

  const raw = bridge.toJSON();
  check('toJSON records the practiced pair', raw.fluency['C::Em'] && raw.fluency['C::Em'].samples === 1);
}

// ---------------------------------------------------------------------------
// 2. Decay after a simulated time gap (fake clock, no real sleeps).
// ---------------------------------------------------------------------------
{
  let clock = 1_000_000;
  const realNow = Date.now;
  Date.now = () => clock;
  try {
    const bridge = createPracticeFluencyBridge({ knownPairs: [['C', 'Em']] });
    bridge.recordDrillResult({ pairKey: 'C::Em', ratePerMin: 60 });
    const before = bridge.getWeakPairs(1)[0];
    check('decay-test: fluency starts at 1 right after a 60/min sample', Math.abs(before.fluency - 1) < 1e-9);

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    clock += 3 * ONE_DAY_MS; // tau = 3 days -> fluency should fall to ~37%

    const after = bridge.getWeakPairs(1)[0];
    check('decay-test: fluency drops after a 3-day gap', after.fluency < before.fluency);
    check('decay-test: fluency stays within (0, 1) after decay', after.fluency > 0 && after.fluency < 1);
    check('decay-test: fluency is close to the tau=3day ~37% mark', Math.abs(after.fluency - Math.exp(-1)) < 0.01);
  } finally {
    Date.now = realNow;
  }
}

// ---------------------------------------------------------------------------
// 3. getWeakPairs(3) returns the 3 weakest pairs correctly ordered.
// ---------------------------------------------------------------------------
{
  let clock = 2_000_000;
  const realNow = Date.now;
  Date.now = () => clock;
  try {
    const knownPairs = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'F']];
    const bridge = createPracticeFluencyBridge({ knownPairs });

    // Give distinct, ordered fluencies: A::B strongest ... E::F weakest-but-one
    // (D::E and E::F are left untouched at cold-start fluency 0, tied weakest).
    bridge.recordDrillResult({ pairKey: 'A::B', ratePerMin: 60 }); // fluency 1.0
    bridge.recordDrillResult({ pairKey: 'B::C', ratePerMin: 48 }); // fluency 0.8
    bridge.recordDrillResult({ pairKey: 'C::D', ratePerMin: 24 }); // fluency 0.4
    // D::E and E::F stay at cold-start fluency 0 (never recorded).

    const weakest3 = bridge.getWeakPairs(3);
    check('getWeakPairs(3) returns exactly 3 pairs', weakest3.length === 3);

    const pairs = weakest3.map((w) => w.pair);
    check('getWeakPairs(3) excludes the two strongest pairs', !pairs.includes('A::B') && !pairs.includes('B::C'));
    check('getWeakPairs(3) includes the never-practiced pairs (cold-start = weakest)',
      pairs.includes('D::E') && pairs.includes('E::F'));

    // Correctly ordered: non-decreasing fluency.
    let ordered = true;
    for (let i = 1; i < weakest3.length; i++) {
      if (weakest3[i].fluency < weakest3[i - 1].fluency) ordered = false;
    }
    check('getWeakPairs(3) is ordered weakest-first', ordered);

    // C::D (fluency 0.4) must be the 3rd-weakest, i.e. present, ranked after
    // the two cold-start (fluency 0) pairs.
    check('getWeakPairs(3) places the practiced-but-weak pair last of the three',
      weakest3[weakest3.length - 1].pair === 'C::D');
  } finally {
    Date.now = realNow;
  }
}

// ---------------------------------------------------------------------------
// 4. toJSON()/fromJSON() round-trip preserves recorded fluency data.
// ---------------------------------------------------------------------------
{
  const bridge = createPracticeFluencyBridge({ knownPairs: [['C', 'Em']], storageKey: 'test-key' });
  bridge.recordDrillResult({ pairKey: 'C::Em', ratePerMin: 30 });
  const saved = bridge.toJSON();

  const restored = createPracticeFluencyBridge.fromJSON(saved);
  check('fromJSON restores storageKey via toJSON round-trip', restored.toJSON().storageKey === 'test-key');
  const restoredWeak = restored.getWeakPairs(1)[0];
  check('fromJSON restores the recorded pair', restoredWeak.pair === 'C::Em');
  check('fromJSON preserves a positive fluency value', restoredWeak.fluency > 0);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
