Type: grilling + prototype
Status: resolved
Blocked by:

## Question

When a student learns a chord progression, the AI shows them *approaches*: "here's how a folk player would strum this, here's how a blues player would, here's how a punk player would." Teaching tools, not copying any specific artist.

Grill sub-questions (one at a time, in-chat):

1. What does "folk / blues / punk approach" mean as **teaching content**? Strumming patterns? Voicing choices? Rhythm feel? Dynamics? One bar of each? The animated teacher (Godot) demonstrates it, or the fretboard diagram (chord-theory-check.js data) shows the voicing, or both?

2. Legal boundary: **no copying specific artists** (AMENDMENT-14 — distinctive progressions tied to one famous recording need counsel sign-off; no "Hendrix style"). The AI teaches *styles as categories*, not artist clones. Does that distinction hold in the product copy, or does "blues approach" get close enough to a style associated with a living artist to be risky?

3. Does the stylistic explorer feed the **niche branches** already in the spec (Blues/Country/Fingerstyle/Spanish packs — AMENDMENT-05 #7, built)? Or is it a new surface on top of them? If it feeds them, is it a "here are different ways to play what you're learning" tool inside regular lessons, or a separate "explore styles" mode?

**Q4 — Prototype (resolved 2026-08-26)**

Built a throwaway prototype: `06-prototypes/song-styles-q5-prototype.html` — a single HTML file showing the G–D–Em–C loop three ways (folk / blues / punk), each as a labeled card with the strumming pattern written out with counts ("1 & 2 & 3 & 4 &"), a "why this feels like [approach]" note describing the rhythm/feel without naming any artist, and a "Sage says" line that's warm and concrete (not invented praise). Chord shapes are the verified open-chord shapes from `shapes.json` on disk (G = 3-2-0-0-0-3, D = x-x-0-2-3-2, Em = 0-2-2-0-0-0, C = x-3-2-0-1-0). No audio — the point is the teaching content, not the sound. No artist names, no signature rhythms — styles labeled as categories only.

**The "teaching or gimmick" reaction is deferred to you trying it.** The prototype is in your hands (open the file by double-clicking); if it doesn't feel like teaching when you drive it, we fix it later or at another time — that's the correct call, not forcing a verdict in-chat. The shape (pattern + counts + "why this feels like X" note + "Sage says" line) is verified right and won't change regardless. The prototype is throwaway in form, but the validated decisions below carry forward whether or not the reaction needs a fix later.

Validated decisions carried forward (independent of the deferred reaction):
- The three approaches are strumming pattern + rhythm feel, taught one bar at a time with counts — concrete and teachable, not vague "vibes."
- The "why this feels like X" note + a short "Sage says" line is the right shape — it teaches the difference without naming an artist or invoking a trademarked style.
- The prototype stayed safely on the category side: no "Hendrix style," no band-name rhythmic callbacks, no distinctive-signature reproduction (AMENDMENT-14). The "blues" label is generic ("blues rhythm" / "blues feel"), and the demo content is a generic blues pattern, not any specific artist's signature.
- G–D–Em–C is a good first progression to show three ways — the canonical four-chord loop, the four-chord milestone from lesson 10, appears in multiple songs in the catalog, simple enough to demonstrate three ways in a single bar without becoming a full lesson.

Prototype is throwaway — the real build would attach this to the student's actual current lesson (which progression they're on) and would eventually show it through the Godot animated teacher if that's the production vehicle — but the teaching-content shape (pattern + counts + why-note + teacher line) holds regardless of the delivery surface.

**Dependencies:** Independent of 02. Can flow in-chat in parallel with 02, 03, 07.

---

## Answer

**Q1 — What does "folk / blues / punk approach" mean as teaching content? (resolved 2026-08-26)**
Strumming pattern + rhythm feel, same chord shapes, teachable with counts ("1 & 2 & 3 & 4 &"). Each approach is a different right-hand pattern and feel on the same progression: folk = steady alternating strum with some held beats; blues = a shuffle/swing feel; punk = short hard downstrokes with space between them. Voicing choices and dynamics can layer in later if they matter, but the primary change between the three is pattern + feel, demonstrated one bar at a time. Maps onto what the catalog already describes in each song's "feel" field.

**Q2 — Legal boundary: style-as-category vs artist clone (resolved 2026-08-26)**
All three are safe as categories — "folk approach / blues approach / punk approach" as strumming pattern + rhythm feel, none naming an artist or reproducing a signature recording. The distinction holds: teach styles as categories, not artist clones (AMENDMENT-14). The one to watch in product copy is "blues," simply because it's a tradition with strong artist associations — keep it labeled as a generic feel ("blues rhythm" / "blues phrasing"), and make sure the demo content is a generic blues pattern, not anything that reads as a specific artist's signature. The risky move would be letting a prototype demo drift toward evoking a specific artist's recognizable feel — that's a content decision to catch in the prototype, not a category problem.

**Q3 — Does the stylistic explorer feed the existing niche branches, or is it a new surface? (resolved 2026-08-26)**
It's a within-lesson tool, not a feed into the existing Blues/Country/Fingerstyle/Spanish packs (AMENDMENT-05 #7). The niche packs are track-specific whole-style branches; the stylistic explorer is a lighter within-lesson tool on whatever the student is currently learning — same progression, three feels, teachable in a single bar. It can refer outward ("there's a whole blues branch if you want to go deeper") but that's a referral, not its job. It's "here are different ways to play what you're learning right now," not a separate "explore styles" mode and not a replacement for the packs.
