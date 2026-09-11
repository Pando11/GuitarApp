// practiceRemix.test.mjs — node self-test (prints PASS, exits 0).
import { remixPlan, FRAMING_IDS } from './practiceRemix.js';
import assert from 'node:assert';

// ---------------------------------------------------------------------------
// Wave 2 task 2A extension: mountPracticeRemix (practiceRemixView.js).
// Uses the REAL PracticeStore (practiceStore.js) + real pairKey() so the
// fixtures below prove the view sources actual stored data end to end, not
// a hand-rolled shape. Uses jsdom (already a devDependency — see
// 07-app/test/app-smoke.mjs) for the container, since mountPracticeRemix
// builds real DOM.
import { JSDOM } from 'jsdom';
import { PracticeStore } from './practiceStore.js';
import { pairKey } from './pairKey.js';
import { mountPracticeRemix, buildRemixInput } from './practiceRemixView.js';

const plan = { weakPair: 'G↔D', fluency: 0.25, ratePerMin: 15, diagnostic: 30, goal: 60 };
const engagement = { recentCleanChanges: 12, lastSessionMs: 300000 };

const out = remixPlan(plan, engagement);

// 3 framings produced
assert.equal(out.framings.length, 3, 'must produce 3 framings');
assert.deepEqual(out.framings.map((f) => f.id), FRAMING_IDS, 'framing ids must be tempo/groove/calm');

// ONE selected
assert.ok(out.selected, 'a framing must be selected');
assert.ok(['tempo', 'groove', 'calm'].includes(out.selectedId), 'selectedId is one of the three');

// output references only real inputs (weak pair + rate come from the plan)
assert.equal(out.weakPair, 'G↔D', 'weakPair must mirror the plan input');
assert.equal(out.ratePerMin, 15, 'ratePerMin must mirror the plan input');
assert.equal(out.fluency, 0.25, 'fluency must mirror the plan input');
for (const f of out.framings) {
  assert.equal(f.weakPair, 'G↔D', 'every framing references the real weak pair');
  assert.ok((f.weakPair + ' ' + f.unit + ' ' + f.note).includes('G') &&
    (f.weakPair + ' ' + f.unit + ' ' + f.note).includes('D'),
    'framing references real chords G and D from the plan');
  // engagement-only selection: no personality/mood inference words
  assert.ok(!/mood|personality|feels? (?:like|tired|lazy|happy|sad)|talent/i.test(JSON.stringify(f)),
    'no mood/personality inference');
}

// engagement-only selection: short session -> calm
const calmOut = remixPlan(plan, { recentCleanChanges: 5, lastSessionMs: 20000 });
assert.equal(calmOut.selectedId, 'calm', 'short session selects calm');
// high recent volume -> tempo
const tempoOut = remixPlan(plan, { recentCleanChanges: 40, lastSessionMs: 600000 });
assert.equal(tempoOut.selectedId, 'tempo', 'high recent volume selects tempo');

console.log('practiceRemix PASS — 3 framings, selected=' + out.selectedId +
  ', weakPair=' + out.weakPair + ', rate=' + out.ratePerMin + '/min');

// ---------------------------------------------------------------------------
// mountPracticeRemix / buildRemixInput (practiceRemixView.js)
// ---------------------------------------------------------------------------

function makeContainer() {
  const dom = new JSDOM('<!doctype html><body></body>');
  const doc = dom.window.document;
  const container = doc.createElement('div');
  doc.body.appendChild(container);
  return container;
}

// --- 1. Brand-new student: no drill data at all -> honest empty state, ----
//        never a fabricated weak pair or rate.
{
  const store = new PracticeStore();
  assert.equal(buildRemixInput(store), null, 'no drill data yet -> buildRemixInput returns null, not a guess');

  const container = makeContainer();
  const handle = mountPracticeRemix(container, store);
  assert.equal(handle.state, 'no-data', 'mount reports no-data state for a brand-new student');
  assert.equal(handle.remix, null, 'no fabricated remix plan when there is no real data');
  const emptyEl = container.querySelector('[data-state="no-data"]');
  assert.ok(emptyEl, 'renders a no-data empty state element');
  assert.ok(!/\d/.test(emptyEl.textContent), 'empty state never shows an invented number');
  console.log('mountPracticeRemix PASS — honest empty state for a new student, no invented numbers');
}

// --- 2. mountPracticeRemix(null, store) does not throw. -------------------
{
  const store = new PracticeStore();
  let threw = false;
  try { mountPracticeRemix(null, store); } catch (e) { threw = true; }
  assert.ok(!threw, 'mountPracticeRemix(null, store) must not throw');
}

// --- 3. Real drill data recorded -> real weak pair/rate flow through, ------
//        chooser renders 3 cards, engagement-selected one pre-highlighted,
//        and the student can click through to either of the other two.
{
  const store = new PracticeStore();
  const key = pairKey('G', 'D'); // real canon pair key, same fn drillRunner.js uses
  store.recordDrillResult({ pairKey: key, ratePerMin: 22, cleanChanges: 12, drillId: 'weak-pair-review', passed: true, score: 0.6 });

  const input = buildRemixInput(store);
  assert.ok(input, 'a recorded drill result produces real remix input');
  assert.equal(input.plan.weakPair, 'D↔G', 'weakPair is built from the real recorded pair (D<G alpha order)');
  assert.equal(input.plan.ratePerMin, 22, 'ratePerMin is the real recorded rate, not invented');
  assert.equal(typeof input.plan.fluency, 'number', 'fluency is the real EMA score from fluencyStore.js');
  // moderate recentCleanChanges (12), no finalized short session -> groove
  assert.equal(input.engagement.recentCleanChanges, 12, 'recentCleanChanges comes from the real recorded cleanChanges');

  const container = makeContainer();
  const handle = mountPracticeRemix(container, store);
  assert.equal(handle.state, 'ready', 'mount reports ready state once real data exists');
  assert.ok(handle.remix, 'remix plan is produced from real data');
  assert.equal(handle.remix.selectedId, 'groove', 'moderate engagement with no short session selects groove');

  const cards = container.querySelectorAll('[data-framing-id]');
  assert.equal(cards.length, 3, 'renders exactly 3 framing cards');
  const ids = Array.from(cards).map((c) => c.getAttribute('data-framing-id')).sort();
  assert.deepEqual(ids, FRAMING_IDS.slice().sort(), 'card ids are exactly tempo/groove/calm');

  const recommended = container.querySelector('.practice-remix-card-recommended');
  assert.ok(recommended, 'the engagement-selected framing is visually pre-highlighted');
  assert.equal(recommended.getAttribute('data-framing-id'), 'groove', 'the pre-highlighted card matches the engagement-selected framing');
  assert.equal(recommended.getAttribute('aria-pressed'), 'true', 'the pre-highlighted card starts active');

  // Click through to a different framing.
  const tempoCard = container.querySelector('[data-framing-id="tempo"]');
  tempoCard.dispatchEvent(new container.ownerDocument.defaultView.Event('click', { bubbles: true }));
  assert.equal(tempoCard.getAttribute('aria-pressed'), 'true', 'clicking a different card makes it active');
  assert.equal(container.querySelector('[data-framing-id="groove"]').getAttribute('aria-pressed'), 'false', 'the previously active card is deactivated on click-through');
  const detailName = container.querySelector('.practice-remix-detail-name');
  assert.equal(detailName.textContent, 'Tempo challenge', 'detail panel updates to the clicked framing');
  assert.ok(recommended.classList.contains('practice-remix-card-recommended'), 'the recommendation badge stays on the engagement pick even after clicking another card');

  console.log('mountPracticeRemix PASS — real weak pair/rate flow through, 3 cards, pre-highlight + click-through work');
}

// --- 4. High recent clean-change volume -> tempo is recommended. ----------
{
  const store = new PracticeStore();
  const key = pairKey('C', 'Em');
  store.recordDrillResult({ pairKey: key, ratePerMin: 40, cleanChanges: 35, drillId: 'weak-pair-review', passed: true, score: 0.8 });
  const handle = mountPracticeRemix(makeContainer(), store);
  assert.equal(handle.remix.selectedId, 'tempo', 'high recent clean-change volume selects tempo');
}

// --- 5. A short finalized session -> calm is recommended. -----------------
{
  const store = new PracticeStore();
  const key = pairKey('Am', 'G');
  store.recordDrillResult({ pairKey: key, ratePerMin: 18, cleanChanges: 10, drillId: 'weak-pair-review', passed: false, score: 0.3 });
  const lastSession = store.sessions[store.sessions.length - 1];
  store.finalizeSession(lastSession.id, { completed: true, durationSec: 30 }); // 30s < 60s -> calm
  const handle = mountPracticeRemix(makeContainer(), store);
  assert.equal(handle.remix.selectedId, 'calm', 'a short recorded session selects calm');
}

console.log('practiceRemixView PASS — mountPracticeRemix sources real data, degrades honestly with no data');
process.exit(0);
