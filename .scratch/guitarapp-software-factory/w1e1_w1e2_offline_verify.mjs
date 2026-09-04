#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';

const root = 'C:/Users/Hendrickson/Desktop/GuitarApp';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function ok(label, pass, details = '') {
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`${tag}: ${label}${details ? ' :: ' + details : ''}`);
  return pass;
}

let failures = 0;

const lessonRunnerPath = `${root}/07-app/core/lesson-runner.js`;
const indexPath = `${root}/07-app/index.html`;

const lessonRunnerSrc = read(lessonRunnerPath);
const indexSrc = read(indexPath);

if (!ok('lesson-runner.js exists and has createLessonRunner', lessonRunnerSrc.includes('createLessonRunner'))) failures++;
if (!ok('index.html loads lesson-runner.js', indexSrc.includes('./core/lesson-runner.js'))) failures++;
if (!ok('index.html sets LESSON_UNLOCK_COUNT=5', indexSrc.includes('LESSON_UNLOCK_COUNT=5'))) failures++;
if (!ok('index.html uses openLesson(index)', indexSrc.includes('openLesson(index)'))) failures++;

// Load runner in sandbox with tiny document shim for escaping.
const sandbox = {
  window: {},
  document: {
    createElement() {
      const node = {
        _txt: '',
        set textContent(v) {
          this._txt = String(v ?? '');
        },
        get innerHTML() {
          return this._txt
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        },
      };
      return node;
    },
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(lessonRunnerSrc, sandbox, { filename: 'lesson-runner.js' });

const api = sandbox.GuitarApp?.LessonRunner;
if (!ok('LessonRunner API exported', !!api)) failures++;

const lessonFiles = [
  'guitar-lesson-01-welcome-anatomy-tuning.json',
  'guitar-lesson-02-holding-the-pick.json',
  'guitar-lesson-03-first-chord-em.json',
  'guitar-lesson-04-second-chord-first-song.json',
  'guitar-lesson-05-strumming-in-time.json',
];

const lessonData = lessonFiles.map((name) =>
  JSON.parse(read(`${root}/07-app/content/lessons/${name}`))
);

const runner = api.createLessonRunner({
  lessons: lessonData,
  render: () => {},
});

const model2 = runner.openLesson(1);
if (!ok('openLesson(1) returns lesson 2 model', model2.lessonId === 'L02-holding-the-pick', model2.lessonId)) failures++;
if (!ok('lesson 2 has steps', Array.isArray(model2.steps) && model2.steps.length > 0, `steps=${model2.steps?.length ?? 0}`)) failures++;

const model5 = runner.openLesson(4);
if (!ok('openLesson(4) returns lesson 5 model', model5.lessonId === 'L05-strumming-in-time', model5.lessonId)) failures++;
if (!ok('lesson 5 includes Em/easyC loop in steps text', JSON.stringify(model5.steps).toLowerCase().includes('easyc'))) failures++;

// Compare 05-content and 07-app copies for lessons 1-5.
for (const name of lessonFiles) {
  const a = JSON.parse(read(`${root}/05-content/${name}`));
  const b = JSON.parse(read(`${root}/07-app/content/lessons/${name}`));
  const same = JSON.stringify(a) === JSON.stringify(b);
  ok(`05-content vs 07-app parity ${name}`, same, same ? '' : 'DIFF');
  if (!same) failures++;
}

console.log(`\nRESULT: ${failures === 0 ? 'GREEN' : 'RED'} (${failures} failure${failures === 1 ? '' : 's'})`);
process.exit(failures === 0 ? 0 : 1);
