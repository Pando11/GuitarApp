# Guitar Lesson App — TAM / Market Sizing

Date: 2026-08-05 · Purpose: close the "market sizing / TAM" open gap from README §7 + HANDOFF.
Audience: founder (non-guitarist) + next agent. Plain language, defensible numbers, sources cited.

---

## 0. TL;DR (the honest conclusion)

**TAM is NOT the constraint.** The business bar is **1,000 engaged monthly users @ $12/mo in 18 months
(~$144K/yr)**. That is a *de minimis* slice of every reasonable market definition below — roughly
0.05%–0.6% of the serviceable market. The real risk is **execution: retention + CAC**, not market size.
A single incumbent (Yousician) already proves one guitar app can reach 20M users, so the ceiling is high.

---

## 1. Top-down: online music education market (cited)

| Source | 2025 size | 2026 size | 2031 size | CAGR |
|---|---|---|---|---|
| Mordor Intelligence | $3.9B | $4.61B | $9.36B | 15.23% (2026–31) |
| Knowledge Sourcing | — | $2.6B | $5.7B | 17.0% |
| Dataintelo (music training *incl. offline*) | $7.8B | — | $14.6B | 7.2% (2026–34) |

Usable figure: **online music education ≈ $4.6B in 2026, growing ~15%/yr.**

Segment cuts inside that number (Mordor, 2025):
- **App-based** solutions = **50.75%** of 2025 revenue → ~$2.0B app-based online music ed in 2025.
- **North America** = **35.05%** of 2025 revenue → NA online music ed ≈ $1.6B (2025).
- **Individual learners** = 59.40% of 2025 revenue (our exact buyer: self-directed adult beginners).
- **Self-paced courses** = 49.05% of 2025 spending (our delivery model).
- Guitar is a named instrument segment in both Mordor and Knowledge Sourcing reports.

### Narrowing to OUR wedge (US + iOS + beginner + acoustic)
Apply conservative cuts to the NA app-based online music ed pool:
- NA app-based online music ed (2025) ≈ $1.6B × 50.75% ≈ **$0.82B**.
- Guitar share of instrument-specific learning (guitar is the #1 US beginner instrument; assume ~25%) → **~$205M/yr** NA app-based guitar learning.
- Beginner slice (~40%) → ~$82M.
- Acoustic-leaning beginners (~60%) → ~$49M.
- iOS users (~55%, music-app users skew iOS) → **SAM ≈ $25–50M/yr** for "US iOS beginner-acoustic guitar learning."

**Implication:** 1,000 users × $144/yr = $144K. That is **0.3%–0.6% of SAM.** Trivial share required.

---

## 2. Bottom-up: real beginner flow (sanity check)

- **16 million Americans** started learning guitar in the last two years — **7% of US ages 13–64**
  (New Guitar Player Landscape Analysis / Bass Gear Mag, 2024).
- ~**72% are aged 13–34** (younger, iOS-heavy cohort).
- Model the *annual* US beginner pool ≈ ~8M new starters/yr. Filter to our wedge:
  iOS (50%) × acoustic-leaning (60%) × would-consider-an-app (70%) ≈ **1.68M prospective US
  beginner-acoustic-iOS users per year.**
- Even **0.1% conversion** of that annual cohort = **1,680 users** — already above the 1,000 bar.
- The 1,000-user bar needs only **~0.06%** of the annual beginner cohort. Extremely achievable on TAM grounds.

---

## 3. Competitive ceiling (proves TAM is real, not theoretical)

- **Yousician:** 20M+ monthly active users; FY2024 revenue est. ~€53M (bloomvocal 2026 review;
  Crunchbase/StartupIntros cite 20M MAU). One guitar app, one instrument focus, reached 20M.
- **Gibson App:** ~100K+ users, 4.6★ (10K+ ratings), $19.99/mo — a newer entrant already at 6-figure users.
- Implication: a focused guitar app capturing **1,000 users is ~0.005% of Yousician's scale.** The market
  comfortably supports niche winners; we are not fighting for crumbs.

---

## 4. What this means for the plan

1. **Do NOT over-spend proving market size.** TAM is ample. The bar is reachable on market grounds alone.
2. **The binding constraints are retention and CAC, not TAM.** Prioritize:
   - The async-critique moat (must be *proven* by the tech spike — see HANDOFF gap I) because retention
     is what separates 1,000 engaged users from 1,000 churned installs.
   - A cheap, incremental acquisition loop (the marketing playbook's full-funnel model applies — but
     NOTE: that playbook still sells the *camera* wedge; it must be re-pointed at the async-critique
     wedge. See HANDOFF "doc drift").
3. **Pricing headroom exists.** Incumbents sit $15–20/mo (Yousician ~$15, Gibson $19.99). Our $12/mo is
   deliberately below them; we can raise to $15–18 later without leaving the market. Do not raise before
   retention is proven.

---

## 5. Confidence notes

- **Cited:** total market sizes, app/NA/beginner segment shares, Yousician scale, 16M-US-beginners stat.
- **Estimated (clearly flagged):** guitar's 25% instrument share, beginner 40% / acoustic 60% / iOS 55%
  cuts, the 8M/yr annual-cohort derivation. These are conservative planning assumptions, not measured facts.
  Even if every cut is off by 2×, SAM stays in the tens-of-millions — the conclusion is unchanged.
- **Not modeled here:** geographic expansion beyond US/English, Android (explicitly out of v1 scope),
  or B2B/music-therapy adjacencies. Those are upside, not required for the bar.
