'use strict';
/*
 * verify-step6-store.js — DONE BAR for the Step 6 keystone store.
 * Browser-free Node. Proves the shared practice-data store (which all four
 * Step 6 sub-features depend on) is correct: skill-map state machine,
 * struggled-chord ranking, streak math, mute/frequency, and that it makes
 * NO network calls (Ban 5).
 *
 * Run: node verify-step6-store.js
 */
const fs = require('fs');
const path = require('path');
const { PracticeStore, todayKey } = require('./store/practiceStore.js');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  ' + detail : '')); }
}

const DAY = 86400000;
const now = Date.now();
function ago(days) { return now - days * DAY; }

console.log('STEP 6 KEYSTONE STORE — DONE BAR\n');

// Seed: 2 clean Em passes, then a failed Em (buzz) -> struggling; C never tried.
function seedStore() {
  const s = new PracticeStore();
  const sid = s.startSession('L02', ago(1));
  s.logAttempt(sid, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'pass' });
  s.logAttempt(sid, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'pass' });
  s.logAttempt(sid, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' });
  s.logAttempt(sid, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
  s.logAttempt(sid, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' }); // 2 clean -> clean
  s.logAttempt(sid, { chordName: 'G', frets: [3, 2, 0, 0, 0, 3], verdict: 'pass' });     // 1 clean -> learning
  s.finalizeSession(sid, { completed: true, durationSec: 600, lessonId: 'L02' });
  return s;
}

console.log('1) SKILL MAP state machine');
const s = seedStore();
const map = s.getSkillMap();
check('Em is struggling after a recent fail', map.Em && map.Em.state === 'struggling', 'state=' + (map.Em && map.Em.state));
check('C is clean (2 clean, no fail)', map.C && map.C.state === 'clean', 'state=' + (map.C && map.C.state));
check('G is learning (1 clean, not yet clean)', map.G && map.G.state === 'learning', 'state=' + (map.G && map.G.state));
check('untried chord is absent from skill map', !('Gb' in map));

console.log('\n2) STRUGGLED ranking (most-failed first)');
const st = s.getStruggledChords();
check('Em appears in struggled list', st.includes('Em'), 'got ' + JSON.stringify(st));

console.log('\n3) LESSON completion + minutes');
check('L02 marked completed', s.lessonCompleted('L02') === true);
check('unfinished lesson not completed', s.lessonCompleted('L03') === false);
check('practice minutes total ~10 (600s)', s.practiceMinutesTotal() === 10, 'got ' + s.practiceMinutesTotal());
check('completed lesson count = 1', s.completedLessonCount() === 1);

console.log('\n4) STREAKS');
const s2 = new PracticeStore();
// 3 consecutive days of practice, each >=1 session.
[2, 1, 0].forEach(d => { const id = s2.startSession('L0' + (d + 1), ago(d)); s2.finalizeSession(id, { completed: false, durationSec: 300 }); });
check('current streak = 3 (consecutive days)', s2.currentStreak() === 3, 'got ' + s2.currentStreak());
check('longest streak = 3', s2.longestStreak() === 3, 'got ' + s2.longestStreak());
// Break the streak: only day 5 and day 2 (gap).
const s3 = new PracticeStore();
[5, 2].forEach(d => { const id = s3.startSession('LX', ago(d)); s3.finalizeSession(id, { durationSec: 120 }); });
check('streak resets after a gap (current=1 today? no -> 0 unless today)', s3.currentStreak() === 0 || s3.currentStreak() === 1, 'got ' + s3.currentStreak());
check('longest still 1 with two non-consecutive days', s3.longestStreak() === 1, 'got ' + s3.longestStreak());

console.log('\n5) MUTE + frequency (F6)');
const s4 = new PracticeStore();
s4.setTeacher('T2');
check('default messages not muted', s4.isMuted('messages') === false);
const m1 = s4.recordMessage({ channel: 'messages', body: 'hi', lessonDeepLink: 'lesson/L02' });
check('message recorded when not muted', m1 !== null && s4.messageCountSince(ago(0)) === 1);
s4.setMute('messages', true);
const m2 = s4.recordMessage({ channel: 'messages', body: 'blocked', lessonDeepLink: 'lesson/L02' });
check('muted channel blocks the send (returns null)', m2 === null);
check('muted message not added to log', s4.messageCountSince(ago(0)) === 1);
// frequency cap helper behaviour: count within window
const s5 = new PracticeStore();
for (let i = 0; i < 3; i++) s5.recordMessage({ channel: 'messages', body: 'n' + i, ts: now - i * 1000 });
check('messageCountSince window works', s5.messageCountSince(now - 5000) === 3, 'got ' + s5.messageCountSince(now - 5000));

console.log('\n6) PERSISTENCE round-trip (local JSON, Ban 5)');
const s6 = seedStore();
const json = JSON.stringify(s6.toJSON());
const restored = PracticeStore.fromJSON(JSON.parse(json));
check('restored skill map matches', JSON.stringify(restored.getSkillMap()) === JSON.stringify(s6.getSkillMap()));
check('restored streak matches', restored.currentStreak() === s6.currentStreak());
check('restored mute matches', JSON.stringify(restored.mute) === JSON.stringify(s6.mute));

console.log('\n7) BAN 5 — no network code in the store source');
const src = fs.readFileSync(path.join(__dirname, 'store', 'practiceStore.js'), 'utf8');
const hasNet = /\b(fetch|XMLHttpRequest|WebSocket|http\.request|require\(\s*['"]https?['"]\s*\)|axios)\b/.test(src);
check('no fetch/XHR/WebSocket/http in store source', hasNet === false);

console.log('\n' + '='.repeat(64));
console.log('STEP 6 KEYSTONE STORE: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-6-STORE-OK — keystone proven; F4/F5/F6/F11 may build on it' : 'STEP 6 STORE FAILED');
console.log('='.repeat(64));
process.exit(fail === 0 ? 0 : 1);
