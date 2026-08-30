'use strict';
/*
 * verify-step6-loops-bc.js — DONE BAR for the student-lifecycle gaps (Loop B + Loop C2).
 * Proves the three gaps from COMPLAINTS-TO-FEATURES.md are now closed:
 *   GAP 1 (Loop B): next-lesson "got it? want to review?" prompt from real struggle record.
 *   GAP 2 (Loop C2): student-asked -> targeted "that thing you asked about" follow-up.
 *   GAP 3: send path reuses the proven F6 produce+record+mute+cap pipeline (network stub by design).
 * Also asserts the C1/C2 SEPARATION (honesty line): C2 references the EXACT named chord,
 * and a generic struggle must NOT be used as a C2 message.
 * Run: node verify-step6-loops-bc.js
 */
const { PracticeStore } = require('./store/practiceStore.js');
const { send, reviewPrompt, sendLoopC2, loopC2Body } = require('./messages/messages.js');

let pass = 0, fail = 0;
function check(n, c, d) { if (c) { pass++; console.log('  OK   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); } }

console.log('STEP 6 — LOOP B + LOOP C2 DONE BAR\n');

console.log('GAP 1) Loop B: next-lesson review prompt from real struggle record');
{
  const s = new PracticeStore();
  const id = s.startSession('L02', Date.now());
  s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'pass' });
  s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' }); // Em struggling
  s.finalizeSession(id, { completed: true, durationSec: 600 });
  const rp = reviewPrompt(s);
  check('review prompt returned for a struggling chord', !!rp, 'rp=' + JSON.stringify(rp));
  check('prompt references the REAL struggling chord (Em)', rp && rp.chord === 'Em', 'chord=' + (rp && rp.chord));
  check('prompt carries a deep link to the lesson', rp && /L02/.test(rp.deepLink || ''), 'deep=' + (rp && rp.deepLink));
  check('prompt never returns for a fresh student (no struggle yet)', (() => { const f = new PracticeStore(); return reviewPrompt(f) === null; })());

  // Loop B must NOT show a review prompt for a chord the student already plays clean.
  const clean = new PracticeStore();
  const cid = clean.startSession('L01', Date.now());
  clean.logAttempt(cid, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
  clean.logAttempt(cid, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
  clean.finalizeSession(cid, { completed: true, durationSec: 300 });
  check('Loop B skips a chord that is already clean', reviewPrompt(clean) === null);
}

console.log('\nGAP 2) Loop C2: student-asked -> targeted follow-up referencing the EXACT chord');
{
  const s = new PracticeStore();
  const id = s.startSession('L05', Date.now());
  s.logAttempt(id, { chordName: 'B7', frets: [null, 2, 1, 2, 0, 2], verdict: 'fail' }); // some struggle history
  s.finalizeSession(id, { completed: true, durationSec: 500 });
  s.studentRequested('B7', Date.now()); // student asked about B7 specifically
  const pending = s.getPendingHelpRequests();
  check('student request recorded as pending', pending.length === 1 && pending[0].chordName === 'B7');
  const body = loopC2Body(s, pending[0]);
  check('C2 body references the EXACT named chord (B7)', /B7/.test(body), 'body=' + body);
  check('C2 body does NOT invent a physical diagnosis', !/buzz|muted|wrong finger|wrist/i.test(body));

  const r = sendLoopC2(s, 'messages', Date.now(), { maxPerDay: 2 });
  check('C2 send succeeds', r.sent === true, 'reason=' + r.reason);
  check('C2 send records the referenced chord', r.referencedChord === 'B7', 'ref=' + r.referencedChord);
  check('C2 marks the request as followed-up (no re-nudge)', s.getPendingHelpRequests().length === 0);
  check('C2 message carries a one-tap deep link', r.message && /lesson\/L05/.test(r.message.body) && r.message.lessonDeepLink === 'L05', 'link=' + (r.message && r.message.lessonDeepLink));
}

console.log('\nGAP 2d) Loop C2 deep link regression: asked-about chord never logged must NOT produce a broken link');
{
  // Reproduces the hostile agent's finding: student asks about Z9 (never practiced),
  // but a DIFFERENT chord (Em) is struggled. The fallback must resolve to a real Lxx,
  // never to the struggled chord's name (e.g. "lesson/Em").
  const s = new PracticeStore();
  const id = s.startSession('L02', Date.now());
  s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' }); // Em struggled, Z9 not logged
  s.finalizeSession(id, { completed: true, durationSec: 600 });
  s.studentRequested('Z9', Date.now());
  const body = loopC2Body(s, s.getPendingHelpRequests()[0]);
  check('C2 body references the EXACT asked chord (Z9)', /Z9/.test(body), 'body=' + body);
  check('C2 body deep link is a real lesson id, NOT the struggled chord name', /lesson\/L\d/i.test(body) && !/lesson\/Em\b/.test(body), 'body=' + body);
  check('C2 body does not leak the unrelated struggled chord into the link', !/Open lesson\/Em/.test(body));
}

console.log('\nGAP 2b) Loop C2 does NOT fire without a student request (separation from C1)');
{
  const s = new PracticeStore();
  const id = s.startSession('L02', Date.now());
  s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' }); // struggling, but NO ask
  s.finalizeSession(id, { completed: true, durationSec: 600 });
  const r = sendLoopC2(s, 'messages', Date.now(), { maxPerDay: 2 });
  check('C2 refuses to send when there is no student-asked request', r.sent === false && r.reason === 'no-pending-request', 'reason=' + r.reason);
}

console.log('\nGAP 2c) Loop C2 respects mute + per-day cap (shares F6 safety pipeline)');
{
  const s = new PracticeStore();
  s.studentRequested('Em', Date.now());
  s.setMute('messages', true);
  const rm = sendLoopC2(s, 'messages', Date.now(), { maxPerDay: 2 });
  check('C2 blocked when muted', rm.sent === false && rm.reason === 'muted');
  s.setMute('messages', false);
  sendLoopC2(s, 'messages', Date.now(), { maxPerDay: 1 });
  const rcap = sendLoopC2(s, 'messages', Date.now(), { maxPerDay: 1 }); // a fresh ask would be needed; here just confirm cap path exists
  // second ask + second send same day must be capped
  s.studentRequested('G', Date.now());
  const r2 = sendLoopC2(s, 'messages', Date.now(), { maxPerDay: 1 });
  check('C2 second send same day is capped (shared cap)', r2.sent === false && r2.reason === 'capped', 'reason=' + r2.reason);
}

console.log('\nGAP 3) Send path reuses F6 produce+record+mute+cap (network send stays a stub by design)');
{
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'messages', 'messages.js'), 'utf8');
  check('no network call added to messages source (Ban 5)', !/\b(fetch|XMLHttpRequest|WebSocket|http\.request|axios|twilio|nodemailer)\b/.test(src));
  check('sendLoopC2 routes through store.recordMessage (same audit trail as C1)', /store\.recordMessage/.test(src));
}

console.log('\n' + '='.repeat(60));
console.log('STEP 6 LOOP B/C2: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-6-LOOPS-BC-OK' : 'STEP 6 LOOPS BC FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
