/*
 * STEP 3 — HEADLESS RENDER SMOKE TEST
 * The browser tool blocks file:// URLs, so the player's DOM path is exercised
 * against a minimal DOM stub: boot, render, swap teachers, advance, re-render.
 * Proves the UI code actually runs and paints the right values — no browser.
 * Run: node render-smoke.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var pass = 0, fail = 0;
function ok(n, c, d) {
  if (c) { pass++; console.log('  OK   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); }
}

/* ---- minimal DOM stub ---- */
function makeEl(id) {
  return {
    id: id, textContent: '', innerHTML: '', value: '', children: [],
    style: { width: '', display: '', opacity: '' },
    appendChild: function (c) { this.children.push(c); },
    onclick: null, onchange: null
  };
}
var els = {};
[ 'lessonSel','teacherSel','hireBtn','teacherCard','playBtn','prevBtn','nextBtn','resetBtn',
  'log','handoff','avatarSvg','sceneKind','personaLine','caption','barFill','posText',
  'fretWrap','auditTbl','lessonTag' ].forEach(function (id) { els[id] = makeEl(id); });

var tbody = makeEl('tbody');
var document_ = {
  getElementById: function (id) { return els[id] || (els[id] = makeEl(id)); },
  querySelector: function (sel) { return sel.indexOf('tbody') !== -1 ? tbody : makeEl('q'); },
  createElement: function () { return makeEl('opt'); },
  documentElement: { style: { setProperty: function (k, v) { docVars[k] = v; } } }
};
var docVars = {};
var timers = [];
var sandbox = {
  console: console, Math: Math, JSON: JSON, Array: Array, Object: Object,
  parseInt: parseInt, isFinite: isFinite, String: String, Number: Number,
  document: document_,
  setInterval: function (fn) { timers.push(fn); return timers.length; },
  clearInterval: function () {},
  __hooks: null
};

var html = fs.readFileSync(path.join(__dirname, 'player3.html'), 'utf8');
var src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

vm.createContext(sandbox);
var err = null;
try {
  vm.runInContext(src + '\n;__hooks = {S:S, hire:hire, render:render, tick:tick, TEACHERS:TEACHERS, LESSONS:LESSONS};', sandbox);
} catch (e) { err = e; }

ok('player script boots against a DOM (no runtime error)', err === null, err && err.message);
if (err) { process.exit(1); }

var H = sandbox.__hooks;

/* ---- boot state ---- */
ok('boot logged CONTENT-IDENTICAL-OK for 3 teachers', /CONTENT-IDENTICAL-OK/.test(els.log.textContent));
ok('boot logged LIPSYNC-SILENCE-OK', /LIPSYNC-SILENCE-OK/.test(els.log.textContent));
ok('lesson dropdown populated', els.lessonSel.children.length === Object.keys(H.LESSONS).length);
ok('teacher dropdown populated with 3 teachers', els.teacherSel.children.length === 3);
ok('caption painted on load', els.caption.textContent.length > 20);
ok('scene kind painted', els.sceneKind.textContent === 'intro');
ok('persona line painted', els.personaLine.textContent === H.TEACHERS.T1.persona_lines.intro);
ok('lesson tag shows the real lessonId', /L01-faster-chord-changes/.test(els.lessonTag.textContent));
ok('teacher card shows the real NAME + teaching style',
  /Maggie Cole/.test(els.teacherCard.innerHTML) &&
  /thirty-four/.test(els.teacherCard.innerHTML));
ok('teacher dropdown labels use real names', els.teacherSel.children.some(function (c) {
  return /Maggie Cole/.test(c.textContent);
}));
ok('theme vars applied from the teacher palette', docVars['--t-primary'] === '#4ea1ff');

/* ---- fretboard SVG actually drawn ---- */
var svg = els.fretWrap.innerHTML;
ok('fretboard SVGs rendered', (svg.match(/<svg/g) || []).length >= 5);
ok('fretboard uses circles for fretted notes', /<circle/.test(svg));
ok('muted strings drawn as ×', /×/.test(svg));

/* read dot coordinates BACK to string+fret (never trust a vision model) */
var PAD_L = 18, PAD_T = 34, COL = 16, ROW = 22;
function readBack(svgStr) {
  var out = [];
  var re = /<circle cx="([\d.]+)" cy="([\d.]+)" r="7\.2"/g, m;
  while ((m = re.exec(svgStr))) {
    var s = Math.round((parseFloat(m[1]) - PAD_L) / COL);
    var f = Math.round((parseFloat(m[2]) - PAD_T) / ROW + 0.5);
    out.push([s, f]);
  }
  return out;
}
/* Em is the first chord of L01: frets [0,2,2,0,0,0] -> dots on string idx 1 & 2, fret 2 */
var firstChordSvg = svg.split('<svg')[1];
var dots = readBack('<svg' + firstChordSvg);
ok('E minor dots read back as string1/fret2 + string2/fret2 (coordinate read-back)',
  JSON.stringify(dots) === JSON.stringify([[1, 2], [2, 2]]), JSON.stringify(dots));

/* ---- advance + swap ---- */
for (var i = 0; i < 30; i++) { H.tick(); }          // 3s into the lesson
var posBefore = els.posText.textContent;
var sceneBefore = H.S.sceneIndex, msBefore = H.S.elapsedInSceneMs;
var fretBefore = els.fretWrap.innerHTML.replace(/var\(--t-primary\)/g, 'C');

H.hire('T2');
ok('swap to T2: scene index held', H.S.sceneIndex === sceneBefore);
ok('swap to T2: elapsed held', H.S.elapsedInSceneMs === msBefore);
ok('swap to T2: handoff banner shown', els.handoff.style.display === 'block' &&
  /new student/i.test(els.handoff.textContent));
ok('swap to T2: theme changed to the zen palette', docVars['--t-primary'] === '#7ed6a5');
ok('swap to T2: persona line changed', els.personaLine.textContent === H.TEACHERS.T2.persona_lines[H.S.view.scenes[H.S.sceneIndex].kind]);
ok('swap to T2: fretboard data unchanged',
  els.fretWrap.innerHTML.replace(/var\(--t-primary\)/g, 'C') === fretBefore);
ok('swap to T2: audit row written', /T1/.test(tbody.innerHTML) && /T2/.test(tbody.innerHTML));

H.hire('T3');
H.hire('T1');
ok('3 swaps recorded in the audit table', (tbody.innerHTML.match(/<tr>/g) || []).length === 3);
ok('after 3 swaps position still held', H.S.sceneIndex === sceneBefore && H.S.elapsedInSceneMs === msBefore);
ok('after 3 swaps position text identical', els.posText.textContent === posBefore);
ok('all 3 audit rows share the same content hash',
  (function () {
    var hs = tbody.innerHTML.match(/<td>([0-9a-f]{8})<\/td>/g) || [];
    return hs.length === 3 && hs[0] === hs[1] && hs[1] === hs[2];
  })());

/* ---- avatar mouth is driven by the lipsync envelope ---- */
var mouths = [];
for (var k = 0; k < 12; k++) {
  H.tick();
  var mm = els.avatarSvg.innerHTML.match(/<rect x="39" y="([\d.]+)" width="22" height="([\d.]+)"/);
  if (mm) { mouths.push(parseFloat(mm[2])); }
}
ok('avatar mouth height VARIES over time (lip-sync animating)',
  new Set(mouths).size > 1, JSON.stringify(mouths));

console.log('\n' + (fail === 0
  ? 'RENDER-SMOKE-OK (' + pass + '/' + (pass + fail) + ')'
  : 'RENDER SMOKE FAIL (' + pass + '/' + (pass + fail) + ', ' + fail + ' failed)'));
process.exit(fail === 0 ? 0 : 1);
