# App Store Guideline 3.1.2 — Subscription Rejection Risk (lesson app)

Date: 2026-08-05 (re-pointed to AMENDMENT-04 lesson-app scope) · Purpose: close the "App Store 3.1.2
subscription-rejection risk" gap (README §7 + HANDOFF).
Status: RESEARCH + MITIGATION. Not legal advice — verify with a submitted build before relying on it.

NOTE: this doc was originally written around the (now RETIRED) record-a-take audio critique. That
mechanic is gone (AMENDMENT-04). The argument below has been re-pointed at the lesson-app: the
subscription buys a **continually-growing, adaptive curriculum + practice tools**, which is squarely
the approved 3.1.2 pattern. Without an audio service as a crutch, the *visible content cadence* matters
even more — see §5.

---

## 0. TL;DR (the honest conclusion)

**Risk: MODERATE, manageable — and slightly HIGHER than it was under the critique framing.** Apple rejects
auto-renewable subs that don't deliver "dynamic, ongoing value over an extended period." A guitar app with a
*static, fixed curriculum* behind the paywall is the classic rejection pattern. We satisfy 3.1.2 through:
**(1) a continually-updated lesson library** (new lessons added on a visible cadence), **(2) adaptive
practice / streaks / progress that evolve every session** (SaaS-like, not one-and-done), and **(3) the free
tuner+metronome front door** that proves the sub is for ongoing service, not a one-time unlock. **Do NOT
launch the paywall with only a frozen 20-lesson library and no visible cadence.**

---

## 1. The rule (verbatim intent, Apple App Review Guidelines 3.1.2(a))

Auto-renewable subscriptions are appropriate only for services providing **"dynamic, ongoing value to the
user over an extended period of time."** Apple's non-exhaustive examples of appropriate subscriptions:
- new game levels
- episodic content
- multiplayer support
- apps offering consistent, substantive updates
- access to large / continually updated media libraries
- software as a service (SaaS)
- cloud support

Minimum: 7-day period, available across all the user's devices.
Explicit bans: bait-and-switch, scam, tricking users into a sub, requiring social posts/contacts/check-ins
to "unlock" what they paid for.

---

## 2. The rejection pattern (what actually gets bounced)

From RevenueCat forum + r/iOSProgramming cases (2024–2025):
- *"Your app uses auto-renewing subscriptions, but it is not an appropriate use of the service… subscriptions
  should provide dynamic, ongoing value over an extended period."* — typical when the app's paid function is
  essentially **one-and-done** (a static tool, a fixed content set, a one-time compute) wrapped in a recurring
  charge.
- A "cloud functionality" sub was rejected because the ongoing value wasn't **visible/demonstrable** to the
  reviewer.
- Common trigger: reviewer can't *see* what they keep getting each month.

**Translation for us:** if the $12/mo only unlocks a fixed set of 20 lessons that never changes, we look like
the rejection pattern. If $12/mo buys a **growing curriculum + adaptive practice that updates every session +
cloud-synced progress**, we look like the approved pattern (Yousician, Fender Play, Simply Guitar, Andy Guitar
all run subs and are on the store).

---

## 3. Our compliance story (map each 3.1.2 criterion → a shipped feature)

| 3.1.2 criterion | How we satisfy it (must be LIVE at submission) |
|---|---|
| Dynamic, ongoing value | **Adaptive practice + streaks + progress logging** that change every session (what to review, your streaks, your next lesson). Not one-and-done. |
| Continually updated media | **A growing lesson library** — new lessons added on a visible cadence (weekly drops). Demonstrate the release log in-app. |
| Consistent, substantive updates | App updates + new curriculum modules; the first-20 is v1, with more levels planned (see first-20 doc). |
| SaaS / cloud support | Supabase-backed progress, cloud-synced practice history, cross-device entitlement (RevenueCat). |
| Works across devices | RevenueCat cross-device entitlement; Supabase/iCloud sync. |
| 7-day minimum | Standard monthly sub, ≥7 days. (Offer a 7–14 day trial per spec §3.) |

**Free tier is protective:** tuner + metronome free, subscription for the curriculum + adaptive practice. This
is the exact structure Apple has approved for Yousician/Fender/Simply/Andy — it shows the sub is for *ongoing
service*, not locking away a one-time function.

---

## 4. Mitigations / pre-submission checklist

1. **Ship a visible content cadence before paywalling.** In-app "New this week" / lesson release log so the
   reviewer sees the curriculum keeps growing. Don't submit with a frozen 20-lesson library.
2. **In App Store Connect:** describe ongoing value explicitly — "a growing, correctly-sequenced curriculum,
   adaptive practice that evolves with you, streaks and progress tracking, new lessons added regularly."
   Provide a **demo account** showing progression + a recent content drop.
3. **Adaptive practice must be live**, not just static video — it's the "dynamic, ongoing value" proof.
4. **Trial, not bait:** 7–14 day trial, clear pricing, no required social/contact actions to unlock value.
5. **Appeal path ready:** if rejected, App Review → Appeal. Lead with "continually-updated curriculum +
   adaptive practice = ongoing value," citing the approved music-app subs as precedent.
6. **Don't oversell in metadata.** Avoid "pay once, learn forever"; emphasize the recurring, growing service.

---

## 5. Residual risk + what would make it worse

- **Worse:** launching with a tiny fixed lesson library and no visible cadence/adaptive practice → looks like
  the rejection pattern. This is now our #1 3.1.2 risk (there's no audio service to lean on). Avoid.
- **Worse:** vague App Store Connect description ("access to premium lessons") with no demonstrable cadence.
- **Residual:** Apple review is inconsistently applied (forum cases confirm). Even a compliant app can catch a
  strict reviewer — hence the appeal path + demonstrable cadence are mandatory, not optional.
- **Not a 3.1.2 issue but adjacent:** ensure the sub is *auto-renewable* (not a consumable/non-renewing) since
  that's the type Apple wants for ongoing services, and RevenueCat handles the edge cases.

---

## 6. Confidence notes

- **Cited:** Apple App Review Guidelines 3.1.2(a) text; RevenueCat forum rejection thread (2025-07-10);
  r/iOSProgramming 3.1.2(c) case. Incumbent music-app subs (Yousician/Fender/Simply/Andy Guitar) confirmed on store.
- **Judgment (flagged):** the lesson-app 3.1.2 argument is our interpretation; it is strong (matches the
  approved music-app pattern) but untested by our own submission. The pre-submission checklist is required,
  not advisory. Confirm with a real submission before bankrolling the launch on this analysis.
- **Scope change:** originally argued around the record-a-take critique (RETIRED, AMENDMENT-04). Re-pointed
  2026-08-05 at the sequenced-lesson-app case.
