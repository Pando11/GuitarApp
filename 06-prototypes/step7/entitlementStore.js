'use strict';
/*
 * entitlementStore.js — Step 7 (F12, Money) entitlement state machine.
 *
 * Pure logic. Hard Ban 5: ZERO network calls in this file. RevenueCat is an
 * EXTERNAL BOUNDARY, wired via revenuecatStub.js (prototype discipline: prove
 * the logic, stub the network — same pattern as Step 6 F6 SEND / F4 LLM).
 *
 * CONTRACT (from FEATURES-LOCKED-v1-2026-08-07.md §F12 + the build plan DONE BAR):
 *   - Single tier: $12/month, free trial.
 *   - Free tier = tuner + metronome + Lesson 1 ONLY. Nothing more.
 *   - Cross-platform (iOS + Android): one entitlement source, identical on both.
 *
 * BUILD DECISION (owner override, 2026-08-08, exec autonomy — do NOT revert):
 *   STRICT free tier per spec F12 literal ("only"): a free user gets EXACTLY
 *   tuner + metronome + Lesson 1. The teacher roster (F3), chat (F4), adaptive
 *   plan (F5), messages (F6) and streaks (F11) are moved to 'premium' (the old
 *   'shell' tier was removed) to widen the free->paid gap and protect the
 *   $4,500/mo subscription target. L01 still functions via the lesson player +
 *   tuner + metronome. Change the policy by editing FEATURE_TIER only.
 */

const FREE_LESSONS = ['L01'];

// Single declarative source of the free/premium policy.
//   'free'    = available to everyone (free + premium)
//   'shell'   = operating layer, available whenever >=1 lesson is unlocked
//   'premium' = requires an active subscription OR an active (unexpired) trial
const FEATURE_TIER = {
  tuner: 'free',          // F2 funnel front door
  metronome: 'free',      // F2 funnel front door
  // OWNER DECISION (2026-08-08, exec autonomy): strict free = tuner + metronome +
  // Lesson 1 ONLY, per spec F12 literal ("only"). The operating-shell features
  // (roster F3, chat F4, adaptive F5, messages F6, streaks F11) are moved to
  // 'premium' to widen the free->paid gap and protect the $4,500/mo subscription
  // target. A free user still functions L01 via the lesson player + tuner + metronome.
  teacherRoster: 'premium', // F3
  chat: 'premium',          // F4
  adaptive: 'premium',      // F5
  messages: 'premium',      // F6
  streaks: 'premium',       // F11
  lesson: 'premium',      // F1 — gated per-lesson id via canAccessLesson
  listening: 'premium',   // F2 full — gated per-lesson via canAccessListening
  band: 'premium',        // F7
  stylePacks: 'premium',  // F8
  reports: 'premium',     // F9
  voice: 'premium',       // F10
};

function tierFor(feature) { return FEATURE_TIER[feature]; }

class EntitlementStore {
  constructor(initial) {
    const i = initial || {};
    this.platform = i.platform || 'ios';        // 'ios' | 'android' — single source, same on both
    this.subscriptionActive = !!i.subscriptionActive;
    this.trialActive = !!i.trialActive;
    this.trialExpiry = i.trialExpiry || null;    // epoch ms
    this.sandbox = !!i.sandbox;                  // sandbox receipt marker (test purchases)
  }

  // ---- subscription lifecycle (driven by the RevenueCat adapter) ----
  activateSandboxPurchase(platform) {
    this.platform = platform || this.platform;
    this.subscriptionActive = true;
    this.trialActive = false;
    this.sandbox = true;
  }
  activatePurchase(platform) {
    this.platform = platform || this.platform;
    this.subscriptionActive = true;
    this.trialActive = false;
    this.sandbox = false;
  }
  startTrial(days = 7, now = Date.now()) {
    this.trialActive = true;
    this.trialExpiry = now + days * 86400000;
  }
  cancel() {
    // cancels the paid subscription (and any trial); user reverts to free.
    this.subscriptionActive = false;
    this.trialActive = false;
    this.sandbox = false;
  }
  resubscribe(platform) { return this.activatePurchase(platform); }

  // ---- queries ----
  isPremium(now = Date.now()) {
    if (this.subscriptionActive) return true;
    if (this.trialActive && this.trialExpiry && now < this.trialExpiry) return true;
    return false;
  }
  isTrialExpired(now = Date.now()) {
    return this.trialActive && this.trialExpiry && now >= this.trialExpiry;
  }
  // roll a lapsed trial back to free at app launch
  settleTrial(now = Date.now()) {
    if (this.trialActive && this.trialExpiry && now >= this.trialExpiry) this.trialActive = false;
  }

  hasUnlockedLesson() { return FREE_LESSONS.length > 0; }

  canAccessFeature(feature, now = Date.now()) {
    const t = tierFor(feature);
    if (t === 'free') return true;
    if (t === 'shell') return this.hasUnlockedLesson();
    return this.isPremium(now); // 'premium'
  }

  canAccessLesson(lessonId, now = Date.now()) {
    if (FREE_LESSONS.includes(lessonId)) return true;
    return this.isPremium(now);
  }

  // listening is free exactly where the lesson is free (L01); premium elsewhere
  canAccessListening(lessonId, now = Date.now()) {
    if (FREE_LESSONS.includes(lessonId)) return true;
    return this.isPremium(now);
  }

  // paywall decision: what to show a free user hitting a premium surface
  paywallDecision(featureOrLesson, now = Date.now()) {
    let allowed;
    if (typeof featureOrLesson === 'string' && /^L\d+/i.test(featureOrLesson)) {
      allowed = this.canAccessLesson(featureOrLesson, now);
    } else {
      allowed = this.canAccessFeature(featureOrLesson, now);
    }
    return { allowed, paywalled: !allowed, tier: this.isPremium(now) ? 'premium' : 'free' };
  }

  // enumerate exactly what the current entitlement exposes (auditable vs spec)
  exposedFeatures(now = Date.now()) {
    const out = [];
    for (const f of Object.keys(FEATURE_TIER)) if (this.canAccessFeature(f, now)) out.push(f);
    return out;
  }

  toJSON() {
    return {
      platform: this.platform,
      subscriptionActive: this.subscriptionActive,
      trialActive: this.trialActive,
      trialExpiry: this.trialExpiry,
      sandbox: this.sandbox,
    };
  }
  static fromJSON(o) { return new EntitlementStore(o); }
}

module.exports = { EntitlementStore, FEATURE_TIER, FREE_LESSONS, tierFor };
