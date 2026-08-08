'use strict';
/*
 * adversarial-step7.js — HOSTILE self-attack on the Step 7 paywall.
 *
 * The owner's two silent-failure modes for a paywall:
 *   A) FREE-LEAK: a free (or expired/cancelled) user reaches premium content.
 *   B) PAYWALL-TRAP: a paying user gets wrongly locked out.
 * Also probes: platform-asymmetry (ios ok, android leaked), trial-expiry not
 * applied, and any feature slipping into the free surface by policy mistake.
 * Run: node adversarial-step7.js
 */
const { EntitlementStore, FEATURE_TIER, FREE_LESSONS } = require('./entitlementStore.js');
const rc = require('./revenuecatStub.js');

let hits = 0;
function safe(label, fn) {
  try { const r = fn(); if (r) { hits++; console.log('  HIT  ' + label); } }
  catch (e) { hits++; console.log('  HIT  ' + label + ' (threw: ' + e.message + ')'); }
}

console.log('STEP 7 ADVERSARIAL — trying to break the paywall\n');

console.log('A) FREE-LEAK attempts (a free user must NEVER reach premium)');
const free = new EntitlementStore();
// Try every "lesson" surface a free user might hit.
['L02','L03','L04','L05','L06','L07','L08','L09','L10','L11','L12','L13','L14','L15','L16','L17','L18','L19','L20']
  .forEach(l => safe('free user must NOT access ' + l, () => free.canAccessLesson(l) === true));
// premium feature surfaces
['lesson','listening','band','stylePacks','reports','voice'].forEach(f =>
  safe('free user must NOT access feature ' + f, () => free.canAccessFeature(f) === true));
// listening on premium lessons
safe('free user must NOT access listening on L09', () => free.canAccessListening('L09') === true);

console.log('\nB) EXPIRED-TRIAL leak (must revert to free, like cancel)');
const t = new EntitlementStore();
t.startTrial(7, Date.now());
t.settleTrial(Date.now() + 30 * 86400000); // long past expiry
['L02','L20'].forEach(l => safe('expired-trial must NOT access ' + l, () => t.canAccessLesson(l, Date.now() + 30*86400000) === true));

console.log('\nC) CANCELLED leak');
const c = new EntitlementStore();
rc.sandboxPurchase(c, 'ios');
rc.cancel(c);
['L02','L20','band','reports','voice'].forEach(x =>
  safe('cancelled must NOT access ' + x, () => (FEATURE_TIER[x] ? c.canAccessFeature(x) : c.canAccessLesson(x)) === true));

console.log('\nD) PLATFORM-ASYMMETRY (ios premium but android leaked to free, or vice versa)');
const s = new EntitlementStore({ platform: 'ios' });
rc.sandboxPurchase(s, 'ios');
s.platform = 'android';
safe('android must NOT lose premium after ios purchase', () => s.isPremium() === false);
s.platform = 'ios';
safe('ios must NOT lose premium after android purchase', () => s.isPremium() === false);

console.log('\nE) PAYWALL-TRAP (a paying user must NEVER be wrongly locked out)');
const p = new EntitlementStore();
rc.sandboxPurchase(p, 'ios');
['L01','L02','L10','L20','band','stylePacks','reports','voice','listening'].forEach(x =>
  safe('premium user must access ' + x, () => (FEATURE_TIER[x] ? p.canAccessFeature(x) : p.canAccessLesson(x)) === false));
safe('premium listening on a premium lesson must be allowed', () => p.canAccessListening('L13') === false);

console.log('\nF) POLICY-LEAK (a premium-class feature must not sit in the free surface)');
const freeSurf = new EntitlementStore().exposedFeatures();
['band','stylePacks','reports','voice'].forEach(f =>
  safe(f + ' must NOT appear in the free surface', () => freeSurf.includes(f)));
safe('a premium lesson id must NOT be in FREE_LESSONS', () => FREE_LESSONS.some(l => l !== 'L01'));

console.log('\n' + '='.repeat(60));
console.log('ADVERSARIAL: ' + hits + ' HITS');
console.log(hits === 0 ? 'STEP-7-PAYWALL-HOLDS' : 'STEP 7 PAYWALL BREACHED');
console.log('='.repeat(60));
process.exit(hits === 0 ? 0 : 1);
