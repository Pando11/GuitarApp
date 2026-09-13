// openingGreeting.js — Ticket 8 (issue #11): Sage's opening greeting.
//
// Pure and DOM-free (mirrors sageCoach.js's contract): reads ONLY numbers
// already stored in a PracticeStore, and optionally a PracticeTimer
// instance's own public state, and produces the lines Sage opens a session
// with. Never invents a fact, a diagnosis, or a piece of history that isn't
// actually in the store (Rule 5/6). A store with zero sessions — exactly
// the state every device is in right after practiceStore.js's
// wipeAllStoredData() (Wave 1) — gets a clean, honest first-time greeting,
// never a broken reference to history that doesn't exist.
//
// Also builds the (equally pure) HTML for the greeting panel, which is the
// SPOKEN ENTRANCE into the existing tuner UI (listenView.js's
// openListenView()) that issue #11 asks for: a line of Sage's own dialogue
// ("let's check your tuning first") with an actual control behind it, not a
// manual "Tune & listen" menu item. lesson-runner.js (the caller) inserts
// this HTML into the DOM and wires the control's click to
// window.GuitarApp.ListenView.openListenView() — this file never touches
// the DOM itself, same division of labor renderLessonHTML/wireCoachButton
// already use in lesson-runner.js.

import { canonChord, displayChord } from './chord-canon.js';

// A gap of this many calendar days or more since the last recorded session
// gets the "returning after absence" beat instead of the ordinary "last
// time" recap. Chosen here (not specified by issue #11): long enough that
// "last time" framing would read oddly, short enough that a couple of
// skipped days still gets a welcome-back rather than being treated as a
// routine same-week return.
export const ABSENCE_DAYS_THRESHOLD = 3;

// The id of the button that is Sage's spoken entrance into the tuner.
// Exported so lesson-runner.js's wiring code and this file's own render
// function never spell it two different ways, and so a test can assert
// against the exact control issue #11 requires.
export const TUNING_ENTRY_ID = 'sage-tuning-entry';

function dayKeyOf(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Calendar-day difference, not a raw 24h-bucket count, so "yesterday
// evening" to "this morning" reads as 1 day, matching practiceStore.js's
// own streak-day semantics (todayKey/dateDiffDays) rather than a stricter
// elapsed-milliseconds count that would call that same case "0 days".
function calendarDayDiff(fromTs, toTs) {
  const a = new Date(dayKeyOf(fromTs));
  const b = new Date(dayKeyOf(toTs));
  return Math.round((b - a) / 86400000);
}

// The most recently attempted chord across all stored sessions, newest
// session/attempt first, displayed with the same learner-facing label
// sageCoach.js's numbers already key by (canonChord/displayChord) so "Last
// time you were working on easyC" and the skill map's own "easyC" agree.
function lastAttemptedChordDisplay(sessions) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const attempts = (sessions[i] && sessions[i].attempts) || [];
    for (let j = attempts.length - 1; j >= 0; j--) {
      const name = attempts[j] && attempts[j].chordName;
      if (name) return displayChord(canonChord(name));
    }
  }
  return null;
}

function attemptsSince(sessions, sinceTs) {
  let n = 0;
  for (const s of sessions) {
    for (const a of (s.attempts || [])) {
      if (typeof a.ts === 'number' && a.ts >= sinceTs) n++;
    }
  }
  return n;
}

function plural(n, word) { return n === 1 ? `1 ${word}` : `${n} ${word}s`; }

// The practice-timer line, if any. Additive and optional: practiceTimer.js
// (07-app/core/practiceTimer.js) is a standalone, in-memory countdown that
// nothing in the shipped app currently persists an instance of (a genuine,
// documented gap — see that file's own header), so a caller only has one to
// pass in when it has actually started one (a future timer UI, or a test).
// No timer, or one that was never started (practiceTimer.js's own default:
// `stopped: true`), means no line — never a guessed or default duration.
function timerLine(timer, now) {
  if (!timer || typeof timer.getRemainingMinutes !== 'function' || typeof timer.isExpired !== 'function') return null;
  if (timer.stopped || timer.startedAt == null) return null;
  if (timer.isExpired(now)) return "Your practice timer has already run out — want to start a new one, or just play?";
  const minutes = timer.getRemainingMinutes(now);
  return `You've got ${plural(minutes, 'minute')} on the practice timer.`;
}

/**
 * Builds Sage's opening greeting from stored numbers only.
 * @param {Object} opts
 * @param {import('./practiceStore.js').PracticeStore} [opts.store]
 * @param {import('./practiceTimer.js').PracticeTimer} [opts.timer]
 * @param {number} [opts.now]
 * @returns {{kind: string, lines: string[], greetingText: string, tuningLine: string}}
 */
export function buildOpeningGreeting(opts) {
  const o = opts || {};
  const now = typeof o.now === 'number' ? o.now : Date.now();
  const store = o.store;
  let sessions = [];
  if (store && typeof store.toJSON === 'function') {
    try {
      const raw = store.toJSON();
      sessions = Array.isArray(raw && raw.sessions) ? raw.sessions : [];
    } catch (e) { sessions = []; }
  }

  const lines = [];
  let kind;

  if (!sessions.length) {
    // Exactly the state every device is in right after Wave 1's
    // wipeAllStoredData() — a clean, honest first-ever greeting. No number
    // is cited because none is stored yet; that omission IS the honesty.
    kind = 'first-time';
    lines.push("Welcome. This is your first session here — let's get started.");
  } else {
    const lastSession = sessions[sessions.length - 1];
    const daysSince = calendarDayDiff(lastSession.ts, now);
    const lastChord = lastAttemptedChordDisplay(sessions);
    const weekAttempts = attemptsSince(sessions, now - 7 * 86400000);

    if (daysSince >= ABSENCE_DAYS_THRESHOLD) {
      kind = 'absence';
      lines.push(`It's been ${plural(daysSince, 'day')} since your last session — welcome back.`);
      if (lastChord) lines.push(`You were last working on ${lastChord}.`);
    } else {
      kind = 'recent';
      if (lastChord) lines.push(`Last time you were working on ${lastChord}.`);
      if (weekAttempts > 0) lines.push(`You've made ${plural(weekAttempts, 'attempt')} this week.`);
      if (!lastChord && weekAttempts === 0) {
        // Sessions exist (e.g. lesson completions with no chord attempts
        // logged) but neither number above has anything to cite. Fall back
        // to whatever else is actually stored — same degrade order
        // sageCoach.js's coachLine() already uses — rather than inventing a
        // beat just to fill the line.
        const streak = (typeof store.currentStreak === 'function') ? store.currentStreak() : 0;
        const lessonsCompleted = (typeof store.completedLessonCount === 'function') ? store.completedLessonCount() : 0;
        if (streak > 0) lines.push(`Current streak: ${plural(streak, 'day')}.`);
        else if (lessonsCompleted > 0) lines.push(`Lessons completed so far: ${lessonsCompleted}.`);
        else lines.push('Welcome back.');
      }
    }
  }

  const tLine = timerLine(o.timer, now);
  if (tLine) lines.push(tLine);

  return {
    kind,
    lines,
    greetingText: lines.join(' '),
    tuningLine: "Before we touch a chord, let's check your tuning.",
  };
}

// Renders Sage's opening panel as an HTML string (no DOM access — same
// string-building convention lesson-runner.js's own renderLessonHTML/
// chordGalleryHTML already use). `escFn` is the caller's own text escaper
// (lesson-runner.js's `esc`); falls back to a bare String() so this stays
// usable/testable outside that file, though the shipped caller always
// passes the real one so nothing here can inject markup from stored text
// (a chord name, ultimately, is the only stored string ever interpolated).
export function renderOpeningGreetingHTML(greeting, escFn) {
  if (!greeting) return '';
  const esc = typeof escFn === 'function' ? escFn : (v) => String(v == null ? '' : v);
  return [
    `<section class="step sage-opening" id="sage-opening" aria-live="polite">`,
    `<span class="lesson-number">Sage</span>`,
    `<p class="sage-opening-greeting">${esc(greeting.greetingText)}</p>`,
    `<p class="sage-opening-tuning">${esc(greeting.tuningLine)}</p>`,
    `<button class="secondary" id="${TUNING_ENTRY_ID}" type="button">Let's check your tuning first</button>`,
    `</section>`,
  ].join('');
}

export default { ABSENCE_DAYS_THRESHOLD, TUNING_ENTRY_ID, buildOpeningGreeting, renderOpeningGreetingHTML };
