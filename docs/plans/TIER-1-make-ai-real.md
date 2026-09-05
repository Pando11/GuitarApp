# TIER 1 — Make the AI claim true

**Do not start until `STATUS.md` marks Tier 0 SHIPPED.**

**Goal:** two students with different profiles and different playing get
demonstrably different lesson paths and different coaching words — and the app
has a reason to still be worth paying for in month six.

**Target:** 3–4 weeks. **Read `README.md` in this folder before dispatching.**

---

## The problem this tier solves

`07-app/core/chatEngine.js` is a template engine. Its header says
`Ban 5: ZERO network`. There is no model call anywhere in the codebase. The app
is a well-built deterministic lesson player, and the pitch is an AI tutor.

**The fix is narrow on purpose.** One model call, in one place, doing one job:
turning stored numbers into human coaching prose. Everything else stays
deterministic. This is exactly what the project's own **Rule 5** already
specifies — *"LLM prose-only, cites stored numbers."* The architecture was
designed for this and then the network was banned. Tier 1 lifts the ban for this
single path.

**Rule 5 is not relaxed.** The model receives facts and writes sentences. It
never decides whether a chord is mastered, never invents a drill, never picks
the next lesson. Those stay in code, testable, in `adaptivePlan.js`.

---

## Wave 1 — Three independent builds, dispatch together

### T1.1 — The coaching service (server side)
**Type:** `general-purpose` · **PLAN FIRST** (dispatch a `Plan` agent for the
API surface, then a `general-purpose` agent to build it)
**OWNS:** `server/**` (new), `server/package.json`, `server/.env.example`

A tiny Node service. It is the **only** thing in the system holding an API key.

- `POST /coach` — body is a **facts envelope**, never raw audio, never a
  transcript, never anything the student typed that wasn't sanitized:
  ```
  { learnerProfile: {ageBand, experience, goal, minutesPerDay},
    lessonId, stepId,
    mastery: [{chord, label, confidence}],
    justHappened: {drillId, passed, score, ratePerMin},
    recentHistory: [{lessonId, completedAt, confidenceDelta}] }
  ```
- Response: `{ prose: string }` — 2–3 sentences, second person, warm.
- **SDK:** `@anthropic-ai/sdk` (this is a JS project; do not use raw `fetch`).
- **Model:** `claude-opus-5`. Use `thinking: {type: "adaptive"}` and
  `output_config: {effort: "low"}` — this is short-form prose generation, not a
  reasoning task, and low effort is the right cost point. Set
  `max_tokens: 512`.
  *(If the owner later wants a cheaper tier, `claude-sonnet-5` at $2/$10 per MTok
  is the swap; that is the owner's call, not the agent's. Cost at Opus with a
  ~700-token cached prefix and ~120 output tokens is roughly $0.004 per coaching
  moment, so a 10-minute lesson with 4 moments costs about 1.6 cents.)*
- **Prompt caching:** the system prompt (voice rules, Rule 5 constraints, the
  Sage persona from `07-app/content/teachers/T1.json`) is stable — put it in
  `system` with `cache_control: {type: "ephemeral"}` and keep the volatile facts
  envelope in the user message, after the breakpoint. Verify with
  `usage.cache_read_input_tokens` being nonzero on the second request; if it is
  zero, something is varying in the prefix and you must find it.
- **Server-side guardrails, all of them tested:**
  - The facts envelope is validated against a schema before it reaches the model.
    Unknown fields are dropped, not forwarded.
  - The response is checked for any chord name or number **not present in the
    input envelope**. If it invented one, discard the prose and fall back to
    `chatEngine.js`'s existing template output. This is the machine-enforced
    version of Rule 5 and it is the most important test in this tier.
  - Rate limit per `anonId`. A stuck client must not be able to bill you.
  - Never echo the API key, never log the full envelope with the profile
    attached.
- **Latency budget:** if the call has not returned in 2.5 s, the client shows the
  template line instead. The student never waits on a network for coaching.

**Acceptance:** `npm test` in `server/` passes, covering: schema rejection of a
malformed envelope, the invented-chord fallback, the cache-hit assertion, the
rate limiter, and a timeout path. A live smoke call is run only if the owner has
supplied a key — if not, mock it and say so.

### T1.2 — Real adaptive planning
**Type:** `general-purpose` · **OWNS:** `07-app/core/adaptivePlan.js`,
`07-app/core/adaptivePlan.test.mjs` (new)

`adaptivePlan.js` is 1.5 KB and does not adapt. This is rules, not ML, and it is
enough to legitimately claim the app adjusts to the student.

Given the mastery map, the learner profile, and recent drill results, decide the
next unit:
- Any chord in the current lesson below a confidence floor → insert a targeted
  drill from the §5.2 menu **before** advancing. Never advance on a failed gate.
- Two consecutive clean passes on the lesson's gate → allow skipping the
  reinforcement lesson that follows.
- `minutesPerDay = 5` → the plan emits shorter units; `60+` → it may chain two.
- `experience = returning-player` → offer a placement skip to the first lesson
  containing a chord they have not proven, rather than starting at Lesson 1.
- Every decision returns a `reason` string naming the numbers it used. The
  coaching service consumes that reason; the UI can show it. **A plan you can't
  explain is a plan you can't debug.**

**Acceptance:** `node 07-app/core/adaptivePlan.test.mjs` passes with at least 12
cases, including: two different profiles fed identical play data produce
different next-units, and a struggling student is never advanced past a failed
gate.

### T1.3 — Learner-type copy variants
**Type:** `general-purpose` · **OWNS:** `07-app/content/lessons/*.json`
(lessons 01–05 only), `07-app/content/lessons/manifest.json`,
`05-content/VOICE-GUIDE.md`

Same skill, three registers. Lessons 1–5 only — enough to learn whether it
matters before writing 25 of them.

For each of L01–L05, add a `copyVariants` object beside the existing
`avatarCopy`, keyed `kid` (7–12), `adult-beginner`, `returning`. Vary the
*framing and pacing language*, never the musical facts, never the chord data,
never `qa_status`. A kid gets "park your middle finger here like it lives
there"; a returning player gets "you know this shape — check the thumb."

Extend `05-content/VOICE-GUIDE.md` with the three registers and two worked
before/after examples so future lessons are writable by anyone.

**Do not touch lessons 06–25.** Do not touch the `chords` block of any lesson —
those carry `qa_status: verified-by-theory-check` and are load-bearing.

**Acceptance:** `npm run test:fidelity` passes. Every L01–L05 file has all three
variants. A diff shows zero changes inside any `chords` object.

---

## Wave 2 — Wire-up, then the retention feature

### T1.4 — Client integration
**Type:** `general-purpose` · **OWNS:** `07-app/core/chatEngine.js`,
`07-app/core/sageCoach.js`, `07-app/core/lesson-runner.js`

- `chatEngine.js` gains a `coachClient` seam: try the service, fall back to the
  existing templates on timeout, error, rate limit, or guardrail rejection.
  **Keep every existing template path working** — they are now the fallback, and
  `chatEngine.test`/`sageCoach.test` must still pass unchanged.
- `lesson-runner.js` selects `copyVariants` by learner profile, defaulting to
  `adult-beginner` when the profile is absent or the variant is missing.
- `lesson-runner.js` asks `adaptivePlan` for the next unit instead of
  incrementing an index.
- Fire a `coach_served` telemetry event with `{source: 'model'|'template',
  latencyMs}` so you can measure how often the fallback fires. If it fires more
  than ~5% of the time in the friend test, the feature is not real yet.

**Acceptance:** `npm run test:all` passes. With the service unreachable, every
lesson still completes end to end — verify by running Playwright with the
service down.

### T1.5 — The reason to renew
**Type:** `general-purpose` · **PLAN FIRST** · **OWNS:** to be set by the lead
after the design choice below

A 25-lesson app ends, and a subscription that ends is a refund request. Pick
**exactly one** and build it:

- **(a) Weekly practice plan** — every Monday, generate this student's week from
  their weak pairs and available minutes. Cheapest to build, reuses everything
  in T1.2, produces a recurring reason to open the app. **Recommended.**
- **(b) A new song each week** — highest pull, but it is a content treadmill and
  a licensing problem (Rule 9). Do not choose this without a content plan.
- **(c) Scored mastery challenges** — the listening engine already produces the
  numbers. Good, but it's a leaderboard without other players.

The lead agent decides, writes the choice and the reasoning into `STATUS.md`,
sets the OWNS list, then dispatches. **Do not build two.**

---

## Exit Check — Tier 1 is SHIPPED when all are true

- [ ] Two seeded profiles (a 9-year-old never-held-one, a 40-year-old returning
      player) produce visibly different first sessions. Screenshot both.
- [ ] Coaching prose differs run to run and cites only real stored numbers — the
      invented-chord guardrail has been tried adversarially and holds.
- [ ] With the coaching service switched off, the app is still fully usable.
- [ ] `coach_served` telemetry shows model-source above 95% in normal use.
- [ ] The renewal feature from T1.5 works and a real person has used it twice.
- [ ] Measured cost per active student per month is written down in `STATUS.md`.
      If it is above ~$1.50 you have a margin problem before you have customers —
      lower `effort`, tighten `max_tokens`, or cut coaching moments per lesson.

---

## Standing warnings for this tier

- **No API key in the client. Ever.** If a task seems to need one, it is wrong.
- **The model writes sentences, not decisions.** The moment a chord's mastery
  label comes from the model instead of the listening engine, Rule 5 is broken
  and the app is guessing at a child's musical ability. Don't.
- Audio never leaves the device. The envelope carries derived numbers only.
- Under-13 profiles were flagged in T0.4. Before Tier 2 takes money from one,
  parental consent is a legal requirement, not a feature.
