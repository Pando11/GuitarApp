// app-smoke.mjs — real shell smoke gate for the current Wave 1/Wave 2 preview.
//
// Runs the ACTUAL 07-app/index.html classic-script shell inside JSDOM, wires a
// fetch shim to the real on-disk lesson/teacher files, then asserts the shipped
// UI path still works:
//   - catalog renders 25 lessons
//   - only lessons 1-5 unlock in Wave 1
//   - Lesson 1 opens with Sage panel
//   - Lesson 5 opens with Level-1 porch performance + local save
//   - Lesson 12 metadata mounts the new Level-2 porch performance hook
//   - T1 voice lock resolves to Sage's Chatterbox profile

import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(TEST_DIR, '..');
const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'https://app.local/index.html?dogfood=1', runScripts: 'outside-only' });
const { window } = dom;
const { document } = window;

globalThis.window = window;
globalThis.document = document;
globalThis.location = window.location;

const spoken = [];
window.speechSynthesis = { speak(utterance) { spoken.push({ text: utterance.text, voiceHint: utterance.voiceHint, providerHint: utterance.providerHint }); } };
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: globalThis.SpeechSynthesisUtterance, configurable: true });
globalThis.Audio = class { play() { return Promise.resolve(); } };
globalThis.URL.createObjectURL = () => 'blob:mock';
window.scrollTo = () => {};
Object.defineProperty(globalThis, 'navigator', {
  value: {
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) },
    serviceWorker: { register: async () => ({}) },
  },
  configurable: true,
});
const localDb = {};
const localStorage = {
  getItem(key) { return Object.prototype.hasOwnProperty.call(localDb, key) ? localDb[key] : null; },
  setItem(key, value) { localDb[key] = String(value); },
  removeItem(key) { delete localDb[key]; },
  clear() { for (const key of Object.keys(localDb)) delete localDb[key]; }
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true });
Object.defineProperty(window, 'localStorage', { value: localStorage, configurable: true });

function resolveLocalPath(url) {
  const asString = String(url);
  if (asString === '/api/tts') return null;
  const clean = asString.replace(/^https?:\/\/app\.local\//, '');
  const withoutQuery = clean.split('?')[0];
  const rel = withoutQuery.replace(/^\.\//, '');
  return path.join(APP_DIR, rel);
}

globalThis.fetch = async (url) => {
  if (String(url) === '/api/tts') {
    return { ok: true, status: 200, blob: async () => new Uint8Array(0), json: async () => ({}), text: async () => '' };
  }
  const full = resolveLocalPath(url);
  try {
    const data = fs.readFileSync(full);
    const text = data.toString('utf8');
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(text),
      text: async () => text,
      blob: async () => data,
    };
  } catch {
    return { ok: false, status: 404, json: async () => ({}), text: async () => '', blob: async () => new Uint8Array(0) };
  }
};
window.fetch = globalThis.fetch;

function runClassicScript(source, filename) {
  window.eval(source + '\n//# sourceURL=' + filename);
}

for (const script of Array.from(document.querySelectorAll('script'))) {
  if (script.src) {
    const full = path.join(APP_DIR, script.getAttribute('src').replace(/^\.\//, ''));
    runClassicScript(fs.readFileSync(full, 'utf8'), full);
  } else {
    runClassicScript(script.textContent, 'index-inline-script.js');
  }
}

document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 250));

let passed = 0;
let failed = 0;
const ok = (name, cond, extra) => {
  if (cond) passed++;
  else {
    failed++;
    console.log('FAIL: ' + name + (extra ? ' :: ' + extra : ''));
  }
};

ok('title matches Emerald Hollow shell', window.document.title === 'GuitarApp - Emerald Hollow', window.document.title);
const cards = Array.from(document.querySelectorAll('.lesson-card'));
ok('catalog renders 25 lesson cards', cards.length === 25, 'got ' + cards.length);
ok('first 5 lessons unlocked', cards.filter((card) => !card.disabled).length === 5, 'got ' + cards.filter((card) => !card.disabled).length);
ok('lessons 6+ locked', cards.filter((card) => card.disabled).length === 20, 'got ' + cards.filter((card) => card.disabled).length);
ok('catalog status text rendered', document.querySelector('#catalog-status')?.textContent === '25 lessons in Emerald Hollow', document.querySelector('#catalog-status')?.textContent || 'missing');
const homeRail = document.querySelector('#performance-rail')?.textContent || '';
ok('performance rail renders on home', /Performance ladder/.test(homeRail), homeRail);
ok('performance rail keeps Path A visible', /Path A live adaptive duet/.test(homeRail), homeRail);
ok('performance rail shows Level 2 at Lesson 12', /Level 2 - Lesson 12/.test(homeRail), homeRail);

const teachers = window.__APP__?.CATALOG?.teachers || [];
ok('teacher catalog loaded', teachers.length === 5, 'got ' + teachers.length);
const sage = teachers.find((teacher) => teacher.id === 'T1');
ok('T1 is Sage', !!sage && sage.name === 'Sage', sage ? sage.name : 'missing');
const speechPayload = window.GuitarApp.composeSpeechRequest('Warm up on the porch.');
ok('Sage voice provider locked to chatterbox', speechPayload.provider === 'chatterbox', JSON.stringify(speechPayload));
ok('Sage voice id locked', speechPayload.voice_id === 'builtin-sage-emerald-v1', JSON.stringify(speechPayload));

cards[0].click();
await new Promise((resolve) => setTimeout(resolve, 50));
ok('Lesson 1 opens', document.querySelector('#lesson-view')?.hidden === false, 'lesson view hidden');
ok('Lesson 1 title renders', /Welcome, Anatomy & Tuning/.test(document.querySelector('#lesson-title')?.textContent || ''), document.querySelector('#lesson-title')?.textContent || 'missing');
ok('Sage panel mounts in Lesson 1', !!document.querySelector('#sage-panel'));
document.querySelector('#sage-speak-intro')?.click();
await new Promise((resolve) => setTimeout(resolve, 10));
ok('Sage intro speaks through shell', spoken.some((entry) => entry.providerHint === 'chatterbox' && entry.voiceHint === 'builtin-sage-emerald-v1' && /tune|breath|chair/i.test(entry.text)), JSON.stringify(spoken));

document.querySelector('#back-home')?.click();
await new Promise((resolve) => setTimeout(resolve, 20));
ok('Back button returns home', document.querySelector('#home-view')?.hidden === false, 'home hidden');

cards[4].click();
await new Promise((resolve) => setTimeout(resolve, 50));
const l1Status = document.querySelector('#pathb-l1-status')?.textContent || '';
ok('Lesson 5 mounts Level-1 performance', !!document.querySelector('#porch-performance-l1'));
ok('Level-1 status starts on Em', /next expected: Em/.test(l1Status), l1Status);
document.querySelector('#pathb-l1-play-a')?.click();
document.querySelector('#pathb-l1-play-b')?.click();
await new Promise((resolve) => setTimeout(resolve, 10));
const savedL1 = JSON.parse(localStorage.getItem('guitarapp.wave1.pathb'));
ok('Level-1 save key written', !!savedL1, localStorage.getItem('guitarapp.wave1.pathb') || 'missing');
ok('Level-1 loop persisted after Em->easyC', !!savedL1 && savedL1.loopsCompleted === 1 && savedL1.expectedIndex === 0, JSON.stringify(savedL1));
document.querySelector('#back-home')?.click();
cards[4].click();
await new Promise((resolve) => setTimeout(resolve, 20));
const reopened = document.querySelector('#pathb-l1-status')?.textContent || '';
ok('Level-1 reopen shows persisted loop count', /loops completed: 1\/1/.test(reopened), reopened);
document.querySelector('#back-home')?.click();
await new Promise((resolve) => setTimeout(resolve, 20));
const homeRailAfterLevel1 = document.querySelector('#performance-rail')?.textContent || '';
ok('performance rail reflects completed Level 1', /Completed \(1\/1 loops\)/.test(homeRailAfterLevel1), homeRailAfterLevel1);

const lesson12 = JSON.parse(fs.readFileSync(path.join(APP_DIR, 'content/lessons/guitar-lesson-12-new-chord-am-big-four.json'), 'utf8'));
const model12 = window.GuitarApp.LessonRunner.normalizeLesson(lesson12, 11);
const probeRoot = document.createElement('div');
document.body.appendChild(probeRoot);
window.GuitarApp.Wave1Flow.mountEnhancements(model12, probeRoot);
const l2Status = probeRoot.querySelector('#pathb-l2-status')?.textContent || '';
ok('Lesson 12 metadata mounts Level-2 performance', !!probeRoot.querySelector('#porch-performance-l2'));
ok('Level-2 config chooses Lesson 12', window.GuitarApp.Wave1Flow.configFromModel(model12)?.lessonNumber === 12, JSON.stringify(window.GuitarApp.Wave1Flow.configFromModel(model12)));
ok('Level-2 status starts on Em', /next expected: Em/.test(l2Status), l2Status);
probeRoot.querySelector('#pathb-l2-play-a')?.click();
probeRoot.querySelector('#pathb-l2-play-b')?.click();
probeRoot.querySelector('#pathb-l2-play-a')?.click();
probeRoot.querySelector('#pathb-l2-play-b')?.click();
probeRoot.querySelector('#pathb-l2-play-a')?.click();
probeRoot.querySelector('#pathb-l2-play-b')?.click();
await new Promise((resolve) => setTimeout(resolve, 10));
const savedL2 = JSON.parse(localStorage.getItem('guitarapp.wave2.pathb.level2'));
ok('Level-2 save key written', !!savedL2, localStorage.getItem('guitarapp.wave2.pathb.level2') || 'missing');
ok('Level-2 reaches 3 target loops', !!savedL2 && savedL2.loopsCompleted === 3, JSON.stringify(savedL2));

console.log('\nAPP SMOKE: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
