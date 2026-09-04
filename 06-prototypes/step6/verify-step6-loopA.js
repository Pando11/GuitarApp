'use strict';
/*
 * verify-step6-loopA.js — DONE BAR for TASK-A1: Loop A drill-serving in the chat.
 * Proves a struggle message or a named chord now yields a REAL drill from the lesson
 * JSON (not invented text), records the ask (so Loop C2 can follow up), cites only
 * real lesson data (Ban 6), and makes zero network calls (Ban 5).
 * Run: node verify-step6-loopA.js
 */
const fs = require('fs'), path = require('path');
const { PracticeStore } = require('./store/practiceStore.js');
const { reply } = require('./chat/chatEngine.js');
const { findDrillForChord, drillForStruggle, loadLessons } = require('./drillSelector.js');

// Point drillSelector at the real lesson dir so the test exercises real curriculum data.
const ROOT = path.resolve(__dirname, '..', '..');
process.env.GUITAR_LESSON_DIR = path.join(ROOT, '05-content');

let pass = 0, fail = 0;
function check(n, c, d) { if (c) { pass++; console.log('  OK   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); } }

console.log('STEP 6 — LOOP A (drill-serving) DONE BAR\n');

console.log('1) A named struggle message serves a REAL drill from the curriculum');
{
  const s = new PracticeStore();
  // Student has struggled with G (so getStruggledChords is meaningful) and explicitly names it.
  const id = s.startSession('L06', Date.now());
  s.logAttempt(id, { chordName: 'G', frets: [3, 2, 0, 0, 0, 3], verdict: 'fail' });
  s.finalizeSession(id, { completed: true, durationSec: 400 });
  const r = reply(s, 'T1', "I can't get this G chord");
  check('reply is on-topic (not off-topic)', r.offTopic === false);
  check('reply carries a drill object', !!r.drill, 'drill=' + JSON.stringify(r.drill));
  check('drill is for the EXACT named chord (G)', r.drill && r.drill.chordPair && r.drill.chordPair.includes('G'), 'pair=' + (r.drill && r.drill.chordPair));
  check('drill cites a real lesson id (L06)', r.drill && /L06/.test(r.drill.lessonId), 'lesson=' + (r.drill && r.drill.lessonId));
  check('reply text names the drill + lesson', /G/.test(r.text) && /L06/.test(r.text), 'text=' + r.text);
  check('the ask was recorded (Loop C2 can follow up)', s.getPendingHelpRequests().some(x => x.chordName === 'G'));
}

console.log('\n2) A struggle signal with NO named chord falls back to the top struggled chord');
{
  const s = new PracticeStore();
  const id = s.startSession('L05', Date.now());
  s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' });
  s.finalizeSession(id, { completed: true, durationSec: 300 });
  const r = reply(s, 'T2', "this chord is really hard, I keep failing");
  check('reply served a drill for the struggled chord (Em)', r.drill && r.drill.chordPair && r.drill.chordPair.includes('Em'), 'pair=' + (r.drill && r.drill.chordPair));
  check('the Em ask was recorded', s.getPendingHelpRequests().some(x => x.chordName === 'Em'));
}

console.log('\n3) Ban 6 — drill cites ONLY real lesson data, never invents a diagnosis');
{
  const lessons = loadLessons();
  const drill = findDrillForChord('G', lessons);
  check('findDrillForChord returns a real exercise from a real lesson file', !!drill && !!drill.exerciseName && !!drill.lessonId);
  check('drill coaching is real curriculum text, not a diagnosis', drill && !/wrist|buzz|muted|finger (too|wrong|close)/i.test(drill.coaching));
  // A chord with no matching drill must return null (no invented placeholder).
  const none = findDrillForChord('Z9', lessons);
  check('unknown chord returns null (no fabricated drill)', none === null);
}

console.log('\n4) Ban 5 — no network in the drill-serving path');
{
  const src = fs.readFileSync(path.join(__dirname, 'drillSelector.js'), 'utf8')
    + fs.readFileSync(path.join(__dirname, 'chat', 'chatEngine.js'), 'utf8');
  check('no fetch/XHR/WebSocket/http/axios in drillSelector + chat', !/\b(fetch|XMLHttpRequest|WebSocket|http\.request|axios|twilio|nodemailer)\b/.test(src));
}

console.log('\n5) Off-topic input is still redirected (no drill leaked)');
{
  const s = new PracticeStore();
  const r = reply(s, 'T1', "what's the guitar company stock price?");
  check('off-topic reply flagged offTopic', r.offTopic === true);
  check('off-topic reply carries no drill', !r.drill);
}

console.log('\n' + '='.repeat(60));
console.log('STEP 6 LOOP A: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-6-LOOP-A-OK' : 'STEP 6 LOOP A FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
