// entitlementStore.js — F12 Money. PORTED 1:1 from 06-prototypes/step7/entitlementStore.js.
// Single source of free/premium policy. Hard Ban 5: ZERO network calls (RevenueCat is external).
// STRICT free tier (owner decision 2026-08-08): tuner + metronome + Lesson 1 ONLY.

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
  toJSON() {
    return { platform: this.platform, subscriptionActive: this.subscriptionActive, trialActive: this.trialActive, trialExpiry: this.trialExpiry, sandbox: this.sandbox };
  }
  static fromJSON(o) { return new EntitlementStore(o); }
}
