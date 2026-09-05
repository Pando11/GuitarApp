# TIER 2 — Make it a business

**Do not start until `STATUS.md` marks Tier 1 SHIPPED and the friend-test
feedback has actually been read.** Building payments before anyone finishes
Lesson 5 is building a toll booth on a road nobody drives.

**Goal:** a person you have never met pays, and pays again next month.

**Target:** 4–6 weeks. **Read `README.md` in this folder before dispatching.**

---

## Before any code: the arithmetic

Put these numbers in `STATUS.md` and re-check them every month.

1000 subscribers at $9.99 ≈ **$120k ARR**. At a 2–5% free→paid conversion and
5–10% monthly churn, *holding* 1000 requires on the order of **25,000–50,000
signups** and permanent acquisition. The product is maybe 40% of that problem.

Nothing in this repo currently addresses acquisition or retention measurement.
T2.5 and T2.6 are therefore not optional extras — they are the half of the goal
the code doesn't cover.

**Also revisit the free tier.** `entitlementStore.js` currently sets free =
tuner + metronome + Lesson 1 only ("STRICT, owner decision 2026-08-08"). Nobody
forms a habit in one lesson. The recommendation is **free through the Lesson 5
performance** — let the student reach a win, then charge. This is an owner
decision; record it in `STATUS.md` before T2.1 hardcodes anything.

---

## Wave 1 — Identity and the server (dispatch together)

### T2.1 — Accounts
**Type:** `general-purpose` · **OWNS:** `server/auth/**`, `pocketbase-dev/**`,
`07-app/core/session.js` (new)

Email + magic link (no passwords to store, no password reset flow to build).
Migrate the existing `anonId` to a real account on first sign-in so a friend's
progress survives the upgrade — losing someone's practice history is
unrecoverable trust damage.

**Under-13 accounts:** the T0.4 age band already flags these. A flagged account
cannot reach checkout without a verified parent email. If that is more than you
want to build, gate under-13 out of paid entirely and say so in the UI — do not
quietly take a child's parent's money without consent. This is COPPA, not
product polish.

**Acceptance:** sign-in works end to end; an anon device's completed lessons
appear under the new account; an under-13 account cannot reach checkout.

### T2.2 — Server-verified entitlements
**Type:** `general-purpose` · **OWNS:** `07-app/core/entitlementStore.js`,
`server/entitlements/**`

`entitlementStore.js` says it plainly: `STUB ONLY — NO REAL PAYMENTS WIRED`.

The client may **cache** entitlement state for offline use. The server is the
only authority. Every premium content fetch is checked server-side.

**A client-side boolean is not an entitlement system** — a determined
fourteen-year-old will flip it in devtools in about ninety seconds, and that is
fine as a nuisance but not as your revenue model. Assume the client lies.

Keep the offline story honest: a paying subscriber on a plane must still get
their lessons. Cache a signed, short-lived (7-day) entitlement token; expire it
gracefully with a "reconnect to keep going" message, never a hard lockout
mid-lesson.

**Acceptance:** a tampered client entitlement grants nothing; a genuine
subscriber works offline for 7 days; expiry does not interrupt a lesson in
progress.

---

## Wave 2 — Money

### T2.3 — Payments
**Type:** `general-purpose` · **OWNS:** `server/billing/**`,
`07-app/checkout.html` (new)

Stripe for web (Checkout + Customer Portal — do not hand-roll a card form, and
do not ever let card data touch your origin). If a native app store build is on
the roadmap, RevenueCat instead; the lead agent decides and records it.

Cover the whole lifecycle, not just the happy path: trial → active → past due
(dunning) → canceled → reactivated → refunded. Webhook handling must be
idempotent; Stripe *will* deliver the same event twice.

**The owner must complete Stripe account setup, tax settings, and business
details personally. An agent must not create accounts, enter bank details, or
accept terms.** Prepare everything up to that boundary and hand over a checklist.

**Acceptance:** test-mode subscription completes; a webhook replayed twice
produces one state change; cancel and reactivate both work; a failed renewal
downgrades access on the correct day and not before.

### T2.4 — Pricing and the paywall moment
**Type:** `general-purpose` · **OWNS:** `07-app/core/entitlementStore.js`
(FEATURE_TIER only), `07-app/paywall.html` (new)

Implement the free-tier decision recorded above. The paywall appears **after**
the Lesson 5 performance — at the moment of a win, not the moment of a wall.
Fire `paywall_shown` / `paywall_converted` / `paywall_dismissed` telemetry with
the lesson and the elapsed-days-since-signup, because that curve is the single
most valuable number you will own.

---

## Wave 3 — The half that isn't code

### T2.5 — Landing page and acquisition
**Type:** `general-purpose` · **OWNS:** `marketing/**` (new)

Landing page: what it is, who it's for, the honest differentiator (adaptive
coaching + on-device listening that actually hears you play), pricing, one CTA,
waitlist capture.

Pick **one** acquisition channel and work it. The repo's `GuitarApp-scratch/yt-teaser`
suggests YouTube, which is the right instinct for guitar — it is where beginners
already are, the content doubles as the product demo, and it compounds. Choose it
or choose another, but choose one and write it in `STATUS.md`. A channel you
half-work is a channel that returns nothing.

### T2.6 — Retention dashboard
**Type:** `general-purpose` · **OWNS:** `server/analytics/**`, `marketing/dashboard/**`

Built on the T0.6 event stream. D1 / D7 / D30 retention, lesson-level drop-off
(which lesson loses the most people — that is your product roadmap), free→paid
conversion, monthly churn, and cost-per-student from Tier 1.

**Ship this before you have subscribers, not after.** The month you notice churn
without instrumentation is the month you can't explain it.

---

## Exit Check — Tier 2 is SHIPPED when all are true

- [ ] A stranger signs up, pays in production, and gets access.
- [ ] That subscriber renews successfully in month 2.
- [ ] A canceled subscriber loses access on the right day; a refund works.
- [ ] The dashboard shows real D7 and lesson-level drop-off from real users.
- [ ] Free→paid conversion is measured, not guessed.
- [ ] Cost per subscriber per month is under 15% of price.

---

## The honest note

Tiers 0 and 1 are engineering problems with known solutions, and this repo is
run by someone who plainly can execute engineering. Tier 2's hard part isn't the
Stripe integration — it's the 25,000 signups. Get Tier 0 in front of five people
this week and let what they actually do decide how much of Tier 1 and 2 is worth
building. Five real users will tell you more than the next forty planning
documents.
