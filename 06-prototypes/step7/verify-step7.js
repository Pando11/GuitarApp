'use strict';
/*
 * verify-step7.js — DONE BAR for Step 7 (F12, Money: subscriptions + paywall).
 *
 * Proves against the plan DONE BAR:
 *   - a sandbox purchase grants full access on BOTH platforms
 *   - the free tier is EXACTLY tuner + metronome + Lesson 1 (nothing more)
 *   - cancellation / re-subscribe paths work
 *
 * Logic is verifiable browser-free; the RevenueCat purchase is a stubbed external
 * boundary (no real app-store sandbox creds in this prototype). Ban 5 scanned.
 * Run: node verify-step7.js
 */
const fs = require('fs'), path = require('path');
const { EntitlementStore, FEATURE_TIER, FREE_LESSONS } = require('./entitlementStore.js');
const rc = require('./revenuecatStub.js');

let pass = 0, fail = 0;
function check(n, c, d) {
  if (c) { pass++; console.log('  OK   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? '  ' + d : '')); }
}

console.log('STEP 7 — F12 SUBSCRIPTIONS + PAYWALL DONE BAR\n');

console.log('1) FREE user sees EXACTLY tuner + metronome + Lesson 1 (nothing more)');
const free = new EntitlementStore();
check('free user is NOT premium', free.isPremium() === false);
check('free user can access tuner', free.canAccessFeature('tuner') === true);
check('free user can access metronome', free.canAccessFeature('metronome') === true);
check('free user can access Lesson 1', free.canAccessLesson('L01') === true);
check('free user can access listening FOR Lesson 1', free.canAccessListening('L01') === true);
check('free user CANNOT access Lesson 2', free.canAccessLesson('L02') === false);
check('free user CANNOT access listening for Lesson 2', free.canAccessListening('L02') === false);
check('free user CANNOT access premium lessons array (L20)', free.canAccessLesson('L20') === false);
// enumerate the full exposed surface and diff against the spec's exact allowance.
// OWNER DECISION (2026-08-08): STRICT free = tuner + metronome ONLY. The shell
// features (F3 roster, F4 chat, F5 adaptive, F6 messages, F11 streaks) are premium,
// so a free user's exposed surface must be exactly {tuner, metronome}.
const exposed = free.exposedFeatures().sort();
check('exposed surface == {tuner, metronome} ONLY (strict free, no shell leak)',
  JSON.stringify(exposed) === JSON.stringify(['tuner','metronome'].sort()),
  'exposed=' + exposed.join(','));
check('free user CANNOT access teacher roster (F3)', free.canAccessFeature('teacherRoster') === false);
check('free user CANNOT access chat (F4)', free.canAccessFeature('chat') === false);
check('free user CANNOT access adaptive plan (F5)', free.canAccessFeature('adaptive') === false);
check('free user CANNOT access messages (F6)', free.canAccessFeature('messages') === false);
check('free user CANNOT access streaks (F11)', free.canAccessFeature('streaks') === false);
check('free user paywall decision for L02 is paywalled', free.paywallDecision('L02').allowed === false && free.paywallDecision('L02').paywalled === true);

console.log('\n2) Sandbox purchase grants FULL access on iOS');
const ios = new EntitlementStore({ platform: 'ios' });
rc.sandboxPurchase(ios, 'ios');
check('sandbox purchase set subscriptionActive', ios.subscriptionActive === true);
check('sandbox purchase marked sandbox', ios.sandbox === true);
check('sandbox user is premium', ios.isPremium() === true);
check('sandbox user can access ALL lessons (L01..L20)', ['L01','L02','L05','L10','L20'].every(l => ios.canAccessLesson(l)));
check('sandbox user can access listening on any lesson', ios.canAccessListening('L07') === true);
check('sandbox user can access all premium features', ['lesson','listening','band','stylePacks','reports','voice'].every(f => ios.canAccessFeature(f)));

console.log('\n3) Sandbox purchase grants FULL access on Android (single source parity)');
const and = new EntitlementStore({ platform: 'android' });
rc.sandboxPurchase(and, 'android');
check('android sandbox user is premium', and.isPremium() === true);
check('android exposes same set as ios', JSON.stringify(and.exposedFeatures().sort()) === JSON.stringify(ios.exposedFeatures().sort()));
check('android can access L20', and.canAccessLesson('L20') === true);

console.log('\n4) Free trial grants premium, then EXPIRES back to free');
const t = new EntitlementStore();
t.startTrial(7, Date.now());
check('active trial is premium', t.isPremium() === true);
check('trial user can access L10', t.canAccessLesson('L10') === true);
const afterExpiry = Date.now() + 8 * 86400000;
t.settleTrial(afterExpiry);
check('expired trial settles to free', t.isPremium(afterExpiry) === false);
check('expired trial loses L10', t.canAccessLesson('L10', afterExpiry) === false);
check('expired trial keeps only tuner+metronome+L01', t.canAccessLesson('L01', afterExpiry) === true && t.canAccessLesson('L02', afterExpiry) === false);

console.log('\n5) Cancellation reverts to free; re-subscribe restores premium');
const c = new EntitlementStore();
rc.sandboxPurchase(c, 'ios');
check('pre-cancel premium', c.isPremium() === true);
rc.cancel(c);
check('after cancel: NOT premium', c.isPremium() === false);
check('after cancel: L02 locked again', c.canAccessLesson('L02') === false);
rc.resubscribe(c, 'ios');
check('after resubscribe: premium again', c.isPremium() === true);
check('after resubscribe: L02 unlocked again', c.canAccessLesson('L02') === true);

console.log('\n6) Cross-platform single source: one entitlement object, same verdict both platforms');
const shared = new EntitlementStore({ platform: 'ios' });
rc.sandboxPurchase(shared, 'ios');
const verdictIOS = shared.canAccessLesson('L15');
shared.platform = 'android';
const verdictAndroid = shared.canAccessLesson('L15');
check('same entitlement verdict regardless of platform field', verdictIOS === verdictAndroid && verdictIOS === true);

console.log('\n7) BAN 5 — entitlementStore.js makes ZERO network calls');
const src = fs.readFileSync(path.join(__dirname, 'entitlementStore.js'), 'utf8');
check('no fetch/XHR/WebSocket/http in entitlementStore source', !/\b(fetch|XMLHttpRequest|WebSocket|http\.request|axios|require\('https'\)|require\("https"\))/.test(src));

console.log('\n' + '='.repeat(60));
console.log('STEP 7 F12: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-7-F12-OK' : 'STEP 7 F12 FAILED');
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
