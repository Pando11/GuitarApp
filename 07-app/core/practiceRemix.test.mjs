// practiceRemix.test.mjs — node self-test (prints PASS, exits 0).
import { remixPlan, FRAMING_IDS } from './practiceRemix.js';
import assert from 'node:assert';

const plan = { weakPair: 'G↔D', fluency: 0.25, ratePerMin: 15, diagnostic: 30, goal: 60 };
const engagement = { recentCleanChanges: 12, lastSessionMs: 300000 };

const out = remixPlan(plan, engagement);

// 3 framings produced
assert.equal(out.framings.length, 3, 'must produce 3 framings');
assert.deepEqual(out.framings.map((f) => f.id), FRAMING_IDS, 'framing ids must be tempo/groove/calm');

// ONE selected
assert.ok(out.selected, 'a framing must be selected');
assert.ok(['tempo', 'groove', 'calm'].includes(out.selectedId), 'selectedId is one of the three');

// output references only real inputs (weak pair + rate come from the plan)
assert.equal(out.weakPair, 'G↔D', 'weakPair must mirror the plan input');
assert.equal(out.ratePerMin, 15, 'ratePerMin must mirror the plan input');
assert.equal(out.fluency, 0.25, 'fluency must mirror the plan input');
for (const f of out.framings) {
  assert.equal(f.weakPair, 'G↔D', 'every framing references the real weak pair');
  assert.ok((f.weakPair + ' ' + f.unit + ' ' + f.note).includes('G') &&
    (f.weakPair + ' ' + f.unit + ' ' + f.note).includes('D'),
    'framing references real chords G and D from the plan');
  // engagement-only selection: no personality/mood inference words
  assert.ok(!/mood|personality|feels? (?:like|tired|lazy|happy|sad)|talent/i.test(JSON.stringify(f)),
    'no mood/personality inference');
}

// engagement-only selection: short session -> calm
const calmOut = remixPlan(plan, { recentCleanChanges: 5, lastSessionMs: 20000 });
assert.equal(calmOut.selectedId, 'calm', 'short session selects calm');
// high recent volume -> tempo
const tempoOut = remixPlan(plan, { recentCleanChanges: 40, lastSessionMs: 600000 });
assert.equal(tempoOut.selectedId, 'tempo', 'high recent volume selects tempo');

console.log('practiceRemix PASS — 3 framings, selected=' + out.selectedId +
  ', weakPair=' + out.weakPair + ', rate=' + out.ratePerMin + '/min');
process.exit(0);
