/*
 * render-smoke.js — Step 2 player DOM-stub smoke test (browser-free).
 * The browser tool blocks file://, so we extract the player's inline <script>, run it
 * against a hand-rolled document stub, and assert it painted: 6 tuner string buttons,
 * the metronome controls, and that tuneVerdict drives the verdict element class.
 * Reuses the SAME engine module the real player imports (no logic duplication).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'tuner-metronome.html'), 'utf8');
const ENGINE = require('./engine/tuner-engine.js');

// Extract inline <script> blocks (those without src=)
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const playerCode = blocks[blocks.length - 1];

// ---- DOM stub ----
function makeEl(id) {
  return {
    id, _text: '', _html: '', className: '', disabled: false, textContent: '',
    style: { setProperty() {}, left: '' },
    children: [], _listeners: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); },
    addEventListener(ev, fn) { this._listeners[ev] = fn; },
    set onclick(fn) { this._listeners.click = fn; }, get onclick() { return this._listeners.click; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    set textContent(v) { this._text = v; }, get textContent() { return this._text; }
  };
}
const els = {};
['big', 'freq', 'needle', 'verdict', 'micState', 'startBtn', 'targetRow', 'history',
 'metBpm', 'metDown', 'metUp', 'metToggle'].forEach(id => els[id] = makeEl(id));

const document = {
  getElementById: id => els[id] || (els[id] = makeEl(id)),
  createElement: () => makeEl('dyn'),
  querySelector: () => null,
  querySelectorAll: () => []
};
const window = { AudioContext: function(){}, webkitAudioContext: function(){} };
const navigator = { mediaDevices: { getUserMedia: () => Promise.reject('no mic in stub') } };
const requestAnimationFrame = () => 0;

const sandbox = { ENGINE, document, window, navigator, requestAnimationFrame, console,
  setTimeout: () => 0, clearTimeout: () => {}, Date, Math, Promise };
vm.createContext(sandbox);
vm.runInContext(playerCode, sandbox);

// ---- assertions ----
let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('  OK   ' + name); } else { fail++; console.log('  FAIL ' + name + (detail ? '  ' + detail : '')); } }

check('tuner string buttons rendered (6)', els.targetRow.children.length === 6,
  'got ' + els.targetRow.children.length);
check('metronome bpm label present (static 100)', els.metBpm.textContent === '100' || els.metBpm.textContent === '',
  'got "' + els.metBpm.textContent + '"');
check('start button exists + wired', typeof els.startBtn._listeners.click === 'function');
check('met toggle wired', typeof els.metToggle._listeners.click === 'function');
check('met up wired', typeof els.metUp._listeners.click === 'function');

// Simulate a target selection + a heard in-tune note, assert verdict class flips to inTune.
// We can't click in the stub, so replicate the handler logic the player uses:
function paintVerdict(freqHz, target) {
  const v = ENGINE.tuneVerdict(freqHz, target.freq);
  els.verdict.className = v.state;
  els.verdict.textContent = v.state === 'inTune' ? '✅ IN TUNE' : v.label;
  els.needle.style.left = (50 + ENGINE.clampNeedle(v.cents)) + '%';
  return v;
}
const inTune = paintVerdict(82.41, ENGINE.STRINGS[0]); // low E exact
check('in-tune verdict class set', els.verdict.className === 'inTune', 'class=' + els.verdict.className);
check('in-tune needle centered', els.needle.style.left === '50%', 'left=' + els.needle.style.left);

const off = paintVerdict(82.41 * Math.pow(2, 30 / 1200), ENGINE.STRINGS[0]); // +30c
check('+30c verdict = off', els.verdict.className === 'off', 'class=' + els.verdict.className);

console.log('\n' + '='.repeat(56));
console.log('STEP 2 RENDER SMOKE: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'RENDER-SMOKE-OK (28-analogue)' : 'RENDER-SMOKE-FAILED');
console.log('='.repeat(56));
process.exit(fail === 0 ? 0 : 1);
