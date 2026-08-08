// test-chord-library.js — REGRESSION SUITE for chord-theory-check.js.
// Written 2026-08-08 after an independent adversarial review found the checker
// failed open on unknown qualities (Cdim passed), treated missing 7ths as warnings,
// and ignored finger/fret ranges. Every case here is a known-correct or known-wrong
// real guitar chord. Run after ANY change to the checker. Exit 1 = a regression.
'use strict';
const { verifyChord } = require('../schema/chord-theory-check.js');

let pass = 0, fail = 0;
function T(label, name, frets, fingers, expectOk, expectWarn = 0) {
  const r = verifyChord('t', { name, frets, fingers });
  // When we expect failure, the only requirement is ok === false (warning count is irrelevant).
  const ok = expectOk ? (r.ok && r.warnings.length === expectWarn) : (r.ok === false);
  if (ok) pass++; else {
    fail++;
    console.log('  FAIL  ' + label);
    console.log('        name="' + name + '" frets=' + JSON.stringify(frets) + ' fingers=' + JSON.stringify(fingers));
    console.log('        expected ok=' + expectOk + ' warnings=' + expectWarn + ' | got ok=' + r.ok + ' warnings=' + r.warnings.length);
    r.errors.forEach(e => console.log('          ERR: ' + e));
    r.warnings.forEach(w => console.log('          warn: ' + w));
  }
}
console.log('== chord-library regression suite ==');

// ---- correct open chords must PASS ----
T('Em',            'E minor',  [0,2,2,0,0,0],        [0,2,3,0,0,0], true);
T('C',             'C major',  [null,3,2,0,1,0],     [null,3,2,0,1,0], true);
T('G 3-finger',    'G major',  [3,2,0,0,0,3],        [2,1,0,0,0,3], true);
T('G 4-finger',    'G major',  [3,2,0,0,3,3],        [2,1,0,0,3,4], true);
T('D',             'D major',  [null,null,0,2,3,2],  [null,null,0,1,3,2], true);
T('Am',            'A minor',  [null,0,2,2,1,0],     [null,0,2,3,1,0], true);
T('E',             'E major',  [0,2,2,1,0,0],        [0,2,3,1,0,0], true);
T('A',             'A major',  [null,0,2,2,2,0],     [null,0,1,2,3,0], true);
T('Easy C',        'Easy C',   [null,3,2,0,null,0],  [null,3,2,0,null,0], true); // full C spelling C E G
T('easy c lowercase','c major',[null,3,2,0,1,0],     [null,3,2,0,1,0], true);
// ---- correct 7th chords must PASS ----
T('G7',            'G7',       [3,2,0,0,0,1],        [3,2,0,0,0,1], true);
T('A7',            'A7',       [null,0,2,0,2,0],     [null,0,2,0,3,0], true);
T('Am7',           'A minor 7',[null,0,2,0,1,0],     [null,0,2,0,1,0], true); // full Am7 spelling A E G C
T('Em7',           'E minor 7',[0,2,0,0,0,0],        [0,2,0,0,0,0], true); // full Em7 spelling E B D G
T('D7',            'D7',       [null,null,0,2,1,2],  [null,null,0,2,1,3], true);
T('C7',            'C7',       [null,3,2,3,1,0],     [null,3,2,4,1,0], true, 1); // 5th omitted (standard)
// ---- correct sus / power chords must PASS ----
T('Dsus4',         'D sus4',   [null,null,0,2,3,3],  [null,null,0,1,3,4], true);
T('Asus2',         'A sus2',   [null,0,2,2,0,0],     [null,0,1,2,0,0], true);
T('G5',            'G5',       [3,5,5,null,null,null],[1,3,4,null,null,null], true);
// ---- correct barre chords must PASS ----
T('F barre',       'F major',  [1,3,3,2,1,1],        [1,3,4,2,1,1], true);
T('Bm barre',      'B minor',  [null,2,4,4,3,2],     [null,1,3,4,2,1], true);
// ---- WRONG chords must FAIL ----
T('Em one fret off',      'E minor', [0,2,2,1,0,0],  [0,2,3,1,0,0], false);
T('G shaped as C',        'G major', [null,3,2,0,1,0],[null,3,2,0,1,0], false);
T('Am named Am7',       'A minor 7',[null,0,2,2,1,0],[null,0,2,3,1,0], false); // G present (wrong tone) + b7 absent
T('G named G7',           'G7',      [3,2,0,0,0,3],  [2,1,0,0,0,3], false); // 3 (F) wrong + b7 (F) absent
T('Am shape under Am7 missing b7','A minor 7',[null,0,2,null,1,0],[null,0,2,null,1,0], false); // b7 required, absent
T('D missing 3rd',        'D major', [null,null,0,2,null,null],[null,null,0,1,null,null], false); // D A only — no F# anywhere
T('finger 9',             'E minor', [0,2,2,0,0,0],  [0,9,8,0,0,0], false);
T('finger on 2 frets',    'D major', [null,null,0,2,3,2],[null,null,0,1,1,1], false);
T('fretted no finger',    'A minor', [null,0,2,2,1,0],[null,0,0,3,1,0], false);
T('frets length 7',       'E minor', [0,2,2,0,0,0,0],[0,2,3,0,0,0,0], false);
T('frets float',          'E minor', [0,2,2,1.5,0,0],[0,2,3,1,0,0], false);
T('frets string',         'E minor', ['0',2,2,0,0,0],[0,2,3,0,0,0], false);
T('mute has finger',      'E minor', [null,2,2,0,0,0],[1,2,3,0,0,0], false);
// ---- UNKNOWN qualities must FAIL CLOSED (review finding #1) ----
T('Cdim named',           'Cdim',    [null,3,2,0,1,0],[null,3,2,0,1,0], false);
T('C6 named',             'C6',      [null,3,2,0,1,0],[null,3,2,0,1,0], false);
T('G9 named',             'G9',      [3,2,0,0,0,1],  [3,2,0,0,0,1], false);
T('Gadd9 named',          'Gadd9',   [3,2,0,2,0,3],  [3,2,0,1,0,4], false);
T('unparseable name',     'Zebra',   [0,2,2,0,0,0],  [0,2,3,0,0,0], false);
T('empty name',           '',        [0,2,2,0,0,0],  [0,2,3,0,0,0], false);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'CHORD-LIBRARY-REGRESSION-OK' : 'REGRESSION — fix the checker');
process.exit(fail === 0 ? 0 : 1);
