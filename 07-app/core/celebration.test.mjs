// celebration.test.mjs — node self-test (prints PASS, exits 0).
import { buildCelebration, BANNED_PRAISE } from './celebration.js';
import assert from 'node:assert';

const numbers = { streakDays: 5, chordsCleaned: 12, daysPracticed: 8, totalSessions: 20, minutesPracticed: 140 };
const out = buildCelebration(numbers);

// output contains the real numbers
assert.ok(out.text.includes('5'), 'text must include streak 5');
assert.ok(out.text.includes('12'), 'text must include chordsCleaned 12');
assert.ok(out.text.includes('8'), 'text must include daysPracticed 8');
assert.ok(out.text.includes('20'), 'text must include sessions 20');
assert.ok(out.text.includes('140'), 'text must include minutes 140');
assert.deepEqual(out.numbers, numbers, 'numbers echoed back verbatim');

// two-layer privacy note (local-first)
assert.ok(out.privacy.layer1 && out.privacy.layer2, 'two-layer privacy note required');
assert.equal(out.localFirst, true, 'local-first flag');

// NO banned praise words (any case)
const blob = (out.text + ' ' + out.privacy.layer1 + ' ' + out.privacy.layer2).toLowerCase();
for (const w of BANNED_PRAISE) {
  assert.ok(!blob.includes(w), 'banned praise word must not appear: ' + w);
}

// no invented praise phrasing
assert.ok(!/you are |you're |amazing|incredible|awesome|born to/.test(blob), 'no invented praise');

console.log('celebration PASS — streak=' + numbers.streakDays +
  ', chordsCleaned=' + numbers.chordsCleaned + ', daysPracticed=' + numbers.daysPracticed);
process.exit(0);
