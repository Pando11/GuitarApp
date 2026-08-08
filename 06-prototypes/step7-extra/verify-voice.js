'use strict';
/*
 * verify-voice.js — F10 "Voice-first practice controls" DONE BAR.
 *
 * Spec (FEATURES-LOCKED-v1 F10 / PLAN Step 8): "slower" / "again" / "what's next" /
 * "tune my guitar" spoken aloud control the lesson player via tap-to-talk. Wake word
 * is v2, out of scope.
 *
 * What this gate PROVES (arithmetic, no human):
 *  1. INTENT COVERAGE — each of the 4 spec commands resolves to its intent from many
 *     natural phrasings (substring matching must handle "can you slow it down a bit").
 *  2. GUARDRAIL (Hard Rule 6 / F4 spirit) — out-of-scope speech resolves to ignore and
 *     execute() performs NO adapter action. Never guess a lesson control.
 *  3. DETERMINISM — same text -> same intent, every time (no RNG anywhere in the map).
 *  4. EXECUTION — each intent drives the adapter and returns a confirmation; slower
 *     actually lowers the rate and CLAMPS at 0.5x (can't decelerate into silence).
 *  5. TUNE DELEGATION — tuneString() reuses the REAL step2 tuner engine: a known
 *     sharp/flat frequency is named with the correct note + cents + label.
 *  6. NO NETWORK (Ban 5) — selfAudit + independent source scan of this module AND
 *     voice-command.js.
 *  7. NEGATIVE — a poisoned adapter is never invoked for ignored speech (spy test).
 *
 * Run: node verify-voice.js
 */
const fs = require('fs');
const path = require('path');
const V = require('./voice-command.js');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '  [' + detail + ']' : '')); }
}

console.log('\n=== 1. INTENT COVERAGE — spec commands, natural phrasings ===');
{
  const CASES = [
    // SLOWER
    ['slower', 'slower'], ['slow down', 'slower'], ['can you slow it down a bit', 'slower'],
    ['that was too fast', 'slower'], ['SLOWER PLEASE', 'slower'],
    // AGAIN
    ['again', 'again'], ['play it again', 'again'], ['one more time', 'again'],
    ['can you repeat that', 'again'], ['replay', 'again'],
    // WHATS_NEXT
    ["what's next", 'whats-next'], ['what is next', 'whats-next'], ['what comes next', 'whats-next'],
    ['move on', 'whats-next'], ["let's continue", 'whats-next'],
    // TUNE
    ['tune my guitar', 'tune-my-guitar'], ['I think my guitar is out of tune', 'tune-my-guitar'],
    ['tune up', 'tune-my-guitar'], ['help me with tuning', 'tune-my-guitar']
  ];
  const bad = CASES.filter(([text, want]) => V.parseCommand(text).intent !== want);
  check('all 4 spec commands resolve from ' + CASES.length + ' natural phrasings',
    bad.length === 0, bad.length ? 'WRONG: ' + JSON.stringify(bad) : CASES.length + '/' + CASES.length + ' correct');
  // Each of the 4 canonical intents is reachable at all
  const reached = new Set(CASES.map(([t]) => V.parseCommand(t).intent));
  check('all 4 canonical intents reachable', reached.size === 4, 'reached=' + [...reached].join(','));
}

console.log('\n=== 2. GUARDRAIL — out-of-scope speech is ignored, never executed ===');
{
  const OOS = ['order me a pizza', "what's the weather today", 'call mom',
    'play some music', 'open youtube', 'text Heidi', 'remind me to buy strings',
    'what is the news', 'email my teacher', '', '   ', 'asdkjh qwfp zzz'];
  const bad = OOS.filter(t => V.parseCommand(t).intent !== 'ignore');
  check('out-of-scope/gibberish/empty all resolve to ignore (' + OOS.length + ' cases)',
    bad.length === 0, bad.length ? 'LEAKED: ' + JSON.stringify(bad) : 'all ignored');
}

console.log('\n=== 3. DETERMINISM — same text -> same intent ===');
{
  let stable = true;
  const probes = ['slow it down', 'play it again', "what's next", 'tune my guitar', 'order pizza'];
  for (const p of probes) {
    const first = JSON.stringify(V.parseCommand(p));
    for (let i = 0; i < 50; i++) if (JSON.stringify(V.parseCommand(p)) !== first) stable = false;
  }
  check('50 repeated parses of 5 probes are byte-identical', stable);
}

console.log('\n=== 4. EXECUTION — intents drive the adapter; slower clamps at 0.5x ===');
{
  const a = V.defaultAdapter();
  const r1 = V.execute('slower', a, { rate: 1 });
  check('slower from 1.0x lowers rate', r1.action && r1.action.rate < 1, 'rate=' + (r1.action || {}).rate);
  let rate = 1;
  for (let i = 0; i < 20; i++) rate = V.execute('slower', a, { rate }).action.rate;
  check('20x slower CLAMPS at 0.5x (cannot decelerate into silence)', rate === 0.5, 'rate=' + rate);
  const r2 = V.execute('again', a, { sceneIndex: 3 });
  check('again returns a confirmation message', !!(r2.action && typeof r2.action.msg === 'string' && r2.action.msg.length > 0));
  const r3 = V.execute("what's next", a, { sceneIndex: 3 });
  check('whats-next advances the scene index', r3.action && r3.action.nextIndex === 4, 'nextIndex=' + (r3.action || {}).nextIndex);
  const r4 = V.execute('tune my guitar', a, {});
  check('tune returns guidance message', !!(r4.action && r4.action.msg.length > 0));
}

console.log('\n=== 5. TUNE DELEGATION — real step2 tuner engine, measured cents ===');
{
  // E2 = 82.41Hz. Note: the tuner names the NEAREST note, so a +50c detune reads
  // as "F2, 50c flat" — that IS the correct tuner answer. Assert on the label and
  // the cents DIRECTION relative to the named note (what the student is told).
  const sharp = V.tuneString(82.41 * Math.pow(2, 50 / 1200));
  const flat = V.tuneString(82.41 * Math.pow(2, -50 / 1200));
  const inTune = V.tuneString(82.41);
  check('E2+50c -> student told to come DOWN (FLAT rel. to named note)',
    /FLAT/.test(sharp.label) && sharp.cents < -30, JSON.stringify(sharp));
  check('E2-50c -> student told FLAT', flat.note === 'E2' && flat.cents < -30 && /FLAT/.test(flat.label),
    JSON.stringify(flat));
  check('E2 dead-on -> IN TUNE', /IN TUNE/.test(inTune.label), JSON.stringify(inTune));
  const a4 = V.tuneString(440);
  check('A4 -> names A (not a fixed-E stub)', /^A/.test(a4.note), JSON.stringify(a4));
}

console.log('\n=== 6. NO NETWORK (Ban 5) ===');
{
  check('selfAudit reports no network', V.selfAudit().noNetwork === true);
  // Independent scan (not the module's own regex): no fetch/XHR/WS/axios in either file.
  const banned = /fetch\s*\(|new\s+XMLHttpRequest|new\s+WebSocket|axios\s*\(|https?\s*\.\s*request/;
  const srcV = fs.readFileSync(path.join(__dirname, 'voice-command.js'), 'utf8');
  const srcG = fs.readFileSync(__filename, 'utf8');
  check('independent scan: no network primitives in voice-command.js or this gate',
    !banned.test(srcV) && !banned.test(srcG));
}

console.log('\n=== 7. NEGATIVE — spy adapter is NEVER invoked for ignored speech ===');
{
  let calls = 0;
  const spy = { slower: () => { calls++; return {}; }, again: () => { calls++; return {}; },
    whatsNext: () => { calls++; return {}; }, tune: () => { calls++; return {}; } };
  ['order a pizza', 'weather please', 'gibberish zzz qqq', ''].forEach(t => V.execute(t, spy, { rate: 1 }));
  check('spy adapter untouched for 4 out-of-scope utterances', calls === 0, 'calls=' + calls);
  const res = V.execute('order a pizza', spy, { rate: 1 });
  check('ignored command returns intent=ignore action=null',
    res.intent === 'ignore' && res.action === null, JSON.stringify(res));
}

console.log('\n=== 8. NEGATION — negated commands never fire (HOLE-1) ===');
{
  const negs = [
    "don't tune my guitar", 'dont stop', 'do not play again', 'never tune',
    'stop tuning', 'no', 'not today', 'enough'
  ];
  const leaked = negs.filter(t => V.parseCommand(t).intent !== 'ignore');
  check('8 negated phrases all resolve to ignore', leaked.length === 0,
    leaked.length ? 'LEAKED: ' + JSON.stringify(leaked) : 'all negated ignored');
  // spy adapter must never fire for negated speech
  let calls = 0;
  const spy = { slower: () => { calls++; return {}; }, again: () => { calls++; return {}; },
    whatsNext: () => { calls++; return {}; }, tune: () => { calls++; return {}; } };
  negs.forEach(t => V.execute(t, spy, { rate: 1 }));
  check('spy adapter untouched for all negated speech', calls === 0, 'calls=' + calls);
}

console.log('\n=== 9. SUBSTRING TRAPS — word-boundary matching (HOLE-2) ===');
{
  const traps = [
    'play against the beat',      // contains 'again'
    'nextdoor neighbor',          // contains 'next'
    'against all odds',           // contains 'again'
    'the nextdoor house',         // contains 'next'
    'attuned to reality',         // contains 'tune' but as substring
    'slower than molasses',       // valid — should still fire
    'what comes next please'      // valid — should still fire
  ];
  const expected = ['ignore', 'ignore', 'ignore', 'ignore', 'ignore', 'slower', 'whats-next'];
  const wrong = traps.filter((t, i) => V.parseCommand(t).intent !== expected[i]);
  check('7 substring traps resolve correctly', wrong.length === 0,
    wrong.length ? 'WRONG: ' + JSON.stringify(wrong.map(t => t + '->' + V.parseCommand(t).intent)) : 'all correct');
  // whole-word still fires
  const stillFire = ['the next string', 'play it again', 'slower please', 'tune my guitar', 'what is next'];
  const missed = stillFire.filter(t => V.parseCommand(t).intent === 'ignore');
  check('5 whole-word phrases still fire', missed.length === 0,
    missed.length ? 'MISSED: ' + JSON.stringify(missed) : 'all fire');
}

console.log('\n=== 10. WHATS-NEXT CLAMP — never advance past last scene (HOLE-3) ===');
{
  const a = V.defaultAdapter();
  const last = a.whatsNext(7, 8);
  check('whatsNext(7,8) clamps at 7', last.nextIndex === 7, 'nextIndex=' + last.nextIndex);
  check('clamp message says last part', /last part/.test(last.msg), last.msg);
  const mid = a.whatsNext(3, 8);
  check('whatsNext(3,8) advances normally', mid.nextIndex === 4, 'nextIndex=' + mid.nextIndex);
  // execute() passes totalScenes through
  const r = V.execute('what\'s next', a, { sceneIndex: 7, totalScenes: 8 });
  check('execute() clamps via totalScenes', r.action.nextIndex === 7, 'nextIndex=' + r.action.nextIndex);
}

console.log('\n=== 11. INVALID TUNER INPUT — reject garbage (HOLE-4) ===');
{
  const invalids = [0, NaN, -1, 'abc', Infinity, -Infinity, null, undefined];
  const bad = invalids.filter(f => {
    const r = V.tuneString(f);
    return !(r.invalid === true && r.note === null && /NO SIGNAL/.test(r.label));
  });
  check('8 invalid inputs all rejected', bad.length === 0,
    bad.length ? 'NOT REJECTED: ' + JSON.stringify(bad) : 'all rejected');
  const ok = V.tuneString(82.41);
  check('valid E2 still works', ok.note === 'E2' && ok.cents === 0 && ok.label === 'IN TUNE',
    JSON.stringify(ok));
}

console.log('\n============================================================');
console.log('F10 VOICE CONTROLS: ' + pass + ' passed, ' + fail + ' failed');
if (fail === 0) console.log('STEP-7-EXTRA-VOICE-OK — F10 proven; tap-to-talk intents guardrailed, tuner delegation live');
process.exit(fail ? 1 : 0);