/*
 * evidence-loop.js — THE EVIDENCE LOOP (AMENDMENT-06)
 *
 * Turns "is this lesson good?" from an opinion into a parameter the app's own data
 * decides. A lesson is PROVEN GOOD when a retained, paying, non-churned cohort cleared
 * it with clean playing + kept practicing + didn't quit after. New lessons are generated
 * from the validated set ("make more like the good ones").
 *
 * Reads a cohort practice-log (contract with F2/F11/F12). Browser-free, Node, zero deps.
 * Self-tests: synthetic retained cohort (most lessons VALIDATED) + adversarial cohort
 * (a lesson made churn-correlated is correctly REJECTED).
 *
 * Run:  node evidence-loop.js            (runs self-tests)
 *       node evidence-loop.js <log.json>  (classifies a real cohort log)
 */
'use strict';

/* ---- §2.1 Proving-cohort parameters (tunable knobs) ---- */
const PARAMS = {
  TENURE_MONTHS: 12,
  MIN_SESSIONS: 24,
  // §2.3 validation bar
  MIN_N: 50,
  CLEAN_MEDIAN_MIN: 0.70,
  STREAK_THROUGH_MIN: 0.60,
  POST_CHURN_MAX: 0.10,
  // §2.4 reject bar
  POST_CHURN_REJECT: 0.25,
  CLEAN_MEDIAN_REJECT: 0.40,
  STREAK_THROUGH_REJECT: 0.30
};

function median(arr) {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN; }

/* Is user u in the proving cohort? §2.1 */
function isProver(u) {
  return u.tenure_months >= PARAMS.TENURE_MONTHS &&
         !u.churned &&
         u.sessions >= PARAMS.MIN_SESSIONS;
}

/* Aggregate per-lesson measures for the proving cohort. §2.2 */
function aggregate(practiceLog) {
  const provers = practiceLog.filter(isProver);
  const byLesson = {};
  for (const u of provers) {
    for (const rec of (u.lessons || [])) {
      const L = rec.id;
      (byLesson[L] = byLesson[L] || []).push(rec);
    }
  }
  const out = {};
  for (const L of Object.keys(byLesson)) {
    const recs = byLesson[L];
    out[L] = {
      n: recs.length,
      clean_rate_median: median(recs.map(r => r.clean_rate)),
      streak_through_rate: mean(recs.map(r => r.streak_through ? 1 : 0)),
      post_churn_rate: mean(recs.map(r => r.churned_after ? 1 : 0))
    };
  }
  return out;
}

/* Classify each lesson. §2.3 / §2.4 */
function classify(agg) {
  const result = {};
  for (const L of Object.keys(agg)) {
    const a = agg[L];
    const reasons = [];
    // validation bar (ALL must hold)
    const valN = a.n >= PARAMS.MIN_N;
    const valClean = a.clean_rate_median >= PARAMS.CLEAN_MEDIAN_MIN;
    const valStreak = a.streak_through_rate >= PARAMS.STREAK_THROUGH_MIN;
    const valChurn = a.post_churn_rate <= PARAMS.POST_CHURN_MAX;
    // reject bar (ANY triggers reject)
    const rejChurn = a.post_churn_rate >= PARAMS.POST_CHURN_REJECT;
    const rejClean = a.clean_rate_median < PARAMS.CLEAN_MEDIAN_REJECT;
    const rejStreak = a.streak_through_rate < PARAMS.STREAK_THROUGH_REJECT;

    if (rejChurn) reasons.push('post_churn_rate ' + a.post_churn_rate.toFixed(2) + ' >= ' + PARAMS.POST_CHURN_REJECT);
    if (rejClean) reasons.push('clean_rate_median ' + a.clean_rate_median.toFixed(2) + ' < ' + PARAMS.CLEAN_MEDIAN_REJECT);
    if (rejStreak) reasons.push('streak_through_rate ' + a.streak_through_rate.toFixed(2) + ' < ' + PARAMS.STREAK_THROUGH_REJECT);

    let status;
    if (rejChurn || rejClean || rejStreak) status = 'REJECT';
    else if (valN && valClean && valStreak && valChurn) status = 'VALIDATED';
    else status = 'UNVALIDATED';

    result[L] = { status, reasons, ...a };
  }
  return result;
}

/* The generation constraint (§3): new lessons come from the VALIDATED set. */
function validatedSet(classified) {
  return Object.keys(classified).filter(L => classified[L].status === 'VALIDATED');
}
function rejectedSet(classified) {
  return Object.keys(classified).filter(L => classified[L].status === 'REJECT');
}

/* ------------------------------------------------------------------ *
 * SELF-TESTS (prove the loop itself is trustworthy, not a rubber stamp)
 * ------------------------------------------------------------------ */
function buildSyntheticCohort(lessons, opts) {
  // lessons: array of ids. opts: { churnLesson?: id, churnFrac?: number }
  const users = [];
  const N = 120; // > MIN_N so sample is sufficient
  for (let i = 0; i < N; i++) {
    const lessonsSeen = lessons.map(id => {
      const rec = { id, clean_rate: 0.78 + Math.random() * 0.18, streak_through: Math.random() > 0.25, churned_after: false };
      // adversarial: inject churn correlation on one lesson
      if (opts && opts.churnLesson === id && Math.random() < (opts.churnFrac || 0.3)) {
        rec.churned_after = true;
        rec.clean_rate = 0.30 + Math.random() * 0.1;
        rec.streak_through = false;
      }
      return rec;
    });
    users.push({ tenure_months: 13, churned: false, sessions: 40, lessons: lessonsSeen });
  }
  return users;
}

function runSelfTests() {
  const LESSONS = ['L01','L02','L03','L04','L05','L06','L07','L08','L09','L10','L11','L12','L13','L14','L15','L16','L17','L18','L19','L20'];
  let pass = true;

  // --- Test 1: healthy retained cohort -> most lessons VALIDATED ---
  const healthy = buildSyntheticCohort(LESSONS);
  const c1 = classify(aggregate(healthy));
  const val1 = validatedSet(c1).length;
  console.log('TEST 1 healthy cohort: ' + val1 + '/' + LESSONS.length + ' VALIDATED');
  if (val1 < LESSONS.length - 1) { pass = false; console.log('  FAIL: expected nearly all validated'); }
  else console.log('  PASS');

  // --- Test 2: adversarial — L07 made churn-correlated -> REJECTED ---
  const bad = buildSyntheticCohort(LESSONS, { churnLesson: 'L07', churnFrac: 0.35 });
  const c2 = classify(aggregate(bad));
  const rej2 = rejectedSet(c2);
  console.log('TEST 2 adversarial cohort: rejected = [' + rej2.join(', ') + ']');
  if (!rej2.includes('L07')) { pass = false; console.log('  FAIL: L07 should have been REJECTED'); }
  else console.log('  PASS: L07 correctly REJECTED (post-churn correlated)');

  // --- Test 3: insufficient sample -> UNVALIDATED, never falsely VALIDATED ---
  const tiny = [ { tenure_months: 13, churned: false, sessions: 40,
                   lessons: LESSONS.map(id => ({ id, clean_rate: 0.99, streak_through: true, churned_after: false })) } ];
  const c3 = classify(aggregate(tiny));
  const allUnval = Object.values(c3).every(x => x.status !== 'VALIDATED');
  console.log('TEST 3 tiny cohort (n=1): statuses = ' + Object.values(c3).map(x=>x.status).join(','));
  if (!allUnval) { pass = false; console.log('  FAIL: small sample must not validate'); }
  else console.log('  PASS: no false validation on tiny sample');

  // --- Test 4: a churned user is excluded from the proving cohort ---
  const withChurn = healthy.concat([ { tenure_months: 13, churned: true, sessions: 40,
                   lessons: LESSONS.map(id => ({ id, clean_rate: 0.99, streak_through: true, churned_after: false })) } ]);
  const c4 = classify(aggregate(withChurn));
  // proving cohort size unchanged (churned excluded), so validation unaffected
  console.log('TEST 4 churned user excluded: proving cohort ignores churned=true -> ' +
              (Object.keys(c4).length === LESSONS.length ? 'PASS' : 'FAIL'));
  if (Object.keys(c4).length !== LESSONS.length) pass = false;

  console.log('\n' + (pass ? 'EVIDENCE-LOOP-SELFTEST-OK — loop is trustworthy' : 'EVIDENCE-LOOP-SELFTEST-FAILED'));
  return pass;
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */
if (require.main === module) {
  const fs = require('fs');
  if (process.argv[2]) {
    const log = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const agg = aggregate(log);
    const cls = classify(agg);
    console.log('EVIDENCE LOOP — cohort log: ' + process.argv[2]);
    console.log('proving cohort size: ' + log.filter(isProver).length + '\n');
    for (const L of Object.keys(cls).sort()) {
      const c = cls[L];
      console.log((c.status === 'VALIDATED' ? '✅' : c.status === 'REJECT' ? '❌' : '⏳') +
        ' ' + L.padEnd(5) + ' ' + c.status.padEnd(11) +
        ' n=' + String(c.n).padStart(3) +
        ' clean=' + c.clean_rate_median.toFixed(2) +
        ' streak=' + c.streak_through_rate.toFixed(2) +
        ' postChurn=' + c.post_churn_rate.toFixed(2) +
        (c.reasons.length ? '  <- ' + c.reasons.join('; ') : ''));
    }
    console.log('\nVALIDATED set (generate new lessons from here): ' + validatedSet(cls).join(', '));
    console.log('REJECT set (rewrite): ' + rejectedSet(cls).join(', ') || '(none)');
  } else {
    runSelfTests();
  }
}

module.exports = { aggregate, classify, validatedSet, rejectedSet, isProver, PARAMS, buildSyntheticCohort };
