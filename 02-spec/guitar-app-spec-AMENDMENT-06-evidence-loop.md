# AMENDMENT-06 — The Evidence Loop (making "good lesson" verifiable)
Date: 2026-08-08 · Owner directive: stop treating teaching quality as unverifiable; define
parameters that, when met by real user data, PROVE a lesson is working, then generate
new lessons from the proven set.

Supersedes: nothing in FEATURES-LOCKED-v1-2026-08-07.md. ADDS a new mechanism (the
Evidence Loop) that sits on top of F2 (listening), F5 (adaptive), F9 (progress reports),
F11 (streaks/practice log), and F12 (subscription/tenure). This is the owner's own
framing: "if a user stays 12 months and looked at these lessons, assume those lessons
are good, then make more like them."

>> AMENDMENT-06 ADDS (does not remove) — append-only.

---

## 1. THE CORE IDEA
We cannot (and the founder cannot) watch a student and judge "was that lesson good."
But we CAN measure, from the app's own data, whether a lesson was *compatible with*
long-term engagement. A lesson that a 12-month-retained, paying user completed, played
cleanly (via the listening engine), and did NOT quit after — is, by the owner's own
definition, a good lesson. That is a parameter, not a feeling.

So the pipeline becomes:
  1. Ship lessons (Step 4 already did: 20 JSON, arithmetic-verified fingerings).
  2. Collect REAL practice data per user (F2 clean-rate, F11 completion/streak, F12 tenure).
  3. Define a PROVING COHORT = users who stayed ≥ T months and are still active.
  4. The lessons that cohort cleared with good signals = VALIDATED SET.
  5. Generate NEW lessons from the validated set (same structure/parameters/pacing).
  6. Lessons correlated with post-consumption churn = flagged for rewrite (a real
     "this lesson is bad" signal, also verifiable).

This is verifiable by construction: every "good" verdict cites real practice-data keys
(F2/F11/F12). That satisfies Hard Ban 6 (LLM cites real data only) and COMPLEMENTS
Hard Ban 7 (chord fingerings still proven by arithmetic — the loop proves engagement
quality, not fingering correctness).

---

## 2. PARAMETERS (the knobs — tune with real data, start with these defaults)

### 2.1 Proving cohort
- `TENURE_MONTHS >= 12`  (the owner's example: 12-month retained payer)
- `NOT_CHURNED` at month T (active subscription, not in grace/cancel)
- `MIN_SESSIONS >= 24`  (saw the app at least ~2x/month — real engagement, not a zombie)
- (Optional later) segment by entry-level (absolute-beginner) so we validate the
  beginner path with beginner cohorts.

### 2.2 Per-lesson measures (all from real app data)
For each lesson L and each user u in the proving cohort:
- `consumed[u][L]`      : boolean — L appears in u's completed-lesson history (F11).
- `clean_rate[u][L]`    : median listening-engine "clean" rate over L's chords (F2). 0..1.
- `streak_through[u][L]`: maintained practice streak ≥ 7 days *after* consuming L (F11).
- `churned_after[u][L]` : u cancelled within 30 days of consuming L (F12).

Aggregated across the cohort for lesson L:
- `n`                  = number of cohort users who consumed L.
- `completion_rate`    = mean(consumed)  (all consumed by definition; kept for non-cohort views).
- `clean_rate_median`  = median(clean_rate[u][L]).
- `streak_through_rate`= mean(streak_through[u][L]).
- `post_churn_rate`    = mean(churned_after[u][L]).

### 2.3 Validation bar (a lesson is PROVEN GOOD when ALL hold)
- `n >= 50`                          (enough cohort sample; scale to actual cohort size)
- `clean_rate_median >= 0.70`       (the listening engine heard them play it cleanly)
- `streak_through_rate >= 0.60`     (they kept practicing after — didn't bounce)
- `post_churn_rate <= 0.10`         (consuming it did NOT predict quitting)

### 2.4 Reject bar (a lesson is FLAGGED FOR REWRITE when ANY holds)
- `post_churn_rate >= 0.25`         (users disproportionately quit right after this lesson)
- `clean_rate_median < 0.40`        (even retained users couldn't play it clean — too hard/unclear)
- `streak_through_rate < 0.30`      (retained users stalled here)

Everything between the bars = UNVALIDATED (not enough signal yet; do not promote, do not kill).

---

## 3. THE LOOP (production rule)
- The 20-lesson library (Step 4) is the INITIAL SEED. It is arithmetic-verified (fingerings)
  but NOT yet evidence-validated (no cohort has cleared it yet). It graduates to VALIDATED
  automatically once the proving cohort clears it per §2.3.
- NEW lessons are GENERATED from the VALIDATED SET only: same JSON schema, same
  pacing/coaching structure, same chord-difficulty envelope as the proven lessons. This
  is the owner's "make more like the good ones" — encoded as a generation constraint.
- The Evidence Loop output (validated set + reject list) feeds:
  - F5 adaptive plan: prioritize validated lessons, quarantine rejected ones.
  - F9 progress reports: "you're on the path 12-month users finished."
  - Content engine (Step 8): packs are generated from validated cores.

---

## 4. WHY THIS IS HONEST (limits stated, not hidden)
- Correlation, not causation: a retained user clearing L does not *prove* L caused
  retention. It proves L was compatible with 12 months of engagement — exactly the bar
  the owner set. We state this in every F9 report ("based on what long-term members did").
- The bar parameters (§2.3/§2.4) are DEFAULTS. They are tuned from real cohort data,
  not asserted as universal truth. Tunable knobs are the point — they make the claim
  re-provable as data grows.
- This REPLACES the "founder can't verify, needs a contract guitarist" gap for *engagement
  quality* — but the contract-guitarist/arithmetic QA for *fingering correctness* (Hard
  Ban 7) remains. The two verifications are orthogonal and both required.

---

## 5. IMPLEMENTATION NOTES
- Engine: `06-prototypes/evidence-loop/evidence-loop.js` — reads a cohort practice-log
  (schema: per-user array of {tenure_months, churned, sessions, lessons:[{id, clean_rate,
  streak_through, churned_after}]}), computes §2.2/§2.3/§2.4, emits VALIDATED / REJECT /
  UNVALIDATED per lesson. Self-tests with a synthetic retained cohort (proves most pass)
  and an adversarial cohort where a specific lesson is churn-correlated (proves it is
  correctly REJECTED). Browser-free, Node, zero deps.
- Input schema is the contract between the app (F2/F11/F12) and the loop; when real data
  exists, drop it in — no engine change needed.

>> END AMENDMENT-06
