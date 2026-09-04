'use strict';
/*
 * verify-step6-streaks.js — DONE BAR for F11 streaks / progress readout (Step 6).
 * Proves the readout surfaces only REAL derived data (Ban 6): streak counts,
 * practice minutes, completed lessons, and the per-chord clean/struggling skill
 * map — all computed from the store, nothing invented.
 * Run: node verify-step6-streaks.js
 */
const { PracticeStore } = require('./store/practiceStore.js');
const { readout } = require('./streaks/streaks.js');

let pass = 0, fail = 0;
function check(n, c, d) { if (c) { pass++; console.log('  OK   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); } }

console.log('STEP 6 — F11 STREAKS / PROGRESS DONE BAR\n');

const DAY = 86400000; const now = Date.now();
function ago(d) { return now - d * DAY; }

console.log('1) Readout reflects real logged data');
const s = new PracticeStore();
[2, 1, 0].forEach(d => { const id = s.startSession('L0' + (d + 1), ago(d)); s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: d === 0 ? 'fail' : 'pass' }); s.finalizeSession(id, { completed: true, durationSec: 300 }); });
const ro = readout(s);
check('current streak = 3', ro.currentStreak === 3, 'got ' + ro.currentStreak);
check('longest streak = 3', ro.longestStreak === 3, 'got ' + ro.longestStreak);
check('practice minutes = 15 (3x300s)', ro.practiceMinutes === 15, 'got ' + ro.practiceMinutes);
check('lessons completed = 3', ro.lessonsCompleted === 3, 'got ' + ro.lessonsCompleted);
check('skill map includes Em with a real state', ro.skillSnapshot.Em && typeof ro.skillSnapshot.Em.state === 'string');

console.log('\n2) Skill map states are internally consistent (no phantom data)');
const s2 = new PracticeStore();
const id2 = s2.startSession('L01', now);
s2.logAttempt(id2, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s2.logAttempt(id2, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s2.logAttempt(id2, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' });
s2.finalizeSession(id2, { completed: true, durationSec: 200 });
const ro2 = readout(s2);
check('C is in cleanChords (2 clean)', ro2.cleanChords.includes('C'));
check('Em is in strugglingChords (recent fail)', ro2.strugglingChords.includes('Em'));
check('no chord appears in two states at once', !ro2.cleanChords.some(c => ro2.strugglingChords.includes(c)));

console.log('\n3) Empty store reports zeros, not phantom progress');
const s3 = new PracticeStore();
const ro3 = readout(s3);
check('empty -> current streak 0', ro3.currentStreak === 0);
check('empty -> lessons completed 0', ro3.lessonsCompleted === 0);
check('empty -> practice minutes 0', ro3.practiceMinutes === 0);
check('empty -> no clean/struggling chords', ro3.cleanChords.length === 0 && ro3.strugglingChords.length === 0);

console.log('\n4) BAN 5 — no network in streaks source');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'streaks', 'streaks.js'), 'utf8');
check('no fetch/XHR/WebSocket/http in streaks source', !/\b(fetch|XMLHttpRequest|WebSocket|http\.request|axios)\b/.test(src));

console.log('\n' + '='.repeat(60));
console.log('STEP 6 F11 STREAKS: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-6-F11-OK' : 'STEP 6 F11 FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
