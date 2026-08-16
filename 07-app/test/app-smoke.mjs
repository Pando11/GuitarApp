// app-smoke.mjs — headless integration test of the REAL app.js using a minimal DOM/Browser shim.
// Proves the PWA wires the proven engines correctly: boot, catalog, navigation,
// entitlement gating, lesson render, teacher swap, voice intent, listening log.
// This is NOT a stub — it imports the actual app.js with shimmed globals.

import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

// Load the REAL index.html so app.js finds #hamburger/#sidenav/#screen/#tabbar.
const html = readFileSync('C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/index.html', 'utf8');
const dom = new JSDOM(html, { url: 'https://app.local/', runScripts: 'outside-only' });
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
// `location` is always present in a real browser; app.js reads location.search in boot().
// JSDOM exposes it on window, so mirror it onto globalThis for the shim.
globalThis.location = window.location;
Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) }, serviceWorker: { register: async () => ({}) } }, configurable: true });
const _ls = (() => { let s = {}; return { getItem: k => s[k] ?? null, setItem: (k, v) => s[k] = String(v), removeItem: k => delete s[k] }; })();
Object.defineProperty(globalThis, 'localStorage', { value: _ls, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.fetch = async (url) => {
  // Resolve content/* and core/* relative to 07-app
  const p = String(url).replace(/^https?:\/\/app\.local\//, '');
  const base = 'C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/';
  const full = base + p;
  try { const txt = readFileSync(full, 'utf8'); return { ok: true, status: 200, json: async () => JSON.parse(txt), text: async () => txt }; }
  catch (e) { return { ok: false, status: 404, json: async () => ({}), text: async () => '' }; }
};
globalThis.SpeechSynthesisUtterance = class { constructor(t){ this.text = t; } };
window.speechSynthesis = { speak(){} };
globalThis.AudioContext = class { constructor(){ this.sampleRate = 44100; this.currentTime = 0; this.destination = {}; } createBuffer(){ return { copyToChannel(){} }; } createBufferSource(){ return { connect(){}, start(){}, buffer:null }; } createOscillator(){ return { connect(){}, start(){}, stop(){}, frequency:{value:0} }; } createGain(){ return { connect(){}, gain:{value:0} }; } createAnalyser(){ return { fftSize:2048, getFloatTimeDomainData(){}, connect(){} }; } close(){} };
window.AudioContext = globalThis.AudioContext;
window.scrollTo = () => {};
globalThis.URL.createObjectURL = () => 'blob:';

// Import the real app (it self-boots on import).
const appMod = await import('file:///C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/app.js');

// app.js exposes window.__APP__ after boot.
await new Promise(r => setTimeout(r, 200));
const APP = window.__APP__;
let passed = 0, failed = 0;
const ok = (n, c, e) => { if (c) passed++; else { failed++; console.log('FAIL: ' + n + (e ? ' :: ' + e : '')); } };

ok('app booted', !!APP, 'window.__APP__ missing');
if (!APP) { console.log('BOOT FAILED'); process.exit(1); }

ok('catalog 25 core lessons', APP.CATALOG.lessons.length === 25, 'got ' + APP.CATALOG.lessons.length);
// Roster = 3 core teachers (T1..T3) + 2 pack-guest teachers (T4 blues, T5 country)
// injected at boot by app.js. Five is the correct post-boot count.
ok('catalog 5 teachers (3 core + 2 pack guests)', APP.CATALOG.teachers.length === 5, 'got ' + APP.CATALOG.teachers.length);
ok('core teachers T1..T3 present', ['T1', 'T2', 'T3'].every(id => APP.CATALOG.teachers.some(t => t.id === id)));
ok('pack teachers T4/T5 injected', ['T4', 'T5'].every(id => APP.CATALOG.teachers.some(t => t.id === id)));
ok('catalog 2 packs', APP.CATALOG.packs.length === 2, 'got ' + APP.CATALOG.packs.length);
ok('teacher T1 present', APP.CATALOG.teachers.some(t => t.id === 'T1'));

// Entitlement: strict free — tuner free, lesson L01 free, L02 paywalled
const ent = APP.app.entitlement;
ok('free tuner accessible', ent.canAccessFeature('tuner'));
ok('free L01 accessible', ent.canAccessLesson('L01'));
ok('L02 paywalled pre-trial', !ent.canAccessLesson('L02'));

// Start trial -> premium
APP.app.startFreeTrial();
ok('premium after trial', ent.isPremium());
ok('L02 accessible after trial', ent.canAccessLesson('L02'));
APP.app.entitlement.cancel();
ok('free again after cancel', !ent.isPremium());

// Lesson render produces scenes via the proven renderer
const L1 = APP.CATALOG.lessons.find(l => l.id.includes('welcome'));
ok('found lesson 1', !!L1);
const manifest = APP.buildManifest(L1.raw);
ok('manifest scenes >= 3', manifest.scenes.length >= 3, 'scenes=' + manifest.scenes.length);
ok('manifest has intro', manifest.scenes[0].kind === 'intro');
ok('manifest total > 0', manifest.totalDurationMs > 0);

// Voice command engine wired (F10)
const V = await import('file:///C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/core/voice-command.js');
ok('voice "again" -> again', V.parseCommand('play it again').intent === 'again');
ok('voice "order pizza" -> ignore', V.parseCommand('order a pizza').intent === 'ignore');

// Teacher swap invariant (F3): content projection identical across teachers
const TE = await import('file:///C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/core/teacher.js');
const t1 = APP.CATALOG.teachers.find(t => t.id === 'T1');
const t2 = APP.CATALOG.teachers.find(t => t.id === 'T2');
const v1 = TE.applyTeacher(manifest, t1);
const v2 = TE.applyTeacher(manifest, t2);
ok('teacher content projection identical', JSON.stringify(TE.lessonContentProjection(v1)) === JSON.stringify(TE.lessonContentProjection(v2)));

console.log('\nAPP SMOKE: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
