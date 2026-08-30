// review-scheduler.mjs — pure review-reminder / streak-nudge logic.
//
// NO network. NO account. NO DOM. NO audio. Given the fluency-store SNAPSHOT
// ({ pair, fluency, samples, lastPracticed }) plus a `now` time, it decides
// which pairs need review, computes a practice streak + consistency, and
// produces a nudge object.
//
// This is the canonical, tested source of truth. It runs identically in Node
// (tests) and the browser. NOTE: UI code that must load over file:// (where
// ES-module import is blocked) uses ui-nudge.js, a faithful classic-script copy
// of the pure core below — keep the two in sync.
//
// ---------------------------------------------------------------------------
// AGENTS.md HARD RULE — NO false-negative framing
// ---------------------------------------------------------------------------
// We NEVER claim a pair "is fine" when we are uncertain. Certainty requires
// real practice data (samples > 0) AND a recent, high-fluency reading. A pair
// with no samples (never practiced) or a stale reading is ALWAYS surfaced for
// review — we do not pretend "unmeasured == mastered." This is why a cold
// (un-practiced) pair FIRES, and why an empty store yields a "warm/start"
// nudge rather than "you're caught up."

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULTS = {
  fluencyThreshold: 0.4, // fluency below this -> weak, review
  staleDays: 3,          // no practice in N days -> review (spacing effect)
  freshDays: 3,          // practiced within N days -> "fresh" for consistency
  K: 3,                  // how many weakest pairs to surface in the nudge
};

// Calendar-day key (UTC) so day math is deterministic and TZ-independent in tests.
function startOfDayUTC(ms) {
  return Math.floor(ms / DAY_MS);
}

// Decide whether ONE pair needs review, and why. Pure + total.
export function pairNeedsReview(p, nowMs = Date.now(), opts = {}) {
  const {
    fluencyThreshold = DEFAULTS.fluencyThreshold,
    staleDays = DEFAULTS.staleDays,
  } = opts;

  // Never practiced -> we are UNCERTAIN -> surface (no false-negative framing).
  if (p.samples === 0 || p.lastPracticed == null) {
    return { review: true, reason: 'unpracticed' };
  }
  // Low fluency -> weak -> review.
  if (p.fluency < fluencyThreshold) {
    return { review: true, reason: 'weak' };
  }
  // Not practiced recently -> spacing effect says it's cooling -> review.
  const idle = nowMs - p.lastPracticed;
  if (idle > staleDays * DAY_MS) {
    return { review: true, reason: 'stale' };
  }
  return { review: false, reason: 'fresh' };
}

// Consecutive-day practice streak ending today (or yesterday if today not yet
// done). Derived purely from the distinct calendar days on which any pair was
// last practiced. Honest: 0 when there is no practice data.
export function computeStreak(snapshot = [], nowMs = Date.now()) {
  const days = new Set();
  for (const p of snapshot) {
    if (p.lastPracticed != null) days.add(startOfDayUTC(p.lastPracticed));
  }
  const today = startOfDayUTC(nowMs);
  let cursor = days.has(today) ? today : today - 1; // allow "today not done yet"
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Churn-risk / "save your streak" nudge  (feature #6: churn-prediction nudges).
// Given the current practice STREAK and how many calendar DAYS have elapsed
// since the last practice, decide whether to fire a comeback nudge and what
// to say. Pure + total. Mirrored in ui-nudge.js (keep the two in sync).
//   - practiced today               -> nothing to fire (streak safe)
//   - idle within grace window       -> SAVE day, streak still alive -> nudge
//   - idle past the grace window     -> streak has lapsed -> restart nudge
// ---------------------------------------------------------------------------
export const COMEBACK_DEFAULTS = {
  graceDays: 1, // idle for <= this many days and the streak is still alive
};

export function comebackNudge(streakDays = 0, daysSinceLastPractice = 0, opts = {}) {
  const { graceDays = COMEBACK_DEFAULTS.graceDays } = opts;

  // No streak yet -> nothing to protect.
  if (streakDays <= 0) return { atRisk: false, broken: false, message: null };

  // Already practiced today -> streak safe right now, no nudge.
  if (daysSinceLastPractice === 0) {
    return { atRisk: false, broken: false, message: null };
  }
  // Within the grace window (e.g. yesterday) -> today is the SAVE day.
  if (daysSinceLastPractice <= graceDays) {
    return {
      atRisk: true,
      broken: false,
      message: `Practice today to protect your ${streakDays}-day streak 🔥`,
    };
  }
  // Idle past the grace window -> the streak has lapsed.
  return {
    atRisk: true,
    broken: true,
    message: `Your ${streakDays}-day streak slipped — 5 minutes restarts it 💪`,
  };
}

// Main entry: the full review/streak/nudge state for the UI (or any consumer).
export function computeReviewState(snapshot = [], nowMs = Date.now(), opts = {}) {
  const o = { ...DEFAULTS, ...opts };

  const reviewPairs = [];
  let fresh = 0;
  for (const p of snapshot) {
    const { review, reason } = pairNeedsReview(p, nowMs, o);
    if (review) {
      reviewPairs.push({
        pair: p.pair,
        fluency: p.fluency,
        samples: p.samples,
        lastPracticed: p.lastPracticed,
        reason,
      });
    } else {
      fresh++;
    }
  }

  // Weakest first: lowest fluency, then longest-idle, bubbles to the top.
  reviewPairs.sort(
    (a, b) =>
      a.fluency - b.fluency ||
      (a.lastPracticed ?? -1) - (b.lastPracticed ?? -1)
  );

  const total = snapshot.length;
  const streakDays = computeStreak(snapshot, nowMs);
  const consistency = total === 0 ? 0 : fresh / total; // fraction currently fresh
  const needsReview = reviewPairs.length > 0;
  const topK = reviewPairs.slice(0, o.K).map((r) => r.pair);

  // ---- Nudge copy. Never says "you're fine" without data. ----
  let level;
  let message;
  if (total === 0) {
    level = 'warm'; // no data -> cannot claim fine
    message = 'Start your first chord-change drill to build your fluency memory.';
  } else if (needsReview) {
    const cold = reviewPairs.some((r) => r.reason === 'unpracticed');
    level = cold || consistency < 0.5 ? 'cold' : 'warm';
    const names = topK.join(', ');
    message =
      `Your weakest pairs are getting cold — review ${reviewPairs.length} ` +
      `pair${reviewPairs.length === 1 ? '' : 's'}` +
      (names ? ` (e.g. ${names})` : '') +
      '.';
  } else {
    level = 'ok';
    message = `All ${total} pairs fresh — keep the ${streakDays}-day streak going.`;
  }

  return {
    needsReview,
    reviewPairs,
    topK,
    fresh,
    total,
    consistency,
    streakDays,
    level, // 'ok' | 'warm' | 'cold'
    message,
  };
}
