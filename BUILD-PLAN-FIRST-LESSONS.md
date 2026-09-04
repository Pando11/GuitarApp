# BUILD PLAN — First Adult Lessons, Testable by Heidi + Friends

**Owner:** you (Heidi)  
**Agent:** Hermes (me)  
**Date:** 2026-08-31  
**Goal:** Get a beginner from "never touched a guitar" to "I played a real song" on their own phone, with the first batch of adult lessons. You and 2-3 friends test it.  
**Scope:** Lessons 1–5 (the "first week" arc) + a working app shell that runs on a phone browser.  
**Not in scope:** All 25 lessons, the Godot world, the animated teacher, the mic listening engine, Path A duet, performance ladder, Mystery Mode, World 2+. Those come later.

---

## Where we actually are (disk truth, surveyed 2026-08-31)

The previous handoff doc (HANDOFF-REMAINING-2026-08-30.md) says "Waves 1–4 are BUILT and VERIFIED." **That is not true on this machine.** Here's what's real:

**On disk right now:**
- Planning docs: AGENTS.md, CONTEXT.md, AMENDMENT-01 through AMENDMENT-17 (17 spec amendments), ADR-0001 (sync), ADR-0002 (practice delivery), ADR-0004 (teacher/World 1), brand-references/emerald-hollow/ (measured palette + video montages)
- A partial Godot tree: `07-app/godot/` with a `.godot/` cache, one video clip (`B02_twoshot.ogv`), imported audio samples — but no `project.godot`, no scenes, no content
- A flat 580-line ticket list: `.scratch/teacher/tickets.md` (T-A1 through T-A4 owner decisions resolved, T-B1 through T-B8 build tickets defined, T-C1 through T-C3 roadmap)
- World-factory scripts: `scripts/world-factory/` (FLUX/Wan stage1/stage2/stage3, fal.ai paths)
- Gate scaffolds: `tools/verify-curriculum-order.js`, `tools/verify-song-progressions.js` (these are placeholder scaffolds — they can't run because the data dirs they read don't exist)

**NOT on disk (the previous handoff claimed these existed):**
- `07-app/app.js` — the PWA entry point — **MISSING**
- `07-app/content/lessons/` — the 25 lesson JSONs — **MISSING** (only `.order-sandbox/` has copies, which is a staging dir, not the app's content dir)
- `07-app/core/` — the app core JS — **MISSING** (only `chord-theory-check.js` and a report JSON exist, nothing else)
- `07-app/service-worker.js` — **MISSING**
- `07-app/manifest.webmanifest` — **MISSING**
- `05-content/` — authoring source — **MISSING**
- `06-prototypes/` — practice engine + chord checker — **MISSING**
- `04-validation/` — ship gates — **MISSING**
- `03-research/` — curriculum research — **MISSING**
- `assets/` at repo root — FLUX/Wan output — **MISSING** (pipeline never ran)
- The real ship gates — `node 06-prototypes/step0/run-chord-check.js` etc. — **can't run** because their input dirs are missing

**Bottom line:** The GuitarApp as a working product does not exist on this machine. The planning is real and detailed. The code is gone. We rebuild from the plans.

This plan is written on the assumption that we rebuild the minimum needed for the test, not the whole app.

---

## What "testable by you and friends" means

A test is successful when:

1. **You can open the app on your phone** (no install from an app store — just tap a link or open a file)
2. **You see Lesson 1** and can work through it at your own pace
3. **You learn your first chord** (Em) with a clear visual + audio explanation
4. **You practice it** — the app lets you try, and gives you a way to check your answer
5. **You move to Lesson 2, 3, 4, 5** and by the end you've played a simple two-chord song with a strum pattern
6. **It feels like a real lesson**, not a manual — a teacher voice talks you through it, the chord diagrams are clear, the strumming is demonstrated

The test does NOT require:
- The animated Emerald Hollow world (that's the v1 cinematic experience — beautiful, but not needed to test whether the lesson flow works)
- The mic listening engine (we can use a "tap to confirm" interaction for the first test — the student plays, then taps "I played it" and the app responds; the real mic comes later)
- The full 25-lesson curriculum (5 lessons is enough to test the arc)
- Cross-device sync, accounts, or any backend (the first test is entirely local on the phone)

---

## The slice: Lessons 1–5 (the "first week")

From the locked AMENDMENT-15 curriculum order, the first 5 lessons are:

| # | Lesson | What the student gets |
|---|---|---|
| 1 | Welcome, anatomy, tuning | What a guitar is, the parts, how to hold it, how to tune (with a reference they can use) |
| 2 | Holding the pick | How to hold a pick, practice picking the strings |
| 3 | First chord — Em | The Em chord shape, finger by finger, with a diagram; play it and strum |
| 4 | Second chord + first song | Add the C chord (easy version), play a two-chord song |
| 5 | Strumming in time | A basic down-strum pattern, play along with a count |

That's a real arc: by the end of Lesson 5, a beginner has held a guitar, held a pick, played two chords, and strummed a simple song. That's enough to test whether the app teaches well.

**Why these 5 and not more:** More lessons = more content to author + more to test. 5 is enough to prove the lesson flow, the chord teaching, the practice interaction, and the progression. If the test works, we extend to 10, then 15, then the full 25. If it doesn't work, we fix the lesson design before writing more.

---

## How we build it: the minimal app shell

For the first test, I'm proposing we build a **lightweight HTML/JS app that runs directly on a phone browser** — no app store, no service worker complexity, no backend. Just open a URL (or a file) and it works.

This is NOT the final PWA architecture. The planning docs describe a full PWA with service worker, offline cache, PocketBase sync, etc. That's the right end state. But for a first test with friends, the full PWA is over-engineering. We want something we can put on a phone this week and have real people use.

**The minimal shell has:**

1. **A lesson viewer** — shows the current lesson's content: text, chord diagrams, audio playback, step-by-step coaching
2. **A navigation flow** — "next step" / "back" through the lesson; a list of lessons so you can see progress
3. **A chord diagram renderer** — draws the fretboard with dots for where to put your fingers (standard tuning, from the verified chord theory data)
4. **An audio player** — plays the teacher's voice lines and any demo audio (we generate the audio from text using a free TTS — Chatterbox or Kokoro, both free and commercial-clean)
5. **A practice interaction** — the student tries the chord, then confirms; the app responds (right/wrong, or "keep trying"); for the first test this can be tap-to-confirm, not mic-based
6. **A progression tracker** — shows which lessons are done, which are next

**What we skip for the first test:**
- Service worker / offline (the test is online-only — open the URL, it loads)
- Accounts / sync (no login, no backend — the phone stores progress in localStorage)
- The animated world (lessons are clean and clear, not cinematic — we can add the world later)
- The mic listening engine (tap-to-confirm for the test; mic comes after we prove the lesson flow)
- The teacher character / Godot scene (the teacher is a voice + text for now; the world comes with the cinematic pipeline)

This shell is a **throwaway prototype for the test** — but it's built on the same lesson content format that the real PWA will use, so the content we author now is reusable later. We author the lessons once, in the right format, and both the prototype and the future PWA read from the same files.

---

## Build order (what I'll do, in sequence)

### Phase 0 — Confirm the lesson format + chord data (1 session)

**What:** Read the existing lesson JSON format from the `.order-sandbox/` copies, read the chord theory data, confirm we know exactly what a lesson file looks like and what chords we can teach.

**Why first:** We author lessons in Phase 2. We need to know the format before we write a single one. The chord data drives the diagrams. Getting this right up front means the lessons we write are reusable in the real PWA later.

**Deliverable:** A short doc that says: "Here's the lesson JSON schema, here are the chords we can teach in the first 5 lessons (Em, C, and any others), here's how the chord diagram data looks." Written to the repo.

**Depends on:** Nothing — we read what's on disk.

---

### Phase 1 — Build the minimal app shell (1-2 sessions)

**What:** Build the HTML/JS app that runs on a phone browser. Lesson viewer, navigation, chord diagram renderer, audio player, practice interaction, progression tracker. No backend, no service worker, no accounts.

**Why second:** We need the shell before we can put lessons into it. The shell is generic — it renders whatever lesson you give it. Once it works for one lesson, it works for all five.

**Deliverable:** A folder of HTML + JS + CSS files that, when opened on a phone browser, shows Lesson 1 and lets you navigate through it. At this point it has no real lesson content yet (we'll plug that in next), but the viewer works — you can see a chord diagram, play audio, move forward/backward.

**Depends on:** Phase 0 (we know the format the shell needs to read).

---

### Phase 2 — Author Lessons 1–5 (2-3 sessions)

**What:** Write the actual lesson content for Lessons 1–5 in the lesson JSON format. Each lesson has: title, steps (each step is a chunk of content — text, a chord diagram, an audio line, a practice prompt), the chords it teaches, the practice interaction. Author them in the same format the real PWA will use.

**Why third:** The shell is ready to receive content. Now we fill it. This is the bulk of the work — good lessons take care to write. The coaching copy needs to be warm and encouraging (the owner's tone rule from Grill #3), the chord diagrams need to be correct (the chord theory is verified, so we drive diagrams from the verified data, not by hand), and the practice interactions need to be real (not just "good job" — actual things to try).

**Specifics per lesson:**
- **Lesson 1 (welcome, anatomy, tuning):** Parts of the guitar, how to hold it, how to tune. No chords yet. Audio: a friendly welcome. Practice: none (this lesson is information), or a simple "tap when you've tuned" confirmation.
- **Lesson 2 (holding the pick):** How to hold a pick, practice picking individual strings. Audio: coaching on grip. Practice: tap to confirm you're holding the pick, or a simple picking exercise (tap each string in order).
- **Lesson 3 (first chord — Em):** The Em chord shape, finger by finger, with a diagram. Play it and strum. Audio: "put your middle finger on the 2nd fret of the A string..." etc. Practice: the student tries Em, taps "I played it," the app responds. This is the first real chord — make it land.
- **Lesson 4 (second chord + first song):** Add the easy C chord. Play a two-chord song (Em and C, simple strum). Audio: coaching on switching. Practice: switch between Em and C, tap to confirm each.
- **Lesson 5 (strumming in time):** A basic down-strum pattern. Play along with a count. Audio: "strum down on 1, 2, 3, 4..." Practice: tap along with the count, or strum and tap to confirm.

**Deliverable:** 5 lesson JSON files in the repo, in the lesson format, ready to be loaded by the shell.

**Depends on:** Phase 1 (the shell knows how to render a lesson) + Phase 0 (we know the chord data for the diagrams).

---

### Phase 3 — Generate the teacher audio (1 session, parallel with Phase 2)

**What:** For each lesson, generate the teacher voice audio lines. The owner wants a "chill, warm, encouraging" teacher voice. The voice is Chatterbox (MIT, free, commercial-clean) if we can run it, or Kokoro-82M (Apache-2.0, free, runs on CPU) as fallback. Both are on the approved list.

**Why parallel with Phase 2:** The lessons need audio lines. We can write the text of each line during Phase 2 and generate the audio right after. The audio generation is a separate step from authoring — write the copy, then generate the WAVs.

**Deliverable:** A folder of WAV files, one per teacher line, named so the lesson JSON can reference them (e.g. `audio/l01/welcome.wav`, `audio/l03/em-shape.wav`).

**Depends on:** Phase 2 (we know what lines to generate) + a working TTS tool on this machine (check if Kokoro is installed in `.venv-kokoro/`; if not, install it or use a fallback).

**Note on install state:** Before claiming a TTS tool is available, check disk. The PC-transfer gotcha is real — the planning docs may say "Kokoro is installed" when it isn't. Verify before generating.

---

### Phase 4 — Integration + phone test prep (1 session)

**What:** Put everything together — the shell, the lessons, the audio — and make sure it runs on a phone. Test on your own phone first: open the URL, go through all 5 lessons, make sure the chord diagrams render, the audio plays, the practice interactions work.

**Why here:** We don't send it to friends until you've run through it yourself and confirmed it works end to end. The first test subject should be you.

**Deliverable:** A single URL (or a folder you can open on your phone) that runs all 5 lessons. You've gone through it yourself and it works.

**Depends on:** Phases 1, 2, 3 all complete.

---

### Phase 5 — You + friends test (your schedule)

**What:** You and 2-3 friends each go through Lessons 1–5 on your own phones. You watch what they do, where they get stuck, what they laugh at, what they don't understand. Take notes. This is the real test.

**Why last:** The app has to work before real people use it. You're the first test subject; friends are the second wave.

**What we're testing:**
- Can a beginner understand the lessons without help?
- Do the chord diagrams make sense?
- Does the teacher voice sound right (warm, not clinical)?
- Can they actually play the chords by the end?
- Where do they get stuck or bored?
- Does the progression feel right (5 lessons, each building on the last)?

**Deliverable:** Notes from the test — what worked, what didn't, what to fix before we extend to more lessons.

**Depends on:** Phase 4 (the app works on your phone).

---

### Phase 6 — Fix + extend (after the test)

**What:** Based on the test notes, fix what didn't work. Then extend the lesson set — probably to Lessons 1–10 next, then more after that. Eventually, when the lesson flow is proven, we rebuild as the full PWA with the animated world, the mic listening, the performance ladder, etc.

**Why last:** The test tells us what to fix. We don't extend until the first 5 lessons are solid.

**Deliverable:** Fixed lessons + the next batch (probably 6–10).

**Depends on:** Phase 5 (test notes in hand).

---

## What I need from you (Heidi)

1. **Confirm the scope:** Lessons 1–5, minimal HTML/JS shell, phone-browser test, no animated world, no mic listening for the first test. If you want fewer lessons (just 1–3) or more (1–7), say so. If you want the mic listening in from the start, say so — it changes the plan.

2. **Confirm the voice:** Chatterbox (MIT, softer/warmth control, needs a GPU or cloud API) or Kokoro-82M (Apache-2.0, CPU, runs here, slightly more robotic)? For a first test, Kokoro on CPU is fine and it's already approved. If you want Chatterbox's warmth, we need a cloud GPU (the fal.ai or RunPod path from the world-factory plans — but that adds cost and complexity). For the test, I'd start with Kokoro and upgrade to Chatterbox later if the voice matters enough.

3. **The test group:** How many friends, and do they actually have guitars? If some don't, we need a "no guitar yet" path through the lessons (tuning and chord shape can be understood without a guitar; strumming and picking need one).

4. **The delivery:** How do you want to get the app on your phone and your friends' phones? Options:
   - A URL on a local server (I run a server on this machine, you and friends access it over WiFi from your phones — simplest for testing, but everyone needs to be on the same WiFi)
   - A single HTML file you can email or AirDrop to a phone and open directly (works offline, no server needed, but file:// has some limitations)
   - A hosted URL (push to a free host — GitHub Pages, etc. — but that's more setup)

   For a first test, I'd go with the local-server-over-WiFi option — it's the fastest to set up and lets us iterate quickly. If you want a different option, say so.

---

## What "done" looks like for this plan

**Done = you and at least one friend can each open the app on your phone, go through Lessons 1–5, and by the end play a simple two-chord song with a strum pattern, and you've captured notes on what worked and what didn't.**

That's it. Not "the full app is built." Not "the animated world is rendered." Not "the mic listens perfectly." Just: a beginner can open this on a phone, learn 2 chords and a strum, and play a song, and we have real feedback to improve from.

Everything else — the Godot world, the animated teacher, the full 25-lesson curriculum, the mic engine, the performance ladder, the sync, the Path A duet — comes after we prove this slice works.

---

## Risks and honest caveats

1. **The previous handoff is wrong.** The app does not exist on disk. We are building from plans, not continuing a build. That's fine — the plans are detailed. But it means this is a rebuild, not a continuation, and the timeline is "build from scratch" not "finish what's there."

2. **The lesson content is the hard part.** Building the shell is straightforward. Writing 5 good lessons — clear, correct, warm, actually teachable — is the real work. The chord diagrams are verified (the chord theory checker proves them), but the coaching copy, the pacing, the practice interactions — those need care. If the lessons are bad, the app doesn't matter.

3. **The voice is a gap.** For the test, Kokoro-82M on CPU is available and free, but it's not as warm as Chatterbox. If the voice quality matters for the test (and the owner's tone rule says it does — "warm and encouraging, never clinical"), we should decide early whether to invest in Chatterbox via a cloud API or accept Kokoro for now.

4. **The mic listening is the biggest missing piece for the "real" experience.** The owner's vision (AMENDMENT-05) is "the app listens to the student play." That's not in this test plan — we're using tap-to-confirm. If you want the mic in the first test, the plan changes significantly (we need the listening engine, which isn't on disk, and real-device testing, which the skill docs say is a manual Heidi-authorized step). For the first test with friends, tap-to-confirm is a reasonable substitute — it tests the lesson flow without needing the mic.

5. **This is a prototype, not the product.** The minimal HTML/JS shell is built for the test, not for launch. When we're ready to ship beyond the test group, we rebuild as the PWA with service worker, offline, sync, etc. The lesson content we author now is reusable — that's the key investment. The shell is throwaway; the lessons are not.

---

## Open questions (I'm flagging these — you answer what you can)

1. **Lessons 1–5 or a different slice?** (I proposed 1–5; you might want 1–3 for a faster test, or 1–7 for a fuller arc.)
2. **Kokoro or Chatterbox for the test voice?**
3. **Delivery method:** local WiFi server, single HTML file, or hosted URL?
4. **Do all test participants have guitars, or do we need a no-guitar path?**
5. **Mic listening in the first test, or tap-to-confirm?**
6. **Any friends you want to name as test participants?** (So I can keep their needs in mind — e.g. one might be more advanced, another a total beginner.)

---

*Plan written 2026-08-31. Re-check disk state before each phase — the PC-transfer gotcha means we verify on disk, not from docs, before claiming anything exists.*
