// verify-prototype-chords.mjs
// Proves the chord dataset the realistic-teacher prototype will render from
// passes Rule 8: 0 errors AND 0 warnings under chord-theory-check.js.
// Muted strings are expressed as `null` (the checker's contract) — NOT a
// separate `mute` array, which the checker ignores.

import { verifyChord } from '../07-app/core/chord-theory-check.js';

// [name, frets[6..1], fingers[6..1]]  (null = not played)
const CHORDS = {
  Em: { name: 'Em', frets:  [0, 2, 2, 0, 0, 0],     fingers: [0, 2, 3, 0, 0, 0] },
  C:  { name: 'C',  frets:  [null, 3, 2, 0, 1, 0],  fingers: [null, 3, 2, 0, 1, 0] },
  G:  { name: 'G',  frets:  [3, 2, 0, 0, 0, 3],     fingers: [2, 1, 0, 0, 0, 3] },
  D:  { name: 'D',  frets:  [null, null, 0, 2, 3, 2], fingers: [null, null, 0, 1, 3, 2] },
};

let totalErrors = 0, totalWarnings = 0, allOk = true;
for (const [key, c] of Object.entries(CHORDS)) {
  const r = verifyChord(key, c);
  totalErrors += r.errors.length;
  totalWarnings += r.warnings.length;
  if (!r.ok) allOk = false;
  console.log(
    `${key.padEnd(3)} -> spells ${r.spells} | notes [${r.uniqueNotes.join(' ')}] ` +
    `| errors=${r.errors.length} warnings=${r.warnings.length}` +
    (r.errors.length ? `\n   ERR: ${r.errors.join(' | ')}` : '') +
    (r.warnings.length ? `\n   WARN: ${r.warnings.join(' | ')}` : '')
  );
}

console.log('\n========================================');
console.log(`SHIP GATE (Rule 8): errors=${totalErrors} warnings=${totalWarnings}`);
console.log(allOk && totalErrors === 0 && totalWarnings === 0
  ? 'PASS — 0 errors AND 0 warnings. Safe to drive the prototype hand/diagram from this data.'
  : 'FAIL — fix chord data before embedding.');
process.exit(allOk && totalErrors === 0 && totalWarnings === 0 ? 0 : 1);
