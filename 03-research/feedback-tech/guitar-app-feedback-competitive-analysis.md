# Guitar Learning Apps: Recording + Feedback Competitive Analysis

**Core question:** does anyone offer *asynchronous recorded-performance review with detailed feedback, including video of hand position*?

**Short answer:** Yes — but only two categories, and neither does it well at scale.
1. **Human video-exchange platforms** (Pickup Music, ArtistWorks, TrueFire, Guitar Tricks) — real video, real hands, but slow (~1 week), rationed (1 per grade), and expensive.
2. **AI video analysis** — essentially *one shipped product*: **Pickup Music's "AI analysis"** (launched ~late 2025), which admits in its own docs that it "can make mistakes" and is "generally more accurate for beginners."

Everything else in the mass market (Yousician, Fender, Simply, Gibson, Melodics) is **real-time, audio-only, pitch/timing scoring** — it cannot see your hands, and its accuracy is the single most-complained-about thing in the category.

---

## 1. Per-app breakdown

### Real-time, audio-only scorers (the mass market)

| App | Feedback type | Audio/Video | AI or human | Price | Documented accuracy complaints |
|---|---|---|---|---|---|
| **Yousician** | Real-time note/chord/timing scoring + post-song score screen | Audio only (mic or cable) | AI/DSP | $7.49–$13.33/mo (annual-equivalent); ~$14.99–$29.99 monthly ([plans](https://account.yousician.com/plans), [Guitar Chalk](https://www.guitarchalk.com/yousician-cost/)) | Heavy. "Yousician keeps telling me I'm getting notes wrong when I'm playing them" ([r/yousician](https://www.reddit.com/r/yousician/comments/m15dcq/)); staff themselves concede mic pickup is imperfect: "biggest problem for note detection is the sound from phone's speaker… that's never perfect" ([r/yousician](https://www.reddit.com/r/yousician/comments/tzjuwo/)); ([r/guitarlessons "Yousician is dogshit"](https://www.reddit.com/r/guitarlessons/comments/1bmmf3f/)) |
| **Fender Play – Feedback Mode (beta)** | Real-time listening while you play along to scrolling tab; summary at end | Audio only | AI — third-party engine **MatchMySound**, not in-house ([TheGuitarLesson](https://www.theguitarlesson.com/fender-play-review/)) | $12.50/mo ([Fender](https://www.fender.com/pages/fender-play)) | Still labelled **beta** by Fender itself ([support doc](https://play-support.fender.com/hc/en-us/articles/44538998312603-What-is-Feedback-Mode)); requires headphones/tuner setup so the mic doesn't hear the backing track |
| **Simply Guitar (Simply/JoyTunes)** | Real-time chord/note detection, pass/fail | Audio only | AI | ~$120/yr, ~$240/2yr | **Worst-documented in category.** Guitar.com review: "its chord detection is simply not really functional… you can play the wrong chord, drop your guitar, have a bin lorry go past the window" and it registered a cough as an Fmaj7 ([guitar.com review](https://guitar.com/reviews/accessories/simply-guitar-review/)). Reddit: rhythm barely assessed — "you can play an entire song crappily and still pass" ([r/guitarlessons](https://www.reddit.com/r/guitarlessons/comments/1fmpgid/)); ([DO NOT GET SIMPLY GUITAR](https://www.reddit.com/r/guitarlessons/comments/17k1p0c/)) |
| **Gibson App** | Real-time pitch/timing + **AI "performance report" after 5 lessons/day**; tracks ~270 discrete skills | Audio only | AI | $19.99/mo or $129.99/yr ([gibson.app](https://www.gibson.app/best-guitar-app)) | Closest thing to *post-hoc AI coaching* in the mass tier — but derived from real-time audio scoring, no video, no hand analysis. Note their comparison page is self-published marketing. |
| **Melodics** | Real-time accuracy display + post-performance breakdown of timing/accuracy | Audio/MIDI only | AI | ~$29.99/mo, ~$149.88/yr ([Melodics how-it-works](https://melodics.com/how-it-works)) | Strong on timing/dynamics for MIDI instruments; guitar is the weakest module (audio pitch detection vs. MIDI's exactness) |
| **JustinGuitar app** | Song player + **Practice Assistant** (tells you *what* to practice, not how well you played) | Audio (song play-along) | Rules/AI-lite | ~$50/yr tier; core courses free ([justinguitar.com](https://www.justinguitar.com/guitar-lessons/how-to-use-justin-s-song-app-b1-115)) | No real critique layer at all — its own community frames the app as convenience over the free site ([community thread](https://community.justinguitar.com/t/is-the-app-worth-the-expense/76972)) |
| **Ultimate Guitar / Uberchord** | UG = tabs + play-along; Uberchord = chord recognition trainer, largely stagnant | Audio only | AI | UG Pro ~$40/yr | No performance critique. Uberchord is a chord-detector demo, not a coach ([uberchord.com](https://www.uberchord.com/)) |
| **Tonaly** | Songwriting/theory/practice tool (circle of fifths, progressions) | N/A | N/A | one-off/low sub ([tonaly.app](https://tonaly.app/)) | **Not a feedback product at all** |
| **ChordAI / Moises** | Audio *analysis of recordings* (chord detection, stem separation, tempo) | Audio only | AI | Moises ~$4–$10/mo | Adjacent tech, **zero pedagogy** — they tell you what's in a track, never how well *you* played it ([Moises](https://www.youtube.com/watch?v=kZiUY2s_ahw)) |

### Asynchronous "record yourself → get a critique" (the real comparables)

| Platform | Feedback type | Audio/Video | AI or human | Price | Friction / complaints |
|---|---|---|---|---|---|
| **Pickup Music** | (a) **1:1 video feedback**: submit a performance video at end of each Learning Pathway grade, coach returns a personalized *video* critique; (b) **AI analysis**: upload <2min video, get strengths / areas to improve / practice plan with lesson links | **Video — both hands framed** | Both human coaches and AI | $29.99/mo or $179.99/yr ([TrueFire comparison](https://go.truefire.com/truefire-vs-pickup-music)) | **Rationed: one submission per grade**; extra submissions ignored. ~1 week turnaround ([1:1 feedback doc](https://help.pickupmusic.com/en/articles/10514040-how-1-1-feedback-works)). AI tier self-disclaims: "can make mistakes… generally more accurate for beginners than for advanced players" ([AI analysis doc](https://help.pickupmusic.com/en/articles/13225355-ai-analysis-coaching)). Reddit: "$30 a month is too steep" ([r/guitarlessons](https://www.reddit.com/r/guitarlessons/comments/1qjfizb/opinions_on_pickup_music/)) |
| **ArtistWorks** | **Video Exchange** — submit video, master-level artist records a video reply, published to a searchable library of past exchanges | Video | Human (name artists) | ~$25–35/mo tiers; users report billing surprises ([TDPRI thread](https://www.tdpri.com/threads/artist-works.1098971/)) | Turnaround is a known uncertainty ([r/classicalguitar](https://www.reddit.com/r/classicalguitar/comments/1q63ep8/)). Best-in-class *quality*, worst *latency* |
| **TrueFire** | Private video exchange with instructor; optional graded assignments in "All Access Backstage" | Video | Human | **$39 per exchange / per month of private lessons — paid on top of subscription** ([TrueFire private lessons](https://truefire.com/private-lessons/trey-alexander/p4099), [TheGuitarLesson](https://www.theguitarlesson.com/truefire-reviewed/)) | Cost-per-critique is the blocker; assignments are "optional, encouraged" so most users never submit |
| **Guitar Tricks** | Video exchange included in All Access membership | Video | Human | ~$20/mo — **exchange included**, unlike TrueFire ([TheGuitarLesson](https://www.theguitarlesson.com/guitar-lesson-blog/guitar-lesson-review/guitartricks-review/)) | Instructor bandwidth-limited; "video exchanges can take a while" ([Guitar Player](https://www.guitarplayer.com/gear/best-online-guitar-lessons)) |

---

## 2. The structural pattern

- **Nobody bridges the two halves.** Cheap = real-time, audio-only, inaccurate, no hands. Good = human, video, slow, rationed, $30+/mo.
- **Video is the untouched signal.** Every mass-market app throws away the camera. Yet the beginner's real failures — thumb over the neck, collapsed wrist, fretting too far from the fret, right-hand anchoring, barre-chord finger angle — are **invisible to audio** and are exactly what a human teacher fixes in the first 10 minutes.
- **Audio accuracy is the category's reputational wound.** Guitar.com's Simply Guitar teardown and the Yousician subreddit are a permanent supply of "the app told me I was wrong when I wasn't." Any new entrant that *fails silently* on detection inherits that distrust.
- **Async is the honest format.** Real-time scoring forces low-latency, single-note-window decisions — that's *why* it's inaccurate. Post-hoc analysis of a finished 60-second take can use the whole recording, both audio and video, and multiple passes. **Latency is the constraint the incumbents chose; dropping it is a technical advantage, not a compromise.**
- **Pickup Music has validated demand and left the flank open**: they gate 1:1 to one submission per grade and disclaim their AI. They proved people will film themselves; they haven't made it unlimited, fast, or trustworthy.

---

## 3. Ranked positioning gaps a new app could own

1. **Unlimited, same-day AI critique of recorded video — including hand/posture analysis.** The single biggest hole. Pickup rations to 1/grade and takes a week; everyone else has no video at all. Own: "film 60 seconds, get a coach-grade written + annotated critique in 2 minutes, as many times as you want."
2. **Hand-position / technique feedback as the *headline* feature, not audio scoring.** Pose estimation on fretting and picking hands: thumb position, wrist angle, finger-to-fret distance, anchoring, barre pressure, pick angle. No mainstream app touches this. It is also *defensibly hard* and directly maps to what beginners quit over.
3. **Radical honesty about confidence.** Show *why* the app judged something, with a timeline of the recording, and say "I'm not sure" instead of a false red X. This directly attacks the #1 documented complaint across Yousician/Simply/Fender. Cheap to build, huge trust moat.
4. **The "$30/mo human coach" price gap.** Human video exchange is $20–39/mo *plus* per-exchange fees. A $9–12/mo unlimited AI-video-critique tier undercuts every async competitor while offering *more* volume.
5. **Progress over time from the recordings themselves.** Nobody keeps a longitudinal video record and says "your wrist angle improved 30° since March." Incumbents track streaks and XP; a recording archive is a far stickier retention asset — and it makes churn painful.
6. **Hybrid escalation: AI first, human on demand.** AI critiques everything free-flow; pay per human review when you want it. Pickup separates these into different products; merging them (AI triages, human confirms) fixes both the latency problem and the trust problem.
7. **Bring-your-own-song / bring-your-own-lesson critique.** Every incumbent only grades content inside its own walled curriculum. Letting a user record *anything* — a JustinGuitar lesson, a YouTube cover, their band's part — removes the biggest reason people bounce off apps.
8. **Teacher-facing tooling.** Private teachers currently review student phone videos over text with zero tooling. A B2B2C layer (student submits, AI pre-annotates, teacher approves/edits in 3 minutes) makes human feedback 10x cheaper and gives you a distribution channel incumbents can't copy without cannibalising their own subscriptions.

**Sharpest single positioning statement:** *"Every other guitar app listens. Ours watches."*
