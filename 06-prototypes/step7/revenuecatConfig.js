'use strict';
/*
 * revenuecatConfig.js — credential boundary for F12 (Money).
 *
 * WHY THIS FILE EXISTS
 *   Live RevenueCat needs real keys that only the owner can mint (RevenueCat
 *   dashboard + App Store Connect + Play Console). No key can be invented here;
 *   a fabricated key fails on the first network call and would make the gate lie.
 *   So the credential boundary is made EXPLICIT and TESTABLE: everything up to
 *   the key is built and proven; the key itself is read from the environment.
 *
 * NO SECRETS IN THIS REPO. Keys are read from process.env only.
 *   RC_IOS_PUBLIC_KEY       RevenueCat public SDK key, Apple app  (starts "appl_")
 *   RC_ANDROID_PUBLIC_KEY   RevenueCat public SDK key, Google app (starts "goog_")
 *   RC_ENTITLEMENT_ID       entitlement identifier, default "premium"
 *   RC_OFFERING_ID          offering identifier,    default "default"
 *   RC_ENV                  "sandbox" | "production"  (default "sandbox")
 *
 * Hard Ban 5 unaffected: entitlementStore.js is still pure and untouched.
 */

const ENTITLEMENT_DEFAULT = 'premium';
const OFFERING_DEFAULT = 'default';

// Shape rules published by RevenueCat for public SDK keys.
const KEY_SHAPE = {
  ios: { prefix: 'appl_', minLen: 20 },
  android: { prefix: 'goog_', minLen: 20 },
};

function readEnv(env) {
  const e = env || process.env;
  return {
    iosKey: e.RC_IOS_PUBLIC_KEY || null,
    androidKey: e.RC_ANDROID_PUBLIC_KEY || null,
    entitlementId: e.RC_ENTITLEMENT_ID || ENTITLEMENT_DEFAULT,
    offeringId: e.RC_OFFERING_ID || OFFERING_DEFAULT,
    rcEnv: e.RC_ENV || 'sandbox',
  };
}

function validateKey(platform, key) {
  const shape = KEY_SHAPE[platform];
  if (!shape) return { ok: false, reason: 'unknown platform: ' + platform };
  if (!key) return { ok: false, reason: 'missing key for ' + platform };
  if (typeof key !== 'string') return { ok: false, reason: 'key must be a string' };
  if (!key.startsWith(shape.prefix)) {
    return { ok: false, reason: platform + ' key must start with "' + shape.prefix + '"' };
  }
  if (key.length < shape.minLen) return { ok: false, reason: platform + ' key is too short to be real' };
  // A secret key must never be shipped in a client build.
  if (/^sk_/.test(key)) return { ok: false, reason: 'SECRET key supplied where PUBLIC SDK key is required' };
  return { ok: true };
}

/**
 * preflight() — can we go live right now?
 * Returns { live, mode, problems[], config }. Never throws, never calls the network.
 * mode: 'live' when both platform keys validate, else 'stub'.
 */
function preflight(env) {
  const cfg = readEnv(env);
  const problems = [];
  const ios = validateKey('ios', cfg.iosKey);
  const android = validateKey('android', cfg.androidKey);
  if (!ios.ok) problems.push('iOS: ' + ios.reason);
  if (!android.ok) problems.push('Android: ' + android.reason);
  if (cfg.rcEnv !== 'sandbox' && cfg.rcEnv !== 'production') {
    problems.push('RC_ENV must be "sandbox" or "production" (got "' + cfg.rcEnv + '")');
  }
  const live = problems.length === 0;
  return {
    live,
    mode: live ? 'live' : 'stub',
    problems,
    config: {
      entitlementId: cfg.entitlementId,
      offeringId: cfg.offeringId,
      rcEnv: cfg.rcEnv,
      iosKey: cfg.iosKey,
      androidKey: cfg.androidKey,
    },
  };
}

/** Redacted view — safe to print in logs / CI output. */
function redact(key) {
  if (!key) return '(unset)';
  return key.slice(0, 9) + '…' + key.slice(-4) + ' (len ' + key.length + ')';
}

module.exports = { preflight, validateKey, readEnv, redact, ENTITLEMENT_DEFAULT, OFFERING_DEFAULT, KEY_SHAPE };
