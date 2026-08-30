Type: grilling + prototype
Status: resolved
Blocked by:

## Question

The student expresses what music they love — "songs that feel like campfires," "the stuff my grandmother played," "upbeat party music," or "nothing I can name, just pick something I'll like" — and the AI matches them to either (a) progressions/chords they already know and can play *today*, or (b) the smallest next step to unlock something they'd love.

Grill sub-questions (one at a time, in-chat):

1. How does the student express taste? A few buttons ("calm," "upbeat," "classic," "I don't know")? A short free-text? A "surprise me" option? How do we keep it simple for a non-technical user (including kids and older adults)?

2. What's the AI matching **against**? The 10-song progression catalog (AMENDMENT-12)? The chords the student has taught so far (cumulative through the 25-lesson curriculum)? Both — "here's a song you can play today" AND "here's the next song to work toward"?

3. Legal boundary: the AI proposes; the app only serves what's on the approved track or what the student has already unlocked. No riffs, melodies, lyrics, tabs (AMENDMENT-12/14). Band names = trademarks, nominative use + "not affiliated / not endorsed" disclaimer on the select card. House of the Rising Sun is public domain and unrestricted — is that the model for any AI-found song, or do we only surface approved-track songs?

4. Does the discovery feed the **existing** 10-song track, or extend it? (If it extends it, that's new content + the song-progression gate `verify-song-progressions.js` + a new public-domain song or an original progression. If it only surfaces the existing track by taste, it's a reorder + personalization layer on existing content.)

5. Prototype: a rough take of the taste-input → match output, so the owner can react to how it feels.

**Dependencies:** Independent of 02 (the agent). Can flow in-chat in parallel with 02, 05, 07.

---

## Answer

**Q1 — How does the student express taste? (LOCKED)**
Voice-primary, buttons as fallback. The student tells Sage what they like in their own words ("I like campfire songs," "nothing I can name, just surprise me") — spoken, because the app is voice-first. Buttons for "calm / upbeat / classic / I don't know" as a fallback for anyone who prefers tapping. "Surprise me" either spoken or tapped. No free-text typing. Keeps it simple for kids and older adults and uses the voice app's actual strength.

**Q2 — What's the AI matching against? (LOCKED)**
Both. The 10-song progression catalog (AMENDMENT-12) AND the chords the student has taught so far (cumulative through the 25-lesson curriculum). Two lanes: "play today" (songs whose chords you already have) and "next step" (the smallest unlock toward something you'd love). Matching only the catalog would suggest songs they can't touch yet; matching only what they have would miss the pull. Together they give both.

**Q3 — Legal boundary (LOCKED)**
AI stays inside the approved 10-song track. Surfaces chord progressions + song titles only (no riffs/melodies/lyrics/tabs, per AMENDMENT-12/14). Band names = trademarks, nominative use + "not affiliated / not endorsed" disclaimer on the select card. If a taste match lands outside the track, the AI says "that's not in your lessons yet, but here's the closest one you *can* play" — pointing back to the track. Public-domain or original content beyond what's there is a later content-creation step, not a discovery judgment call. Keeps the legal boundary clean.

**Q4 — Feed existing track or extend? (LOCKED)**
Feed the existing 10-song track for now — reorder + personalization layer. Extend later when there's more legally-cleared content and the repo is back on the new Mini PC. Note: since ticket 10 flagged the song-progression content dir as absent on this machine, "feed the existing track" pulls against the repo-restore from the thumb drive — once the full catalog is back on the new Mini PC, discovery has a real track to work with. More-content-later (public-domain + original songs, legally cleared) becomes a fresh ticket after restore.

**Q5 — Prototype (RESOLVED 2026-08-26)**

Built a throwaway prototype: `06-prototypes/song-discovery-q5-prototype.html` — a single HTML file you can open offline by double-clicking. Voice-primary (type a phrase standing in for talking to Sage) with button backup (calm / upbeat / classic / surprise me). Two lanes shown against the real 10-song catalog: "Play today" (songs whose chords you already have) and "Next step" (smallest unlock toward something you'd love). Each match carries a short "why Sage picked this" note — which feel-words it matched and, for next-step, which chords you're still missing.

Verified logic straight from `progressions.json` + `chord-prereqs.json` on disk. At the default demo state (student at lesson 10, four chords: Em, easyC, G, D):
- "Surprise me" → play-today: Sweet Home Alabama, Amazing Grace (public domain), Zombie, Nothing Else Matters (ranked by difficulty, smallest step first); next step: Highway to Hell (unlocks next lesson), then Californication, Stairway to Heaven, House of the Rising Sun (smallest unlock first).
- "Calm" → play-today: Amazing Grace (3 tags), Nothing Else Matters (2); next step: Wish You Were Here (4 tags — gentle, spacious, brushed strums), Stairway to Heaven, House of the Rising Sun.
- "Upbeat" → play-today returns NO real taste match (the driving/heavy songs all need A, E, or A7, which aren't taught yet at lesson 10) — surfaces the closest available by difficulty instead (Sweet Home Alabama first); next step: Highway to Hell, Back In Black, Johnny B. Goode. This is the honest-empty feel the two-lane design is meant to surface.
- "Classic" → play-today: Amazing Grace (3 tags — traditional, hymn), then the rest; next step: House of the Rising Sun (3 tags — traditional, public domain, folk).

Owner reacted: "it looks great" (2026-08-26). Prototype is throwaway — the validated decision to carry forward is the two-lane feel + per-match "why" note, not the file itself. The real build will swap the typed-phrase input for actual voice (Chatterbox + on-device speech recognition when that's in the stack) and will read the student's real taught-chord set from PocketBase memory instead of the lesson-select dropdown.

**Prototype:** `06-prototypes/song-discovery-q5-prototype.html` (throwaway). Validated decision: taste → two-lane match (play today / next step) with a per-match "why" note; voice-primary, buttons as backup; stays inside the 10-song track with the not-affiliated disclaimer; public-domain songs flagged.
