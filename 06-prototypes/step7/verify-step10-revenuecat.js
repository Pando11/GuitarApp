'use strict';
/*
 * verify-step10-revenuecat.js — DONE BAR for the F12 live-credential boundary.
 *
 * Proves everything that does NOT require a real key:
 *   - key-shape validation rejects junk, secret keys, wrong prefixes
 *   - preflight degrades to 'stub' with no keys and reports WHY
 *   - preflight goes 'live' when well-formed keys are present
 *   - CustomerInfo -> entitlement mapping is correct (active / expired / trial /
 *     missing / android store / sandbox flag)
 *   - the live path issues exactly one authorized request (verified with an
 *     INJECTED FAKE fetch — no network, no real credential)
 *   - Hard Ban 5 holds: entitlementStore.js still contains zero network calls
 *   - the stub path still behaves identically to Step 7
 *
 * What this canNOT prove: that Apple/Google actually grant the entitlement.
 * That needs the owner's sandbox keys and is the ONLY remaining gap.
 */

const fs = require('fs');
const path = require('path');
const { preflight, validateKey, redact } = require('./revenuecatConfig.js');
const { RevenueCatAdapter, applyCustomerInfo } = require('./revenuecatAdapter.js');
const { EntitlementStore } = require('./entitlementStore.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  OK   ' + m); } else { fail++; console.log('  FAIL ' + m); } };

const GOOD_IOS = 'appl_' + 'A'.repeat(24);
const GOOD_AND = 'goog_' + 'B'.repeat(24);

console.log('\n-- key shape validation --');
ok(validateKey('ios', GOOD_IOS).ok, 'well-formed iOS public key accepted');
ok(validateKey('android', GOOD_AND).ok, 'well-formed Android public key accepted');
ok(!validateKey('ios', null).ok, 'missing key rejected');
ok(!validateKey('ios', 'goog_' + 'A'.repeat(24)).ok, 'android key in iOS slot rejected');
ok(!validateKey('ios', 'appl_short').ok, 'too-short key rejected');
ok(!validateKey('ios', 'sk_live_' + 'A'.repeat(24)).ok, 'SECRET key rejected where public key required');
ok(!validateKey('windows', GOOD_IOS).ok, 'unknown platform rejected');

console.log('\n-- preflight --');
const empty = preflight({});
ok(empty.live === false && empty.mode === 'stub', 'no credentials -> mode "stub", never a fake live');
ok(empty.problems.length === 2, 'preflight names BOTH missing platform keys (' + empty.problems.length + ')');
ok(empty.config.entitlementId === 'premium', 'entitlement id defaults to "premium"');
ok(empty.config.rcEnv === 'sandbox', 'RC_ENV defaults to sandbox (never prod by accident)');

const good = preflight({ RC_IOS_PUBLIC_KEY: GOOD_IOS, RC_ANDROID_PUBLIC_KEY: GOOD_AND });
ok(good.live === true && good.mode === 'live', 'both well-formed keys -> mode "live"');
ok(good.problems.length === 0, 'live preflight reports no problems');
const badEnv = preflight({ RC_IOS_PUBLIC_KEY: GOOD_IOS, RC_ANDROID_PUBLIC_KEY: GOOD_AND, RC_ENV: 'staging' });
ok(badEnv.live === false, 'invalid RC_ENV blocks live');

console.log('\n-- secret hygiene --');
ok(redact(GOOD_IOS).includes('…') && !redact(GOOD_IOS).includes('A'.repeat(24)), 'redact() never prints the full key');
ok(redact(null) === '(unset)', 'redact() handles an unset key');
const cfgSrc = fs.readFileSync(path.join(__dirname, 'revenuecatConfig.js'), 'utf8');
ok(!/appl_[A-Za-z0-9]{10,}/.test(cfgSrc) && !/goog_[A-Za-z0-9]{10,}/.test(cfgSrc), 'no hardcoded key literal in config source');

console.log('\n-- CustomerInfo -> entitlement mapping --');
const future = new Date(Date.now() + 30 * 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();

let s = new EntitlementStore();
let r = applyCustomerInfo(s, { entitlements: { active: { premium: { expires_date: future, store: 'app_store', period_type: 'normal' } } } }, 'premium');
ok(r.premium === true && s.isPremium(), 'active iOS subscription -> premium');
ok(s.platform === 'ios', 'app_store maps to platform ios');
ok(s.canAccessFeature('band') && s.canAccessLesson('L07'), 'premium unlocks gated features + lessons');

s = new EntitlementStore();
r = applyCustomerInfo(s, { entitlements: { active: { premium: { expires_date: future, store: 'play_store', period_type: 'normal' } } } }, 'premium');
ok(s.platform === 'android' && s.isPremium(), 'play_store maps to android and grants premium');

s = new EntitlementStore();
r = applyCustomerInfo(s, { entitlements: { active: { premium: { expires_date: past, store: 'app_store' } } } }, 'premium');
ok(r.premium === false && !s.isPremium(), 'EXPIRED entitlement -> not premium');
ok(s.canAccessLesson('L01') && !s.canAccessLesson('L02'), 'expired user falls back to strict free (L01 only)');

s = new EntitlementStore();
r = applyCustomerInfo(s, { entitlements: { active: {} } }, 'premium');
ok(r.premium === false, 'no active entitlement -> not premium');

s = new EntitlementStore();
r = applyCustomerInfo(s, { entitlements: { active: { premium: { expires_date: future, store: 'app_store', period_type: 'trial' } } } }, 'premium');
ok(s.trialActive === true && s.subscriptionActive === false && s.isPremium(), 'trial grants premium without marking a paid sub');

s = new EntitlementStore();
applyCustomerInfo(s, { entitlements: { active: { premium: { expires_date: future, store: 'app_store', is_sandbox: true } } } }, 'premium');
ok(s.sandbox === true, 'sandbox receipts are flagged as sandbox (never counted as real revenue)');

s = new EntitlementStore();
applyCustomerInfo(s, { entitlements: { active: { other_thing: { expires_date: future } } } }, 'premium');
ok(!s.isPremium(), 'a DIFFERENT entitlement id does not unlock premium');

console.log('\n-- adapter: stub path (no credentials) --');
const stubAd = new RevenueCatAdapter({ env: {} });
ok(stubAd.mode === 'stub', 'adapter with no keys runs in stub mode');
ok(stubAd.status().iosKey === '(unset)', 'status() reports unset key without inventing one');
(async () => {
  const p = await stubAd.purchase('ios');
  ok(p.ok && p.mode === 'stub' && stubAd.store.isPremium(), 'stub sandbox purchase grants premium');
  ok(stubAd.store.sandbox === true, 'stub purchase is marked sandbox');
  stubAd.cancel();
  ok(!stubAd.store.isPremium(), 'cancel reverts to free');
  stubAd.resubscribe('android');
  ok(stubAd.store.isPremium() && stubAd.store.platform === 'android', 're-subscribe works cross-platform');

  console.log('\n-- adapter: live path (INJECTED FAKE fetch, no network, no real key) --');
  const calls = [];
  const fakeFetch = async (url, opts) => {
    calls.push({ url, auth: opts.headers.Authorization });
    return { ok: true, status: 200, json: async () => ({ subscriber: { entitlements: { active: { premium: { expires_date: future, store: 'app_store', period_type: 'normal' } } } } }) };
  };
  const liveAd = new RevenueCatAdapter({ env: { RC_IOS_PUBLIC_KEY: GOOD_IOS, RC_ANDROID_PUBLIC_KEY: GOOD_AND }, fetch: fakeFetch });
  ok(liveAd.mode === 'live', 'adapter with valid keys runs in live mode');
  const lp = await liveAd.purchase('ios', 'user-123');
  ok(calls.length === 1, 'live purchase issues exactly ONE request');
  ok(calls[0].url.includes('/subscribers/user-123'), 'request targets the correct subscriber endpoint');
  ok(calls[0].auth === 'Bearer ' + GOOD_IOS, 'request carries the iOS bearer credential');
  ok(lp.ok && liveAd.store.isPremium(), 'live purchase applies the entitlement');

  await liveAd.restore('user-123', 'android');
  ok(calls[1].auth === 'Bearer ' + GOOD_AND, 'android restore uses the ANDROID key, not the iOS one');

  const failFetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
  const badAd = new RevenueCatAdapter({ env: { RC_IOS_PUBLIC_KEY: GOOD_IOS, RC_ANDROID_PUBLIC_KEY: GOOD_AND }, fetch: failFetch });
  let threw = false;
  try { await badAd.purchase('ios', 'u'); } catch (e) { threw = /401/.test(e.message); }
  ok(threw, 'a rejected credential throws instead of silently granting premium');
  ok(!badAd.store.isPremium(), 'failed live purchase leaves the user NOT premium');

  console.log('\n-- Hard Ban 5: core purity --');
  const esSrc = fs.readFileSync(path.join(__dirname, 'entitlementStore.js'), 'utf8');
  ok(!/(fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|require\(['"]https?['"]\))/.test(esSrc), 'entitlementStore.js still has ZERO network calls');
  const adSrc = fs.readFileSync(path.join(__dirname, 'revenuecatAdapter.js'), 'utf8');
  ok(/api\.revenuecat\.com/.test(adSrc), 'network lives ONLY in the adapter (external boundary)');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 10 F12 CREDENTIAL BOUNDARY: ' + pass + ' passed, ' + fail + ' failed');
  console.log(fail === 0 ? 'STEP-10-RC-BOUNDARY-OK — live wiring is drop-in once keys exist'
                         : 'STEP-10-RC-BOUNDARY-FAIL');
  console.log('REMAINING GAP (owner-blocked): real App Store / Play sandbox keys.');
  console.log('='.repeat(60));
  process.exit(fail === 0 ? 0 : 1);
})();
