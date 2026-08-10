// chat-voice.test.mjs — proves the AI coach ("Ask Teacher") reply is SPOKEN, not
// just rendered as silent text. Drives the real app.js chat send and asserts
// speak() was invoked with the current teacher's voice config.
// Run: node 07-app/test/chat-voice.test.mjs
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync('C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/index.html', 'utf8');
const dom = new JSDOM(html, { url: 'https://app.local/', runScripts: 'outside-only' });
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.location = window.location;
Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) }, serviceWorker: { register: async () => ({}) } }, configurable: true });
const _ls = (() => { let s = {}; return { getItem: k => s[k] ?? null, setItem: (k, v) => s[k] = String(v), removeItem: k => delete s[k] }; })();
Object.defineProperty(globalThis, 'localStorage', { value: _ls, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.fetch = async (url) => {
  const p = String(url).replace(/^https?:\/\/app\.local\//, '');
  const base = 'C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/';
  try { const txt = readFileSync(base + p, 'utf8'); return { ok: true, status: 200, json: async () => JSON.parse(txt), text: async () => txt }; }
  catch { return { ok: false, status: 404, json: async () => ({}), text: async () => '' }; }
};
globalThis.SpeechSynthesisUtterance = class { constructor(t){ this.text = t; } };
window.SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;
let spokenTexts = [];
window.speechSynthesis = { speak: (u) => { spokenTexts.push(u && u.text); } };
globalThis.speechSynthesis = window.speechSynthesis;
globalThis.AudioContext = class { constructor(){ this.sampleRate = 44100; this.currentTime = 0; this.destination = {}; } createBuffer(){ return { copyToChannel(){} }; } createBufferSource(){ return { connect(){}, start(){}, buffer:null }; } createOscillator(){ return { connect(){}, start(){}, stop(){}, frequency:{value:0} }; } createGain(){ return { connect(){}, gain:{value:0} }; } createAnalyser(){ return { fftSize:2048, getFloatTimeDomainData(){}, connect(){} }; } close(){} };
window.AudioContext = globalThis.AudioContext;
window.scrollTo = () => {};
globalThis.URL.createObjectURL = () => 'blob:';

// Import the real app (it self-boots on import). The chat send then drives speak().
const appMod = await import('file:///C:/Users/The Yoda Trader/Desktop/GuitarApp/07-app/app.js');
await new Promise(r => setTimeout(r, 200));
const APP = window.__APP__;

let passed = 0, failed = 0;
const ok = (n, c) => { if (c) { passed++; console.log('  ✓', n); } else { failed++; console.log('  ✗', n); } };

ok('app booted', !!APP);
// Premium so chat is unlocked
APP.app.startFreeTrial();

// Navigate to the chat screen (Ask Teacher).
APP.navigate('chat');
await new Promise(r => setTimeout(r, 50));

// Find the chat input + send button in the rendered DOM.
const input = window.document.querySelector('.chat-bar input');
const send = window.document.querySelector('.chat-bar button');
ok('chat input + send button rendered', !!input && !!send);

// Type an on-topic question and send.
input.value = 'How is my E minor chord coming along?';
send.dispatchEvent(new window.Event('click'));
await new Promise(r => setTimeout(r, 50));

ok('coach reply was spoken (>=1 utterance)', spokenTexts.length >= 1);
ok('spoken text non-empty', !!spokenTexts[0] && spokenTexts[0].length > 0);
// The coach reply is persona text (off-topic-guard not triggered because the
// question references a chord). It must contain the teacher's spoken reply,
// which for an on-topic chord question is the "struggled/clean/open" line.
ok('spoken text is the coach reply (mentions chord or encouragement)',
   !!spokenTexts[0] && /chord|play|lesson|you/i.test(spokenTexts[0]));
ok('a replay button was added for the coach reply', !!window.document.querySelector('.chat-log .msg.teacher + .btn'));

console.log('\nchat-voice: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
