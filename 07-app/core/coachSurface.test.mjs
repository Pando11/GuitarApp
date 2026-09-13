// coachSurface.test.mjs — Wave 1 task C self-test.
//
// Run: node 07-app/core/coachSurface.test.mjs
//
// Covers: buildCoachEnvelope produces exactly the server's facts-envelope
// shape (server/src/schema.js) from a full valid input; buildCoachEnvelope
// never throws on malformed/missing mastery and produces a safe envelope;
// getCoachMessage falls back to the local template (no server call) when
// the envelope is malformed/incomplete and no network transport is
// available.

import { buildCoachEnvelope, getCoachMessage, buildActions } from './coachSurface.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== coachSurface.js Wave 1 task C self-test ===');

// ---------------------------------------------------------------------------
// 1. buildCoachEnvelope with a full valid input produces the correct shape.
// ---------------------------------------------------------------------------
const fullInput = {
  anonId: 'anon-test-0123456789',
  learnerProfile: { ageBand: '18-34', experience: 'returning-player', goal: 'Play campfire songs', minutesPerDay: 15 },
  lessonId: 'lesson-3',
  mastery: [
    { chord: 'G', label: 'needs_work', confidence: 72 },
    { chord: 'Em', label: 'mastered', confidence: 95 },
  ],
  justHappened: { drillId: 'muted-strum', passed: true, score: 88, ratePerMin: 42 },
  recentHistory: [
    { lessonId: 'lesson-2', completedAt: '2026-09-01T12:00:00.000Z', confidenceDelta: 5 },
  ],
};

const fullEnvelope = buildCoachEnvelope(fullInput);
check('full envelope has anonId', fullEnvelope.anonId === fullInput.anonId);
check('full envelope has learnerProfile', JSON.stringify(fullEnvelope.learnerProfile) === JSON.stringify(fullInput.learnerProfile));
check('full envelope has lessonId', fullEnvelope.lessonId === 'lesson-3');
check('full envelope has mastery array of correct shape', JSON.stringify(fullEnvelope.mastery) === JSON.stringify(fullInput.mastery));
check('full envelope mastery confidence stays on 0-100 scale', fullEnvelope.mastery.every((m) => m.confidence >= 0 && m.confidence <= 100));
check('full envelope has justHappened', JSON.stringify(fullEnvelope.justHappened) === JSON.stringify(fullInput.justHappened));
check('full envelope has recentHistory', JSON.stringify(fullEnvelope.recentHistory) === JSON.stringify(fullInput.recentHistory));
check('full envelope never invents a stray top-level field', Object.keys(fullEnvelope).sort().join(',') === ['anonId', 'learnerProfile', 'lessonId', 'lessonChords', 'mastery', 'justHappened', 'recentHistory'].sort().join(','));

// ---------------------------------------------------------------------------
// Ticket 4 (issue #7) — storeSnapshot/adviceLedger/tempoMemory pickers.
// ---------------------------------------------------------------------------
const fullSnapshotInput = {
  storeSnapshot: {
    chords: ['Em', 'C'],
    perChord: { Em: { clean: 4, fail: 2, unsure: 0, tries: 6 } },
    currentStreak: 3,
    longestStreak: 5,
    practiceMinutes: 42,
    lessonsCompleted: 2,
    helpRequests: 1,
    lastTempo: 60,
  },
  adviceLedger: [{ chord: 'Em', kind: 'slow_down', status: 'pending', verdictsCount: 2 }],
  tempoMemory: [{ key: 'Em::C', bpm: 65 }],
};
const snapEnvelope = buildCoachEnvelope(fullSnapshotInput);
check('storeSnapshot passes through intact', JSON.stringify(snapEnvelope.storeSnapshot) === JSON.stringify(fullSnapshotInput.storeSnapshot));
check('adviceLedger passes through intact', JSON.stringify(snapEnvelope.adviceLedger) === JSON.stringify(fullSnapshotInput.adviceLedger));
check('tempoMemory passes through intact', JSON.stringify(snapEnvelope.tempoMemory) === JSON.stringify(fullSnapshotInput.tempoMemory));

check('storeSnapshot is omitted entirely when absent', !('storeSnapshot' in buildCoachEnvelope({})));
check('adviceLedger is omitted entirely when empty/absent', !('adviceLedger' in buildCoachEnvelope({})));
check('tempoMemory is omitted entirely when empty/absent', !('tempoMemory' in buildCoachEnvelope({})));

check('storeSnapshot non-object is dropped, not guessed at', !('storeSnapshot' in buildCoachEnvelope({ storeSnapshot: 'not-an-object' })));
check('a perChord entry missing a required stat is dropped but a valid sibling is kept', (() => {
  const env = buildCoachEnvelope({ storeSnapshot: { perChord: { Em: { clean: 1, fail: 0, unsure: 0, tries: 1 }, C: { clean: 'x' } } } });
  return Object.keys(env.storeSnapshot.perChord).length === 1 && env.storeSnapshot.perChord.Em.tries === 1;
})());
check('storeSnapshot.lastTempo=null is preserved (explicitly no tempo yet)', buildCoachEnvelope({ storeSnapshot: { lastTempo: null, chords: ['Em'] } }).storeSnapshot.lastTempo === null);

check('a malformed advice entry is dropped, valid ones kept', (() => {
  const env = buildCoachEnvelope({ adviceLedger: [{ chord: 'Em', kind: 'slow_down', status: 'pending', verdictsCount: 1 }, { chord: 'Em', kind: 'x', status: 'not-a-real-status', verdictsCount: 1 }, null] });
  return env.adviceLedger.length === 1;
})());
check('a malformed tempo entry is dropped, valid ones kept', (() => {
  const env = buildCoachEnvelope({ tempoMemory: [{ key: 'Em', bpm: 60 }, { key: 'C', bpm: -5 }, { key: '', bpm: 60 }] });
  return env.tempoMemory.length === 1 && env.tempoMemory[0].bpm === 60;
})());

// ---------------------------------------------------------------------------
// Ticket 4 (issue #7) — buildActions(): pure, never invents, only ever
// echoes fields it was handed.
// ---------------------------------------------------------------------------
check('buildActions() with no args returns an empty list', Array.isArray(buildActions()) && buildActions().length === 0);
check('buildActions() with all-empty opts returns an empty list', buildActions({}).length === 0);

const emDiagram = { chord: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] };
const diagramActions = buildActions({ diagram: emDiagram });
check('show_diagram action carries the exact chord/frets/fingers given', diagramActions.length === 1 && diagramActions[0].type === 'show_diagram' && JSON.stringify(diagramActions[0].frets) === JSON.stringify(emDiagram.frets) && JSON.stringify(diagramActions[0].fingers) === JSON.stringify(emDiagram.fingers));
check('show_diagram with no frets/fingers still carries the chord name alone', buildActions({ diagram: { chord: 'Em' } })[0].chord === 'Em' && !('frets' in buildActions({ diagram: { chord: 'Em' } })[0]));
check('show_diagram is omitted when diagram has no chord name', buildActions({ diagram: { frets: emDiagram.frets } }).length === 0);
check('show_diagram drops a wrong-length frets array rather than guessing', !('frets' in buildActions({ diagram: { chord: 'Em', frets: [0, 2] } })[0]));

check('set_metronome action carries the given bpm', JSON.stringify(buildActions({ metronome: { bpm: 65 } })) === JSON.stringify([{ type: 'set_metronome', bpm: 65 }]));
check('set_metronome is omitted for a non-positive/invalid bpm', buildActions({ metronome: { bpm: 0 } }).length === 0 && buildActions({ metronome: { bpm: 'fast' } }).length === 0);

check('open_tuner action appears only when explicitly true', JSON.stringify(buildActions({ tuner: true })) === JSON.stringify([{ type: 'open_tuner' }]));
check('open_tuner is omitted for any other value', buildActions({ tuner: 'yes' }).length === 0 && buildActions({ tuner: false }).length === 0);

const drillInput = { drillId: 'L05:Anchor drill', lessonId: 'L05', exerciseName: 'Anchor drill', chordPair: ['Em', 'C'] };
check('start_drill action carries every given field verbatim', JSON.stringify(buildActions({ drill: drillInput })) === JSON.stringify([{ type: 'start_drill', ...drillInput }]));
check('start_drill is omitted without a drillId', buildActions({ drill: { lessonId: 'L05', exerciseName: 'Anchor drill' } }).length === 0);

check('log_advice action carries the given chord/kind', JSON.stringify(buildActions({ advice: { chord: 'Em', kind: 'slow_down' } })) === JSON.stringify([{ type: 'log_advice', chord: 'Em', kind: 'slow_down' }]));
check('log_advice is omitted when kind is missing', buildActions({ advice: { chord: 'Em' } }).length === 0);

check('buildActions() composes all five independently in one call', buildActions({ diagram: emDiagram, metronome: { bpm: 60 }, tuner: true, drill: drillInput, advice: { chord: 'Em', kind: 'slow_down' } }).map((a) => a.type).sort().join(',') === ['show_diagram', 'set_metronome', 'open_tuner', 'start_drill', 'log_advice'].sort().join(','));


// ---------------------------------------------------------------------------
// 1b. buildCoachEnvelope never invents/mutates anonId — invalid input is
// dropped, never coerced or generated.
// ---------------------------------------------------------------------------
// lessonChords — the lesson's own verified chord shapes, so guardrail.js can
// tell naming the lesson's subject apart from inventing a fact, and so Sage
// quotes the real fingering instead of guessing one (2026-09-08).
check('a lesson chord shape passes through intact', JSON.stringify(buildCoachEnvelope({ lessonChords: [{ chord: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }] }).lessonChords) === JSON.stringify([{ chord: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }]));
check('a chord named without a diagram still passes through', JSON.stringify(buildCoachEnvelope({ lessonChords: [{ chord: 'Em' }] }).lessonChords) === JSON.stringify([{ chord: 'Em' }]));
check('lessonChords absent yields an empty array, never undefined', JSON.stringify(buildCoachEnvelope({}).lessonChords) === '[]');
check('lessonChords non-array yields an empty array', JSON.stringify(buildCoachEnvelope({ lessonChords: 'Em' }).lessonChords) === '[]');
check('a bare string entry is dropped, not guessed at', JSON.stringify(buildCoachEnvelope({ lessonChords: ['Em'] }).lessonChords) === '[]');
check('an entry with no chord name is dropped', JSON.stringify(buildCoachEnvelope({ lessonChords: [{ frets: [0, 2, 2, 0, 0, 0] }] }).lessonChords) === '[]');
check('an over-long chord name is dropped', JSON.stringify(buildCoachEnvelope({ lessonChords: [{ chord: 'x'.repeat(13) }] }).lessonChords) === '[]');
check('a wrong-length frets array is dropped but the name is kept', JSON.stringify(buildCoachEnvelope({ lessonChords: [{ chord: 'Em', frets: [0, 2] }] }).lessonChords) === JSON.stringify([{ chord: 'Em' }]));
check('a non-integer fret is dropped but the name is kept', JSON.stringify(buildCoachEnvelope({ lessonChords: [{ chord: 'Em', frets: [0, 'two', 2, 0, 0, 0] }] }).lessonChords) === JSON.stringify([{ chord: 'Em' }]));
check('a muted string (null) is preserved, not treated as malformed', JSON.stringify(buildCoachEnvelope({ lessonChords: [{ chord: 'C', frets: [null, 3, 2, 0, 1, 0] }] }).lessonChords[0].frets) === JSON.stringify([null, 3, 2, 0, 1, 0]));
check('lessonChords de-duplicates by name', buildCoachEnvelope({ lessonChords: [{ chord: 'Em' }, { chord: 'Em' }, { chord: 'C' }] }).lessonChords.length === 2);
check('lessonChords caps at 24 entries', buildCoachEnvelope({ lessonChords: Array.from({ length: 40 }, (_, i) => ({ chord: 'c' + i })) }).lessonChords.length === 24);

check('anonId=undefined is omitted, not invented', !('anonId' in buildCoachEnvelope({ learnerProfile: fullInput.learnerProfile })));
check('anonId="" (empty string) is omitted', !('anonId' in buildCoachEnvelope({ anonId: '' })));
check('anonId=123 (non-string) is omitted', !('anonId' in buildCoachEnvelope({ anonId: 123 })));
check('anonId longer than 128 chars is omitted', !('anonId' in buildCoachEnvelope({ anonId: 'x'.repeat(129) })));
check('anonId exactly 128 chars is kept', buildCoachEnvelope({ anonId: 'x'.repeat(128) }).anonId === 'x'.repeat(128));

// ---------------------------------------------------------------------------
// 2. buildCoachEnvelope with a malformed/missing mastery array does NOT
// throw and produces a safe envelope.
// ---------------------------------------------------------------------------
let threwUndefined = false;
let envUndefinedMastery;
try {
  envUndefinedMastery = buildCoachEnvelope({ learnerProfile: fullInput.learnerProfile, lessonId: 'lesson-1', mastery: undefined });
} catch (e) { threwUndefined = true; }
check('buildCoachEnvelope with mastery=undefined does not throw', !threwUndefined);
check('buildCoachEnvelope with mastery=undefined yields empty mastery array', Array.isArray(envUndefinedMastery.mastery) && envUndefinedMastery.mastery.length === 0);

let threwNonArray = false;
let envNonArrayMastery;
try {
  envNonArrayMastery = buildCoachEnvelope({ learnerProfile: fullInput.learnerProfile, lessonId: 'lesson-1', mastery: 'not-an-array' });
} catch (e) { threwNonArray = true; }
check('buildCoachEnvelope with mastery=string does not throw', !threwNonArray);
check('buildCoachEnvelope with mastery=string yields empty mastery array', Array.isArray(envNonArrayMastery.mastery) && envNonArrayMastery.mastery.length === 0);

let threwGarbageItems = false;
let envGarbageItems;
try {
  envGarbageItems = buildCoachEnvelope({ mastery: [null, 42, 'x', { chord: 'C' }, { label: 'needs_work' }] });
} catch (e) { threwGarbageItems = true; }
check('buildCoachEnvelope with garbage mastery items does not throw', !threwGarbageItems);
check('buildCoachEnvelope drops fully-invalid items but keeps partially-valid ones', envGarbageItems.mastery.length === 2);

let threwNoArgs = false;
let envNoArgs;
try {
  envNoArgs = buildCoachEnvelope();
} catch (e) { threwNoArgs = true; }
check('buildCoachEnvelope() with no args at all does not throw', !threwNoArgs);
check('buildCoachEnvelope() with no args yields a safe empty-ish envelope', Array.isArray(envNoArgs.mastery) && Array.isArray(envNoArgs.recentHistory) && !envNoArgs.learnerProfile);

// ---------------------------------------------------------------------------
// 3. getCoachMessage falls back to the local template (not a server call)
// when given a malformed/incomplete envelope. askCoach's coachClient only
// ever calls out over options.fetchImpl or the global fetch — with no
// transport available it returns null and askCoach falls back to the local
// template (see chatEngine.js askCoach/coachClient). We temporarily remove
// globalThis.fetch to prove no network call path is exercised.
// ---------------------------------------------------------------------------
const savedFetch = globalThis.fetch;
let fetchWasCalled = false;
// A poisoned fetch that would prove a call was attempted, then we delete it
// entirely to simulate "no transport available" (offline / no fetch global).
delete globalThis.fetch;

const malformedEnvelope = buildCoachEnvelope({ mastery: undefined, justHappened: 'not-an-object' });
const localTemplateText = 'Keep your hands relaxed and try that shape again.';
const resultString = await getCoachMessage(malformedEnvelope, localTemplateText);
check('getCoachMessage falls back to the string local template text', resultString.text === localTemplateText);
check('getCoachMessage reports source: template on fallback', resultString.source === 'template');

let templateFnCalled = false;
const localTemplateFn = () => { templateFnCalled = true; return 'Generic encouragement.'; };
const resultFn = await getCoachMessage(malformedEnvelope, localTemplateFn);
check('getCoachMessage accepts a zero-arg function localTemplate', resultFn.text === 'Generic encouragement.');
check('getCoachMessage actually invoked the function template on fallback', templateFnCalled);
check('getCoachMessage never called a network fetch (none was available)', !fetchWasCalled);

// getCoachMessage also returns actions, derived from buildActions() — proven
// here with no fetch available so this stays a pure/local assertion, same as
// the rest of this block.
const actionsResult = await getCoachMessage(buildCoachEnvelope({}), 'fallback text', { tuner: true });
check('getCoachMessage returns actions alongside text/source', Array.isArray(actionsResult.actions) && actionsResult.actions.length === 1 && actionsResult.actions[0].type === 'open_tuner');
const noActionsResult = await getCoachMessage(buildCoachEnvelope({}), 'fallback text');
check('getCoachMessage returns an empty actions list when no actionContext is given (backward compatible)', Array.isArray(noActionsResult.actions) && noActionsResult.actions.length === 0);

globalThis.fetch = savedFetch;

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
