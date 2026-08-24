# docs/adr/0001-always-on-encrypted-sync.md

**Status:** ratified (Grill #1, 2026-08-23 — owner re-confirmed on this machine)
**Supersedes:** AMENDMENT-11 Red Line 1 ("per-student profile … on-device, never uploaded") and §4 Scope Cap ("on-device only; no sync; cross-device is a later decision, not v1") — those on-device-only wordings are OVERRIDDEN for v1 student memory
**Related:** ADR-0002 (practice delivery), ADR-0003 (mystery mode), ADR-0004 (the teacher — World 1), AMENDMENT-11 (product thesis), AMENDMENT-16 (PocketBase backend)

---

## Context

The product thesis (AMENDMENT-11) is world-locked teacher + longitudinal student memory + teacher–student duet. The "teacher remembers you" sell only works if the memory follows the student across devices — practice on the phone, open the desktop, the teacher still knows where they left off.

The original AMENDMENT-11 on-device-only wording ("never uploaded," "no sync, cross-device is a later decision") conflicts with that sell. This ADR resolves the conflict for v1: sync is always on, but privacy is preserved by device-side encryption, not by keeping data local.

---

## Decision

### 1. Memory MUST follow the student across devices

Non-negotiable. Phone → desktop → memory present. If a student practices on one device and opens the app on another, the teacher's knowledge of them comes with them.

### 2. Sync is ALWAYS ON — no opt-in/off toggle

No sync switch in the UI. Reasoning: a toggle dumps a privacy/UX choice onto non-technical users who won't understand it and may leave it OFF, silently killing the feature's value. The personalized "teacher comes back — you struggled with this, let's redo it" *is* the product sell; losing it silently is a real failure mode.

### 3. Privacy by device-side encryption, NOT by locality

- The app encrypts the memory on-device.
- PocketBase stores ONLY ciphertext it cannot decrypt.
- Only the student's own devices hold the key.
- Server breach / subpoena / backup yields unreadable data.
- This honors AMENDMENT-11's redline *in spirit* (server never sees plaintext) while satisfying the cross-device requirement.

### 4. Recovery key — human-readable phrase, set up when adding a 2nd device

If a student loses their only device, the encrypted memory is gone (server can't read it, we can't recover it). Recovery is via a phrase:

- **Format:** human-readable 4–6 word phrase (not a 12-word seed).
- **When set up:** the first time the student adds a second device — not on first app open (no friction before they've seen value). If they never add a second device, the phrase is never needed; memory is local-only on their single device.
- **How it works:** the phrase is used to derive the on-device key. The phrase itself is never transmitted. When device #2 is added, the student enters the phrase, the app derives the same key, and the existing ciphertext decrypts.
- **Warning text at setup:** clear and plain — "write this down. we can't recover it for you. if you lose it, you lose your memory."
- **Device #1 only:** memory lives on device #1 until a second device is added. Adding device #2 is the moment the phrase is introduced and the encrypted blob is first pushed to PocketBase.

### 5. Mastery shape — label + 0–100 confidence

Each chord's state has two parts, both stored:

- **Label** — `mastered` / `needs_work` / `not_started`. Drives what the app *does* (rules, what gets served).
- **Confidence (0–100)** — numeric shade of how well the chord is known. Drives the teacher's *tone* ("solid" vs "shaky").

#### Label is a named bucket of confidence — no independent disagreement

The label and confidence cannot disagree — they come from the same source event, not two opinions:

- `mastered` → confidence ≥ 70 AND sustained (e.g. 3 separate confident strums classified by the listening engine).
- `needs_work` → confidence below threshold.
- `not_started` → no data yet.

#### Confidence dynamics for v1

- Confidence = the most recent measured value from the listening engine (a strum classified against a known chord).
- Gentle decay if no practice event touches that chord in N days (suggested: 30 days → drift toward "not sure" range).
- NOT a sophisticated rolling-average model for v1 — keep it simple. The practice engine's `fluencyStore` already has `decay()`; if confidence is the same concept, reuse it. If it's a different concept, say so explicitly.
- Why this matters: Rule 5 says the teacher cites stored numbers. If the number says "solid at 85" but the student hasn't played in 6 months, the teacher would be repeating a lie. The number must reflect *current* state, not *historical best*.

### 6. What is where (even at this rough level)

State this explicitly to prevent a future build from accidentally putting plaintext or the key on the server:

- **On-device (plaintext):** the per-chord label, the confidence number, the practice events, the per-pair fluency state. The key to decrypt is on the device.
- **On PocketBase (ciphertext only):** the encrypted blob — the same data, encrypted with the device key. The server stores unreadable bytes.
- **The key:** never leaves the device. Not in PocketBase. Not in any backend store.

### 7. Sync trigger — when data actually flows

"Always on" does not mean real-time per-strum sync for v1. Two-part model:

- **Push:** encrypted blob is pushed to PocketBase at session end (when the student finishes a lesson / performance).
- **Pull:** latest is pulled from PocketBase on app open.
- This feels "always on" to the student (open the app on a new device and the memory is there) without per-strum write load.

---

## Consequences

### Positive

- The "teacher remembers you" sell works across devices — the core product promise is real.
- Privacy is protected by encryption, not by telling non-technical users to manage a toggle they don't understand.
- Recovery path exists (phrase) if a device is lost, without introducing a 2-device requirement to use the feature at all.
- The ADR's "what is where" + "key never leaves device" blocks a whole class of future accidental data exposure.
- Sync model is simple (session-end push + app-open pull) — no real-time sync engineering for v1.

### Negative / trade-offs

- **Recovery phrase cuts both ways.** If the user loses the phrase, the memory is unrecoverable. We warn clearly, but users will lose it. This is the honest trade of device-side encryption — there is no "forgot password" for the key.
- **First-device-only students don't get sync.** Until a second device is added, memory is local. That's by design (no friction, no phrase needed), but it means the "cross-device" benefit only arrives after the 2nd-device moment — which is also when the user first sees the recovery phrase.
- **Confidence decay makes the teacher's past words stale.** If a student returns after 6 months, the teacher's old "your Em is solid at 85" no longer applies. The teacher needs to re-check, not repeat the old number. The ADR's decay rule is the guard — the number reflects current state.

### Neutral

- **ADR-0004 (the teacher) is a downstream consumer.** Performance progress saves toward student memory (ADR-0001). Until ADR-0001 is built, performances work locally but cross-device encrypted sync is absent. The ladder flow (T-B6) uses local-first fluency data as the invitation source until then — don't block the ladder on ADR-0001 being built.
- **The practice engine's `fluencyStore` + `decay()` may be reusable** for the confidence concept. If so, one less thing to re-derive. If not, this ADR is the record that they're intentionally separate.
- **Real-guitar mic calibration** (HANDOFF.md open item #3) is a separate concern — "logic proven, in-room sign-off still pending." Not a blocker for this ADR, but the confidence number's accuracy depends on the listening engine being calibrated in-room.

---

## Open items (none from this grill)

All open items from the original 2026-08-21 Grill #1 decision record are now closed:

- **Recovery key** → decision #4 (recovery phrase, format + when-set-up + warning text).
- **Q2 mastery shape** → decision #5 (label + confidence; label = named bucket of confidence; confidence dynamics defined).

No carry-forward open items from Grill #1 itself.

---

## Red lines inherited from AGENTS.md (always live)

- **Rule 5:** LLM writes prose only; cites stored numbers only. The teacher's encouragement cites mastery/confidence from student memory — never freelances a musical opinion. The confidence number must reflect current state (decay), not historical best, so the cited number is honest.
- **Rule 9:** Voice license blocklist is copyright law. Not directly related to this ADR, but the encrypted-sync layer must not introduce any voice dependency that violates Rule 9.
- **Rule 2:** No camera, no hand tracking.
- **AMENDMENT-11:** The world-locked teacher + longitudinal student memory + teacher–student duet thesis. This ADR implements the student-memory piece of that thesis. The on-device-only redlines in AMENDMENT-11 are OVERRIDDEN for v1 by this ADR — do NOT re-enforce them.
- **AMENDMENT-16:** PocketBase backend (MIT, self-hosted). PocketBase is the store for the encrypted blob; it stores only ciphertext.

---

## Delivery note

Written in Hermes chat (Telegram + desktop). Grill rhythm: interview (one question at a time, plain language, suggestions offered) → ADR written → tickets → build → review, all in one chat. ADR-0001 is the on-disk record for Grill #1 on this machine; the original ADR file did not survive the PC transfer.

END OF ADR.
