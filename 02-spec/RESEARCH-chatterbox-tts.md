# Chatterbox TTS — Voice Decision Report (Guitar Lesson App)

_Prepared for Heidi (non-technical owner). Research done live via web search on 2026-08-15._

## Verdict (plain English)
**KEEP Chatterbox.** It is a genuinely free, open-source voice engine whose license (MIT) lets you sell it inside a paid app with no subscription or per-seat fees, and it includes the two features you need — cloning a teacher's voice from ~5 seconds of audio and controlling emotion. In blind listener tests it matches or beats ElevenLabs, and no other free model we found is clearly *better* — the closest rivals (Zonos, Qwen3-TTS) are roughly equal peers, not upgrades. Keep Kokoro as the cheap CPU backup voice.

---

## Model Comparison

| Model | Quality vs ElevenLabs | License | Commercial-safe? | Free or Paid? |
|---|---|---|---|---|
| **Chatterbox** (Resemble AI) — *current pick* | At/near parity. Vendor blind tests: 63–65% listener preference over ElevenLabs. Ranked top open model on Artificial Analysis Speech Arena. | **MIT** | **YES** — explicitly covers code + weights + zero-shot cloning + emotion | **FREE** (self-host) |
| **Zonos** (Zyphra) — top rival | Peer/comparable; "on par with or surpassing top TTS providers"; very expressive, 44kHz | Apache-2.0 | YES | FREE |
| **Qwen3-TTS** (Alibaba) — emerging | High quality, sub-100ms latency, 10k+ GitHub stars; newer, less battle-tested | Apache-2.0 | YES (model card) | FREE |
| **OuteTTS 1.0** (OuteAI) | Good, lighter/14 langs, voice cloning | Apache-2.0 | YES | FREE |
| **Nari Labs Dia / Dia2** | Excellent for multi-speaker dialogue + laughter; 1.6B | Apache-2.0 | YES | FREE |
| **Spark-TTS** (SparkAudio) | Solid, 0.5B LLM-based | Apache-2.0 | YES | FREE |
| **Kokoro-82M** — *already in use as fallback* | Lower than Chatterbox; **no cloning/emotion**; tiny, runs on CPU | Apache-2.0 | YES | FREE |
| **ElevenLabs** — the benchmark | Quality leader; 74 languages, 10k+ voices, best latency/consistency | Proprietary | YES but **PAID subscription** | PAID |

---

## Recommendation
**KEEP Chatterbox.** One-line reason: it's the only top-tier open model that is unambiguously MIT (commercial-safe *including* voice cloning and emotion) and matches ElevenLabs in blind tests, while Zonos and Qwen3-TTS are peers, not clear upgrades.

**Practical notes for the build:**
- Chatterbox is now a *family*: the base model (best quality), **Chatterbox-Turbo** (low-latency, adds optional PerTh watermarking for provenance — fine/good for a paid app), and **Chatterbox-Nano** (110M, runs on CPU, ~3x realtime on 8 cores) — so you have a quality tier, a speed tier, and an on-device/cheap tier, all MIT.
- **Voice-cloning consent caveat (legal, not license):** MIT lets you *use* cloning commercially, but cloning a real person's voice (your teacher's) for a sold product should be done with that person's written consent — that's a right-of-publicity issue, not a software-license issue.
- Keep **Kokoro** as the free CPU fallback (it's already installed) for when Chatterbox GPU/servers are unavailable; it's lower quality and can't clone, so it's the "still works" safety net, not the main voice.
- None of the PROJECT BLOCKLIST models (XTTS-v2, F5-TTS, Fish Speech, Piper, IndexTTS-2, Wav2Lip) are commercial-clean, so they stay excluded.

---

## Sources actually read (URLs / names)
- GitHub repo license check: `https://github.com/resemble-ai/chatterbox` — GitHub API reports `"spdx_id": "MIT"`; LICENSE file text: "MIT License, Copyright (c) 2025 Resemble AI".
- Resemble AI Chatterbox page: `https://www.resemble.ai/learn/models/chatterbox` — MIT, emotion control, real-time, zero-shot cloning from 5s.
- Hugging Face model card: `https://huggingface.co/ResembleAI/chatterbox` — "Licensed under MIT… benchmarked against ElevenLabs."
- Chatterbox Turbo / Multilingual V3 / Nano: `https://www.resemble.ai/learn/models/chatterbox-turbo`, `https://www.resemble.ai/learn/models/chatterbox-multilingual`.
- Quality/blind-test claims (vendor-run, treat with mild skepticism): Local AI Master `https://localaimaster.com/blog/chatterbox-tts-setup-guide` (63.75%); FindSkill.ai `https://findskill.ai/blog/best-open-source-tts-2026/` (65.3%); GenMediaLab `https://www.genmedialab.com/comparisons/elevenlabs-vs-chatterbox-tts/`; Oakgen.ai `https://oakgen.ai/blog/chatterbox-tts-open-source-review` (63.8%).
- Independent open-model ranking: Pinggy `https://pinggy.io/blog/best_open_source_self_hosted_text_to_speech_models/` (Artificial Analysis Speech Arena Elo lists Chatterbox & Zonos as top open).
- Zonos license + quality: `https://github.com/Zyphra/Zonos` (Apache-2.0, "on par with or surpassing top TTS providers").
- OuteTTS 1.0: `https://outeai.com/blog/outetts-1-0-release` (Apache-2.0).
- Nari Labs Dia: `https://github.com/nari-labs/dia` (Apache-2.0).
- Spark-TTS: `https://github.com/SparkAudio/Spark-TTS` (Apache-2.0).
- Qwen3-TTS: `https://github.com/QwenLM/Qwen3-TTS` (Apache-2.0), `https://theagenttimes.com/articles/qwen3-tts-emerges-as-a-sleeper-hit-for-agents-needing-real-t-e044724e`.
- General reviews/roundups: `https://codersera.com/blog/chatterbox-tts-vs-elevenlabs-tts-an-in-depth-comparison/`, `https://reviewnexa.com/chatterbox-tts-review/`, `https://www.digitalocean.com/community/tutorials/resemble-chatterbox-tts-text-to-speech`.
