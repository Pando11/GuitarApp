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

### Live verification script (W6.1)

`test/real-call.smoke.mjs` runs the recipe above for real, plus a real
end-to-end round trip through `07-app/core/chatEngine.js`'s `askCoach()` (the
only place that fires `coach_served` telemetry) against the real HTTP server
started in-process. It is **not** picked up by `npm test` (that only globs
`test/*.test.js`), so it never runs in CI and never costs money unless
invoked explicitly:

```bash
cd server
npm run test:live
```

Requires a real, workspace-scoped `ANTHROPIC_API_KEY` in `.env`. If the key
is org-level rather than workspace-scoped and the org has more than one
workspace, every request — including this script's — fails with a real
`400 invalid_request_error`:

> This API key is not scoped to a workspace, so this request must include
> the anthropic-workspace-id header with the ID of the workspace to use.

Set `ANTHROPIC_WORKSPACE_ID` in `.env` (see `.env.example`) to resolve this;
the value comes from the Anthropic Console and is an owner action — no code
in this service can discover or guess it.

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

## Deployment — open decision for the owner (2026-09-09)

Today this process only runs on the owner's desktop (`npm start`, port
8787). GitHub Pages serves the static app only — it cannot run this
process, and nothing in this repo should try to make it. Until a host is
picked, the deployed app has no coach to call (see Agent 1's task on
`07-app/index.html` for how that failure is surfaced instead of silently
serving canned text).

This is a one-person decision, not a code decision — no host has been
signed up for and none should be until the owner picks one. The code needs
no changes to run on any of the three below: it's a plain `node:http`
process with one dependency, it already reads `PORT` from the environment
(`src/config.js:3`), and `npm start` is already the correct start command.

**Railway is off the table** — the owner has used it before elsewhere and
found it unreliable, independent of anything about this project. Ruled out
2026-09-10; not re-litigated below.

**Three options, cheapest owner-effort first:**

| Option | Cost/month | Owner setup | Notes |
|---|---|---|---|
| **Render** (web service) | Free (spins down after ~15 min idle, cold start ~30-50s on the next request) or **$7/mo** (Starter, always-on) | Connect the GitHub repo in Render's dashboard, set root directory to `server`, build command `npm install`, start command `npm start`. Paste env vars into Render's dashboard (never into a file that gets committed). Render assigns an HTTPS URL. | Free tier's cold start (~30-50s) is longer than `MODEL_TIMEOUT_MS` (6s) and `MODEL_TIMEOUT_QUESTION_MS` (12s) in `src/config.js` — the *first* request after idle would time out and silently fall back to template prose, which is exactly the failure mode this whole handoff is trying to eliminate. Only acceptable on the paid always-on tier, or if the owner accepts that a cold first-request always shows canned text. |
| **Google Cloud Run** | ~$5-10/mo with `min-instances=1` (or scale-to-zero for less, at the cost of the same cold-start trap as Render's free tier) | Write a small `Dockerfile` for `server/` (plain Node process, no framework-specific build step needed), `gcloud run deploy` from the `server` directory, set env vars with `--set-env-vars` or `--set-secrets` (the latter reads from Secret Manager — never a committed file). Cloud Run assigns an HTTPS URL. | Pinning `min-instances=1` removes the cold-start trap entirely rather than just shrinking it. More setup than a dashboard-only host (a Dockerfile + gcloud CLI), but a well-established, reliable platform. |
| **Fly.io** | Roughly $2-5/mo for the smallest always-on VM (usage-based, no flat free tier) | Install `flyctl`, run `fly launch` from `server/` (it detects Node and writes `fly.toml` — review before deploying), then `fly secrets set ANTHROPIC_API_KEY=... ANTHROPIC_WORKSPACE_ID=...`. Secrets are injected as env vars at runtime and never touch git. `fly deploy` after that. | More CLI-driven than Render; rewards the owner if they want an always-on box with no idle spin-down and want to avoid a web dashboard holding the key. Cheapest of the three. |

**How the key gets there without landing in git, for all three:** the key
is pasted once into that host's dashboard (or passed to a CLI command that
sends it straight to the host's API) as an environment variable — never
written into a file the repo tracks. `server/.env` is already listed in
the root `.gitignore` (`.gitignore:2` and the general `.env` rule at
`.gitignore:3`) and confirmed untracked (`git check-ignore -v server/.env`
resolves) — it must stay that way regardless of which host is picked.
`.env` (or the host's env var equivalent) is also where
`COACH_ALLOWED_ORIGINS` needs to be set once the app has a real deployed
origin (see `src/config.js:23-36`) — the default allow-list only covers
local dev ports, so the coach will reject every cross-origin call from a
GitHub Pages URL until that variable is set to match it exactly.

**`ANTHROPIC_WORKSPACE_ID` is currently blank** (`server/.env.example:13`).
This is independent of which host is chosen — it's an Anthropic Console
setting, not a hosting one. It only matters if the real `ANTHROPIC_API_KEY`
turns out to be org-level rather than workspace-scoped and the org has more
than one workspace; if so, every request (on any host) fails with the
`400 invalid_request_error` documented above under "Live verification
script." The owner won't know which case applies until a live call is made
with the real key on the new host — if it 400s with that specific message,
set `ANTHROPIC_WORKSPACE_ID` in that host's env vars (value from the
Anthropic Console) and redeploy. No action needed up front.

**Not recommended:** a self-managed VPS (e.g. a $4-6/mo droplet). It's the
cheapest raw compute but pushes TLS certificates, a reverse proxy, process
supervision (systemd), and OS security updates onto the owner — all three
options above handle that. Worth reconsidering only if the owner is already
running other services on a VPS and this would just be one more process on
a box they maintain anyway.

**Recommendation, if a single pick is wanted:** Google Cloud Run with
`min-instances=1`. It has no cold-start correctness trap (fixed outright,
not just shrunk like Render's paid tier avoids it by staying always-on) and
is a well-established, reliable platform — worth the extra Dockerfile/gcloud
setup step over a dashboard-only host. Fly.io is the cheapest option if the
owner would rather optimize for cost and doesn't mind the CLI-driven setup.
This is a suggestion, not a decision made on the owner's behalf — nothing
has been signed up for.
