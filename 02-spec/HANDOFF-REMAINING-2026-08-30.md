# GuitarApp — Handoff: What Remains (2026-08-30)

**Status right now:** Waves 1–4 are BUILT and VERIFIED on disk. Two quick-win tickets (H5, H6) just closed. Six tickets remain — four are environmentally blocked (no GPU / no PocketBase binary / missing source asset), two are human-gate (HITL) tasks that need Heidi.

All claims below were checked on disk, not taken from docs. Each ticket says: what's built, what's blocked, and the exact next action.

---

## ✅ Closed this session (no action needed)
| Ticket | What got done | Proof |
|---|---|---|
| H6 | "10 songs" → "11" across 7 files; fixed AMENDMENT-12's wrong song list (omitted Amazing Grace) + PD count | residual `10 song` grep clean |
| H5 | `05-content/` resequenced to 25-lesson NEW order; 5 orphan authoring lessons backfilled; practice generator repaired (import + 25-cap) | curriculum gate 0 err; chord gate 25/81/0/0; practice gen 45 lessons/0 fails |

**Commits (branch `h5-05content-backfill`, NOT yet merged to default):**
`841f80b` (H6) · `f0dfbda` (H5 + generator repair) · `ef6203a` (ticket doc)

---

## ⏳ OPEN TICKETS

### H1 — Wave 0 de-risk vertical slice  (HITL — needs Heidi)
- **Built:** Sage bridge, Story Memory (BI-4), backup buttons all done and self-testing.
- **Blocked:** needs 5–10 real beginners on their own phones running the slice.
- **Next action:** Heidi runs/arranges the real-user test; capture 3 yes/no scores (played a chord after? / smiled? / Sage heard them correctly?). Sign-off gates all downstream "fun" claims.

### H2 — PocketBase live sync  (BLOCKED — no server binary on this machine)
- **Built:** `07-app/core/pocketbaseSync.js` Layer-3 client crypto (PBKDF2-SHA256 150k iters + AES-256-GCM), recovery-phrase gen, schema `pocketbaseSchema.json`. Offline crypto round-trip **12/12 PASS** (node v22 webcrypto). `fetch()` is commented out (no server to call).
- **Blocked:** no `pocketbase` server binary in the environment to round-trip against.
- **Next action:** obtain/launch a PocketBase instance (self-hosted or local binary), then uncomment the `fetch()` call and run a real push/pull round-trip. Student sync cannot be proven until then.

### H3 — Jam generative audio  (BLOCKED — no GPU / RunPod supply)
- **Built (Part A, on-device):** `gradeStudentPhrase()`, `emitFacts()` — 16/16 PASS.
- **Blocked (Part B):** `generateResponse()` throws `GEN_BLOCKED`. Needs cloud GPU/RunPod to generate Sage's musical reply.
- **Next action:** stand up the RunPod worker (pod `xgcitppkl4lcm9` was STOPPED 2026-08-29; EU region had 0 GPU supply then). Once a GPU is available, implement the generation call and test the round-trip.

### H4 — L01-open-c lesson video  (BLOCKED — missing source asset)
- **Built:** Godot scaffold wired, 3 Emerald Hollow clips transcoded to `.ogv` (B00/B01/B02) and playing headless (exit 0).
- **Blocked:** `07-app/godot/data/lesson_manifest.json` references `res://assets/lessons/L01-open-c.mp4` + `.ogg` — those files don't exist (`07-app/assets/lessons/` is empty). Manifest carries a `_todo_blocked` flag.
- **Next action:** generate the L01 open-C lesson video+audio (via the world-factory pipeline / fal.ai) and land the files; flip the `_todo_blocked` flag.

### H7 — PWA live-browser smoke  (HITL — needs a browser/device)
- **Built + verified offline:** `app.js` hardened (SW registration, `?dogfood=1` tolerant, file:// safe — `node --check` PASS), `service-worker.js` bumped to `guitarapp-v2` + precache fixed, `manifest.webmanifest` valid, `backupButtons.js` BI-8 self-test PASS.
- **Blocked:** service-worker / renderer / tuner / lesson-player can't be exercised headlessly.
- **Next action:** open the PWA in a real browser (or phone), confirm SW installs, tuner renders, a lesson plays end-to-end.

### H8 — Wave 5 integration + human lyric read-through  (HITL — needs Heidi)
- **Built:** ship-gate sweeps re-runnable; counsel-prep pack derivable from `progressions.json` disclaimers + PD flags.
- **Blocked:** real-device mic dogfood + **human lyric read-through** — AMENDMENT-14 CRITICAL: regex cannot catch a paraphrased lyric, so a human must read the actual song text in-app.
- **Next action:** on a real device, run a full lesson→mystery-song flow with mic; Heidi (or designated human) reads every song's displayed lyrics for copyright-safe phrasing.

---

## 🔀 Housekeeping before next session
- **Merge `h5-05content-backfill` → default** (or keep the branch — your call). Three commits are currently only on the branch.
- **Unrelated untracked files** in the repo (`.scratch/*.json`, `FAL-AI-WORLD1-PLAN.md`, `scripts/world-factory/*`) are World-1 generation tooling, not part of this handoff — leave or clean as you like.

## One-line summary
App is feature-complete for Waves 1–4 and the two doc/authoring tickets are closed. What's left is real-user testing (H1, H7, H8), three environment gaps this machine can't satisfy (H2 PocketBase, H3 GPU, H4 video asset), and merging the work branch.
