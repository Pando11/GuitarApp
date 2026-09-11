// styleExplorerView.js — "try it a different way" panel for a lesson step.
//
// Why this file exists (2026-09-10, TIER-1B task 2B): stylisticExplorer.js's
// exploreStyle() has been complete and unit-tested since it was ported from
// 06-prototypes/song-styles-q5-prototype.html, and nothing in the shipping
// app imported it. This is the missing view, not new music logic — every
// card shown here comes straight out of that engine, which is untouched.
//
// Rule 5 / real-content discipline: the chord or progression shown is read
// out of the lesson's own `chords` block (lessonModel.chords, the exact
// object lesson-runner.js's normalizeLesson() puts on the model — see
// lesson-runner.js's `const chords = raw.chords ...; model = {..., chords}`).
// Nothing here invents a progression a lesson doesn't actually teach. If a
// lesson has no chords yet, this renders an honest empty state and nothing
// else (see e.g. guitar-lesson-01-welcome-anatomy-tuning.json, whose
// `chords` block is just `{ "_schema": ... }`).
//
// Wiring note for whichever wave adds the call site: this module exports a
// pure `mountStyleExplorer(container, lessonModel)` and touches no ids in
// index.html, so it does not collide with lesson-runner.js's own rendering.

import { exploreStyle, STYLE_LIBRARY } from './stylisticExplorer.js';

const CATEGORIES = Object.keys(STYLE_LIBRARY);

// lessonModel.chords is the object lesson-runner.js's normalizeLesson()
// copies verbatim from the raw lesson JSON's `chords` block. Its keys are
// the chord names the lesson teaches, in the JSON's own order, plus a
// `_schema` documentation key that is never a chord.
function deriveProgression(lessonModel) {
  const chords =
    lessonModel && typeof lessonModel.chords === 'object' && lessonModel.chords !== null
      ? lessonModel.chords
      : {};
  const names = Object.keys(chords).filter((k) => k !== '_schema');
  return names.join(' - ');
}

function renderEmptyState(doc, container) {
  container.innerHTML = '';
  const empty = doc.createElement('div');
  empty.className = 'style-explorer style-explorer--empty';
  empty.setAttribute('data-testid', 'style-explorer-empty');
  empty.textContent =
    "This lesson doesn't have a chord or progression yet, so there's nothing to try a different way.";
  container.appendChild(empty);
}

function renderCard(doc, cardHost, progression, styleCategory) {
  const out = exploreStyle(progression, { styleCategory });
  cardHost.innerHTML = '';
  cardHost.setAttribute('data-active-style', out.styleCategory);

  const title = doc.createElement('div');
  title.className = 'style-explorer__card-title';
  title.textContent = out.styleCategory;
  cardHost.appendChild(title);

  const arrows = doc.createElement('div');
  arrows.className = 'style-explorer__arrows';
  arrows.setAttribute('data-testid', 'style-explorer-arrows');
  arrows.textContent = out.arrows;
  cardHost.appendChild(arrows);

  const counts = doc.createElement('div');
  counts.className = 'style-explorer__counts';
  counts.setAttribute('data-testid', 'style-explorer-counts');
  counts.textContent = out.countsPerBar;
  cardHost.appendChild(counts);

  const feel = doc.createElement('div');
  feel.className = 'style-explorer__feel';
  feel.setAttribute('data-testid', 'style-explorer-feel');
  feel.textContent = out.rhythmFeel;
  cardHost.appendChild(feel);

  return out;
}

/**
 * Renders a "try it a different way" panel into `container`: the folk /
 * blues / punk / ballad strum-pattern cards for the chord or progression
 * `lessonModel` is actually teaching, with tabs to flip between them.
 *
 * @param {Element} container - empty-able host element (its content is replaced)
 * @param {Object} lessonModel - the model produced by lesson-runner.js's
 *   normalizeLesson(); only `lessonModel.chords` is read.
 * @returns {null|{progression: string, getActiveStyle: () => string, setActiveStyle: (cat: string) => void}}
 *   null when the lesson has no chords to explore (honest empty state was
 *   rendered instead); otherwise a small handle for tests/callers.
 */
export function mountStyleExplorer(container, lessonModel) {
  if (!container) return null;
  const doc = container.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return null;

  const progression = deriveProgression(lessonModel);
  if (!progression) {
    renderEmptyState(doc, container);
    return null;
  }

  container.innerHTML = '';

  const panel = doc.createElement('div');
  panel.className = 'style-explorer';
  panel.setAttribute('data-testid', 'style-explorer-panel');

  const heading = doc.createElement('h3');
  heading.className = 'style-explorer__heading';
  heading.textContent = 'Try it a different way';
  panel.appendChild(heading);

  const sub = doc.createElement('p');
  sub.className = 'style-explorer__progression';
  sub.setAttribute('data-testid', 'style-explorer-progression');
  sub.textContent = progression;
  panel.appendChild(sub);

  const tabs = doc.createElement('div');
  tabs.className = 'style-explorer__tabs';
  tabs.setAttribute('role', 'tablist');
  panel.appendChild(tabs);

  const cardHost = doc.createElement('div');
  cardHost.className = 'style-explorer__card';
  panel.appendChild(cardHost);

  // Default category comes from exploreStyle's own deterministic pick for
  // this progression, so the initial card matches what exploreStyle(input)
  // alone would have shown before any tab is touched.
  let active = exploreStyle(progression).styleCategory;

  function paint() {
    renderCard(doc, cardHost, progression, active);
    Array.from(tabs.children).forEach((btn) => {
      const isActive = btn.getAttribute('data-style') === active;
      btn.setAttribute('aria-selected', String(isActive));
      btn.classList.toggle('is-active', isActive);
    });
  }

  CATEGORIES.forEach((cat) => {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'style-explorer__tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('data-style', cat);
    btn.setAttribute('data-testid', 'style-explorer-tab-' + cat);
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      active = cat;
      paint();
    });
    tabs.appendChild(btn);
  });

  paint();
  container.appendChild(panel);

  return {
    progression,
    getActiveStyle: () => active,
    setActiveStyle: (cat) => {
      if (STYLE_LIBRARY[cat]) {
        active = cat;
        paint();
      }
    },
  };
}

export default mountStyleExplorer;
