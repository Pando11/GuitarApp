'use strict';
/* adversarial-step7-fresh-vega.js — INDEPENDENT re-verify of Step 7 (F12).
 * Written from scratch against the source; does not import verify-step7.js
 * or adversarial-step7.js. Browser-free, Node only. */

const fs = require('fs');
const path = require('path');
const ES_PATH = path.join(__dirname, 'entitlementStore.js');
const { EntitlementStore, FEATURE_TIER, FREE_LESSONS } = require(ES_PATH);
const rc = require(path.join(__dirname, 'revenuecatStub.js'));

let pass = 0, fail = 0;
const defects = [];
function ok(cond, name, repro) {
  if (cond) { pass++; }
  else { fail++; defects.push({ name, repro: repro || '' }); console.log('  FAIL: ' + name + (repro ? '  [repro: ' + repro + ']' : '')); }
}
const ALL = ['L01','L02','L03','L04','L05','L06','L07','L08','L09','L10',
             'L11','L12','L13','L14','L15','L16','L17','L18','L19','L20'];
const PREMIUM_LESSONS = ALL.filter(l => l !== 'L01');
const PREMIUM_FEATURES = ['lesson','listening','band','stylePacks','reports','voice'];
const NOW = Date.UTC(2026, 7, 8);
const FAR = NOW + 365 * 86400000;

console.log('== A. FREE-LEAK ==');
{
  const s = new EntitlementStore({});
  ok(s.isPremium(NOW) === false, 'fresh store is not premium', 'new EntitlementStore({}).isPremium()');
  for (const L of PREMIUM_LESSONS) {
    ok(s.canAccessLesson(L, NOW) === false, 'free denied lesson ' + L, 'canAccessLesson("' + L + '")');
    ok(s.canAccessListening(L, NOW) === false, 'free denied listening ' + L, 'canAccessListening("' + L + '")');
    ok(s.paywallDecision(L, NOW).paywalled === true, 'paywalled ' + L, 'paywallDecision("' + L + '")');
  }
  for (const f of PREMIUM_FEATURES) {
    ok(s.canAccessFeature(f, NOW) === false, 'free denied feature ' + f, 'canAccessFeature("' + f + '")');
    ok(s.paywallDecision(f, NOW).paywalled === true, 'free paywalled feature ' + f);
  }
  ok(s.canAccessLesson('L01', NOW) === true, 'free CAN access L01');
  ok(s.canAccessListening('L01', NOW) === true, 'free CAN listen L01');
  ok(s.canAccessFeature('tuner', NOW) === true, 'free CAN use tuner');
  ok(s.canAccessFeature('metronome', NOW) === true, 'free CAN use metronome');
  ok(s.paywallDecision('L02', NOW).paywalled === true && s.paywallDecision('L02', NOW).allowed === false,
     'paywallDecision(L02) paywalled for free');
  ok(s.paywallDecision('L01', NOW).paywalled === false, 'paywallDecision(L01) open for free');
  ok(s.paywallDecision('L02', NOW).tier === 'free', 'paywallDecision tier=free for free user');
  // forged-state attacks
  const forged = [
    ['sandbox flag alone', new EntitlementStore({ sandbox: true })],
    ['trialActive w/o expiry', new EntitlementStore({ trialActive: true })],
    ['trialActive expiry in past', new EntitlementStore({ trialActive: true, trialExpiry: NOW - 1 })],
    ['android fresh', new EntitlementStore({ platform: 'android' })],
  ];
  for (const [name, f] of forged) {
    ok(f.isPremium(NOW) === false, 'no premium via ' + name);
    ok(f.canAccessLesson('L02', NOW) === false, 'L02 locked via ' + name);
  }
}

console.log('== B. EXPIRED-TRIAL ==');
{
  const s = new EntitlementStore({});
  s.startTrial(7, NOW);
  ok(s.isPremium(NOW) === true, 'trial grants premium');
  ok(s.canAccessLesson('L20', NOW) === true, 'trial unlocks L20');
  ok(s.isTrialExpired(FAR) === true, 'trial reports expired in future');
  s.settleTrial(FAR);
  ok(s.trialActive === false, 'settleTrial clears trialActive');
  ok(s.isPremium(FAR) === false, 'expired trial not premium');
  ok(s.canAccessLesson('L02', FAR) === false, 'expired trial: L02 locked', 'startTrial(7);settleTrial(+365d);canAccessLesson("L02")');
  ok(s.canAccessLesson('L01', FAR) === true, 'expired trial: L01 still open');
  ok(s.canAccessListening('L02', FAR) === false, 'expired trial: listening L02 locked');
  for (const f of PREMIUM_FEATURES) ok(s.canAccessFeature(f, FAR) === false, 'expired trial denies ' + f);
  // boundary: exactly at expiry
  const b = new EntitlementStore({}); b.startTrial(7, NOW);
  ok(b.isPremium(b.trialExpiry) === false, 'premium false exactly at expiry instant');
  // no-settle leak: even without settleTrial, isPremium must be false past expiry
  const n = new EntitlementStore({}); n.startTrial(7, NOW);
  ok(n.canAccessLesson('L02', FAR) === false, 'lapsed trial locked even without settleTrial');
}

console.log('== C. CANCEL / RESUBSCRIBE ==');
{
  const s = new EntitlementStore({});
  rc.sandboxPurchase(s, 'ios');
  ok(s.isPremium(NOW) === true, 'sandboxPurchase grants premium');
  ok(s.sandbox === true, 'sandbox receipt marked');
  rc.cancel(s);
  ok(s.isPremium(NOW) === false, 'cancel revokes premium');
  ok(s.canAccessLesson('L02', NOW) === false, 'cancel: L02 locked again', 'sandboxPurchase();cancel();canAccessLesson("L02")');
  ok(s.canAccessLesson('L01', NOW) === true, 'cancel: L01 still open');
  for (const f of PREMIUM_FEATURES) ok(s.canAccessFeature(f, NOW) === false, 'cancel denies ' + f);
  rc.resubscribe(s, 'android');
  ok(s.isPremium(NOW) === true, 'resubscribe restores premium');
  ok(s.canAccessLesson('L20', NOW) === true, 'resubscribe: L20 open');
  ok(s.sandbox === false, 'resubscribe = real (non-sandbox) purchase');
  // cancel during trial
  const t = new EntitlementStore({}); t.startTrial(7, NOW); t.cancel();
  ok(t.isPremium(NOW) === false, 'cancel during trial revokes');
  // double cancel idempotent
  t.cancel(); ok(t.isPremium(NOW) === false, 'double cancel stays free');
}

console.log('== D. PLATFORM ASYMMETRY ==');
{
  for (const [a, b] of [['ios','android'], ['android','ios']]) {
    const s = new EntitlementStore({ platform: a });
    rc.sandboxPurchase(s, a);
    ok(s.isPremium(NOW) === true, 'premium after purchase on ' + a);
    s.platform = b;
    ok(s.isPremium(NOW) === true, 'still premium after flip ' + a + '->' + b, 'purchase(' + a + '); store.platform="' + b + '"');
    for (const L of ALL) ok(s.canAccessLesson(L, NOW) === true, 'cross-platform ' + b + ' lesson ' + L);
    // round-trip through JSON must preserve entitlement
    const j = EntitlementStore.fromJSON(JSON.parse(JSON.stringify(s.toJSON())));
    ok(j.isPremium(NOW) === true, 'JSON round-trip preserves premium (' + b + ')');
    ok(rc.restore(j).premium === true, 'restore() reports premium (' + b + ')');
  }
  const fr = new EntitlementStore({});
  ok(rc.restore(fr).premium === false, 'restore() on free user reports not premium');
}

console.log('== E. PAYWALL-TRAP (premium wrongly denied) ==');
{
  const s = new EntitlementStore({});
  rc.purchase(s, 'ios');
  for (const L of ALL) {
    ok(s.canAccessLesson(L, NOW) === true, 'premium allowed lesson ' + L);
    ok(s.canAccessListening(L, NOW) === true, 'premium allowed listening ' + L);
    ok(s.paywallDecision(L, NOW).paywalled === false, 'premium never paywalled on ' + L);
  }
  for (const f of Object.keys(FEATURE_TIER)) {
    ok(s.canAccessFeature(f, NOW) === true, 'premium allowed feature ' + f);
  }
  ok(s.canAccessListening('L13', NOW) === true, 'premium listening L13');
  ok(s.paywallDecision('band', NOW).tier === 'premium', 'tier reported premium');
  const tr = new EntitlementStore({}); tr.startTrial(7, NOW);
  for (const f of Object.keys(FEATURE_TIER)) ok(tr.canAccessFeature(f, NOW) === true, 'active trial allowed ' + f);
}

console.log('== F. POLICY-MAP CONSISTENCY + FREE SURFACE ENUMERATION ==');
{
  ok(Array.isArray(FREE_LESSONS) && FREE_LESSONS.length === 1 && FREE_LESSONS[0] === 'L01',
     'FREE_LESSONS is exactly ["L01"]', 'FREE_LESSONS=' + JSON.stringify(FREE_LESSONS));
  for (const f of PREMIUM_FEATURES) ok(FEATURE_TIER[f] === 'premium', 'FEATURE_TIER.' + f + " === 'premium'",
    'FEATURE_TIER.' + f + '=' + FEATURE_TIER[f]);
  ok(FEATURE_TIER.tuner === 'free' && FEATURE_TIER.metronome === 'free', 'tuner+metronome are free tier');
  const freeMarked = Object.keys(FEATURE_TIER).filter(k => FEATURE_TIER[k] === 'free');
  ok(freeMarked.length === 2 && freeMarked.includes('tuner') && freeMarked.includes('metronome'),
     "only tuner+metronome carry tier 'free'", "free-marked=" + JSON.stringify(freeMarked));
  const tiers = new Set(Object.values(FEATURE_TIER));
  ok([...tiers].every(t => ['free','shell','premium'].includes(t)), 'no unknown tier values');

  const free = new EntitlementStore({});
  const exposed = free.exposedFeatures(NOW);
  console.log('  free exposedFeatures = ' + JSON.stringify(exposed));
  for (const f of ['band','stylePacks','reports','voice','lesson','listening'])
    ok(!exposed.includes(f), 'no premium leak into free surface: ' + f, 'exposedFeatures() contains ' + f);
  ok(exposed.includes('tuner') && exposed.includes('metronome'), 'free surface includes tuner+metronome');
  const shellOnly = exposed.filter(f => FEATURE_TIER[f] === 'shell');
  console.log('  free shell-tier surface (by-design waiver) = ' + JSON.stringify(shellOnly));
  ok(exposed.every(f => FEATURE_TIER[f] !== 'premium'), 'free surface contains ZERO premium-tier features');
  // content-access sense: free user's unlocked content is exactly L01
  const unlocked = ALL.filter(L => free.canAccessLesson(L, NOW));
  ok(unlocked.length === 1 && unlocked[0] === 'L01', 'free content access is exactly L01',
     'unlocked=' + JSON.stringify(unlocked));
  const listenable = ALL.filter(L => free.canAccessListening(L, NOW));
  ok(listenable.length === 1 && listenable[0] === 'L01', 'free listening access is exactly L01');
  // unknown feature must not be granted
  ok(free.canAccessFeature('__nope__', NOW) === false, 'unknown feature denied to free user');
  ok(free.paywallDecision('__nope__', NOW).paywalled === true, 'unknown feature paywalled for free');
}

console.log('== G. HARD BAN 5 — no network in entitlementStore.js ==');
{
  const src = fs.readFileSync(ES_PATH, 'utf8');
  const pats = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /require\(\s*['"]https?['"]\s*\)/,
                /\bhttps?:\/\//, /axios/, /navigator\.sendBeacon/, /EventSource/];
  const hits = pats.filter(p => p.test(src)).map(p => p.source);
  ok(hits.length === 0, 'entitlementStore.js has no network refs', 'hits=' + JSON.stringify(hits));
  const stub = fs.readFileSync(path.join(__dirname, 'revenuecatStub.js'), 'utf8');
  const stubHits = pats.filter(p => p.test(stub)).map(p => p.source);
  console.log('  revenuecatStub.js network refs (informational, NOT a failure): ' +
    (stubHits.length ? JSON.stringify(stubHits) : 'none'));
}

const total = pass + fail;
console.log('\n===== FRESH ADVERSARIAL RESULT =====');
console.log('assertions: ' + total + '  pass: ' + pass + '  fail: ' + fail);
if (fail) { console.log('DEFECTS:'); defects.forEach((d, i) => console.log(' ' + (i + 1) + '. ' + d.name + ' | repro: ' + d.repro)); }
console.log(fail === 0 ? 'STEP 7: PASS' : 'STEP 7: FAIL');
process.exit(fail === 0 ? 0 : 1);
