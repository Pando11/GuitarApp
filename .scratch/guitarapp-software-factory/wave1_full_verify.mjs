#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';

const root = 'C:/Users/Hendrickson/Desktop/GuitarApp';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function readJSON(path) { return JSON.parse(read(path)); }

let fail = 0;
function check(label, ok, details = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${details ? ' :: ' + details : ''}`);
  if (!ok) fail++;
}

const indexPath = `${root}/07-app/index.html`;
const lessonRunnerPath = `${root}/07-app/core/lesson-runner.js`;
const wave1Path = `${root}/07-app/core/wave1-flow.js`;

const indexSrc = read(indexPath);
check('index loads lesson-runner', indexSrc.includes('./core/lesson-runner.js'));
check('index loads wave1-flow', indexSrc.includes('./core/wave1-flow.js'));
check('Wave 1 unlock count fixed at 5', indexSrc.includes('LESSON_UNLOCK_COUNT=5'));
check('index mounts wave1 enhancements', indexSrc.includes('Wave1Flow.mountEnhancements'));

const sandbox = {
  window: {},
  localStorage: (() => {
    const db = new Map();
    return {
      getItem(k) { return db.has(k) ? db.get(k) : null; },
      setItem(k, v) { db.set(k, String(v)); },
      removeItem(k) { db.delete(k); },
      _dump() { return db; },
    };
  })(),
  document: {
    createElement() {
      return {
        _txt: '',
        set textContent(v) { this._txt = String(v ?? ''); },
        get innerHTML() {
          return this._txt
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        },
      };
    },
    getElementById() { return null; },
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(read(lessonRunnerPath), sandbox, { filename: 'lesson-runner.js' });
vm.runInContext(read(wave1Path), sandbox, { filename: 'wave1-flow.js' });

const LR = sandbox.GuitarApp?.LessonRunner;
const W1 = sandbox.GuitarApp?.Wave1Flow;
check('LessonRunner API exported', !!LR);
check('Wave1Flow API exported', !!W1);

const files = [
  'guitar-lesson-01-welcome-anatomy-tuning.json',
  'guitar-lesson-02-holding-the-pick.json',
  'guitar-lesson-03-first-chord-em.json',
  'guitar-lesson-04-second-chord-first-song.json',
  'guitar-lesson-05-strumming-in-time.json',
];

const lessons07 = files.map((f) => readJSON(`${root}/07-app/content/lessons/${f}`));
const lessons05 = files.map((f) => readJSON(`${root}/05-content/${f}`));

for (let i = 0; i < files.length; i++) {
  check(`05-content parity ${files[i]}`, JSON.stringify(lessons05[i]) === JSON.stringify(lessons07[i]));
}

const runner = LR.createLessonRunner({ lessons: lessons07, render: () => {} });
const l1 = runner.openLesson(0);
const l5 = runner.openLesson(4);
check('Runner opens L01 correctly', l1.lessonId === 'L01-welcome-anatomy-tuning', l1.lessonId);
check('Runner opens L05 correctly', l5.lessonId === 'L05-strumming-in-time', l5.lessonId);
check('L05 has Em/easyC in rendered step data', JSON.stringify(l5.steps).includes('easyC'));

const introLine = W1.deriveSageLine(l1, 'intro');
const resultsLine = W1.deriveSageLine(l1, 'results');
const wrapLine = W1.deriveSageLine(l5, 'wrap');
check('Sage intro line exists', typeof introLine === 'string' && introLine.length > 10);
check('Sage encouragement line exists', typeof resultsLine === 'string' && resultsLine.length > 10);
check('L05 wrap points to porch performance', /porch|performance/i.test(wrapLine), wrapLine);

const sessionA = W1.makePathBSession(sandbox.localStorage);
sessionA.reset();
let state = sessionA.load();
check('Path B reset starts expecting Em', sessionA.expectedChord(state) === 'Em', sessionA.expectedChord(state));

let r1 = sessionA.play('easyC'); // wrong first chord -> wait
check('Path B waits on wrong chord', r1.action === 'wait', r1.action);
let r2 = sessionA.play('Em');
check('Path B follows correct Em', r2.action === 'follow', r2.action);
check('Path B now expects easyC', r2.expectedNow === 'easyC', r2.expectedNow);
let r3 = sessionA.play('easyC');
check('Path B completes first loop after easyC', r3.loopsCompleted === 1, String(r3.loopsCompleted));

// Reopen proof: recreate session from same storage and ensure state persisted.
const sessionB = W1.makePathBSession(sandbox.localStorage);
const reopened = sessionB.load();
check('Reopen/save proof: loops persisted', reopened.loopsCompleted === 1, String(reopened.loopsCompleted));
check('Reopen/save proof: expected chord persisted to Em', sessionB.expectedChord(reopened) === 'Em', sessionB.expectedChord(reopened));

console.log(`\nRESULT: ${fail === 0 ? 'GREEN' : 'RED'} (${fail} failure${fail === 1 ? '' : 's'})`);
process.exit(fail === 0 ? 0 : 1);
