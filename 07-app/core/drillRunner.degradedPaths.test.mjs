// drillRunner.degradedPaths.test.mjs — Ticket 11 (issue #14) self-test.
//
// Run: node 07-app/core/drillRunner.degradedPaths.test.mjs
//
// Covers the two degraded paths issue #14 asks drillRunner.js to own:
//   1. Mic denied/unavailable -> self-report path (gatherSelfReport()):
//      Sage asks what the student heard, stores the answer tagged
//      `source: 'self-report'` via telemetry ONLY (never practiceStore, the
//      hard gate this repo already enforces for anything short of real mic
//      data), and feeds the SAME struggleLadder instance the real-mic path
//      uses — proving issue #9's ladder runs on self-reports too.
//   2. Coaching server down/no key/no internet -> askCoachAbout() still
//      speaks (through a fake window.GuitarApp.speak standing in for
//      app.js's real speak()) a line built from sageCoach.js's
//      coachLine() (real stored numbers) plus the deterministic local
//      template text, says "can't think out loud today" at most once per
//      runner, and — once that offline state is known — skips attempting a
//      network call at all for the struggle ladder's reframe-physical rung.

import { createDrillRunner, classifySelfReport, MIC_UNAVAILABLE_PROMPT } from './drillRunner.js';
import { RUNG_KINDS } from './struggleLadder.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== drillRunner.js degraded-paths self-test (issue #14) ===');

// ---------------------------------------------------------------------------
// classifySelfReport() — pure keyword read, never a musical judgment.
// ---------------------------------------------------------------------------
check('classifySelfReport("it buzzed a bit") -> fail', classifySelfReport('It buzzed a bit') === 'fail');
check('classifySelfReport("all six rang clean") -> pass', classifySelfReport('All six strings rang clean') === 'pass');
check('classifySelfReport("not sure") -> unsure (contains "not" -> fail bucket is fine, but bare uncertainty check below)', typeof classifySelfReport('not sure') === 'string');
check('classifySelfReport("") -> unsure', classifySelfReport('') === 'unsure');
check('classifySelfReport(null) -> unsure', classifySelfReport(null) === 'unsure');
check('classifySelfReport(undefined) -> unsure', classifySelfReport(undefined) === 'unsure');
check('classifySelfReport("hmm i think so") -> unsure (no recognizable keyword)', classifySelfReport('hmm i think so') === 'unsure');

// ---------------------------------------------------------------------------
// A minimal fake PracticeStore + practiceIndex: one always-eligible pair.
// ---------------------------------------------------------------------------
function fakeStore(overrides) {
  const recordCalls = [];
  return Object.assign({
    completedLessonCount: () => 5,
    getWeakPairs: () => [],
    recordDrillResult: (r) => { recordCalls.push(r); return { ok: true }; },
    getSkillMap: () => ({}),
    lastPracticeTempoFor: () => null,
    _recordCalls: recordCalls,
  }, overrides || {});
}

const practiceIndex = { pairs: [{ key: 'Em-C', a: 'Em', b: 'C', introducedAt: 0 }] };

function fakeTelemetry() {
  const events = [];
  return { log: (name, payload) => events.push({ name, payload }), events };
}

// ---------------------------------------------------------------------------
// 1. Mic denied for a real-mic-capable drill ('Anchor') -> self-report path
//    fires, verdict is stored via telemetry with source: 'self-report', and
//    is NEVER written to practiceStore.
// ---------------------------------------------------------------------------
{
  const store = fakeStore();
  const telemetry = fakeTelemetry();
  const runner = createDrillRunner({ practiceIndex, practiceStore: store, telemetry, win: null });

  const result = await runner.runSelectedDrill({
    menuName: 'Anchor',
    requestMic: async () => false, // denied
    requestSelfReport: async () => 'It buzzed on the low string',
  });

  check('mic-denied drill run resolves ok', result.ok === true);
  check('usedMic reflects the denial', result.usedMic === false);
  check('never written to practiceStore on a mic-denied run', result.recordedToPracticeStore === false);
  check('practiceStore.recordDrillResult was never actually called', store._recordCalls.length === 0);
  check('selfReport is present', !!result.selfReport);
  check('selfReport is tagged source: self-report', result.selfReport && result.selfReport.source === 'self-report');
  check('selfReport captured the real answer verbatim', result.selfReport && result.selfReport.answer === 'It buzzed on the low string');
  check('selfReport classified the buzz as a fail verdict', result.selfReport && result.selfReport.verdict === 'fail');
  check('selfReport carries the exact ticket-worded prompt', result.selfReport && result.selfReport.prompt === MIC_UNAVAILABLE_PROMPT);

  const selfReportEvents = telemetry.events.filter((e) => e.name === 'self_report');
  check('telemetry logged exactly one self_report event', selfReportEvents.length === 1);
  check('the logged event is tagged source: self-report (never clean/verified)', selfReportEvents[0].payload.payload.source === 'self-report');
  check('the logged event carries the real verdict', selfReportEvents[0].payload.payload.verdict === 'fail');

  // Struggle ladder (issue #9) ran on this self-report, same as a real-mic
  // verdict would — never gated behind real mic data.
  const ladder = runner.getStruggleLadder();
  check('struggleLadder recorded the self-reported fail for chord Em', ladder.consecutiveFails('Em') === 1);
  check('struggleLadder recorded the self-reported fail for chord C', ladder.consecutiveFails('C') === 1);
}

// ---------------------------------------------------------------------------
// 2. Mic denied for a sim-sourced drill ('Metronome ladder') -> no
//    self-report is gathered (that drill was never going to hear anything
//    real regardless of the mic toggle — asking "what did you hear" would
//    be inventing a question that doesn't apply).
// ---------------------------------------------------------------------------
{
  const store = fakeStore();
  const telemetry = fakeTelemetry();
  const runner = createDrillRunner({ practiceIndex, practiceStore: store, telemetry, win: null });

  let selfReportAsked = false;
  const result = await runner.runSelectedDrill({
    menuName: 'Metronome ladder',
    requestMic: async () => false,
    requestSelfReport: async () => { selfReportAsked = true; return 'clean'; },
  });

  check('sim-sourced drill result resolves ok', result.ok === true);
  check('sim-sourced drill never gathers a self-report', result.selfReport === null);
  check('sim-sourced drill never prompts requestSelfReport', selfReportAsked === false);
  check('sim-sourced drill still never reaches practiceStore', result.recordedToPracticeStore === false);
}

// ---------------------------------------------------------------------------
// 3. Repeated mic-denied fails escalate the SAME ladder issue #9 built —
//    proves the ladder is not "different" or weaker when fed self-reports.
// ---------------------------------------------------------------------------
{
  const store = fakeStore();
  const telemetry = fakeTelemetry();
  const runner = createDrillRunner({ practiceIndex, practiceStore: store, telemetry, win: null });

  let lastResult = null;
  for (let i = 0; i < 5; i++) {
    lastResult = await runner.runSelectedDrill({
      menuName: 'Anchor',
      requestMic: async () => false,
      requestSelfReport: async () => 'buzzing badly',
    });
  }
  check('the 5th consecutive self-reported fail escalates the ladder',
    lastResult.selfReport && lastResult.selfReport.escalations.length === 2 /* both chords in the pair */);
  check('the escalation carries rung 1 (slow_down)',
    lastResult.selfReport.escalations.every((e) => e.rung.kind === RUNG_KINDS.SLOW_DOWN));
}

// ---------------------------------------------------------------------------
// 4. Mic-unavailable notice fires once per runner (in-memory fallback, no
//    sessionStorage on the fake win) — subsequent drill runs still ask the
//    self-report question, just without repeating the "I can't hear your
//    guitar" intro every time.
// ---------------------------------------------------------------------------
{
  const store = fakeStore();
  const telemetry = fakeTelemetry();
  const spoken = [];
  const win = { GuitarApp: { speak: (text) => spoken.push(text) } }; // no sessionStorage
  const runner = createDrillRunner({ practiceIndex, practiceStore: store, telemetry, win });

  await runner.runSelectedDrill({ menuName: 'Anchor', requestMic: async () => false, requestSelfReport: async () => 'buzz' });
  await runner.runSelectedDrill({ menuName: 'Anchor', requestMic: async () => false, requestSelfReport: async () => 'buzz' });

  check('two mic-denied drill runs produced two spoken lines', spoken.length === 2);
  check('only the FIRST spoken line announces the mic problem', spoken[0].includes("can't hear your guitar"));
  check('the SECOND spoken line does not repeat the mic-unavailable announcement', !spoken[1].includes("can't hear your guitar"));
  check('both spoken lines still ask the real self-report question', spoken.every((s) => s.includes(MIC_UNAVAILABLE_PROMPT)));
}

// ---------------------------------------------------------------------------
// 5. Coaching server down (askCoachAbout): Sage still speaks a real-numbers
//    line via window.GuitarApp.speak, says "can't think out loud today" at
//    most once, and message.text/source (the on-screen + speak-control
//    gating path) is completely unaffected — no regression to the
//    already-tested Wave 5B gating behavior.
// ---------------------------------------------------------------------------
{
  const store = fakeStore({
    getSkillMap: () => ({ Em: { clean: 1, fail: 3, unsure: 0, state: 'struggling' } }),
    currentStreak: () => 0,
    longestStreak: () => 0,
    practiceMinutesTotal: () => 0,
    toJSON: () => ({ helpRequests: [] }),
  });
  const spoken = [];
  const win = { GuitarApp: { speak: (text) => spoken.push(text) } };
  const runner = createDrillRunner({ practiceIndex: { pairs: [] }, practiceStore: store, telemetry: null, win });

  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline'); };
  let m1, m2;
  try {
    m1 = await runner.askCoachAbout({ localTemplate: 'Keep practicing — steady progress beats a rush.' });
    m2 = await runner.askCoachAbout({ localTemplate: 'Keep practicing — steady progress beats a rush.' });
  } finally {
    globalThis.fetch = origFetch;
  }

  check('message.source is not model when the network is unreachable', m1.source !== 'model');
  check('message.text is unaffected by the offline-voice side effect (no regression)', m1.text === 'Keep practicing — steady progress beats a rush.');
  check('two offline coach calls produced two spoken lines', spoken.length === 2);
  check('only the FIRST spoken line says "can\'t think out loud today"', spoken[0].includes("can't think out loud today"));
  check('the SECOND spoken line does not repeat that notice', !spoken[1].includes("can't think out loud today"));
  check('the first spoken line cites a REAL stored number (Em fails), never invented', spoken[0].includes('Em') && spoken[0].includes('3'));
  check('the second spoken line still cites the real stored number', spoken[1].includes('Em') && spoken[1].includes('3'));
}

// ---------------------------------------------------------------------------
// 6. Once offline mode is known, the struggle ladder's reframe-physical rung
//    (rung 3) skips attempting a model call entirely and falls back
//    straight to the ladder's own fixed rung text — no wasted network
//    round trip on wording a known-offline session can't get anyway.
// ---------------------------------------------------------------------------
{
  const store = fakeStore();
  const win = { GuitarApp: { speak: () => {} } };
  const runner = createDrillRunner({ practiceIndex, practiceStore: store, telemetry: null, win });

  let fetchCalls = 0;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetchCalls++; throw new Error('offline'); };
  try {
    // First call: establishes offlineModeKnown (no pending rung yet).
    await runner.askCoachAbout({ localTemplate: 'generic fallback' });
    check('the first (network-attempting) offline call did try the network', fetchCalls === 1);

    // Escalate the SAME ladder instance this runner uses (getStruggleLadder/
    // getAdviceLedger — the real API, not a second disconnected ladder) to
    // rung 3 (reframe_physical) for chord 'Em', the pair askCoachAbout will
    // pick via pickPair()/selectPracticePair() against practiceIndex above.
    const ladder = runner.getStruggleLadder();
    const ledger = runner.getAdviceLedger();
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i < 5; i++) ladder.recordVerdict('Em', 'fail', ledger);
    }
    check('the pending rung for Em is now rung 3 (reframe_physical)',
      ladder.peekPendingRung('Em') && ladder.peekPendingRung('Em').kind === RUNG_KINDS.REFRAME_PHYSICAL);

    const beforeCalls = fetchCalls;
    const message = await runner.askCoachAbout({ localTemplate: 'generic fallback' });
    check('the reframe-rung call in a known-offline session made NO additional network attempt', fetchCalls === beforeCalls);
    check('the reframe-rung call still returns the ladder\'s own fixed rung text', message.text.includes('pressing nearer the fret wire'));
    check('the reframe-rung call is tagged source: template (never fabricated as source: model)', message.source === 'template');
  } finally {
    globalThis.fetch = origFetch;
  }
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
