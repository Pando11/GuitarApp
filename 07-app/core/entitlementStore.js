// entitlementStore.js — F12 Money (STUB ONLY). PORTED 1:1 from 06-prototypes/step7/entitlementStore.js.
// Single source of free/premium policy. Hard Ban 5: ZERO network calls (RevenueCat is external).
// STRICT free tier (owner decision 2026-08-08): tuner + metronome + Lesson 1 ONLY.
//
// *****************************************************************************
//  STUB ONLY — NO REAL PAYMENTS WIRED.
//  isEntitled()/setEntitled() here are a LOCAL, dependency-free entitlement
//  STATE STORE for offline testing. Real RevenueCat / PocketBase purchase
//  verification is NOT connected (and must never make a network call per
//  Hard Ban 5). Wire real purchases only behind a server-verified entitlement
//  check before any paid launch.
// *****************************************************************************

export const FREE_LESSONS = ['L01'];

export const FEATURE_TIER = {
  tuner: 'free',
  metronome: 'free',
  teacherRoster: 'premium',
  chat: 'premium',
  adaptive: 'premium',
  messages: 'premium',
  streaks: 'premium',
  lesson: 'premium',
  listening: 'premium',
  band: 'premium',
  stylePacks: 'premium',
  reports: 'premium',
  voice: 'premium'
};

export function tierFor(feature) { return FEATURE_TIER[feature]; }

// --- local entitlement override (STUB, for tests) -----------------------------
// A single boolean override that forces isEntitled() to a fixed value. This is
// the local-storage-backed flip used by tests; it is NOT a payment. When unset
// (null) the normal free/premium policy applies. Uses globalThis.localStorage
// if present, otherwise an in-memory fallback (node tests).
const OVERRIDE_KEY = 'entitlementStore.override';
const _mem = new Map();

function _ls() {
  try {
    return (typeof globalThis !== 'undefined' && globalThis.localStorage) ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}
function _getOverride() {
  const ls = _ls();
  const raw = ls ? ls.getItem(OVERRIDE_KEY) : _mem.get(OVERRIDE_KEY);
  if (raw === null || raw === undefined) return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}
function _setOverride(v) {
  const ls = _ls();
  if (v === null) {
    if (ls) ls.removeItem(OVERRIDE_KEY); else _mem.delete(OVERRIDE_KEY);
    return;
  }
  const raw = v ? 'true' : 'false';
  if (ls) ls.setItem(OVERRIDE_KEY, raw); else _mem.set(OVERRIDE_KEY, raw);
}

export class EntitlementStore {
  constructor(initial) {
    const i = initial || {};
    this.platform = i.platform || 'ios';
    this.subscriptionActive = !!i.subscriptionActive;
    this.trialActive = !!i.trialActive;
    this.trialExpiry = i.trialExpiry || null;
    this.sandbox = !!i.sandbox;
  }
  activateSandboxPurchase(platform) { this.platform = platform || this.platform; this.subscriptionActive = true; this.trialActive = false; this.sandbox = true; }
  activatePurchase(platform) { this.platform = platform || this.platform; this.subscriptionActive = true; this.trialActive = false; this.sandbox = false; }
  startTrial(days = 7, now = Date.now()) { this.trialActive = true; this.trialExpiry = now + days * 86400000; }
  cancel() { this.subscriptionActive = false; this.trialActive = false; this.sandbox = false; }
  resubscribe(platform) { return this.activatePurchase(platform); }
  isPremium(now = Date.now()) {
    if (this.subscriptionActive) return true;
    if (this.trialActive && this.trialExpiry && now < this.trialExpiry) return true;
    return false;
  }
  isTrialExpired(now = Date.now()) { return this.trialActive && this.trialExpiry && now >= this.trialExpiry; }
  settleTrial(now = Date.now()) { if (this.trialActive && this.trialExpiry && now >= this.trialExpiry) this.trialActive = false; }
  hasUnlockedLesson() { return FREE_LESSONS.length > 0; }
  canAccessFeature(feature, now = Date.now()) {
    const t = tierFor(feature);
    if (t === 'free') return true;
    if (t === 'shell') return this.hasUnlockedLesson();
    return this.isPremium(now);
  }
  canAccessLesson(lessonId, now = Date.now()) {
    if (FREE_LESSONS.includes(lessonId)) return true;
    return this.isPremium(now);
  }
  canAccessListening(lessonId, now = Date.now()) {
    if (FREE_LESSONS.includes(lessonId)) return true;
    return this.isPremium(now);
  }
  paywallDecision(featureOrLesson, now = Date.now()) {
    let allowed;
    if (typeof featureOrLesson === 'string' && /^L\d+/i.test(featureOrLesson)) allowed = this.canAccessLesson(featureOrLesson, now);
    else allowed = this.canAccessFeature(featureOrLesson, now);
    return { allowed, paywalled: !allowed, tier: this.isPremium(now) ? 'premium' : 'free' };
  }
  exposedFeatures(now = Date.now()) {
    const out = [];
    for (const f of Object.keys(FEATURE_TIER)) if (this.canAccessFeature(f, now)) out.push(f);
    return out;
  }
  // --- STUB entitlement flip (local-storage-backed, for tests) ----------------
  // Force the entitlement answer for ALL features. Pass true/false to override,
  // or null/undefined to clear and fall back to normal free/premium policy.
  // This is a test hook only — NOT a real purchase.
  setEntitled(value) { _setOverride(value == null ? null : !!value); }
  // Clear any forced override (return to normal policy).
  clearEntitlementOverride() { _setOverride(null); }
  // isEntitled(featureId): boolean — the canonical entitlement gate.
  // Returns the forced override if set, otherwise the normal free/premium policy.
  isEntitled(featureId) {
    const o = _getOverride();
    if (o === true) return true;
    if (o === false) return false;
    return this.canAccessFeature(featureId);
  }
  toJSON() {
    return { platform: this.platform, subscriptionActive: this.subscriptionActive, trialActive: this.trialActive, trialExpiry: this.trialExpiry, sandbox: this.sandbox };
  }
  static fromJSON(o) { return new EntitlementStore(o); }
}
