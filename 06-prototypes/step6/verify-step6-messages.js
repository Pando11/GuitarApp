'use strict';
/*
 * verify-step6-messages.js — DONE BAR for F6 encouraging messages (Step 6).
 * Proves: a message cites something TRUE from practice data, carries a one-tap
 * deep link into the exact lesson, the per-day frequency cap is enforced, and
 * one-tap mute blocks the send (Ban 6: real data only).
 * Run: node verify-step6-messages.js
 */
const { PracticeStore } = require('./store/practiceStore.js');
const { send, factBody, withinCap } = require('./messages/messages.js');

let pass = 0, fail = 0;
function check(n, c, d) { if (c) { pass++; console.log('  OK   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); } }

console.log('STEP 6 — F6 MESSAGES DONE BAR\n');

console.log('1) Message cites a TRUE fact + one-tap deep link');
const s = new PracticeStore();
const id = s.startSession('L02', Date.now());
s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'pass' });
s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' }); // Em struggling
s.finalizeSession(id, { completed: true, durationSec: 600 });
const r = send(s, 'messages', { maxPerDay: 2 });
check('message sent (not muted/capped)', r.sent === true, 'reason=' + r.reason);
check('body cites the REAL struggling chord (Em)', /Em/.test(r.message.body), 'body=' + r.message.body);
check('body contains a one-tap deep link into the exact lesson', /lesson\/L02/.test(r.message.body) && r.message.lessonDeepLink === 'L02', 'link=' + r.message.lessonDeepLink);
check('body does NOT invent a false fact about an untried chord', !/your G is/.test(r.message.body));

console.log('\n2) Frequency cap enforced per day');
const s2 = new PracticeStore();
const id2 = s2.startSession('L01', Date.now());
s2.logAttempt(id2, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s2.logAttempt(id2, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s2.finalizeSession(id2, { completed: true, durationSec: 300 });
send(s2, 'messages', { maxPerDay: 2 });
const r2 = send(s2, 'messages', { maxPerDay: 2 });
const r3 = send(s2, 'messages', { maxPerDay: 2 });
check('first two sends succeed', r2.sent === true || r2.sent === true);
check('third send same day is CAPPED', r3.sent === false && r3.reason === 'capped', 'reason=' + r3.reason);
check('withinCap helper reports false at cap', withinCap(s2, 'messages', 2) === false);

console.log('\n3) One-tap mute blocks the send');
const s3 = new PracticeStore();
const id3 = s3.startSession('L01', Date.now());
s3.logAttempt(id3, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s3.logAttempt(id3, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s3.finalizeSession(id3, { completed: true, durationSec: 300 });
s3.setMute('messages', true);
const rm = send(s3, 'messages', { maxPerDay: 2 });
check('muted channel returns sent=false', rm.sent === false && rm.reason === 'muted');
check('muted channel adds nothing to the log', s3.messageCountSince(Date.now() - 1000) === 0);
s3.setMute('messages', false);
const runmuted = send(s3, 'messages', { maxPerDay: 2 });
check('unmuting restores sends', runmuted.sent === true);

console.log('\n3b) Frequency cap is PER-CHANNEL (D3 fix)');
const s3b = new PracticeStore();
const id3b = s3b.startSession('L01', Date.now());
s3b.logAttempt(id3b, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s3b.logAttempt(id3b, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s3b.finalizeSession(id3b, { completed: true, durationSec: 300 });
const cap1 = send(s3b, 'messages', { maxPerDay: 1 });   // uses the only slot for 'messages'
check('messages send consumes its own channel slot', cap1.sent === true);
const capSms = send(s3b, 'sms', { maxPerDay: 1 });       // a DIFFERENT channel must not be capped
check('sms channel is NOT capped by messages-channel usage', capSms.sent === true && capSms.reason !== 'capped', 'reason=' + capSms.reason);
const cap2 = send(s3b, 'messages', { maxPerDay: 1 });    // second messages send same day -> capped
check('second messages-channel send same day IS capped', cap2.sent === false && cap2.reason === 'capped');

console.log('\n3c) Ban 6 — message must NOT invent a physical diagnosis (D1 fix)');
const sStruggle = new PracticeStore();
const idS = sStruggle.startSession('L02', Date.now());
sStruggle.logAttempt(idS, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'pass' });
sStruggle.logAttempt(idS, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' });
sStruggle.finalizeSession(idS, { completed: true, durationSec: 600 });
const fbD1 = factBody(sStruggle);
check('factBody cites real struggling chord, no invented cause', /Em/.test(fbD1) && !/buzz|muted|wrong finger|press closer|behind the fret|your (em|c|g|d) is (too|not).*(buzz|finger)/i.test(fbD1), 'fb=' + fbD1);

console.log('\n4) BAN 6 — factBody only uses real keys');
const fb = factBody(s);
check('factBody references a real chord or real stat', /Em|clean|minutes|day|streak/i.test(fb), 'fb=' + fb);

console.log('\n5) BAN 5 — no network in messages source');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'messages', 'messages.js'), 'utf8');
check('no fetch/XHR/WebSocket/http in messages source', !/\b(fetch|XMLHttpRequest|WebSocket|http\.request|axios)\b/.test(src));

console.log('\n' + '='.repeat(60));
console.log('STEP 6 F6 MESSAGES: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-6-F6-OK' : 'STEP 6 F6 FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
