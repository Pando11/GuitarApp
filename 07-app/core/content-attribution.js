// content-attribution.js — content -> install/subscription attribution instrument (BUILDER change)
//
// WHY: lesson WORLDS are meant to be install/subscription drivers, but nothing on disk
// attributes a user's install/subscription back to the world/content they saw. This module
// is the smallest non-breaking instrument: it records an anonymous event whenever content/world
// is viewed or a conversion happens, and (optionally) ships it to a self-hosted PocketBase
// collection. It NEVER touches lesson JSONs, the curriculum gate, the song-progression gate,
// chord-theory-check, or asset-job.js.
//
// LEGAL FLOOR (AGENTS.md): only content-VIEW / install / subscription events are recorded.
// No learning progress, no audio, no PII. Student *learning* data stays on-device (AMENDMENT-11
// Red Line 1). This is marketing attribution only.
//
// PAID-DEPENDENCY RULE (guitarapp-stack skill): PocketBase is MIT + self-hosted = $0 recurring.
// The module makes NO network call unless CONTENT_ATTRIBUTION_ENDPOINT is explicitly set, so it
// is safe to ship disabled and adds $0 cost. No Midjourney / ElevenLabs / SVD / any blocklisted tool.
//
// USAGE:
//   import { trackContentEvent } from './core/content-attribution.js';
//   trackContentEvent({ event: 'world_view', worldId: 'elderwick-market', lessonId: 'l02' });
//   trackContentEvent({ event: 'install', worldId: 'elderwick-market', source: 'app_store' });
//   trackContentEvent({ event: 'subscription', worldId: 'elderwick-market', source: 'revenuecat' });
//
// Configure (server-side only, never hardcode in client bundle):
//   globalThis.CONTENT_ATTRIBUTION_ENDPOINT = 'https://pb.example.com/api/collections/content_events/records';
//   globalThis.CONTENT_ATTRIBUTION_TOKEN    = '<superuser-or-rule-scoped token>';

const COLLECTION = 'content_events';

function endpoint() {
  // Read from globalThis so it can be injected at runtime without editing this file.
  return (typeof globalThis !== 'undefined' && globalThis.CONTENT_ATTRIBUTION_ENDPOINT) || null;
}

function token() {
  return (typeof globalThis !== 'undefined' && globalThis.CONTENT_ATTRIBUTION_TOKEN) || null;
}

/**
 * Record a content-attribution event.
 * @param {{event:string, worldId?:string, lessonId?:string, contentId?:string, source?:string}} detail
 * @returns {Promise<{shipped:boolean, reason:string}>}
 */
export async function trackContentEvent(detail) {
  const evt = {
    event: detail.event || 'unknown',
    worldId: detail.worldId || null,
    lessonId: detail.lessonId || null,
    contentId: detail.contentId || null,
    source: detail.source || null,
    ts: new Date().toISOString(),
  };

  const url = endpoint();
  if (!url) {
    // No-op path (default). Safe in dev / before PocketBase is wired. No network call.
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[content-attribution] no-op (no endpoint configured):', evt);
    }
    return { shipped: false, reason: 'no_endpoint_configured' };
  }

  // Build the PocketBase record shape. Keep it anonymous (no PII, no learning data).
  const record = {
    event: evt.event,
    world_id: evt.worldId,
    lesson_id: evt.lessonId,
    content_id: evt.contentId,
    source: evt.source,
    occurred_at: evt.ts,
  };

  try {
    if (typeof fetch !== 'function') {
      return { shipped: false, reason: 'fetch_unavailable' };
    }
    const headers = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) headers['Authorization'] = t;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(record),
    });
    return { shipped: res.ok, reason: res.ok ? 'ok' : `http_${res.status}` };
  } catch (err) {
    // Never throw into the lesson/content pipeline.
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[content-attribution] ship failed (ignored):', err && err.message);
    }
    return { shipped: false, reason: 'exception' };
  }
}

export const CONTENT_ATTRIBUTION_COLLECTION = COLLECTION;
export default trackContentEvent;
