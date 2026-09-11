// practiceRemixView.js — Wave 2 task 2A (docs/plans/TIER-1B-close-the-gaps.md).
//
// View module that surfaces practiceRemix.js's three framings (Tempo
// challenge / Play-along groove / Calm slow) as a chooser the student sees
// before a drill starts, sourced from REAL weak-pair + rate-per-min +
// engagement data already flowing through practiceFluencyBridge.js /
// practiceStore.js — the same data T1.6's practice screen uses.
//
// Exports mountPracticeRemix(container, practiceStore). Renders plain DOM
// (no framework, no build step) into `container`. A later wave (Wave 4)
// wires this into 07-app/index.html and drillRunner.js; this module does
// not touch either.
//
// Rule 5 (AGENTS.md / docs/plans/README.md): every number shown here traces
// to a real recorded value (practiceStore.getWeakPairs() / sessions
// attempts) or to practiceRemix.js's own already-verdicted internal
// defaults — this view never fabricates a weak pair or a rate. When there
// is no real weak-pair drill data yet (a brand-new student), it renders an
// honest empty state instead — the same "no-data" degrade pattern
// weeklyPlan.js's buildWeeklyPlan() already uses.

import { remixPlan } from './practiceRemix.js';
import { parsePair } from './pairKey.js';
import { displayChord } from './chord-canon.js';

// ---------------------------------------------------------------------------
// Real-data sourcing (no invented numbers).
// ---------------------------------------------------------------------------

// getWeakPairs() entries are PracticeStore's real shape
// ({pair, fluency, samples} — see practiceFluencyBridge.js/fluencyStore.js),
// but accept a bare string too (same defensive read drillRunner.js's
// selectPracticePair() already does against this exact API).
function weakPairKeyOf(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  return entry.pair || entry.pairKey || entry.key || null;
}

// The most recent recorded attempt for a given pairKey, scanning
// practiceStore.sessions (real per-attempt data written by
// PracticeStore.recordDrillResult — practiceStore.js). The fluency store
// itself only keeps the EMA-blended fluency score (fluencyStore.js), not the
// raw per-minute rate, so this is how a real ratePerMin is recovered for
// display instead of guessed at.
function mostRecentAttemptForPair(practiceStore, pairKeyStr) {
  const sessions = (practiceStore && practiceStore.sessions) || [];
  let best = null;
  for (const s of sessions) {
    const attempts = (s && s.attempts) || [];
    for (const a of attempts) {
      if (!a || a.pairKey !== pairKeyStr) continue;
      if (typeof a.ratePerMin !== 'number' && typeof a.cleanChanges !== 'number') continue;
      if (!best || (a.ts || 0) >= (best.ts || 0)) best = a;
    }
  }
  return best;
}

// Real engagement signal from the most recent session: its recorded
// duration (durationSec, set by PracticeStore.finalizeSession) and the
// clean-change volume actually logged in it (or, failing that, a plain
// count of 'pass' verdicts already recorded). Counts and timings only — no
// mood/personality inference, matching practiceRemix.js's own contract.
function recentEngagement(practiceStore) {
  const sessions = (practiceStore && practiceStore.sessions) || [];
  if (!sessions.length) return { recentCleanChanges: 0, lastSessionMs: 0 };
  const last = sessions[sessions.length - 1];
  const lastSessionMs = Number.isFinite(last.durationSec) ? last.durationSec * 1000 : 0;
  const attempts = last.attempts || [];
  let recentCleanChanges = attempts.reduce(
    (sum, a) => sum + (a && typeof a.cleanChanges === 'number' ? a.cleanChanges : 0),
    0
  );
  if (recentCleanChanges === 0) {
    recentCleanChanges = attempts.filter((a) => a && a.verdict === 'pass').length;
  }
  return { recentCleanChanges, lastSessionMs };
}

// Build the { plan, engagement } input remixPlan() needs, from real
// PracticeStore data only — or return null when there is genuinely no
// weak-pair drill data yet (a brand-new student, or one who has only logged
// chord-shape attempts with no pair drill ever recorded).
export function buildRemixInput(practiceStore) {
  let weak = [];
  try {
    weak = (practiceStore && typeof practiceStore.getWeakPairs === 'function')
      ? (practiceStore.getWeakPairs(1) || [])
      : [];
  } catch (e) {
    weak = [];
  }
  const top = weak[0];
  // fluencyStore.js seeds every known pair at samples:0/fluency:0 as a
  // cold-start placeholder (see fluencyStore.js createFluencyStore) — that
  // is not a real measurement, so samples > 0 is the honest data/no-data
  // line, not merely "an entry exists".
  if (!top || !(top.samples > 0)) return null;

  const pairKeyStr = weakPairKeyOf(top);
  if (!pairKeyStr) return null;

  let parsed;
  try {
    parsed = parsePair(pairKeyStr);
  } catch (e) {
    return null;
  }
  if (!parsed || !parsed.a || !parsed.b) return null;

  const weakPair = displayChord(parsed.a) + '↔' + displayChord(parsed.b); // '↔'

  const attempt = mostRecentAttemptForPair(practiceStore, pairKeyStr);
  const ratePerMin = attempt
    ? (typeof attempt.ratePerMin === 'number' ? attempt.ratePerMin : attempt.cleanChanges)
    : null;

  const plan = { weakPair };
  if (typeof top.fluency === 'number') plan.fluency = top.fluency;
  if (typeof ratePerMin === 'number') plan.ratePerMin = ratePerMin;

  const engagement = recentEngagement(practiceStore);
  return { plan, engagement };
}

// ---------------------------------------------------------------------------
// Plain DOM rendering. Class names are descriptive placeholders — a later
// wave drops the real 07-app/index.html practice-screen CSS classes onto
// these same elements; nothing here depends on a stylesheet existing.
// ---------------------------------------------------------------------------

function ownerDoc(node) {
  return (node && node.ownerDocument) || (typeof document !== 'undefined' ? document : null);
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function renderEmptyState(container) {
  const doc = ownerDoc(container);
  clear(container);
  const wrap = doc.createElement('div');
  wrap.className = 'practice-remix practice-remix-empty';
  wrap.setAttribute('data-state', 'no-data');
  const p = doc.createElement('p');
  p.className = 'practice-remix-empty-text';
  p.textContent = 'Practice a weak chord pair once and your remix options '
    + '— Tempo challenge, Play-along groove, Calm slow — will show up here.';
  wrap.appendChild(p);
  container.appendChild(wrap);
}

function renderDetail(detailEl, framing) {
  const doc = ownerDoc(detailEl);
  clear(detailEl);
  const h = doc.createElement('h4');
  h.className = 'practice-remix-detail-name';
  h.textContent = framing.name;
  const unit = doc.createElement('p');
  unit.className = 'practice-remix-detail-unit';
  unit.textContent = framing.unit;
  const note = doc.createElement('p');
  note.className = 'practice-remix-detail-note';
  note.textContent = framing.note;
  const seq = doc.createElement('ul');
  seq.className = 'practice-remix-detail-sequence';
  framing.sequence.forEach((step) => {
    const li = doc.createElement('li');
    li.className = 'practice-remix-detail-step';
    li.textContent = String(step);
    seq.appendChild(li);
  });
  detailEl.appendChild(h);
  detailEl.appendChild(unit);
  detailEl.appendChild(note);
  detailEl.appendChild(seq);
}

// Renders the three-card chooser plus a detail panel for whichever framing
// is currently active. Returns { setActive } so click handlers and the
// mount() caller share one code path.
function renderChooser(container, remix) {
  const doc = ownerDoc(container);
  clear(container);

  const wrap = doc.createElement('div');
  wrap.className = 'practice-remix';
  wrap.setAttribute('data-state', 'ready');

  const heading = doc.createElement('div');
  heading.className = 'practice-remix-heading';
  heading.textContent = 'Remix this practice: ' + remix.weakPair;
  wrap.appendChild(heading);

  const cardRow = doc.createElement('div');
  cardRow.className = 'practice-remix-cards';
  wrap.appendChild(cardRow);

  const detail = doc.createElement('div');
  detail.className = 'practice-remix-detail';
  wrap.appendChild(detail);

  const cardsById = {};

  function setActive(id) {
    const framing = remix.framings.find((f) => f.id === id);
    if (!framing) return;
    Object.keys(cardsById).forEach((fid) => {
      const btn = cardsById[fid];
      const isActive = fid === id;
      btn.classList.toggle('is-selected', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    renderDetail(detail, framing);
  }

  remix.framings.forEach((framing) => {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'practice-remix-card';
    btn.setAttribute('data-framing-id', framing.id);
    btn.setAttribute('aria-pressed', 'false');

    const isRecommended = framing.id === remix.selectedId;
    if (isRecommended) btn.classList.add('practice-remix-card-recommended');

    const name = doc.createElement('span');
    name.className = 'practice-remix-card-name';
    name.textContent = framing.name;
    btn.appendChild(name);

    const unit = doc.createElement('span');
    unit.className = 'practice-remix-card-unit';
    unit.textContent = framing.unit;
    btn.appendChild(unit);

    if (isRecommended) {
      const badge = doc.createElement('span');
      badge.className = 'practice-remix-card-badge';
      badge.textContent = 'Recommended for you';
      btn.appendChild(badge);
    }

    btn.addEventListener('click', () => setActive(framing.id));
    cardRow.appendChild(btn);
    cardsById[framing.id] = btn;
  });

  container.appendChild(wrap);
  // Pre-highlight + show detail for the engagement-selected framing, but
  // let the student click through to either of the other two.
  setActive(remix.selectedId);

  return { setActive };
}

// mountPracticeRemix(container, practiceStore) — the Wave 4 seam. Reads real
// weak-pair/rate/engagement data via buildRemixInput(), calls
// practiceRemix.js's remixPlan(), and renders a three-card chooser with the
// engagement-selected framing pre-highlighted (student can still click any
// of the three). Renders an honest no-data state when the student has no
// real weak-pair drill data yet.
export function mountPracticeRemix(container, practiceStore) {
  if (!container) return null;

  const input = buildRemixInput(practiceStore);
  if (!input) {
    renderEmptyState(container);
    return { container, remix: null, state: 'no-data' };
  }

  const remix = remixPlan(input.plan, input.engagement);
  const controls = renderChooser(container, remix);
  return {
    container,
    remix,
    state: 'ready',
    selectFraming: controls.setActive,
  };
}

export default mountPracticeRemix;
