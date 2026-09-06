# Guitar Lesson App — Content & Unit Cost Model

Date: 2026-08-05 · Purpose: close the "content cost model" open gap from README §7 + HANDOFF.
Shows whether the $12/mo / >90% margin bar holds, and WHERE the money actually goes.

---

## 0. TL;DR (the honest conclusion)

**Content is NOT the cost problem.** Per-user marginal cost of delivering software is ~$0 (App Store
take is the only real per-user cost). The ONLY non-trivial recurring cost is the **contract guitarist's
QA time**, and it scales with **lesson velocity, not user count**. LLM generation + voice TTS are
rounding errors (cents per lesson). Infrastructure is ~$70/mo.

- **Break-even = ~15–35 paying subscribers** (vs the 1,000-user bar → 30–65× break-even).
- At 1,000 users ($144K/yr): total content+infra cost ≈ **$2.1K–$5.0K/yr → 96–99% margin** (clears >90%).
- **Strategic insight:** the bottleneck to margin is *lesson throughput* (guitarist QA hours), not users.
  Adding users is almost pure margin. Spend energy on retention + CAC, not on content economies.

---

## 1. Per-lesson cost (one new lesson, weekly cadence)

Based on the real fixture `05-content/guitar-lesson-01-faster-chord-changes.json` (a lesson = JSON
schema + ~6 coaching lines + 3 exercises + chord/pivot QA block). Each lesson needs: LLM draft,
voice render, guitarist verification, (amortized) art.

| Line item | Basis | Cost/lesson |
|---|---|---|
| LLM lesson generation | ~4K in / 4K out tokens @ ~$3/M in, $15/M out (mid model) | **~$0.07** (round $0.10) |
| Voice (OpenAI TTS) | AGENTS Rule 9: ~$0.36 / 200 lines; lesson ≈ 30 lines coaching | **~$0.05** (round $0.06) |
| Voice (Kokoro-82M free hedge) | Apache-2.0, self-hosted | $0.00 |
| **Guitarist QA** | 20–45 min review/listen/verify fingering @ $50/hr (build-plan rate) | **$16.67–$37.50** (mid $25) |
| Art / assets | Code-driven fretboard = free; avatar art one-time, amortized; AI art (FLUX.1[schnell]) = $0 | **$0–$2** amortized |
| **Per-lesson total** | | **≈ $25 (QA-driven)** |

**The guitarist QA is ~99% of per-lesson cost.** Everything else is cents.

Annual new-lesson cost at **1 lesson/week (52/yr)** ≈ $25 × 52 = **~$1,300/yr**.
At 2 lessons/week → ~$2,620/yr. QA capacity, not budget, caps velocity.

---

## 2. Recurring infrastructure (monthly)

From spec §5 + AGENTS stack (Supabase, RevenueCat, Cloudflare Workers, PostHog, Sentry) + audio pipeline.

| Service | Use | Cost/mo |
|---|---|---|
| Audio pipeline VPS | server-side basic-pitch + librosa (spec: ~$40/mo box) | ~$40 |
| Supabase | Postgres/auth/storage/RLS | $0 (free) → $25 at scale |
| Cloudflare Workers | LLM coaching endpoint | $5–20 |
| RevenueCat | subscriptions | $0 until $2.5K/mo processed |
| PostHog | funnels/retention | $0 (free tier) |
| Sentry | crash reporting | $0 (free tier) |
| **Infra total** | | **~$45–85/mo (use $70)** → **~$840/yr** |

---

## 3. Two scenarios vs the revenue bar

Revenue bar: **1,000 users × $12/mo = $12,000/mo = $144,000/yr** (ARR). Annual revenue/user = $144.

### Scenario A — Lean (1 lesson/week, AI art, free voice hedge)
- Lesson QA: $25 × 52 = $1,300/yr
- Infra: $70 × 12 = $840/yr
- **Total ≈ $2,140/yr ≈ $178/mo**

### Scenario B — Conservative (build-plan $200–500/mo content/QA band + infra)
- Content/QA: $350/mo (covers weekly-lesson QA + re-review of flagged AI critiques)
- Infra: $70/mo
- **Total ≈ $420/mo = $5,040/yr**

### Margin + break-even
| | Scenario A | Scenario B |
|---|---|---|
| Annual cost | $2,140 | $5,040 |
| Revenue @ 1,000 users | $144,000 | $144,000 |
| **Gross margin** | **98.5%** | **96.5%** |
| Break-even (paying users) | ~15 | ~35 |
| 1,000-user bar ÷ break-even | ~67× | ~29× |

Both clear the **>90% margin** target with room to spare.

---

## 4. What this means for the plan

1. **Per-user marginal cost ≈ $0.** App Store commission (15–30%) is the main per-user cost. Every
   additional subscriber is near-pure margin — so **retention and CAC dominate unit economics**, not content.
2. **Guitarist QA is the one real recurring cost and the one real scaling constraint.** At 1 lesson/week the
   guitarist spends ~26 hrs/yr (trivial). Even at 5 lessons/week = 130 hrs/yr ≈ $6,500 QA — still <5% of
   revenue at 1,000 users. **Hire/retain one reliable QA guitarist before scaling lesson velocity.**
3. **Voice + LLM are negligible** — do not over-optimize. Use OpenAI TTS for quality, keep Kokoro as the
   free hedge (AGENTS Rule 9). Do NOT pay ElevenLabs.
4. **Infra is flat** until scale — fine on a $40 box + free tiers through the 1,000-user bar.
5. **Watch the hidden cost: founder time + marketing.** Neither is in this model. CAC (paid/owned) is the
   variable that actually decides whether 1,000 users is profitable — see TAM doc §4 and the (stale)
   marketing playbook. The model above assumes users are acquired; it does NOT assume they're free.

---

## 5. Confidence notes

- **Cited:** AGENTS Rule 9 voice rate ($0.36/200 lines), spec audio-pipeline ~$40/mo, build-plan QA rate
  ($40–60/hr, $200–500/mo band), RevenueCat/Supabase/PostHog/Sentry free-tier norms.
- **Estimated (flagged):** LLM per-lesson token count (~4K in/out), guitarist QA minutes (20–45), guitar
  share of QA budget, art amortization. Conservative; QA is the dominant term so small errors don't move
  the conclusion.
- **Out of scope:** one-time app-build cost (no code yet), App Store fee ($99/yr dev program), legal/entity,
  paid-acquisition spend. Those are startupCapEx/marketing, not content-unit cost.
