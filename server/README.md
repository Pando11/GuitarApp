# Coaching service (T1.1)

A tiny Node HTTP service (`node:http`, no framework) that is the **only**
process in the system holding `ANTHROPIC_API_KEY`. It turns a validated
"facts envelope" (learner profile, mastery numbers, drill results — never
audio, never a raw transcript) into 2-3 sentences of coaching prose.

Rule 5 is machine-enforced here: the model may only write prose, never
decide a fact. Every response is checked for chords or numbers not present
in the input envelope (`src/guardrail.js`); if the model invents one, the
prose is discarded and a template fallback (`src/templateFallback.js`) is
served instead — the caller always gets `{prose, source}` back with a 200.

## Run it

```bash
cd server
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY
npm start
```

Without `ANTHROPIC_API_KEY` set, the service still starts and responds —
every `/coach` call just falls back to template prose (`source: "template"`)
since there's no key to call the model with. A warning is logged at start.

## Test it

```bash
cd server
npm test
# equivalently, from the repo root: node --test server/test/
```

33 tests across schema validation, the guardrail, the rate limiter, the
model client (mocked SDK), and the HTTP handler (integration-style, mocked
model client). No test makes a real network call unless `ANTHROPIC_API_KEY`
is set in the environment when the modelClient tests run — none currently
do, since no key was available while building this; if you add a live smoke
test later, gate it behind `if (process.env.ANTHROPIC_API_KEY)`.

### Verifying prompt caching against the real API

The bundled tests mock the Anthropic SDK client and only assert that the
`system` array sent to `messages.create` is byte-identical across two
successive calls (`test/modelClient.test.js`) — that's the precondition for
a cache hit, but it can't prove the server actually cached anything. To
confirm a real cache hit, with a real key set:

```js
import Anthropic from '@anthropic-ai/sdk';
import { callCoach } from './src/modelClient.js';

const client = new Anthropic();
const envelope = { /* a valid facts envelope */ };
await callCoach(envelope, { client }); // first call: cache miss, writes the cache
const second = await callCoach(envelope, { client });
console.log(second.usage.cache_read_input_tokens); // should be > 0
```

## Try it with curl

```bash
curl -s http://localhost:8787/healthz

curl -s http://localhost:8787/coach \
  -H 'Content-Type: application/json' \
  -d '{
    "anonId": "anon-abc123",
    "learnerProfile": {"ageBand": "18-34", "experience": "never-held-one", "goal": "play campfire songs", "minutesPerDay": 15},
    "lessonId": "L01",
    "mastery": [{"chord": "G", "label": "needs_work", "confidence": 40}]
  }'
```

## API

### `GET /healthz`
Cheap reachability check, no model call. Always `200 {ok: true}`.

### `POST /coach`
Body: a facts envelope (see `src/schema.js` for the exact shape and enums).
Always returns `200 {prose, source: 'model' | 'template'}` on a
well-formed, non-rate-limited request — even on a model timeout or a
guardrail rejection, so the client never has to branch on error vs success.

Non-200 responses:
- `400 {error: 'invalid_json'}` — body isn't valid JSON, or wasn't an object.
- `400 {error: 'schema_validation', details: [...]}` — envelope failed validation.
- `413 {error: 'payload_too_large'}` — body exceeded 16 KB.
- `429 {error: 'rate_limited', retryAfterMs}` — per-`anonId` rate limit hit
  (default 10 requests/min, configurable via `COACH_RATE_LIMIT_PER_MIN` — the
  tier doc doesn't specify a number, this default was chosen for this build).
- `404 {error: 'not_found'}` — anything else.

## Notable implementation decisions

- **`anonId` is a required top-level field**, added beyond the tier doc's
  sample facts-envelope body — it's required for per-`anonId` rate limiting,
  which the tier doc explicitly asks for ("Rate limit per `anonId`").
- **`mastery[].confidence` is validated as 0-100**, per `CONTEXT.md` and
  `docs/adr/0001-always-on-encrypted-sync.md` ("Confidence (0–100)"). Note:
  `07-app/core/adaptivePlan.js`'s `CONFIDENCE_FLOOR` comment describes
  confidence on a 0..1 scale, which conflicts with `CONTEXT.md`/the ADR.
  This server follows `CONTEXT.md` as the glossary of record. **This
  discrepancy needs reconciling with T1.2 before T1.4 wires the two
  together** — if `adaptivePlan.js` is genuinely on a 0..1 scale, either it
  or this schema needs to change, or T1.4's integration layer needs to
  convert between them explicitly.
- **`learnerProfile.minutesPerDay` is validated against the literal enum
  `[5, 15, 30, 60]`**, taken from `07-app/core/learnerProfile.js`'s
  `PROFILE_SCHEMA`. The tier doc's prose says "60+" informally; the app's
  own schema has no "60+" value, just the number `60`.
- **`mastery[].label` enum is `mastered` / `needs_work` / `not_started`**,
  from `CONTEXT.md` and the ADR — not invented.
- **`justHappened`/`recentHistory` are optional and default to `null`/`[]`**,
  because `drill_result` telemetry doesn't fire anywhere in the current app
  yet (see `docs/plans/STATUS.md`'s Tier 1 handoff notes) — most real
  traffic will omit them. The prompt builder (`buildUserMessage` in
  `src/modelClient.js`) omits those sections from the text sent to the model
  entirely when absent, rather than sending a literal "null".
- **The fallback template generator (`src/templateFallback.js`) is a
  separate, standalone implementation**, not an import from
  `07-app/core/chatEngine.js`. The tone/register is modeled on chatEngine's
  Sage (T1) persona, but the code isn't shared — the server is deployed
  independently from the static client bundle, and this repo has no build
  step that could safely share code across that boundary without risking
  the API key ending up somewhere client-adjacent.
- **Deployment**: this server needs to run somewhere with a persistent
  process (it is not static content) — see `docs/plans/STATUS.md`'s Tier 1
  handoff notes; this wasn't solved by Tier 0's GitHub Pages static deploy
  and remains an open decision for whoever wires up T1.4/deployment.
