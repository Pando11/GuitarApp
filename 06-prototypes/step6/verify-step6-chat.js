'use strict';
/*
 * verify-step6-chat.js — DONE BAR for F4 teacher chat (Step 6).
 * Proves: persona-scoped replies, Ban 6 (cites real store keys only),
 * off-topic canned redirect (hard rule), no network.
 * Run: node verify-step6-chat.js
 */
const { PracticeStore } = require('./store/practiceStore.js');
const { reply, isOnTopic } = require('./chat/chatEngine.js');

let pass = 0, fail = 0;
function check(n, c, d) { if (c) { pass++; console.log('  OK   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); } }

// Seed: Em struggling, C clean.
function seed() {
  const s = new PracticeStore();
  const id = s.startSession('L02', Date.now());
  s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'pass' });
  s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' });
  s.logAttempt(id, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
  s.logAttempt(id, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
  s.finalizeSession(id, { completed: true, durationSec: 600 });
  return s;
}

console.log('STEP 6 — F4 CHAT DONE BAR\n');

console.log('1) PERSONA scoping');
const s = seed();
const r1 = reply(s, 'T1', 'why does my Em buzz?');
check('T1 reply is in Maggie Cole persona', r1.persona === 'Maggie Cole', 'got ' + r1.persona);
const r3 = reply(s, 'T3', 'why does my Em buzz?');
check('T3 reply is in Ray Boudreaux persona', r3.persona === 'Ray Boudreaux', 'got ' + r3.persona);
check('different teachers give different voiced text', r1.text !== r3.text);

console.log('\n2) BAN 6 — cites only REAL practice data');
check('reply mentions the REAL struggling chord (Em)', /Em/.test(r1.text), 'text=' + r1.text);
check('reply does NOT invent a chord not in the store', !/G major/.test(r1.text));
// Ban 6, D1: the store records pass/fail only — never WHY a chord failed. So a reply
// must NOT invent a physical cause ("buzzing", "muted", "wrong finger"). It may only
// say the chord isn't clean / is clean (derived from the recorded verdict).
check('no INVENTED physical diagnosis (buzzing/muted/finger)', !/buzz|muted|wrong finger|finger (is|was) (in|on)|press closer|behind the fret|too far/i.test(r1.text), 'text=' + r1.text);

console.log('\n3) OFF-TOPIC canned redirect (hard rule) — hostile traps from fresh audit');
const traps = [
  'what do you think about the stock market?',
  'how do I invest in a guitar company?',
  'what is the stock price of Fender guitar corp?',
  'who is the best guitar player of all time in football terms?',
  'write a note to my landlord about rent'
];
let offOk = 0;
for (const t of traps) {
  const o = reply(s, 'T1', t);
  // A SAFE redirect is one that carries NO second-person diagnosis about a specific
  // chord and NO instructional advice ("your Em", "press", "fret", "try", "ring clean").
  // The canned text mentioning "chords/buzzing strings/lesson" generically is fine.
  const leaksAdvice = /your (em|c|g|d|am|a|e|dm)\b|press|fret|try (it|that|again)|ring(s)? clean|closer to/i.test(o.text);
  const ok = o.offTopic === true && !leaksAdvice;
  if (ok) offOk++;
  else console.log('    LEAK: "' + t + '" -> ' + JSON.stringify(o.text));
}
check('all 5 hostile off-topic traps redirect WITHOUT leaking guitar advice', offOk === traps.length, offOk + '/' + traps.length);
check('on-topic is NOT flagged offTopic', isOnTopic('how do I play a C chord?') === true);
check('genuine practice question passes', isOnTopic('my Em keeps failing, why?') === true);
check('self-progress question passes', isOnTopic('how am I doing?') === true);

console.log('\n4) CONTEXT-AWARE fallback');
const s2 = new PracticeStore();
const id2 = s2.startSession('L01', Date.now());
s2.logAttempt(id2, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s2.logAttempt(id2, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s2.finalizeSession(id2, { completed: true, durationSec: 300 });
const r2 = reply(s2, 'T2', 'how am I doing?');
check('contextual reply cites the real clean chord (C)', /C/.test(r2.text), 'text=' + r2.text);

console.log('\n5) BAN 5 — no network in chat engine source');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'chat', 'chatEngine.js'), 'utf8');
check('no fetch/XHR/WebSocket/http in chat source', !/\b(fetch|XMLHttpRequest|WebSocket|http\.request|axios)\b/.test(src));

console.log('\n' + '='.repeat(60));
console.log('STEP 6 F4 CHAT: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-6-F4-OK' : 'STEP 6 F4 FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
