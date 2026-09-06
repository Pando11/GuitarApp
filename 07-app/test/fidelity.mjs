// fidelity.mjs — PROVES the 07-app/core ESM ports are byte-faithful to the proven
// 06-prototypes CommonJS engines. Runs identical inputs through BOTH and compares.
// This is the "re-verify, don't trust" discipline applied to the port itself.
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..', '..');
const CJS = path.join(REPO_ROOT, '06-prototypes');
const SRC = path.join(REPO_ROOT, '07-app', 'core');
const fileUrl = (p) => pathToFileURL(p).href;

// Load originals (CommonJS) via createRequire
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const O = {
  tuner: require(CJS + '/step2/engine/tuner-engine.js'),
  listening: require(CJS + '/step5/engine/listening-engine.js'),
  chord: require(CJS + '/step0/schema/chord-theory-check.js'),
  validate: require(CJS + '/step0/schema/validate.js'),
  renderer: require(CJS + '/step0/engine/renderer.js'),
  band: require(CJS + '/step7-extra/band-engine.js'),
  voice: require(CJS + '/step7-extra/voice-command.js'),
  teacher: require(CJS + '/step3/engine/teacher.js'),
  entitlement: require(CJS + '/step7/entitlementStore.js'),
  store: require(CJS + '/step6/store/practiceStore.js'),
  chat: require(CJS + '/step6/chat/chatEngine.js'),
  adaptive: require(CJS + '/step6/adaptive/adaptivePlan.js'),
  messages: require(CJS + '/step6/messages/messages.js'),
  streaks: require(CJS + '/step6/streaks/streaks.js')
};
console.error('DEBUG O keys:', Object.keys(O).map(k => k + ':' + (O[k] ? typeof O[k] : 'NULL')).join(' '));
console.error('DEBUG O.store.PracticeStore:', O.store && typeof O.store.PracticeStore);

// Load ports (ESM)
const T = await import(fileUrl(SRC + '/tuner-engine.js'));
const L = await import(fileUrl(SRC + '/listening-engine.js'));
const CH = await import(fileUrl(SRC + '/chord-theory-check.js'));
const V = await import(fileUrl(SRC + '/schema/validate.js'));
const R = await import(fileUrl(SRC + '/renderer.js'));
const B = await import(fileUrl(SRC + '/band-engine.js'));
const VO = await import(fileUrl(SRC + '/voice-command.js'));
const TE = await import(fileUrl(SRC + '/teacher.js'));
const EN = await import(fileUrl(SRC + '/entitlementStore.js'));
const ST = await import(fileUrl(SRC + '/practiceStore.js'));
const CA = await import(fileUrl(SRC + '/chatEngine.js'));

// The proven original's chat reads its drills from 05-content via
// drillSelector.loadLessons(); the ported chat is browser-safe and receives
// lessons via setLessons(). To compare them faithfully, inject the SAME source
// the original uses (the 05-content authoring directory) into the port.
try {
  const ds = require(CJS + '/step6/drillSelector.js');
  CA.setLessons(ds.loadLessons());
} catch (e) { /* non-fatal: if lessons can't load, drills simply won't serve */ }
const AD = await import(fileUrl(SRC + '/adaptivePlan.js'));
const MS = await import(fileUrl(SRC + '/messages.js'));
const SK = await import(fileUrl(SRC + '/streaks.js'));

let passed = 0, failed = 0;
function ok(name, cond, extra) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL: ' + name + (extra ? ' :: ' + extra : '')); }
}
function eq(name, a, b) {
  let same; try { same = JSON.stringify(a) === JSON.stringify(b); } catch { same = (a === b); }
  ok(name, same, 'ORIG=' + JSON.stringify(a) + ' PORT=' + JSON.stringify(b));
}

// ---- tuner ----
eq('tuner.noteFromFreq(A4)', O.tuner.noteFromFreq(440), T.noteFromFreq(440));
eq('tuner.noteFromFreq(E2)', O.tuner.noteFromFreq(82.41), T.noteFromFreq(82.41));
{ const sr = 22050; const buf = O.tuner.makeStringTone(110, sr, 0.2);
  const fO = O.tuner.autoCorrelate(buf, sr); const fT = T.autoCorrelate(buf, sr);
  ok('tuner.autoCorrelate A2', Math.abs(fO - fT) < 0.5, 'O=' + fO + ' T=' + fT); }
eq('tuner.tuneVerdict', O.tuner.tuneVerdict(110.1, 110), T.tuneVerdict(110.1, 110));

// ---- chord-theory ----
const chords = {
  Em: { name: 'E minor', frets: [0,2,2,0,0,0], fingers: [0,2,3,0,0,0] },
  A:  { name: 'A major', frets: [null,0,2,2,2,0], fingers: [null,0,1,2,3,0] },
  D:  { name: 'D major', frets: [null,null,0,2,3,2], fingers: [null,null,0,1,3,2] },
  Am: { name: 'A minor', frets: [null,0,2,2,1,0], fingers: [null,0,2,3,1,0] }
};
for (const [k, c] of Object.entries(chords)) {
  eq('chord.verifyChord ' + k, O.chord.verifyChord(k, c).ok, CH.verifyChord(k, c).ok);
  eq('chord.verifyChord errors ' + k, O.chord.verifyChord(k, c).errors, CH.verifyChord(k, c).errors);
}
// fail case: name says Am but frets are A major
{ const bad = { name: 'A minor', frets: [null,0,2,2,2,0], fingers: [null,0,1,2,3,0] };
  eq('chord.false-positive-Am-actually-Amaj', O.chord.verifyChord('X', bad).ok, CH.verifyChord('X', bad).ok); }

// ---- validate ----
const sampleLesson = {
  lesson: { id: 'L01', title: 'T', level: 'absolute-beginner', lesson_type: 'technique', objectives: ['x'], estimated_minutes: 10 },
  chords: { C: { name: 'C major', frets: [null,3,2,0,1,0], fingers: [null,3,2,0,1,0], qa_status: 'verified-standard' } },
  exercises: [{ id: 'e1', name: 'n', purpose: 'p', params: {}, coaching: 'c', qa_status: 'verified-standard' }],
  avatar_coaching_copy: { intro: 'i' },
  qa_block: { must_verify: ['a'] }
};
eq('validate.valid', O.validate.validateLesson(sampleLesson).valid, V.validateLesson(sampleLesson).valid);

// ---- renderer ----
{ const mO = O.renderer.buildManifest(sampleLesson); const mT = R.buildManifest(sampleLesson);
  eq('renderer.manifest scenes', mO.scenes.length, mT.scenes.length);
  eq('renderer.manifest total', mO.totalDurationMs, mT.totalDurationMs);
  eq('renderer.chordSVG', O.renderer.chordSVG(chords.Em), R.chordSVG(chords.Em)); }

// ---- listening ----
{ const sr = 22050;
  const em = [0,2,2,0,0,0];
  const good = O.listening.makeChordTone(em, sr, 0.4, 0.5);
  const bad = O.listening.makeChordTone([null,0,2,2,2,0], sr, 0.4, 0.5); // A major
  const quiet = new Float32Array(Math.floor(sr * 0.4));
  const vOg = O.listening.verifyChord(good, sr, em); const vTg = L.verifyChord(good, sr, em);
  eq('listening.pass-verdict', vOg.verdict, vTg.verdict);
  const vOb = O.listening.verifyChord(bad, sr, em); const vTb = L.verifyChord(bad, sr, em);
  eq('listening.wrong-fail', vOb.verdict, vTb.verdict);
  const vOq = O.listening.verifyChord(quiet, sr, em); const vTq = L.verifyChord(quiet, sr, em);
  eq('listening.quiet-unsure', vOq.verdict, vTq.verdict); }

// ---- band ----
{ const opts = { chordCycle: ['Em','A'], chords: { Em: { frets: [0,2,2,0,0,0] }, A: { frets: [null,0,2,2,2,0] } }, bpm: 80, beats: 4, seed: 1, bars: 2 };
  const bO = O.band.buildBand(opts); const bT = B.buildBand(opts);
  eq('band.determinism-hash', O.band.bufferHash(bO.buffer), B.bufferHash(bT.buffer));
  eq('band.duration', bO.durationSec, bT.durationSec);
  // bass pitch: window 0..0.3s at bar 0 should contain root E (82.41)
  const vO = O.band.verifyStemPitch(bO.buffer, 82.41, { t0: 0 }); const vT = B.verifyStemPitch(bT.buffer, 82.41, { t0: 0 });
  eq('band.bass-E2-ok', vO.ok, vT.ok); }

// ---- voice ----
const phrases = ['slower', 'play it again', "what's next", 'tune my guitar', 'order a pizza', "don't tune", 'weather today'];
for (const p of phrases) eq('voice.parseCommand ' + p, O.voice.parseCommand(p).intent, VO.parseCommand(p).intent);
{ const ex = O.voice.execute('slower', O.voice.defaultAdapter(), { rate: 1, sceneIndex: 3, totalScenes: 20 });
  const tx = VO.execute('slower', VO.defaultAdapter(), { rate: 1, sceneIndex: 3, totalScenes: 20 });
  eq('voice.execute.slower.rate', ex.action.rate, tx.action.rate); }

// ---- teacher (cosmetic-only invariant) ----
{ const mkT = (id) => ({ id, codename: 'c'+id, name: 'N'+id, tagline: 't', teaching_style: 'x'.repeat(130),
    persona: { summary: 's', tone: 't' }, voice: { provider: 'p', voice_id: 'v', style: 's' },
    skin: { palette: { primary: '#000' } }, handoff_line: 'h',
    persona_lines: { intro: 'i', chord: 'c', exercise: 'e', wrap: 'w' } });
  const mO = O.renderer.buildManifest(sampleLesson); const mT = R.buildManifest(sampleLesson);
  const tO = mkT('T1'), t1 = mkT('T1'), t2 = mkT('T2');
  const aO1 = O.teacher.applyTeacher(mO, tO); const aT1 = TE.applyTeacher(mT, t1);
  const aO2 = O.teacher.applyTeacher(mO, mkT('T2')); const aT2 = TE.applyTeacher(mT, t2);
  eq('teacher.content-projection T1 vs port', JSON.stringify(O.teacher.lessonContentProjection(aO1)), JSON.stringify(TE.lessonContentProjection(aT1)));
  eq('teacher.content-projection identical across teachers (orig)', JSON.stringify(O.teacher.lessonContentProjection(aO1)), JSON.stringify(O.teacher.lessonContentProjection(aO2)));
  eq('teacher.content-projection identical across teachers (port)', JSON.stringify(TE.lessonContentProjection(aT1)), JSON.stringify(TE.lessonContentProjection(aT2))); }

// ---- entitlement (strict free) ----
{ const eO = new O.entitlement.EntitlementStore({}); const eT = new EN.EntitlementStore({});
  eq('ent.tuner-free', eO.canAccessFeature('tuner'), eT.canAccessFeature('tuner'));
  eq('ent.chat-premium', eO.canAccessFeature('chat'), eT.canAccessFeature('chat'));
  eq('ent.L01-free', eO.canAccessLesson('L01'), eT.canAccessLesson('L01'));
  eq('ent.L02-paywalled', eO.canAccessLesson('L02'), eT.canAccessLesson('L02'));
  eO.activatePurchase('ios'); eT.activatePurchase('ios');
  eq('ent.after-purchase-L02', eO.canAccessLesson('L02'), eT.canAccessLesson('L02')); }

// ---- practiceStore + F4/F5/F6/F11 ----
{ const mk = (StoreMod) => { const s = new StoreMod.PracticeStore({});
    const id = s.startSession('L03'); s.logAttempt(id, { chordName: 'Em', frets: [0,2,2,0,0,0], verdict: 'fail' });
    s.logAttempt(id, { chordName: 'Em', frets: [0,2,2,0,0,0], verdict: 'fail' });
    s.finalizeSession(id, { completed: true, durationSec: 600 });
    return s; };
  const sO = mk(O.store), sT = mk(ST);
  eq('store.skillmap-struggling', sO.getStruggledChords(), sT.getStruggledChords());
  eq('store.streak', sO.currentStreak(), sT.currentStreak());
  eq('store.completedLessonCount', sO.completedLessonCount(), sT.completedLessonCount());
  eq('store.minutes', sO.practiceMinutesTotal(), sT.practiceMinutesTotal());
  eq('chat.reply', O.chat.reply(sO, 'T1', 'how is my Em').text, CA.reply(sT, 'T1', 'how is my Em').text);
  eq('chat.offtopic', O.chat.reply(sO, 'T1', 'what stock should I buy').offTopic, CA.reply(sT, 'T1', 'what stock should I buy').offTopic);
  eq('adaptive.openedWithDrill', O.adaptive.buildTomorrowPlan(sO).openedWithDrill, AD.buildTomorrowPlan(sT).openedWithDrill);
  eq('messages.factBody', O.messages.factBody(sO), MS.factBody(sT));
  eq('streaks.readout-streak', O.streaks.readout(sO).currentStreak, SK.readout(sT).currentStreak); }

// ---- Wave 1 task A: fluencyStore / oneMinuteChanges / pairKey / listenerReal ----
// These prototype files are already ESM (export function/export const), so both
// sides are loaded with dynamic import() -- NOT require() (require() above is
// only for the older CommonJS 06-prototypes/stepN originals).
const PE = path.join(REPO_ROOT, '06-prototypes', 'practice-engine');
const OPK = await import(fileUrl(PE + '/pair-key.mjs'));
const PPK = await import(fileUrl(SRC + '/pairKey.js'));
const OMC = await import(fileUrl(PE + '/one-minute-changes.mjs'));
const PMC = await import(fileUrl(SRC + '/oneMinuteChanges.js'));
const OFS = await import(fileUrl(PE + '/fluency-store.mjs'));
const PFS = await import(fileUrl(SRC + '/fluencyStore.js'));
const OLR = await import(fileUrl(PE + '/listener-real.mjs'));
const PLR = await import(fileUrl(SRC + '/listenerReal.js'));

// ---- pairKey: normalization (C<->Em == Em<->C, and easyC collapses onto C) ----
eq('pairKey.normalize-order-C-Em', OPK.pairKey('C', 'Em'), PPK.pairKey('C', 'Em'));
eq('pairKey.normalize-order-Em-C-matches', OPK.pairKey('Em', 'C'), OPK.pairKey('C', 'Em'));
eq('pairKey.port-normalize-order-Em-C-matches', PPK.pairKey('Em', 'C'), PPK.pairKey('C', 'Em'));
eq('pairKey.easyC-collapses-onto-C', OPK.pairKey('easyC', 'Em'), OPK.pairKey('C', 'Em'));
eq('pairKey.port-easyC-collapses-onto-C', PPK.pairKey('easyC', 'Em'), PPK.pairKey('C', 'Em'));
eq('pairKey.orig-vs-port', OPK.pairKey('Em', 'C'), PPK.pairKey('Em', 'C'));

// ---- oneMinuteChanges: 30/min and 60/min measureOneMinute cases ----
{
  const mkEvents = (chords) => chords.map((c, i) => ({ chord: c, confident: true, t: i * 1000 }));
  // 30 clean alternating changes in 60s -> ratePerMin 30
  const events30 = mkEvents(Array.from({ length: 31 }, (_, i) => (i % 2 === 0 ? 'Em' : 'C')));
  const oR30 = OMC.measureOneMinute(['Em', 'C'], events30, 1.0);
  const pR30 = PMC.measureOneMinute(['Em', 'C'], events30, 1.0);
  eq('oneMinuteChanges.30-per-min.ratePerMin', oR30.ratePerMin, pR30.ratePerMin);
  eq('oneMinuteChanges.30-per-min.advance', oR30.advance, pR30.advance);
  eq('oneMinuteChanges.30-per-min.goal', oR30.goal, pR30.goal);
  // 60 clean alternating changes in 60s -> ratePerMin 60 (goal met)
  const events60 = mkEvents(Array.from({ length: 61 }, (_, i) => (i % 2 === 0 ? 'Em' : 'C')));
  const oR60 = OMC.measureOneMinute(['Em', 'C'], events60, 1.0);
  const pR60 = PMC.measureOneMinute(['Em', 'C'], events60, 1.0);
  eq('oneMinuteChanges.60-per-min.ratePerMin', oR60.ratePerMin, pR60.ratePerMin);
  eq('oneMinuteChanges.60-per-min.goal', oR60.goal, pR60.goal);
}

// ---- listenerReal: classifyStrum confident vs not-confident ----
{
  const pairPcs = { tokenA: 'Em', pcsA: OLR.chordPitchClasses('Em'), tokenB: 'C', pcsB: OLR.chordPitchClasses('C') };
  const pairPcsP = { tokenA: 'Em', pcsA: PLR.chordPitchClasses('Em'), tokenB: 'C', pcsB: PLR.chordPitchClasses('C') };
  // Confident case: strong, unambiguous energy on Em's pitch classes only.
  const confidentAcc = new Map([[4, 10], [7, 10], [11, 10]]); // E, G, B
  const oConfident = OLR.classifyStrum(confidentAcc, pairPcs);
  const pConfident = PLR.classifyStrum(confidentAcc, pairPcsP);
  eq('listenerReal.classifyStrum-confident.chord', oConfident.chord, pConfident.chord);
  eq('listenerReal.classifyStrum-confident.confident', oConfident.confident, pConfident.confident);
  ok('listenerReal.classifyStrum-confident.is-true', pConfident.confident === true);
  // Not-confident case: empty/ambiguous energy -> no target dominance.
  const noisyAcc = new Map([[1, 5], [6, 5]]); // neither chord's pitch classes
  const oNoisy = OLR.classifyStrum(noisyAcc, pairPcs);
  const pNoisy = PLR.classifyStrum(noisyAcc, pairPcsP);
  eq('listenerReal.classifyStrum-not-confident.chord', oNoisy.chord, pNoisy.chord);
  eq('listenerReal.classifyStrum-not-confident.confident', oNoisy.confident, pNoisy.confident);
  ok('listenerReal.classifyStrum-not-confident.is-false', pNoisy.confident === false);
}

// ---- fluencyStore: record + spacing-effect decay (tau=3 days) ----
{
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  let clockO = 1000000, clockP = 1000000;
  const oStore = OFS.createFluencyStore({ knownPairs: [['Em', 'C']], now: () => clockO });
  const pStore = PFS.createFluencyStore({ knownPairs: [['Em', 'C']], now: () => clockP });
  oStore.record(['Em', 'C'], { ratePerMin: 60 }, clockO);
  pStore.record(['Em', 'C'], { ratePerMin: 60 }, clockP);
  clockO += 3 * ONE_DAY_MS; clockP += 3 * ONE_DAY_MS;
  const oDecayed = oStore.selectWeakest(1, clockO);
  const pDecayed = pStore.selectWeakest(1, clockP);
  eq('fluencyStore.decay-after-3-days.fluency', oDecayed[0].fluency, pDecayed[0].fluency);
  eq('fluencyStore.decay-after-3-days.pair', oDecayed[0].pair, pDecayed[0].pair);
  ok('fluencyStore.decay-below-initial', pDecayed[0].fluency < 1 && pDecayed[0].fluency > 0);
}

// ---- Wave 2 task D: practiceLoop / reviewScheduler ----
const OPL = await import(fileUrl(PE + '/practice-loop.mjs'));
const PPL = await import(fileUrl(SRC + '/practiceLoop.js'));
const ORS = await import(fileUrl(PE + '/review-scheduler.mjs'));
const PRS = await import(fileUrl(SRC + '/reviewScheduler.js'));

// ---- practiceLoop: measureLessonPair + buildReviewSession ----
{
  const simulateFn = (X, old) => {
    // 40 clean alternating changes across 60s -> ratePerMin 40.
    const chords = Array.from({ length: 41 }, (_, i) => (i % 2 === 0 ? X : old));
    return chords.map((c, i) => ({ chord: c, confident: true, t: i * 1500 }));
  };
  const oLoop = OPL.createPracticeLoop({ knownPairs: [], K: 3, now: () => 1000000 });
  const pLoop = PPL.createPracticeLoop({ knownPairs: [], K: 3, now: () => 1000000 });
  const oM = oLoop.measureLessonPair('C', ['Em', 'A'], simulateFn);
  const pM = pLoop.measureLessonPair('C', ['Em', 'A'], simulateFn);
  eq('practiceLoop.measureLessonPair.weakest-pair', oM.weakest.pair, pM.weakest.pair);
  eq('practiceLoop.measureLessonPair.weakest-ratePerMin', oM.weakest.ratePerMin, pM.weakest.ratePerMin);
  const oR = oLoop.buildReviewSession();
  const pR = pLoop.buildReviewSession();
  eq('practiceLoop.buildReviewSession.pairs', oR.pairs, pR.pairs);
  eq('practiceLoop.buildReviewSession.fluencies', oR.fluencies, pR.fluencies);
}

// ---- reviewScheduler: pairNeedsReview + computeReviewState ----
{
  const nowMs = 10_000_000;
  const snapshot = [
    { pair: 'C::Em', fluency: 0.9, samples: 5, lastPracticed: nowMs - 1000 },
    { pair: 'A::D', fluency: 0.2, samples: 3, lastPracticed: nowMs - 1000 },
    { pair: 'G::C', fluency: 0.8, samples: 0, lastPracticed: null },
  ];
  for (const p of snapshot) {
    const oN = ORS.pairNeedsReview(p, nowMs);
    const pN = PRS.pairNeedsReview(p, nowMs);
    eq('reviewScheduler.pairNeedsReview.' + p.pair + '.review', oN.review, pN.review);
    eq('reviewScheduler.pairNeedsReview.' + p.pair + '.reason', oN.reason, pN.reason);
  }
  const oState = ORS.computeReviewState(snapshot, nowMs);
  const pState = PRS.computeReviewState(snapshot, nowMs);
  eq('reviewScheduler.computeReviewState.needsReview', oState.needsReview, pState.needsReview);
  eq('reviewScheduler.computeReviewState.topK', oState.topK, pState.topK);
  eq('reviewScheduler.computeReviewState.level', oState.level, pState.level);
  eq('reviewScheduler.computeReviewState.message', oState.message, pState.message);
  eq('reviewScheduler.computeStreak', ORS.computeStreak(snapshot, nowMs), PRS.computeStreak(snapshot, nowMs));
  eq('reviewScheduler.comebackNudge', ORS.comebackNudge(5, 1), PRS.comebackNudge(5, 1));
}

console.log('\nFIDELITY GATE: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
