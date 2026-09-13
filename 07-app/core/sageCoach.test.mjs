// sageCoach.test.mjs — WAVE 2 SAGE FORWARD-COACHING BRIDGE self-test.
//
// Run: node 07-app/core/sageCoach.test.mjs
//
// Asserts the coaching line is Rule-5-safe:
//   (a) it contains at least one REAL number taken from the input, and
//   (b) it contains NO freelanced opinion/praise (banned-word scan).
//
// Feeds FAKE but well-formed numbers — no real student data, no network.

import { coachLine, sageCoach, snapshotFromStore, BANNED_PHRASES, adviceLedgerForEnvelope, tempoMemoryForEnvelope } from './sageCoach.js';
import { PracticeStore } from './practiceStore.js';
import { AdviceLedger } from './adviceLedger.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

// Extract integer tokens from a string.
function numsIn(str) {
  const m = (str || '').match(/\d+/g);
  return m ? m.map(Number) : [];
}
// Every number present in the input snapshot (flattened), as integers.
function inputNumbers(snap) {
  const out = [];
  out.push(snap.helpRequests, snap.currentStreak, snap.longestStreak, snap.practiceMinutes, snap.lessonsCompleted);
  if (snap.lastTempo != null) out.push(snap.lastTempo);
  for (const c of snap.chords) {
    const d = snap.perChord[c];
    out.push(d.clean, d.fail, d.unsure, d.tries);
  }
  return out.filter((n) => typeof n === 'number' && isFinite(n));
}
// Does the line cite at least one real input number (exact token match)?
function citesRealNumber(line, snap) {
  const lineNums = numsIn(line);
  const inNums = inputNumbers(snap);
  return inNums.some((n) => lineNums.includes(n));
}
// Banned-word scan: case-insensitive, whole-phrase.
function hasBannedOpinion(line) {
  const low = (line || '').toLowerCase();
  return BANNED_PHRASES.find((p) => low.includes(p.toLowerCase())) || null;
}

console.log('\n=== sageCoach Rule-5 self-test ===');

// ---------------------------------------------------------------------------
// Case A: struggling chord with recorded fails (the headline path).
// ---------------------------------------------------------------------------
const snapA = {
  chords: ['Em', 'C'],
  perChord: {
    Em: { clean: 5, fail: 2, unsure: 1, tries: 8 },
    C: { clean: 9, fail: 0, unsure: 0, tries: 9 },
  },
  currentStreak: 3, longestStreak: 7, practiceMinutes: 42, lessonsCompleted: 4, helpRequests: 0, lastTempo: 84,
};
const lineA = coachLine(snapA);
console.log('  A line: "' + lineA + '"');
check('A line cites a real input number', citesRealNumber(lineA, snapA));
check('A line has NO banned opinion', hasBannedOpinion(lineA) === null);

// ---------------------------------------------------------------------------
// Case B: open help requests dominate the line.
// ---------------------------------------------------------------------------
const snapB = { chords: [], perChord: {}, currentStreak: 0, longestStreak: 0, practiceMinutes: 0, lessonsCompleted: 0, helpRequests: 2, lastTempo: null };
const lineB = coachLine(snapB);
console.log('  B line: "' + lineB + '"');
check('B line cites the help-request count', citesRealNumber(lineB, snapB));
check('B line has NO banned opinion', hasBannedOpinion(lineB) === null);

// ---------------------------------------------------------------------------
// Case C: only a streak recorded.
// ---------------------------------------------------------------------------
const snapC = { chords: [], perChord: {}, currentStreak: 5, longestStreak: 12, practiceMinutes: 0, lessonsCompleted: 0, helpRequests: 0, lastTempo: null };
const lineC = coachLine(snapC);
console.log('  C line: "' + lineC + '"');
check('C line cites the streak number', citesRealNumber(lineC, snapC));
check('C line has NO banned opinion', hasBannedOpinion(lineC) === null);

// ---------------------------------------------------------------------------
// Case D: empty store — line must still carry NO banned opinion.
// (No number to cite, which is acceptable because the input has none.)
// ---------------------------------------------------------------------------
const snapD = { chords: [], perChord: {}, currentStreak: 0, longestStreak: 0, practiceMinutes: 0, lessonsCompleted: 0, helpRequests: 0, lastTempo: null };
const lineD = coachLine(snapD);
console.log('  D line: "' + lineD + '"');
check('D line has NO banned opinion (empty input)', hasBannedOpinion(lineD) === null);

// ---------------------------------------------------------------------------
// Case E: full path through a FAKE PracticeStore -> snapshotFromStore -> coachLine.
// Exercises the exact wiring teacher.js uses.
// ---------------------------------------------------------------------------
const fakeStore = new PracticeStore({
  sessions: [
    { id: 's1', lessonId: 'L03', ts: Date.now() - 86400000 * 2, durationSec: 600, completed: true,
      attempts: [
        { chordName: 'Em', verdict: 'fail', ts: 1 }, { chordName: 'Em', verdict: 'fail', ts: 2 },
        { chordName: 'Em', verdict: 'clean', ts: 3 }, { chordName: 'Em', verdict: 'clean', ts: 4 },
        { chordName: 'Em', verdict: 'clean', ts: 5 }, { chordName: 'Am', verdict: 'clean', ts: 6 },
      ] },
  ],
  helpRequests: [{ chordName: 'Em', ts: 1, followedUp: false }],
});
const snapE = snapshotFromStore(fakeStore);
const lineE = sageCoach(fakeStore);
console.log('  E line: "' + lineE + '"');
check('E (real store) line cites a real input number', citesRealNumber(lineE, snapE));
check('E (real store) line has NO banned opinion', hasBannedOpinion(lineE) === null);

// ---------------------------------------------------------------------------
// Negative control: a line that SHOULD fail the banned-word scan must fail.
// (Sanity that the test actually detects freelanced opinion.)
// ---------------------------------------------------------------------------
const controlLine = "You're a natural, a great musician — prodigy talent!";
check('negative control: banned scan DETECTS freelanced opinion', hasBannedOpinion(controlLine) !== null);

// ---------------------------------------------------------------------------
// Ticket 4 (issue #7) — adviceLedgerForEnvelope / tempoMemoryForEnvelope.
// The other two pieces handed to the model alongside snapshotFromStore(),
// reduced to exactly the shape coachSurface.js/server's schema.js accept.
// ---------------------------------------------------------------------------
console.log('\n=== adviceLedgerForEnvelope / tempoMemoryForEnvelope ===');

const ledger = new AdviceLedger();
ledger.logAdvice({ chord: 'Em', kind: 'slow_down' });
ledger.recordVerdictSinceAdvice('Em', 'pass');
ledger.recordVerdictSinceAdvice('Em', 'fail');
const ledgerEnvelope = adviceLedgerForEnvelope(ledger);
check('adviceLedgerForEnvelope produces one entry for one logged suggestion', ledgerEnvelope.length === 1);
check('adviceLedgerForEnvelope entry carries chord/kind/status/verdictsCount', ledgerEnvelope[0].chord === 'Em' && ledgerEnvelope[0].kind === 'slow_down' && ledgerEnvelope[0].status === 'pending' && ledgerEnvelope[0].verdictsCount === 2);
check('adviceLedgerForEnvelope never returns the raw verdicts array (only a count)', !('verdicts' in ledgerEnvelope[0]));
check('adviceLedgerForEnvelope(null) does not throw and returns []', (() => { try { return Array.isArray(adviceLedgerForEnvelope(null)); } catch (e) { return false; } })());
check('adviceLedgerForEnvelope({}) (no toJSON) does not throw and returns []', (() => { try { return adviceLedgerForEnvelope({}).length === 0; } catch (e) { return false; } })());

const tempoStore = new PracticeStore({ sessions: [{ id: 's1', lessonId: 'L05', ts: Date.now(), durationSec: 300, completed: true, attempts: [] }] });
tempoStore.recordPracticeTempo('s1', 65, ['Em', 'C']);
tempoStore.recordPracticeTempo('s1', 70, 'G');
const tempoEnvelope = tempoMemoryForEnvelope(tempoStore, [['Em', 'C'], 'G', 'D']);
check('tempoMemoryForEnvelope returns only the keys that actually have a stored tempo', tempoEnvelope.length === 2);
check('tempoMemoryForEnvelope carries the exact stored bpm for a pair key', tempoEnvelope.some((e) => e.bpm === 65 && e.key.includes('Em') && e.key.includes('C')));
check('tempoMemoryForEnvelope carries the exact stored bpm for a single-chord key', tempoEnvelope.some((e) => e.bpm === 70 && e.key === 'G'));
check('tempoMemoryForEnvelope(store, non-array) does not throw and returns []', (() => { try { return tempoMemoryForEnvelope(tempoStore, 'not-an-array').length === 0; } catch (e) { return false; } })());
check('tempoMemoryForEnvelope(null, [...]) does not throw and returns []', (() => { try { return tempoMemoryForEnvelope(null, ['Em']).length === 0; } catch (e) { return false; } })());

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) { console.log('OVERALL: PASS'); process.exit(0); }
else { console.log('OVERALL: FAIL'); process.exit(1); }
