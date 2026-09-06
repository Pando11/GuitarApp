Type: grilling + prototype
Status: resolved
Blocked by:

## Answer

**Q1 — six framings:** All six stay. No reduction. (Rhythm game, call-and-response, play-along groove, tempo challenge, performance moment, calm slow.)

**Q2 — sequencer inputs:** Engagement data only, none inferred. Inputs: (a) preferred format — user-set, consent-based (video/sheet/replay); (b) quality-weighted engagement — did the framing actually move their rate up, not just "did they finish"; (c) variety — don't repeat the same framing twice in a row; (d) random shuffle as a floor. User-set format preferences (e.g. "I usually want a quick go") read if the user configured them — not inferred. No personality/mood inference. No "how they learn" typing.

**Q3 — built on existing engine:** Yes. Verified on disk: `06-prototypes/practice-engine/` — one-minute-changes.mjs (30/60 sensor), fluency-store.mjs (per-pair memory, spacing decay, selectWeakest), listener-real.mjs (constrained on-device listener, 347 lines), storage-glue.js + storage-adapter.mjs (localStorage + memory fallback), review-scheduler.mjs (weak-pair surfacing + streak), practice-ui.html (679 lines, all 11 §5.2 drills). The six framings are a presentation layer on top of existing drills — not new drill types. Two framings need companion audio hooks the engine doesn't have yet (call-and-response needs a chord-cue playback; play-along groove needs a groove player) — that's new audio capability, not new drills. The rest map cleanly onto existing drills with a skin/tempo change.

**Q4 — relation to adaptive plan:** Practice remix is a presentation/reframing layer on top of the adaptive practice plan (AMENDMENT-05 #4), not a separate thing. Two stacked decisions in the same session: (1) which weak spot — adaptive plan via fluency store + review scheduler; (2) which framing — remix. Same weak pair, different flavor.

**Q5 — prototype:** Built and reacted to. `06-prototypes/practice-engine/practice-remix-q5-prototype.html` — one weak spot (G↔D, fluency 0.25, 15/min) shown three framings (⏱ Tempo challenge, 🎸 Play-along groove, 🐢 Calm slow) with shared state card + framing tabs. Owner verdict: "It all looks good." Prototype is throwaway.

Status: resolved
