'use strict';
/*
 * render-smoke-step7.js — browser-free UI proof for the paywall demo.
 *
 * The browser tool BLOCKS file:// and there is no headless browser here, so we
 * extract the inline <script> from paywall-demo.html, run it against a hand-rolled
 * DOM stub, and assert the painted lock-state matches the PROVEN entitlement logic
 * (canAccessLesson) for free AND premium tiers. This catches real render bugs
 * (e.g. a free user shown L02 as UNLOCKED) without trusting a vision model.
 * Run: node render-smoke-step7.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');

let pass = 0, fail = 0;
function check(n, c, d) {
  if (c) { pass++; console.log('  OK   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); }
}

const html = fs.readFileSync(path.join(__dirname, 'paywall-demo.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
check('demo contains an inline script', !!m);

// --- minimal DOM stub ---
function makeEl() {
  return {
    _html: '', className: '', onclick: null,
    children: [],
    set innerHTML(v) { this._html = v; this.children = []; },
    get innerHTML() { return this._html; },
    appendChild(c) { this.children.push(c); },
    set textContent(v) { this._text = v; },
    get textContent() { return this._text; },
  };
}
const byId = {};
['lessons', 'status', 'buy', 'cancel', 'resub', 'trial'].forEach(id => { byId[id] = makeEl(); });

const sandbox = {
  document: {
    getElementById: id => byId[id] || makeEl(),
    createElement: () => makeEl(),
  },
  window: {},
  console,
  Date, Math, JSON, Object, Array, String, Number, RegExp, setTimeout: () => {},
};
sandbox.window = sandbox; // demo sets window.__store

vm.createContext(sandbox);
vm.runInContext(m[1], sandbox);

const store = sandbox.window.__store;
check('demo wired a real EntitlementStore', !!store && typeof store.canAccessLesson === 'function');

// Free tier: the lessons grid must paint L01 open and the rest locked.
function paintState() {
  // re-run render is internal; instead read what render() wrote to #lessons children
  const kids = byId['lessons'].children;
  const states = {};
  for (const k of kids) {
    const name = (k.innerHTML.match(/<div class="name">([^<]+)<\/div>/) || [])[1];
    const open = /UNLOCKED/.test(k.innerHTML);
    if (name) states[name] = open;
  }
  return states;
}
const freeStates = paintState();
check('FREE: L01 painted UNLOCKED', freeStates['L01'] === true);
check('FREE: L02 painted LOCKED (paywall)', freeStates['L02'] === false);
check('FREE: L20 painted LOCKED (paywall)', freeStates['L20'] === false);

// Premium tier: simulate the buy button firing, then re-read. The demo's render()
// is bound to the button; we invoke it via the stored onclick then re-inspect.
byId['buy'].onclick();
const premStates = paintState();
check('PREMIUM: L02 now UNLOCKED after sandbox buy', premStates['L02'] === true);
check('PREMIUM: L20 now UNLOCKED after sandbox buy', premStates['L20'] === true);
check('PREMIUM: L01 still UNLOCKED', premStates['L01'] === true);

// Cancel reverts the painted state back to locked premium lessons.
byId['cancel'].onclick();
const cancelled = paintState();
check('CANCEL: L02 locks again', cancelled['L02'] === false);
check('CANCEL: L01 stays open', cancelled['L01'] === true);

// Status line must reflect the tier truth (no false "PREMIUM" for a free user).
check('status text reflects FREE for free user after cancel', /FREE/.test(byId['status'].innerHTML));

console.log('\n' + '='.repeat(60));
console.log('STEP 7 RENDER-SMOKE: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'RENDER-SMOKE-OK' : 'STEP 7 RENDER-SMOKE FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
