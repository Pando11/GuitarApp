'use strict';
/*
 * verify-step6-adaptive.js — DONE BAR for F5 adaptive plan (Step 6).
 * Proves: after a logged flubbed session, tomorrow's plan OPENS with a drill
 * targeting the flubbed chord, with a real deep link to the lesson it was in
 * (Ban 6: real data only). Also proves it does NOT invent chords.
 * Run: node verify-step6-adaptive.js
 */
const { PracticeStore } = require('./store/practiceStore.js');
const { buildTomorrowPlan } = require('./adaptive/adaptivePlan.js');

let pass = 0, fail = 0;
function check(n, c, d) { if (c) { pass++; console.log('  OK   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); } }

console.log('STEP 6 — F5 ADAPTIVE PLAN DONE BAR\n');

console.log('1) Flubbed Em -> plan OPENS with an Em drill (the core bar)');
const s = new PracticeStore();
const id = s.startSession('L02', Date.now());
s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'pass' });
s.logAttempt(id, { chordName: 'Em', frets: [0, 2, 2, 0, 0, 0], verdict: 'fail' });  // flub
s.logAttempt(id, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s.logAttempt(id, { chordName: 'C', frets: [null, 3, 2, 0, 1, 0], verdict: 'pass' });
s.finalizeSession(id, { completed: true, durationSec: 600 });
const plan = buildTomorrowPlan(s);
check('plan opened with a drill', plan.openedWithDrill === true);
check('opening drill targets the flubbed chord (Em)', plan.openingDrill && plan.openingDrill.chord === 'Em', 'got ' + (plan.openingDrill && plan.openingDrill.chord));
check('opening drill deep-links to the real lesson (L02)', plan.openingDrill && plan.openingDrill.lessonDeepLink === 'lesson/L02', 'got ' + (plan.openingDrill && plan.openingDrill.lessonDeepLink));
check('opening drill reason cites the real session', plan.openingDrill && /last session/.test(plan.openingDrill.reason), 'got ' + (plan.openingDrill && plan.openingDrill.reason));

console.log('\n2) Two flubs -> adds a chord-change drill between the two weakest');
const s2 = new PracticeStore();
const id2 = s2.startSession('L03', Date.now());
s2.logAttempt(id2, { chordName: 'G', frets: [3, 2, 0, 0, 0, 3], verdict: 'fail' });
s2.logAttempt(id2, { chordName: 'G', frets: [3, 2, 0, 0, 0, 3], verdict: 'fail' });
s2.logAttempt(id2, { chordName: 'D', frets: [null, 3, 2, 0, 0, 0], verdict: 'fail' });
s2.logAttempt(id2, { chordName: 'D', frets: [null, 3, 2, 0, 0, 0], verdict: 'fail' });
s2.finalizeSession(id2, { completed: true, durationSec: 700 });
const plan2 = buildTomorrowPlan(s2);
check('plan opened with a drill', plan2.openedWithDrill === true);
check('chord-change drill present when >=2 struggling', plan2.plan.some(p => p.type === 'chord-change-drill'));
const cc = plan2.plan.find(p => p.type === 'chord-change-drill');
check('change drill targets the two flubbed chords', cc && cc.chords.includes('G') && cc.chords.includes('D'), 'got ' + JSON.stringify(cc && cc.chords));

console.log('\n3) BAN 6 — plan cites ONLY real chords (never invents)');
check('no invented chord (e.g. Am) in the plan', !JSON.stringify(plan2).includes('"Am"') || plan2.plan.every(p => !(p.chord === 'Am')));
const allChords = plan2.plan.map(p => p.chord).filter(Boolean);
check('every plan chord exists in the store', allChords.every(c => ['G', 'D'].includes(c)), 'got ' + JSON.stringify(allChords));

console.log('\n4) Plan advances the path (next lesson appended)');
check('plan ends with a forward lesson step', plan2.plan.some(p => p.type === 'lesson' && /^L\d+$/.test(p.lessonId)), 'got ' + JSON.stringify(plan2.plan.filter(p => p.type === 'lesson')));

console.log('\n5) BAN 5 — no network in adaptive source');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'adaptive', 'adaptivePlan.js'), 'utf8');
check('no fetch/XHR/WebSocket/http in adaptive source', !/\b(fetch|XMLHttpRequest|WebSocket|http\.request|axios)\b/.test(src));

console.log('\n' + '='.repeat(60));
console.log('STEP 6 F5 ADAPTIVE: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-6-F5-OK' : 'STEP 6 F5 FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
