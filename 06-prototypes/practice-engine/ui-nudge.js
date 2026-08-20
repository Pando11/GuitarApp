// ui-nudge.js — renders the review-reminder / streak nudge into the
// #review-nudge placeholder (created by another agent in practice-ui.html).
//
// CLASSIC SCRIPT (no ES-module import) on purpose: ES-module `import` is
// blocked over file:// (origin "null"), and AGENTS.md forbids localhost-only
// deliverables. So the pure core is inlined here as a faithful copy of
// review-scheduler.mjs. Keep the two in sync.
//
// CONTRACT: practice-ui.html (or any host page) may set
//   window.reviewSchedulerData = { snapshot: [{pair,fluency,samples,lastPracticed}], nowMs?: Number }
// before this script's DOMContentLoaded handler runs. If it does, the nudge is
// computed and rendered. If absent, a neutral "no data yet" placeholder is
// shown (NEVER a false "you're all caught up").
//
// NO-OP GUARANTEE: if #review-nudge does not exist in the DOM, this script does
// nothing at all — it never throws and never touches other elements.

(function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;

  var DEFAULTS = {
    fluencyThreshold: 0.4, // below -> weak, review
    staleDays: 3,          // no practice in N days -> review
    freshDays: 3,          // within N days -> "fresh" for consistency
    K: 3                   // weakest pairs to surface
  };

  function startOfDayUTC(ms) {
    return Math.floor(ms / DAY_MS);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---- pure core (mirror of review-scheduler.mjs) ----
  function startOfDay(ms) { return Math.floor(ms / DAY_MS); }

  function pairNeedsReview(p, nowMs, opts) {
    opts = opts || {};
    var fluencyThreshold = opts.fluencyThreshold != null ? opts.fluencyThreshold : DEFAULTS.fluencyThreshold;
    var staleDays = opts.staleDays != null ? opts.staleDays : DEFAULTS.staleDays;

    if (p.samples === 0 || p.lastPracticed == null) {
      return { review: true, reason: 'unpracticed' };
    }
    if (p.fluency < fluencyThreshold) {
      return { review: true, reason: 'weak' };
    }
    var idle = nowMs - p.lastPracticed;
    if (idle > staleDays * DAY_MS) {
      return { review: true, reason: 'stale' };
    }
    return { review: false, reason: 'fresh' };
  }

  function computeStreak(snapshot, nowMs) {
    snapshot = snapshot || [];
    var days = {};
    for (var i = 0; i < snapshot.length; i++) {
      var lp = snapshot[i].lastPracticed;
      if (lp != null) days[startOfDay(lp)] = true;
    }
    var today = startOfDay(nowMs);
    var cursor = days[today] ? today : today - 1;
    var streak = 0;
    while (days[cursor]) { streak++; cursor--; }
    return streak;
  }

  function computeReviewState(snapshot, nowMs, opts) {
    snapshot = snapshot || [];
    opts = opts || {};
    var o = {};
    for (var k in DEFAULTS) o[k] = DEFAULTS[k];
    for (var k2 in opts) o[k2] = opts[k2];

    var reviewPairs = [];
    var freshCount = 0;
    for (var i = 0; i < snapshot.length; i++) {
      var p = snapshot[i];
      var r = pairNeedsReview(p, nowMs, o);
      if (r.review) {
        reviewPairs.push({
          pair: p.pair, fluency: p.fluency, samples: p.samples,
          lastPracticed: p.lastPracticed, reason: r.reason
        });
      } else {
        freshCount++;
      }
    }
    reviewPairs.sort(function (a, b) {
      return (a.fluency - b.fluency) || ((a.lastPracticed || -1) - (b.lastPracticed || -1));
    });

    var total = snapshot.length;
    var streakDays = computeStreak(snapshot, nowMs);
    var consistency = total === 0 ? 0 : freshCount / total;
    var needsReview = reviewPairs.length > 0;
    var topK = reviewPairs.slice(0, o.K).map(function (x) { return x.pair; });

    var level, message;
    if (total === 0) {
      level = 'warm';
      message = 'Start your first chord-change drill to build your fluency memory.';
    } else if (needsReview) {
      var cold = reviewPairs.some(function (x) { return x.reason === 'unpracticed'; });
      level = (cold || consistency < 0.5) ? 'cold' : 'warm';
      var names = topK.join(', ');
      message = 'Your weakest pairs are getting cold — review ' + reviewPairs.length +
        ' pair' + (reviewPairs.length === 1 ? '' : 's') + (names ? ' (e.g. ' + names + ')' : '') + '.';
    } else {
      level = 'ok';
      message = 'All ' + total + ' pairs fresh — keep the ' + streakDays + '-day streak going.';
    }

    return {
      needsReview: needsReview,
      reviewPairs: reviewPairs,
      topK: topK,
      fresh: freshCount,
      total: total,
      consistency: consistency,
      streakDays: streakDays,
      level: level,
      message: message
    };
  }

  // ---- churn-risk / "save your streak" nudge (mirror of review-scheduler.mjs) ----
  var COMEBACK_DEFAULTS = { graceDays: 1 };

  function comebackNudge(streakDays, daysSinceLastPractice, opts) {
    opts = opts || {};
    var graceDays = opts.graceDays != null ? opts.graceDays : COMEBACK_DEFAULTS.graceDays;
    if (streakDays <= 0) return { atRisk: false, broken: false, message: null };
    if (daysSinceLastPractice === 0) return { atRisk: false, broken: false, message: null };
    if (daysSinceLastPractice <= graceDays) {
      return { atRisk: true, broken: false, message: 'Practice today to protect your ' + streakDays + '-day streak 🔥' };
    }
    return { atRisk: true, broken: true, message: 'Your ' + streakDays + '-day streak slipped — 5 minutes restarts it 💪' };
  }

  // ---- rendering ----
  function renderReviewNudge(state, targetEl) {
    if (!targetEl) return;
    var streak = state.streakDays;
    var flame = streak > 0 ? '🔥' : '❄️';
    var levelClass = state.level === 'cold' ? 'bad' : state.level === 'warm' ? 'warn' : 'adv';

    var html = '';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
    html += '  <span class="pill ' + levelClass + '">' + escapeHtml(state.level.toUpperCase()) + '</span>';
    html += '  <span style="font-weight:600;">' + flame + ' ' + streak +
            '-day streak · ' + Math.round(state.consistency * 100) + '% fresh</span>';
    html += '</div>';
    html += '<div class="sub" style="text-align:left;">' + escapeHtml(state.message) + '</div>';

    if (state.reviewPairs.length) {
      html += '<ul class="pairs" style="margin-top:8px;">';
      for (var i = 0; i < state.reviewPairs.length; i++) {
        var rp = state.reviewPairs[i];
        var pct = Math.max(2, Math.round(rp.fluency * 100));
        html += '<li><span>' + escapeHtml(rp.pair) +
                ' <span style="color:var(--muted);font-size:11px;">(' + escapeHtml(rp.reason) + ')</span></span>' +
                '<span class="meter"><div style="width:' + pct + '%;background:var(--warn);"></div></span></li>';
      }
      html += '</ul>';
    }

    targetEl.innerHTML = html;
  }

  function autoRun() {
    // NO-OP if the placeholder another agent creates is absent.
    var el = document.getElementById('review-nudge');
    if (!el) return;

    var data = window.reviewSchedulerData;
    var nowMs = (data && typeof data.nowMs === 'number') ? data.nowMs : Date.now();
    var snapshot = (data && Array.isArray(data.snapshot)) ? data.snapshot : [];

    if (!data) {
      // Honest idle state — never claims "you're caught up".
      el.innerHTML =
        '<div class="sub" style="text-align:left;color:var(--muted);">' +
        'Review nudge ready. Set <code>window.reviewSchedulerData</code> to populate.</div>';
      return;
    }

    renderReviewNudge(computeReviewState(snapshot, nowMs), el);
  }

  // Expose for the host page / other modules / tests.
  window.ReviewNudge = {
    computeReviewState: computeReviewState,
    computeStreak: computeStreak,
    pairNeedsReview: pairNeedsReview,
    DEFAULTS: DEFAULTS,
    renderReviewNudge: renderReviewNudge,
    comebackNudge: comebackNudge,
    COMEBACK_DEFAULTS: COMEBACK_DEFAULTS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRun);
  } else {
    autoRun();
  }
})();
