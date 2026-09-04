// world-view-tracker.js — BUILDER advance (BOARDROOM 2026-08-23).
//
// Wires the ORPHANED attribution instrument (content-attribution.js) into the
// content/world view path so the FIRST built world is measurable for
// install/subscription attribution.
//
// WHY: content-attribution.js existed but nothing imported/called it, so a built
// world could not be attributed. This is the smallest non-breaking caller.
//
// NON-BREAKING: nothing imports this yet. The app opts in by importing and calling
// trackWorldView() when a world is shown, and trackContentConversion() on
// install/subscription. Guarded by globalThis.CONTENT_ATTRIBUTION_ENABLED so it
// stays a no-op until explicitly enabled. No edits to app.js / lesson JSONs / gates.
//
// PAID-DEPENDENCY RULE: the underlying instrument posts only to self-hosted
// PocketBase (MIT, $0 recurring) when an endpoint is configured. No Midjourney /
// ElevenLabs / SVD / any blocklisted tool. Models referenced (flux.1-schnell,
// wan2.2-i2v, chatterbox) are commercial-clean per 07-app/core/asset-job.js.
//
// USAGE (app shell, opt-in):
//   globalThis.CONTENT_ATTRIBUTION_ENABLED = true;
//   import { trackWorldView, trackContentConversion } from './core/world-view-tracker.js';
//   trackWorldView('elderwick-market', 'l02');            // on world/lesson view
//   trackContentConversion('install', 'elderwick-market', 'app_store');
//   trackContentConversion('subscription', 'elderwick-market', 'revenuecat');

import { trackContentEvent } from './content-attribution.js';

function enabled() {
  return (typeof globalThis !== 'undefined' && globalThis.CONTENT_ATTRIBUTION_ENABLED === true);
}

/**
 * Record a content/world VIEW (opt-in, anonymous, marketing attribution only).
 * @param {string} worldId  e.g. 'elderwick-market'
 * @param {string|null} lessonId  optional lesson being viewed
 * @returns {Promise<{shipped:boolean, reason:string}>}
 */
export function trackWorldView(worldId, lessonId = null) {
  if (!enabled()) return { shipped: false, reason: 'disabled' };
  return trackContentEvent({ event: 'world_view', worldId, lessonId });
}

/**
 * Record an install/subscription CONVERSION attributed to a world (opt-in).
 * @param {'install'|'subscription'} event
 * @param {string} worldId
 * @param {string|null} source  e.g. 'app_store' | 'revenuecat'
 */
export function trackContentConversion(event, worldId, source = null) {
  if (!enabled()) return { shipped: false, reason: 'disabled' };
  return trackContentEvent({ event, worldId, source });
}

export default { trackWorldView, trackContentConversion };
