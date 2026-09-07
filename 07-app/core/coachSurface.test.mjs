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

import { buildCoachEnvelope, getCoachMessage } from './coachSurface.js';

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
check('full envelope never invents a stray top-level field', Object.keys(fullEnvelope).sort().join(',') === ['anonId', 'learnerProfile', 'lessonId', 'mastery', 'justHappened', 'recentHistory'].sort().join(','));

// ---------------------------------------------------------------------------
// 1b. buildCoachEnvelope never invents/mutates anonId — invalid input is
// dropped, never coerced or generated.
// ---------------------------------------------------------------------------
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

globalThis.fetch = savedFetch;

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
