'use strict';
/*
 * messages.js — F6 encouraging messages (Step 6).
 * Builds a message that cites something TRUE from the practice store, with a
 * one-tap deep link into the exact lesson; enforces a per-day frequency cap
 * and one-tap mute (mute lives in the store).
 * The actual push/SMS/email SEND is an external boundary — this module only
 * produces + records the message (prototype discipline: prove logic, stub network).
 * Run its DONE BAR: node verify-step6-messages.js
 */
const DAY = 86400000;
function startOfToday(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

function factBody(store) {
  const struggled = store.getStruggledChords();
  const clean = store.getCleanChords();
  const minutes = store.practiceMinutesTotal();
  const streak = store.currentStreak();
  if (struggled.length) {
    const c = struggled[0];
    const lesson = store.lessonForChord(c) || 'L01';
    // Phrased ONLY from the recorded verdict (fail), never an invented physical cause.
    return `Your ${c} isn't ringing clean yet — 2 minutes on it today and it'll click. Open lesson/${lesson} when you're ready.`;
  }
  if (clean.length) {
    const word = streak === 1 ? 'day' : 'days';
    return `Your ${clean[0]} is sounding clean! Keep the streak going — ${streak} ${word} in.`;
  }
  return `You've practiced ${minutes} minutes. Lesson 1 is waiting whenever you are.`;
}

function withinCap(store, channel, maxPerDay, now = Date.now()) {
  return store.messageCountSinceChannel(startOfToday(now), channel) < maxPerDay;
}

function send(store, channel, opts = {}) {
  const maxPerDay = opts.maxPerDay || 2;
  if (store.isMuted(channel)) return { sent: false, reason: 'muted' };
  if (!withinCap(store, channel, maxPerDay)) return { sent: false, reason: 'capped' };
  const body = factBody(store);
  const link = /lesson\/(L\w+)/.exec(body);
  const deep = link ? link[1] : null;
  const message = store.recordMessage({ channel, body, lessonDeepLink: deep });
  return { sent: !!message, message, reason: message ? 'ok' : 'muted' };
}

// --- Loop C2: student-initiated follow-up (the "you asked about X" message) ---
// Distinct from factBody (Loop C1). This ONLY fires for a chord the student
// explicitly asked about, and it references that exact chord by name so the app
// reads as "I remembered what you asked" rather than a generic struggle blast.
// It must NOT invent a physical diagnosis (Ban 6) — it only cites the request.
function loopC2Body(store, request) {
  const c = request.chordName;
  // lessonForChord returns the real lessonId the chord was last practiced in, or
  // 'L01' if it was never logged. NOTE: do NOT fall back to getStruggledChords()[0]
  // — that returns a CHORD NAME, not a lesson id, which would produce a broken
  // deep link like "lesson/B7". 'L01' is the safe default (matches reviewPrompt).
  const lesson = store.lessonForChord(c) || 'L01';
  return `That ${c} you asked about — how's it going? Here's another drill if you want it. Open lesson/${lesson} when you're ready.`;
}

function sendLoopC2(store, channel, requestTs, opts = {}) {
  const maxPerDay = opts.maxPerDay || 2;
  const pending = store.getPendingHelpRequests();
  if (!pending.length) return { sent: false, reason: 'no-pending-request' };
  const req = pending[0];
  if (store.isMuted(channel)) return { sent: false, reason: 'muted' };
  if (!withinCap(store, channel, maxPerDay, requestTs)) return { sent: false, reason: 'capped' };
  const body = loopC2Body(store, req);
  const link = /lesson\/(L\w+)/.exec(body);
  const deep = link ? link[1] : null;
  const message = store.recordMessage({ channel, body, lessonDeepLink: deep });
  if (!message) return { sent: false, reason: 'muted' };
  store.markHelpRequestFollowedUp(req.chordName);
  return { sent: true, message, reason: 'ok', referencedChord: req.chordName };
}

// --- Loop B: next-lesson "got it? want to review?" prompt ---
// Backed by the struggled-chords record (not an invented guess). Returns null when
// there is nothing the student has struggled with yet, so the lesson-start hook can
// simply skip the prompt instead of showing a meaningless one.
function reviewPrompt(store) {
  const struggled = store.getStruggledChords();
  if (!struggled.length) return null;
  const c = struggled[0];
  const lesson = store.lessonForChord(c) || 'L01';
  return { chord: c, lesson, prompt: `Last time your ${c} was giving you trouble. Got it now, or want a quick review?`, deepLink: lesson };
}

module.exports = { factBody, withinCap, send, loopC2Body, sendLoopC2, reviewPrompt };
