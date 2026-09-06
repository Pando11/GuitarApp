# AMENDMENT-06 — Unlock the Avatar + Voice Stack (2026-08-09)

**Owner directive, Heidi, 2026-08-09. Supersedes AMENDMENT-05 §8 and AGENTS.md Rules 9 & the
avatar guardrails, on the points below. This is the latest word.**

Rationale (owner, verbatim intent): the cartoon-only teacher and the fingering ban were adopted
when cartoons were the only thing we had looked at — before any repo research existed. That
constraint was a product of ignorance, not a product decision. New capabilities ship constantly and
this app should upgrade with them. Goal: **the best AI guitar lesson app, using what AI can
actually do today.**

---

## 1. AVATARS — CARTOON LOCK REMOVED

**REMOVED:** "One cartoon avatar." / "MULTIPLE cartoon teachers (monsters/creatures/characters)"
as a *mandate*.

**NEW TRUTH:**
- Teacher presentation is **OPEN and EXPERIMENTAL**. Realistic / photoreal / stylized-3D / 2D
  cartoon are ALL permitted. Cartoons remain *allowed*, no longer *required*.
- **Explicitly target adult students** with a more realistic, credible instructor presence.
- **Ready Player Me + TalkingHead (MIT) is now IN SCOPE** — 3D avatars, real-time visemes,
  browser-side, zero GPU. This was previously excluded by the cartoon lock; that exclusion is void.
- Multiple selectable teacher identities remain the goal; the ROSTER concept survives, the
  ART-STYLE MANDATE does not.
- Rive remains out (paid subscription, no-fee-stack rule stands). Lottie/canvas remain *available*,
  no longer *mandatory*.

## 2. FINGERING DEMONSTRATION BAN — REMOVED

**REMOVED:** "an avatar must NEVER demonstrate fingerings" / "no AI-drawn fingers" as an absolute.

**NEW TRUTH:**
- Avatars **MAY** demonstrate fingerings. Experimentation is authorized.
- The one surviving quality bar (engineering, not ideology): **a demonstrated fingering must match
  the verified chord data.** `chord-theory-check.js` already proves fingerings arithmetically —
  drive the animation FROM that verified data, so the hand and the diagram cannot disagree.
  Correct-by-construction is now an ASSET, not a liability.
- The 2D fretboard diagram stays as the precision reference. The avatar adds demonstration on top.

## 3. VOICE — REALISM IS THE REQUIREMENT

Owner: current app voices are not good enough; wants realistic, ElevenLabs-class, open source.

**NEW TRUTH — shipping voice target: CHATTERBOX (Resemble AI).**
- 25.9k stars, **MIT on the CODE *and* the WEIGHTS** — genuinely commercial-safe, verified live.
- Zero-shot voice cloning + emotion control => a distinct realistic voice per teacher.
- ~200ms streaming. Needs ~6GB VRAM (see §4 hardware note).
- This is the ElevenLabs replacement the owner asked for. **Do NOT pay for ElevenLabs.**
- Kokoro-82M (Apache-2.0, CPU-viable, 54 voices) = the no-GPU fallback for live/dynamic lines.
- OpenAI TTS remains a permitted stopgap, no longer the mandated shipping choice.

### 3b. LICENSE BLOCKLIST — STAYS, AND WHY (this one is NOT a restriction I can lift)
The blocklist is not a taste preference — it is copyright law, and it does not bend to owner
directive. Shipping these in a PAID app is a real legal exposure:
- **XTTS-v2 / Coqui** — repo advertises MPL-2.0 but the **WEIGHTS are CPML = NON-COMMERCIAL**.
  Coqui is DEFUNCT, so there is no one left to buy a commercial license from. Unfixable. HARD NO.
- **F5-TTS** — CC-BY-NC. Non-commercial. NO.
- **Fish-Speech / OpenAudio** — CC-BY-NC-SA. NO.
- **Piper** — GPL-3.0 since Oct 2025 (copyleft; would infect the app). NO.
- **IndexTTS-2** — no clear license despite 22.5k stars. Not without legal review.
- **Wav2Lip** (avatar side) — NO LICENSE FILE AT ALL. NO.
- **FLUX.1 [dev] / [Krea]** (image side) — weights NON-COMMERCIAL. Use FLUX.1[schnell] or
  Qwen-Image (both Apache-2.0) instead.
**The point: Chatterbox gives the owner exactly what she asked for — realistic, open source,
better than what's in the app now — WITHOUT the legal landmine. Nothing is being sacrificed.**

## 4. HARDWARE NOTE (verified 2026-08-09)
- Current desktop GPU: **NVIDIA GTX 970, 4GB** — cannot run Chatterbox (~6GB).
- Incoming Acer mini PC: likely integrated graphics, will be the always-on Hermes host.
- **Strategy: pre-render teacher voice lines in batches on a RENTED cloud GPU** (RunPod/Vast,
  ~$0.30-0.70/hr; est. $20-40 for the full first voice library), ship the audio files.
  Kokoro on CPU covers live/dynamic lines. No hardware purchase required.
- Browser-side avatars (TalkingHead) need **no GPU at all** on either machine.

## 5. STANDING PRINCIPLE — UPGRADE WITH THE FIELD
Constraints adopted for lack of options must be revisited when options appear. Re-check the
avatar/voice/image stack against current open-source releases regularly; propose upgrades rather
than defending old limits. **Licensing is the only permanent constraint.**

---
## UNCHANGED BY THIS AMENDMENT
Musical correctness via `chord-theory-check.js` (0 errors / 0 warnings ship gate); constrained
listening only, never open-ended transcription; on-device audio, never uploaded; confidence
honesty; no red "unverified" boxes in UI; not a song-on-demand service.
