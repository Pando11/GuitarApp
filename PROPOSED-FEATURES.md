# GuitarApp — PROPOSED & POSSIBLE FEATURES (MASTER REGISTRY)

**Purpose:** ONE file that lists every feature we have *proposed* or are *considering*
building, gathered from all the scattered spec / research / brainstorm docs so you never
have to hunt for them again.

**Why this file exists:** feature ideas were spread across
`02-spec/guitar-app-features-list.md`, `02-spec/FEATURES-LOCKED-v1-2026-08-07.md`,
`02-spec/guitar-app-spec-AMENDMENT-05.md`, `03-research/ai-features-20-monetization-ideas.md`,
`03-research/COMPLAINTS-TO-FEATURES.md`, `02-spec/guitar-app-spec-AMENDMENT-11.md`,
`02-spec/guitar-app-spec-AMENDMENT-12.md`, and the base spec's V2/V3 roadmap. This is the
single consolidation. The original docs stay in place as history — do not delete them.

**OS note (Windows / case-insensitive filenames):** this file is named in flat case
`PROPOSED-FEATURES.md` at the repo root (same level as `AGENTS.md` / `HANDOFF.md`) so it
surfaces immediately in any file listing and can never case-collide with another file.
NOTE: `search_files` (rg) FAILS on paths containing the space in "The Yoda Trader"
(rg IO error 3) — use `terminal` + `find`/`grep` to locate files under that path, or just
open this file directly from `Desktop/GuitarApp/`.

---

## STATUS LEGEND
- `[PROPOSED]`     — brainstormed / suggested, not yet committed to build
- `[APPROVED]`     — owner signed off (usually via an AMENDMENT); may be built or pending
- `[BUILT]`        — source docs report working code + passing tests
- `[DEFERRED]`     — possible later (V2/V3), not for v1
- `[BANNED]`       — explicitly excluded by a hard rule; do NOT re-propose without a new amendment
- `[OUT]`          — proposed but blocked by our own rules (see note)

Build-status tags reflect what the *source docs state as of their dates*. Before treating
any item as shipped, re-run the ship gates (`node run-chord-check.js`,
`node 07-app/test/fidelity.mjs`, the step-6 suites) and the live-TTS / dogfood checks.

---

## A. THE 20(+1) MONETIZATION / SUCCESS BRAINSTORM (2026-08-16)
Source: `03-research/ai-features-20-monetization-ideas.md`. All `[PROPOSED]` unless noted.
Legend there: REVENUE = new money / less churn; COST = saves money; Effort = build size.

| # | Feature | Type / Effort | Notes / overlap |
|---|---------|---------------|-----------------|
| 1 | AI-personalized daily practice plans | REVENUE, low | Builds on weak-pair data. Overlaps AMENDMENT-05 #4 (adaptive). |
| 2 | "Hum a song → instant lesson" transcriber | REVENUE, medium | **Unblocked 2026-08-16** — owner deleted Rule 4 + Rule 7 bans. Match only known-learned chords. |
| 3 | Real-time AI feedback coach | REVENUE, med-high | Extends AMENDMENT-05 #1 listening with AI phrasing ("you're muting the G string"). |
| 4 | Adaptive pacing (anti-churn) | REVENUE, medium | Slows/speeds curriculum per student. Overlaps #1. |
| 5 | AI lesson-world factory | COST, high one-time | FLUX→Wan→Chatterbox→Godot end-to-end; drops cost-per-lesson toward $0. |
| 6 | Churn-prediction nudges | REVENUE, low-med | Spots quitting signals, fires "don't break your streak." |
| 7 | Grounded AI tutor chat (paywall you have) | REVENUE, low | `renderChat` already premium-gated (F4). "Ask a teacher, anytime." |
| 8 | SEO / content engine for cheaper installs | COST/REVENUE, low | AI song-tutorials/blog/YouTube scripts from world visuals. |
| 9 | AI paywall / price optimization | REVENUE, low | Auto A/B-tests trial length / price / wording. |
| 10 | White-label voice cloning for teachers (B2B) | REVENUE, medium | Chatterbox zero-shot clone; teachers sell lessons. New B2B line. |
| 11 | AI backing-band play-alongs | REVENUE, medium | Needs a free commercial-clean music-gen model. **NOT MusicGen** (CC BY-NC = non-commercial, disqualified). Verified candidates: **ACE-Step (MIT) + YuE (Apache-2.0)** — both confirmed at source 2026-08-17. Needs cloud GPU (no VRAM on mini-PC). |
| 12 | Shareable progress videos | REVENUE (growth), low-med | Auto-builds milestone video from world visuals; user shares → free installs. |
| 13 | Parent progress reports | REVENUE (B2C2), low | Weekly plain-language email to a parent; opens kids' market. |
| 14 | Auto-leveled songs | REVENUE (less churn), medium | Rearranges any song to student's level, ramps as they improve. |
| 15 | Teacher dashboard (B2B) | REVENUE, medium | AI class summary for teachers using the app; per-seat plan. |
| 16 | Smarter upgrade offers | REVENUE, low | Splits users (newbie/stuck/almost-done), shows best "go premium" moment. |
| 17 | Full app translation (other languages) | REVENUE (big TAM), medium | Chatterbox clones voice per language; lesson JSON already text. |
| 18 | "Play with the band" AI fill-in | REVENUE, medium | AI fills the rest of the song in real time. Same music-gen license caveat as #11 (ACE-Step/YuE, NOT MusicGen). |
| 19 | Wrong-tuning / wrong-guitar auto-detect | COST + less churn, low-med | Detects "half-step flat" before frustration/refund. |
| 20 | Graduation upsell at the capstone | REVENUE (timed), low | On finishing lesson 25, offer the next paid track at peak motivation. |
| 21 | Seamless lesson-to-lesson continuation | REVENUE (anti-churn), low | "✓ Complete → Next lesson ▶" keeps student in the teacher's world. PWA-first. |
| 22 | **Suno-style AI music generator (BOARD ITEM 2026-08-17)** | REVENUE, medium (phase 1) → med-high (phase 2) | Owner saw Suno ads; proposes a Suno-*like* feature for GuitarApp. **Do NOT use Suno** (paid subscription, free tier non-commercial, copyright-lawsuit history — violates our free+clean rule). Build the capability on open-source: **ACE-Step (MIT) / YuE (Apache-2.0)**, licenses verified at source 2026-08-17. Two phases: (1) student hums a tune → app matches to known chords / turns it into a lesson — overlaps + extends #2 (already unblocked 2026-08-16); (2) app generates original practice backing tracks / full songs — needs cloud GPU like #5/FLUX. **Status: awaiting board decision.** Questions for board: (a) approve the "hum a song → lesson" direction? (b) budget a small cloud-GPU trial for phase-2 backing tracks? (c) any music-IP concern to route to counsel before ship? |

**High-ROI cluster to dig into first** (cheap, grounded, sit on data already collected):
#1, #7, #3, #12, #13, #16, #20.
**Bigger swings:** #5, #10, #17.

---

## B. COMPLAINT → FEATURE IDEAS (from competitor tear-downs)
Source: `03-research/COMPLAINTS-TO-FEATURES.md`. Status per that doc.

### B1. The struggling-student loop (red-lined [IN] = allowed for v1, [OUT] = blocked)
| Idea | Status | Note |
|------|--------|------|
| 1. Auto-serve more practice on the stuck thing | `[APPROVED]` built (Loop A) | chat serves real drill from lesson JSON. |
| 2. Teacher explains it a different way | `[PROPOSED]` | Pre-authored alternate explanations for sticky topics. |
| 3. Slow it down / loop a smaller piece | `[PROPOSED]` | Metronome + tempo control already exist. |
| 4. Break the skill into baby steps | `[APPROVED]` built (Loop A + #1) | Splits chord change into micro-drills. |
| 5. "You're getting better" from real memory | `[BUILT]` | Longitudinal practice memory (AMENDMENT-11 core). |
| 6. Re-show fingering slower / different angle | `[APPROVED]` | Re-draw from verified chord-theory data (AMENDMENT-10). |
| 7. Camera watches their hands | `[OUT]` | Retired; camera/hand-tracking barred by AGENTS Rule 2. |
| 8. Record playing & critique the take | `[OUT]` | Recording ban deleted 2026-08-16 but retirement decision stands; needs owner go-ahead. |
| 9. Free AI tutor diagnoses WHY a chord sounds bad | `[OUT]` | AI may only cite practice-record facts, never invent physical diagnosis. |

### B2. The three student-help loops (status per doc)
- **LOOP A** — in-lesson live catch (drill serving): `[BUILT]` (drillSelector.js + chat reply; 14/0 tests).
- **LOOP B** — next lesson "got it? want to review?": `[BUILT]` (reviewPrompt; closed same session).
- **LOOP C1** — app-initiated follow-up (F6): `[BUILT]` (16/0 tests).
- **LOOP C2** — student-initiated targeted follow-up ("that thing you asked about"): `[BUILT]` (closed same session; 20/0 tests). *Gap 3 = real push/SMS/email SEND is stubbed by design — separate launch-integration task.*

### B3. Walled-curriculum opening (bring-your-own-song)
- `[PROPOSED]` / future — v1 is our sequenced curriculum + songs; BYO-song grader noted as a future opening, not shipped.

---

## C. THE NINE APPROVED AI FEATURES (AMENDMENT-05, 2026-08-07)
Source: `02-spec/guitar-app-spec-AMENDMENT-05.md`. All `[APPROVED]`; build status from
`FEATURES-LOCKED-v1-2026-08-07.md`, `HANDOFF.md`, and the live skill.
1. **The app listens** (constrained mic verification) — `[BUILT]` (Step 5 proven).
2. **Talk-to-the-coach chat** — `[BUILT]` (F4; Loop A serving).
3. **Encouraging texts/notifications w/ one-tap links** — `[BUILT]` (F6; Loop C1/C2).
4. **Adaptive practice plan** — `[APPROVED]` (practice engine exists; daily-plan AI = #1/#4 proposed).
5. **AI generates new lessons forever** — `[BUILT]` (content pipeline; style packs).
6. **The band that follows you** — `[BUILT]` (F7 engine, hostile-verified).
7. **Niche branches as a feature** (Blues/Country/Fingerstyle/Spanish packs) — `[BUILT]` (Blues pack shipped).
8. **Human-feeling progress reports** — `[BUILT]` (F9).
9. **Voice-first practice controls** — `[BUILT]` engine; HANDOFF notes the *gate* was still missing.

---

## D. WORLD / TEACHER / SONG FEATURES (AMENDMENT-11 / 12)
Source: `02-spec/guitar-app-spec-AMENDMENT-11.md`, `02-spec/guitar-app-spec-AMENDMENT-12.md`.

| Feature | Status | Note |
|---------|--------|------|
| World-locked teacher (hand matches the world) | `[APPROVED]` | AMENDMENT-11 visual rule. |
| Longitudinal student memory (teacher remembers you) | `[BUILT]` (partial) | practiceStore + F6 loops. |
| Teacher–student **duet** | `[PROPOSED]` | AMENDMENT-11 thesis; follow-up tasks "open, not yet built." |
| Song-progression track (parallel to teaching spine) | `[APPROVED]` | AMENDMENT-12; 10 songs + 11 shapes shipped; **music accuracy VERIFIED 2026-08-14** (knowledge-only LLM review — `02-spec/MUSIC-ACCURACY-REVIEW-2026-08-14.md`; not human-guitarist sign-off). |
| **Mystery Mode** (guess-the-progression) | `[APPROVED]` / building | AMENDMENT-12 §4; legal-gated (no protected lyrics). |
| AI-drawn fingers / fretboards permitted | `[APPROVED]` | AMENDMENT-10 lifted the old ban; must be driven by verified chord data. |

---

## E. DEFERRED ROADMAP (V2 / V3) — possible later, not v1
Source: base `guitar-app-spec.md` §3 + `guitar-app-features-list.md` §3.

**V2 (only after v1 retention data):** Android port; technique-health tracking;
song-based learning from a properly licensed catalog; async duets; then-vs-now progress
reels; avatar picker (reskins only).

**V3 (conditional on retention data):** live jam sessions (only if v2 shows a community
retention cliff); fine-grained pressure/wrist coaching (only if v1/v2 data is labeled).

**Excluded-from-v1 list (X1–X10) from `guitar-app-features-list.md`:**
X1 camera chord-shape check · X2 record-a-take critique · X3 on-device pitch/timing detection
(retired) · X4 hand tracking / MediaPipe · X5 real-time note scoring as FX · X6 songs-as-licensed-library ·
X7 live jams/community (v3) · X8 Android/electric/bass (v2+) · X9 animated AI hands (forbidden) ·
X10 avatar picker/story campaigns/genre remix/AI-composed songs (v2+).

---

## F. HARD BANS — do NOT re-propose without a fresh owner amendment
From `FEATURES-LOCKED-v1-2026-08-07.md` §HARD BANS + `AGENTS.md`:
1. No generative AI draws fingers/fretboards/hands *ungrounded* in verified data (AMENDMENT-10 permits data-driven AI).
2. **No camera finger-watching, no AI video of playing** (AGENTS Rule 2 still bars camera/hand-tracking).
3. No open-ended audio transcription (constrained target-matching only; the old ban was deleted 2026-08-16 but accuracy rationale stands).
4. No copyrighted songs — original/public-domain only.
5. Audio never leaves the device; all listening on-device.
6. LLM never invents musical judgements; cites real practice data only.
7. Every lesson's musical content passes verification before shipping (arithmetic check + musical review).
8. Voice/image models must be commercially licensed (Apache-2.0/MIT) or paid per-call. No subscription-fee creative tools.
License blocklist (never propose): Essentia/ aubio/ TarsosDSP/ pedalboard/ dtw-python/ madmom (audio);
XTTS-v2/ F5-TTS/ Fish Speech/ Piper (voice); Midjourney/ SVD/ LTX/ Hunyuan/ CogVideoX/ ComfyUI (image/video).

---

## G. SOURCE INDEX (where each set came from)
- `03-research/ai-features-20-monetization-ideas.md` → section A (#1–#21)
- `03-research/COMPLAINTS-TO-FEATURES.md` → section B (loops, [IN]/[OUT])
- `02-spec/guitar-app-spec-AMENDMENT-05.md` → section C (nine AI features)
- `02-spec/guitar-app-spec-AMENDMENT-11.md`, `...-AMENDMENT-12.md` → section D (world/teacher/song/duet)
- base `guitar-app-spec.md` §3 + `guitar-app-features-list.md` §3 → section E (V2/V3, X1–X10)
- `02-spec/FEATURES-LOCKED-v1-2026-08-07.md` §HARD BANS + `AGENTS.md` → section F

**To add a new proposed feature:** append it to the matching section above AND note the
source doc. Keep this file as the single registry; the source docs remain as history.

END OF REGISTRY.
