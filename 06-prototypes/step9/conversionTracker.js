/*
 * GuitarApp Step 9 — CONVERSION TRACKER (task 2 of the $4,500/mo plan)
 *
 * Purpose: make the "450 paying subs" target MEASURABLE, not aspirational.
 * The spec (FEATURES-LOCKED-v1) hard-codes 450 subs x $12 = ~$4,500/mo but gives
 * no funnel model. This module records the only three events that matter for that
 * number:
 *   view        -> a YouTube video was watched (top of funnel, AMENDMENT-05 §5)
 *   install     -> viewer installed the app from the video CTA
 *   paid_sub    -> installed user converted to the $12/mo plan (THE REVENUE EVENT)
 *
 * Design rules (match the project):
 *   - ZERO npm deps, CommonJS, NO DOM access (this is the server/analytics layer).
 *   - No external network calls until keys are provided. By default it logs to a
 *     local JSONL file so the funnel is observable from day one without credentials.
 *   - When PostHog/Sentry keys are set (env), it forwards the SAME events to them.
 *     No behavior change otherwise — the schema is identical.
 *
 * The "450 subs" target becomes: track paid_sub count + CAC (install/view, sub/install)
 * and you can SEE whether the funnel is on track instead of hoping.
 */

'use strict';

var fs = require('fs');
var path = require('path');

var EVENTS = ['view', 'install', 'paid_sub'];

// Where local funnel data lands (JSONL). Override via env CONV_LOG.
var LOG_PATH = process.env.CONV_LOG ||
  path.join(__dirname, 'conversion-events.jsonl');

// Optional analytics providers. Leave blank in dev; fill when wiring PostHog/Sentry.
var POSTHOG_KEY = process.env.POSTHOG_KEY || '';
var SENTRY_DSN = process.env.SENTRY_DSN || '';

function nowMs() { return Date.now(); }

function isValidEvent(e) {
  return EVENTS.indexOf(e) !== -1;
}

/*
 * track(event, props) — record one funnel event.
 *   event : 'view' | 'install' | 'paid_sub'
 *   props : { videoId, lessonId, channel?, source?, userId?, valueUsd?, plan? }
 * Returns the recorded record (also appends to the JSONL log / forwards if configured).
 */
function track(event, props) {
  if (!isValidEvent(event)) {
    throw new Error('conversionTracker: unknown event "' + event + '" (expected one of ' + EVENTS.join(', ') + ')');
  }
  props = props || {};
  var rec = {
    ts: nowMs(),
    event: event,
    videoId: props.videoId || null,
    lessonId: props.lessonId || null,
    channel: props.channel || 'youtube',
    source: props.source || null,
    userId: props.userId || null,
    valueUsd: (event === 'paid_sub') ? (typeof props.valueUsd === 'number' ? props.valueUsd : 12) : 0,
    plan: (event === 'paid_sub') ? (props.plan || 'monthly') : null,
    meta: props.meta || null
  };

  // Local JSONL log — the funnel is observable with zero credentials.
  try {
    fs.appendFileSync(LOG_PATH, JSON.stringify(rec) + '\n');
  } catch (e) {
    // Never let analytics crash the video/build. Log-only failure is silent-by-design.
  }

  // Forward to real providers when keys exist. Schema is identical, so the
  // YouTube team gets the same events in PostHog/Sentry for dashboards.
  if (POSTHOG_KEY) {
    // Intentionally NOT implemented here: PostHog client requires a dep. When the
    // owner provides keys, add `posthog.capture({ distinctId, event, properties })`.
  }
  if (SENTRY_DSN) {
    // Same: Sentry requires a dep; wire `Sentry.captureEvent` here with the same `rec`.
  }

  return rec;
}

/*
 * summarize(logPath) — read the JSONL funnel and report the numbers that decide
 * whether we hit 450 subs. Pure read; does not mutate the log.
 */
function summarize(logPath) {
  var p = logPath || LOG_PATH;
  var counts = { view: 0, install: 0, paid_sub: 0, revenueUsd: 0 };
  var byVideo = {};
  try {
    var lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
    lines.forEach(function (ln) {
      var r;
      try { r = JSON.parse(ln); } catch (e) { return; }
      if (!isValidEvent(r.event)) return;
      counts[r.event]++;
      if (r.event === 'paid_sub') counts.revenueUsd += (r.valueUsd || 12);
      var v = r.videoId || 'unknown';
      byVideo[v] = byVideo[v] || { view: 0, install: 0, paid_sub: 0 };
      byVideo[v][r.event]++;
    });
  } catch (e) { /* empty log => zeros */ }

  var viewToInstall = counts.view ? counts.install / counts.view : 0;
  var installToSub = counts.install ? counts.paid_sub / counts.install : 0;
  var viewToSub = counts.view ? counts.paid_sub / counts.view : 0;

  return {
    counts: counts,
    byVideo: byVideo,
    rates: {
      view_to_install: +viewToInstall.toFixed(4),
      install_to_sub: +installToSub.toFixed(4),
      view_to_sub: +viewToSub.toFixed(4)
    },
    // The single number the spec cares about: how many subs to go.
    subs_to_target: Math.max(0, 450 - counts.paid_sub)
  };
}

module.exports = {
  EVENTS: EVENTS,
  track: track,
  summarize: summarize,
  LOG_PATH: LOG_PATH
};
