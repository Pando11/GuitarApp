// stylisticExplorer.test.mjs — node self-test (prints PASS, exits 0).
import { exploreStyle, STYLE_LIBRARY } from './stylisticExplorer.js';
import assert from 'node:assert';

const out = exploreStyle('G - D - Em - C');
assert.ok(out.styleCategory, 'styleCategory present');
assert.ok(['folk', 'blues', 'punk', 'ballad'].includes(out.styleCategory), 'category is a style category, not an artist');
assert.ok(/^1 & 2 & 3 & 4 &$/.test(out.countsPerBar), 'valid counts-per-bar string');
assert.ok(out.pattern && out.arrows && out.rhythmFeel, 'pattern/arrows/rhythmFeel present');
assert.ok(Array.isArray(out.bar) && out.bar.length === 4, 'bar normalised to 4 chords');

// No artist-name leakage anywhere in the output.
const BANNED_ARTISTS = ['Cranberries', 'Chili', 'Skynyrd', 'AC/DC', 'Berry', 'Metallica',
  'Pink Floyd', 'Zeppelin', 'Newton', 'Traditional'];
const dump = JSON.stringify(out).toLowerCase();
for (const a of BANNED_ARTISTS) {
  assert.ok(!dump.includes(a.toLowerCase()), 'no artist name leakage: ' + a);
}

// explicit style override works
const folk = exploreStyle('G - D - Em - C', { styleCategory: 'folk' });
assert.equal(folk.styleCategory, 'folk');

// invalid explicit style falls back to a real library category
const fb = exploreStyle('Em - C', { styleCategory: 'nonexistent' });
assert.ok(STYLE_LIBRARY[fb.styleCategory], 'fallback yields a real library category');

// single-chord input still yields a valid counts string
const single = exploreStyle('Am');
assert.ok(/^1 & 2 & 3 & 4 &$/.test(single.countsPerBar));

console.log('stylisticExplorer PASS — category=' + out.styleCategory + ', counts=' + out.countsPerBar);

// --- mountStyleExplorer (TIER-1B task 2B) -----------------------------
// Extends this file rather than adding a sibling, per the task's own
// "or add a sibling" allowance combined with keeping one home for the
// exploreStyle()-family engine + view coverage. Uses jsdom (already a
// devDependency — see 07-app/test/app-smoke.mjs) because mountStyleExplorer
// builds real DOM nodes; everything above this point stays untouched.

import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mountStyleExplorer } from './styleExplorerView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');

function loadLessonJson(filename) {
  const raw = fs.readFileSync(path.join(lessonsDir, filename), 'utf8');
  return JSON.parse(raw);
}

// Fixture "lesson models" built the way lesson-runner.js's normalizeLesson()
// actually builds them: `model.chords = raw.chords` verbatim (see
// lesson-runner.js, normalizeLesson(): `const chords = raw && typeof
// raw.chords === "object" ... ? raw.chords : {}; ... model = {..., chords}`).
// Never inventing a progression here — these are the real per-lesson
// `chords` blocks shipped in 07-app/content/lessons/.
function lessonModelFrom(filename) {
  const raw = loadLessonJson(filename);
  return { lessonId: raw.lesson && raw.lesson.id, chords: raw.chords };
}

function freshContainer() {
  const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>');
  const doc = dom.window.document;
  return doc.getElementById('host');
}

// 1. Single-chord lesson (guitar-lesson-03-first-chord-em.json: chords = {Em}).
{
  const container = freshContainer();
  const model = lessonModelFrom('guitar-lesson-03-first-chord-em.json');
  assert.deepEqual(Object.keys(model.chords).filter((k) => k !== '_schema'), ['Em']);

  const handle = mountStyleExplorer(container, model);
  assert.ok(handle, 'mount returns a handle when the lesson has chords');
  assert.equal(handle.progression, 'Em', 'progression derived from the real chords block, not invented');

  const panel = container.querySelector('[data-testid="style-explorer-panel"]');
  assert.ok(panel, 'panel rendered');
  const progressionEl = container.querySelector('[data-testid="style-explorer-progression"]');
  assert.equal(progressionEl.textContent, 'Em');

  const tabs = container.querySelectorAll('.style-explorer__tab');
  assert.equal(tabs.length, 4, 'one tab per folk/blues/punk/ballad category');
  const tabStyles = Array.from(tabs).map((b) => b.getAttribute('data-style')).sort();
  assert.deepEqual(tabStyles, ['ballad', 'blues', 'folk', 'punk']);

  assert.ok(['folk', 'blues', 'punk', 'ballad'].includes(handle.getActiveStyle()));
  assert.ok(container.querySelector('[data-testid="style-explorer-arrows"]').textContent.length > 0);
  assert.ok(container.querySelector('[data-testid="style-explorer-counts"]').textContent.length > 0);
  assert.ok(container.querySelector('[data-testid="style-explorer-feel"]').textContent.length > 0);
}

// 2. Multi-chord progression lesson (guitar-lesson-13-four-chord-songs.json).
{
  const container = freshContainer();
  const model = lessonModelFrom('guitar-lesson-13-four-chord-songs.json');
  const handle = mountStyleExplorer(container, model);
  assert.ok(handle);
  // Progression order follows the lesson JSON's own chords-block key order —
  // never re-sorted or fabricated.
  const expected = Object.keys(model.chords).filter((k) => k !== '_schema').join(' - ');
  assert.equal(handle.progression, expected);

  // Flipping styles swaps the rendered card in place, no re-mount needed.
  const before = container.querySelector('[data-testid="style-explorer-arrows"]').textContent;
  const other = ['folk', 'blues', 'punk', 'ballad'].find((c) => c !== handle.getActiveStyle());
  handle.setActiveStyle(other);
  assert.equal(handle.getActiveStyle(), other);
  const after = container.querySelector('[data-testid="style-explorer-arrows"]').textContent;
  assert.ok(before !== after || STYLE_LIBRARY[other].arrows === before, 'card content follows the active tab');

  // Clicking a tab does the same thing a caller's setActiveStyle would.
  const remaining = ['folk', 'blues', 'punk', 'ballad'].find((c) => c !== other);
  const btn = container.querySelector('[data-style="' + remaining + '"]');
  btn.dispatchEvent(new container.ownerDocument.defaultView.Event('click', { bubbles: true }));
  assert.equal(handle.getActiveStyle(), remaining, 'tab click updates the active style');
}

// 3. Edge case: a lesson with no real chords yet (guitar-lesson-01, whose
// chords block is only `{ "_schema": ... }`) must render an honest empty
// state, not a fabricated progression.
{
  const container = freshContainer();
  const model = lessonModelFrom('guitar-lesson-01-welcome-anatomy-tuning.json');
  assert.deepEqual(Object.keys(model.chords).filter((k) => k !== '_schema'), []);

  const handle = mountStyleExplorer(container, model);
  assert.equal(handle, null, 'no chords means no explorer, not an invented one');
  assert.ok(!container.querySelector('[data-testid="style-explorer-panel"]'), 'no panel rendered');
  const empty = container.querySelector('[data-testid="style-explorer-empty"]');
  assert.ok(empty, 'honest empty state rendered instead');
  assert.ok(empty.textContent.length > 0);
}

// 4. Edge case: missing/undefined chords entirely (malformed or absent block)
// still degrades to the empty state rather than throwing or inventing input.
{
  const container = freshContainer();
  const handle = mountStyleExplorer(container, { lessonId: 'no-chords-at-all' });
  assert.equal(handle, null);
  assert.ok(container.querySelector('[data-testid="style-explorer-empty"]'));
}

// 5. Null container is handled gracefully (no throw).
{
  assert.equal(mountStyleExplorer(null, { chords: { Em: {} } }), null);
}

console.log('mountStyleExplorer PASS — real lesson chords -> real style cards, honest empty state on no chords');
process.exit(0);
