# Voice Options for an Animated Guitar Teacher — Without ElevenLabs
Research date: 2026 pricing. Use case: warm, encouraging female teacher voice, ~200–1,000 lesson lines, **paid iOS app**, regenerated whenever curriculum changes.

---

## 0. TL;DR Recommendation

**Use OpenAI `gpt-4o-mini-tts` (or `tts-1`) for production audio, pre-rendered as MP3/AAC files shipped in the app bundle.** Back it up with **Kokoro-82M (Apache-2.0)** locally if you ever want zero marginal cost.

- **Realistic monthly cost: $0–$5.** 200 lines × ~120 chars ≈ 24,000 characters = **$0.36 one-time** at $15/1M. Even a 5,000-line curriculum regenerated monthly = 600k chars = **$9/month**.
- ElevenLabs Creator ($22/mo) or Pro ($99/mo) would be **$264–$1,188/year** for the same work. You save essentially all of it.
- Do **not** use Coqui XTTS-v2 or F5-TTS — they are non-commercial licensed and would put a paid App Store product at legal risk.

---

## 1. Free / Open-Source TTS — License is the deciding factor

| Model | Weights License | **Commercial OK?** | Quality | Voice cloning | Hardware | Founder-friendliness |
|---|---|---|---|---|---|---|
| **Kokoro-82M** (hexgrad) | **Apache-2.0** | ✅ **Yes** | Very good for 82M params; natural, warm `af_heart` / `af_bella` voices | ❌ No (fixed voice set, ~26 voices) | **CPU real-time**; tiny | ⭐⭐⭐⭐⭐ `pip install kokoro`, 5 lines of Python |
| **Chatterbox / Chatterbox Multilingual** (Resemble AI) | **MIT** | ✅ **Yes** | SoTA open; beats ElevenLabs in Resemble's own A/B evals | ✅ **Zero-shot from ~5s of audio** | GPU strongly preferred (~6GB VRAM) | ⭐⭐⭐ needs a GPU or a rented one |
| **Piper** | Code: old `rhasspy/piper` MIT (archived Oct 2025); current `OHF-Voice/piper1-gpl` is **GPL-3.0**. Voices: mostly CC-BY-4.0, some Blizzard-licensed | ⚠️ Mostly yes if self-hosted, but **check each voice's MODEL_CARD** | Serviceable/robotic — below Kokoro | ❌ No | Runs on a Raspberry Pi | ⭐⭐⭐⭐ but quality too low for a paid app |
| **MeloTTS** (MyShell) | **MIT** | ✅ Yes | Decent, CPU-realtime by design | ❌ No | CPU | ⭐⭐⭐⭐ |
| **Orpheus-TTS** (Canopy Labs) | **Apache-2.0** | ✅ Yes | Very expressive, LLM-style streaming | ✅ Some | ~6–8GB VRAM for 3B quantized | ⭐⭐ ML-ish setup |
| **StyleTTS2** | **MIT** | ✅ Yes | Excellent, but dated setup | ✅ Limited | GPU | ⭐⭐ fiddly |
| **Coqui XTTS-v2** | **CPML (Coqui Public Model License)** | ❌ **NO** | Excellent cloning | ✅ Yes | GPU | 🚫 **Coqui Inc. shut down Jan 2024 — there is literally nobody left to sell you a commercial license.** The MPL-2.0 applies to the *toolkit code only*, not the weights or their audio output |
| **F5-TTS** | Code MIT, **weights CC-BY-NC-4.0** | ❌ **NO** | Very good | ✅ Zero-shot | GPU | 🚫 NC carries over even to fine-tunes (Emilia training data) |
| **Fish Speech / OpenAudio S1-mini** | **CC-BY-NC-SA-4.0** weights | ❌ Not without paying | Very good | ✅ | ~4–6GB VRAM | 🚫 Commercial license only by contacting business@fish.audio |

**Sources:** https://huggingface.co/hexgrad/Kokoro-82M · https://github.com/resemble-ai/chatterbox · https://huggingface.co/coqui/XTTS-v2 (LICENSE.txt = CPML 1.0.0) · https://github.com/coqui-ai/TTS/discussions/4304 ("You can only use XTTS under the CPML now, there is no one to sell a commercial license anymore.") · https://github.com/SWivid/F5-TTS/blob/main/LICENSE · https://github.com/fishaudio/fish-speech/blob/main/LICENSE · https://localaimaster.com/blog/xtts-coqui-commercial-license · https://d-central.tech/local-voice-ai-models/

> ⚠️ **The trap:** the three best-sounding open cloners (XTTS-v2, F5-TTS, Fish Speech) are exactly the three you can't legally ship in a paid app. The permissive winners are **Kokoro** (no cloning, CPU, easy) and **Chatterbox** (cloning, MIT, needs GPU).

---

## 2. Cheap Paid APIs (2026 prices, per 1M characters)

| Service | Price / 1M chars | Commercial rights | Quality notes |
|---|---|---|---|
| **Hume Octave 2** | **$7.60** | ✅ Yes | Cheapest; emotionally adaptive — good fit for "encouraging teacher" |
| **Inworld TTS-1.5 Max** | **$10** | ✅ Yes | Ranked #1 on TTS Arena for quality-per-dollar |
| **Gemini / Google Chirp 3 HD** | $12 (Flash) / $30 (Chirp 3 HD); Neural2 $16; Standard $4 | ✅ Yes | Chirp 3 HD is excellent. 1M chars/mo free tier |
| **OpenAI `tts-1`** | **$15** | ✅ You own the Output (API terms) — but must disclose the voice is AI-generated | Warm, natural, 9–13 voices ("nova", "shimmer", "coral" fit a friendly teacher) |
| **OpenAI `gpt-4o-mini-tts`** | ~$15 (token-based, ≈$0.015/min) | ✅ Same | **Steerable** — you can prompt "warm, patient guitar teacher, encouraging" |
| **Azure Neural** | $16 ($22 Neural HD, was $30) | ✅ Yes | 500k chars/mo free tier forever (F0). Commit tier → $7.50 |
| **Amazon Polly Neural** | $16 ($4 standard) | ✅ Yes | ⭐ **Only one with built-in viseme speech marks** — see §5 |
| **OpenAI `tts-1-hd`** | $30 | ✅ | |
| **Deepgram Aura-2** | $30 ($27 Growth) | ✅ | <90ms latency, $200 free credit |
| **Cartesia Sonic 3** | ~$33 | ✅ | Plans from $4/mo |
| **Play.ht** | ~$39/1M ($39/mo Creator, 50k words) | ✅ | 900+ voices, cloning |
| **ElevenLabs Flash** | **~$60–103** | ✅ (paid tiers only — Free tier has **no** commercial license) | Best-in-class but 4–13× the price |
| **ElevenLabs Multilingual v3** | **~$206** | ✅ | |

**ElevenLabs subscription reality:** Free $0 (10k credits, **no commercial rights**) · Starter $5 (30k) · Creator $22 (100k, ~100 min) · Pro $99 (500k) · Scale $330 (2M). Overage $0.30/1k chars on Creator.
Sources: https://elevenlabs.io/pricing · https://www.buildmvpfast.com/api-costs/ai-voice · https://cloud.google.com/text-to-speech/pricing · https://azure.microsoft.com/en-us/pricing/details/speech/ · https://aws.amazon.com/polly/pricing/ · https://deepgram.com/pricing · https://developers.openai.com/api/docs/pricing

### Direct cost comparison for YOUR workload
Assume 200 lines × 120 chars = **24,000 chars** per full curriculum render.

| Option | One full render | 12 full re-renders/yr |
|---|---|---|
| Kokoro / Chatterbox self-hosted | **$0** | **$0** |
| Hume Octave 2 | $0.18 | $2.19 |
| OpenAI tts-1 | $0.36 | $4.32 |
| Azure Neural | $0.38 (free under F0 tier) | $0 (within 500k/mo free) |
| ElevenLabs Creator plan | $22/mo minimum | **$264/yr** |
| ElevenLabs Pro plan | $99/mo minimum | **$1,188/yr** |

Even a **10× larger** curriculum (2,000 lines) costs **$3.60/render** on OpenAI. The founder's instinct is correct: **ElevenLabs is unnecessary for this.**

---

## 3. Apple AVSpeechSynthesizer (on-device, $0)

- **Cost:** genuinely free, offline, no API keys, no per-character billing, no legal questions.
- **Quality in 2026:** ⚠️ **Not good enough as the primary voice of a paid, character-driven product.** The default compact voices are noticeably robotic; even "Enhanced"/"Premium" downloadable voices (Ava, Samantha, Zoe) sound like a screen reader, not a warm teacher. Users must download Premium voices manually in Settings → your app can't guarantee they exist.
- Known dev pain: the Simulator sounds far better than real devices; voice availability varies by device/locale (https://medium.com/@info_4533/why-avspeechsynthesizer-sounds-terrible-on-real-iphones-eb4565862ea8).
- **Personal Voice** (iOS 17+) is now usable by third-party apps but it clones *the user's* voice — wrong tool here.
- **Correct role:** fallback for dynamic/unscripted text (e.g. reading a chord name the user typed) where you can't pre-render. Not for the character.

---

## 4. Hiring a Human Voice Actor

- **Realistic non-union cost for ~200 short app lines:** **$500–$1,500** for a decent pro (typical non-union session/day rate $250–$500; app/e-learning narration commonly quoted $200–$400 per finished hour or ~$3–$8 per short line). Union/SAG-AFTRA with a commercial app buyout: **$1,500–$5,000+**, plus usage-term renewals.
  (https://www.voicecrafters.com/industry-standard-voice-over-rates/ · https://www.thevoicerealm.com/voice-actor-non-union-rates.php)
- **The hidden killer:** every curriculum change = a **pickup session**. Minimum session fees ($100–$250) apply even for 5 lines. Actors get booked, change rates, retire, or become unreachable — and then your character's voice changes mid-product. Room tone and mic chain drift between sessions, so pickups audibly mismatch.
- **Verdict:** wrong shape for a living, iterating curriculum. If you love a human voice, the hybrid is: hire the actor for ~30 minutes of clean audio → **clone with Chatterbox (MIT)** under a written contract that grants you synthetic-voice rights. Best of both, one-time cost, infinite regeneration.

---

## 5. Lip-Sync: driving a 2D cartoon mouth from generated audio

Three viable paths, cheapest first:

1. **Rhubarb Lip Sync** (open source, MIT-ish, https://github.com/DanielSWolf/rhubarb-lip-sync)
   - CLI: feed a WAV (+ optional dialog text for higher accuracy), get back a TSV/JSON timeline of **6–9 mouth shapes (A–H, X)** — the Hanna-Barbera/Preston Blair standard.
   - Runs offline, batch over hundreds of files in a script. **This is the right tool.** Bake the timeline into a JSON shipped alongside each audio file — zero runtime cost on device.
2. **Amazon Polly speech marks** (https://docs.aws.amazon.com/polly/latest/dg/viseme.html)
   - If you use Polly for TTS, request `SpeechMarkTypes=["viseme","word"]` and it returns viseme + timing JSON **for free with the synthesis**. Zero extra tooling. Strong argument for choosing Polly if lip-sync fidelity matters more than voice warmth.
3. **Rive state machine** (your animation layer)
   - Build one Rive artboard with ~8–10 mouth-shape animations, exposed via a **single Number input `phoneme`** on the state machine. At runtime, walk the timeline JSON and set `phoneme` at each timestamp; Rive blends between shapes. Working writeup: https://rive.expert/blog/lip-sync-animation
   - Rive iOS runtime supports `SMINumber` inputs, so this is ~50 lines of Swift synced to `AVAudioPlayer.currentTime`.

**Pipeline:** `lessons.csv` → TTS API → `line_042.mp3` → Rhubarb → `line_042.json` → ship both in bundle → Swift plays audio + drives Rive `phoneme` input. Fully scriptable; re-running the whole curriculum is one command.

---

## 6. Final Recommendation

**Primary: OpenAI `gpt-4o-mini-tts`, voice "coral" or "nova", with a steering prompt like *"warm, patient, encouraging guitar teacher speaking to a nervous beginner."*
Lip-sync: Rhubarb → JSON → Rive state machine.**

Why:
- ~$0.40 per full 200-line curriculum render — effectively free vs. ElevenLabs' $264–$1,188/yr floor.
- Steerable emotion gets you the "warm teacher" character without voice cloning.
- You own the output; commercial use is permitted under the API terms (disclose AI-generated voice in your App Store listing / app credits).
- Zero infrastructure — a Python script and an API key. No GPU, no ML knowledge.

**Monthly cost estimate: $0–$10/month.** (Realistically $0 most months, since you only pay when you regenerate.)

**Second choice / hedge — if you want zero vendor dependency:**
Run **Kokoro-82M (Apache-2.0)** locally on your Mac. `pip install kokoro soundfile`, voice `af_heart`. Truly $0 forever, no API, no ToS, commercially clean, CPU-fast. Quality is a step below OpenAI but genuinely pleasant — worth generating 10 sample lines side-by-side before deciding.

**If you later want a distinctive signature voice:** pay a voice actor once (~$500–$1,000) for 30 min of clean audio with synthetic-rights in the contract, then clone with **Chatterbox (MIT)** on a rented GPU (~$0.50/hr) and regenerate forever for free.

**Avoid:** XTTS-v2, F5-TTS, Fish Speech (all non-commercial), ElevenLabs Free tier (no commercial license), and AVSpeechSynthesizer as your character's voice.
