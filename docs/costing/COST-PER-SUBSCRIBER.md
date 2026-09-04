# GuitarApp — Cost per Subscriber (2026-08-30)

**Status:** proposed / informational (not yet ratified as an amendment)
**Owner question answered:** "Estimate my cost per 10 subscribers."

---

## What is MEASURED (real) vs ESTIMATED (informed guess)

| Claim | Basis | Confidence |
|---|---|---|
| Backend (PocketBase) handles tens of thousands of daily students on one small server | **Real load test** on this laptop: 30,000 sync cycles, 0 errors, ~640 txn/s, degrades only above ~1,000 *simultaneous* syncs | High (laptop is a floor; a real server beats it) |
| Free voice (Kokoro CPU) ~2.7s compute per spoken line | **Real benchmark** on this 16-core laptop | High |
| Chatterbox GPU voice throughput | Estimate only — no GPU on this PC to test | Low (needs real GPU run) |
| Dollar prices | 2026 web pricing (Hetzner, RunPod, Cloudflare R2) | Medium (prices drift) |

---

## The cost model

Three things can cost money:

1. **Server** — runs PocketBase (progress sync) + Kokoro fallback voice. Free software; you pay for the box.
2. **Voice** — free (on-phone or Kokoro CPU) OR paid GPU (Chatterbox).
3. **Cached teacher audio** — if you pre-generate once and store/stream it.

### Recommended plan: pre-generate + cache the voice once
Generate each static teacher line with Chatterbox **one time**, store on Cloudflare R2, stream like a music file.

| Component | 2026 price | Notes |
|---|---|---|
| Server (Hetzner CX32, 4 CPU / 8 GB) | ~$11 / month | Runs PocketBase + Kokoro for tens of thousands of students |
| Audio storage (R2) | $0 | ~4 MB for all 25 lessons → inside R2 10 GB free tier |
| Audio delivery (R2 egress) | $0 | R2 has free egress |
| **Total** | **~$11 / month flat** | Does not grow with subscribers until very large |

### Cost per 10 subscribers (cached plan)
| Subscribers | Monthly cost | Cost per 10 subscribers |
|---|---|---|
| 100 | ~$11 | ~$1.10 |
| 1,000 | ~$11 | ~$0.11 |
| 10,000 | ~$11 | ~$0.011 |
| 100,000 | ~$22 (2nd server) | ~$0.002 |

The bill is **flat** — it shrinks per-subscriber as you grow.

---

## Worst case: live GPU voice for everyone (do NOT do this)
Generate voice **live, per request, every student**, no caching:
- One 16 GB GPU on RunPod ≈ $0.58/hr ≈ **$420/month**, serving only a few real-time streams at once.
- Roughly **$0.50–$2.00+ per 10 subscribers/month**, and it scales *up* with usage.

**Duet feature** (teacher plays along live) is the one place live GPU is justified — but it's occasional, not every lesson. At ~$0.58/hr and 1–2 min per duet, even 1,000 duet sessions/month ≈ **$20 extra**. Cheap because on-demand by the minute.

---

## Bottom line
- **Realistic cost: ~1 cent to $1.10 per 10 subscribers / month** — almost entirely a flat ~$11 server bill.
- The GPU is **not** a per-subscriber tax if you pre-cache the voice (supported by the architecture).
- The only thing that blows up the number is generating voice live for everyone — avoidable.

## Honest gaps
- Prices are 2026 web rates; they will drift.
- Chatterbox GPU figure is an estimate (no GPU available here to run it).
- To tighten both: deploy PocketBase + run Chatterbox on a real GPU (RunPod) once.
