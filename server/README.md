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
  process (it is not static content) — Tier 0's GitHub Pages static deploy
  cannot run it. Host decided 2026-09-10: Render, paid tier — see the
  "Deployment — Render" section below for the full setup.

## Deployment — Render (chosen 2026-09-10, paid tier)

Today this process only runs on the owner's desktop (`npm start`, port
8787). GitHub Pages serves the static app only — it cannot run this
process, and nothing in this repo should try to make it. Until the Render
service exists and its URL is set as the `COACH_URL` repository variable
(see `.github/workflows/deploy-pages.yml`), the deployed app has no coach
to call — surfaced as an on-screen banner, not silently served canned text.

**Decision, locked (`docs/plans/TIER-1B-close-the-gaps.md`, decision 3):
Render, paid "Starter" tier (~$7/mo), always-on.** Railway is off the
table (owner used it before elsewhere, found it unreliable — unrelated to
this project). Google Cloud Run and Fly.io were both considered and are
kept in the comparison table below for context/history only — they are not
live options for this build.

No Dockerfile is needed and no code changes were required to deploy: this
is a plain `node:http` process with two dependencies (`@anthropic-ai/sdk`,
`dotenv`), it already reads `PORT` from the environment the way Render
injects it (`src/config.js:3` — Render sets its own `PORT`, default
`10000`, and this app listens on whatever `PORT` it's given), and
`npm start` is already the correct, and now correctly self-sufficient,
start command (see "Local dev: `.env` is now loaded automatically" below).
Verified against Render's own docs before writing `render.yaml` (below):
Render's native Node runtime runs `buildCommand`/`startCommand` directly,
with no Dockerfile required for a non-containerized Node service.

### `render.yaml`

`server/render.yaml` is a Render Blueprint — infrastructure-as-code for
this one web service, sourced from the `server/` subdirectory of this
monorepo (via `rootDir: server`), so Render ignores the rest of the repo
when building/starting it. It declares `buildCommand: npm install`,
`startCommand: npm start`, `plan: starter`, and a health check at
`/healthz`. Secret-shaped env vars (`ANTHROPIC_API_KEY`,
`ANTHROPIC_WORKSPACE_ID`, `COACH_ALLOWED_ORIGINS`) are declared with
`sync: false`, which makes Render prompt for a value during setup rather
than storing or guessing one — no real value is ever committed to this
file.

**Render's Blueprint feature looks for `render.yaml` at the repo root by
default.** Since this one deliberately lives at `server/render.yaml`
instead (to keep it colocated with the service it deploys, per this task's
file-ownership rule), the owner must set the Blueprint's YAML path to
`server/render.yaml` in Render's "New Blueprint" setup screen — the exact
field for this is on Render's own repo-connection step, not something this
repo can set on the owner's behalf. If that field is confusing or missing
in the dashboard flow encountered, skip the Blueprint entirely and use the
manual "New Web Service" steps below instead — they configure the exact
same settings by hand and are equally valid; `render.yaml` is a convenience
for repeatable/versioned config, not a requirement.

### Owner steps (do these yourself — no code changes needed either way)

1. **Create a Render account** at render.com (or sign in) and connect it to
   the GitHub account that owns this repo.
2. **Create the service.** Either:
   - **Blueprint route:** Dashboard -> "New +" -> "Blueprint" -> select this
     repo -> set the Blueprint YAML path to `server/render.yaml` -> Render
     reads the file and shows the one `guitarapp-coach` service it
     describes, prompting for the `sync: false` env vars (next step) before
     creating it. **or**
   - **Manual route:** Dashboard -> "New +" -> "Web Service" -> select this
     repo -> set **Root Directory** to `server`, **Runtime** to `Node`,
     **Build Command** to `npm install`, **Start Command** to `npm start`,
     **Plan** to `Starter` (~$7/mo, always-on — required; the free tier's
     ~30-50s cold start after idle is longer than `MODEL_TIMEOUT_MS`
     (6s)/`MODEL_TIMEOUT_QUESTION_MS` (12s) in `src/config.js`, so the first
     request after idle would time out and silently fall back to template
     prose — exactly the failure mode this deploy exists to eliminate).
3. **Set environment variables** in the service's Environment tab (or the
   Blueprint's setup prompts): `ANTHROPIC_API_KEY` (the real key — never
   commit it), `ANTHROPIC_WORKSPACE_ID` (leave blank unless/until the
   400 described below under "ANTHROPIC_WORKSPACE_ID" happens),
   `COACH_ALLOWED_ORIGINS` (the deployed app's real origin, e.g. the GitHub
   Pages URL — comma-separated if more than one; see `src/config.js:23-36`,
   whose default allow-list only covers local dev ports and will reject
   every real cross-origin call otherwise). Do **not** set `PORT` — Render
   assigns it automatically and this app already reads it correctly.
4. **Deploy** (the Blueprint route deploys on creation; the manual route has
   a "Create Web Service" button that triggers the first deploy). Watch the
   build/deploy logs in the Render dashboard for the
   `coach service listening on port <N>` line from `logger.info` in
   `src/index.js`.
5. **Get the resulting public URL** from the top of the service's Render
   dashboard page (shape: `https://<service-name>.onrender.com`, e.g.
   `https://guitarapp-coach.onrender.com`). Hand this URL back so it can be
   set as the `COACH_URL` GitHub Actions repository variable (Settings ->
   Secrets and variables -> Actions -> Variables), with `/coach` appended
   (e.g. `https://guitarapp-coach.onrender.com/coach`) — see the comment at
   the top of `.github/workflows/deploy-pages.yml` for exactly how that
   variable gets substituted into the deployed static app.
6. **Verify** by curling `https://<the-url>/healthz` (expect
   `{"ok":true}`) and then a real `/coach` call (same body shape as "Try it
   with curl" above) — confirm the response has `"source":"model"`, not
   `"source":"template"`. If it 400s with an
   `anthropic-workspace-id` message, see the `ANTHROPIC_WORKSPACE_ID`
   paragraph below.

### Local dev: `.env` is now loaded automatically

Previously `src/index.js` read `process.env` directly with nothing loading
`server/.env` into it, so `npm start` alone silently served template prose
even with a real key sitting in `.env` (the key was never in scope for that
process). Fixed 2026-09-10: `dotenv` is now a real dependency
(`package.json`) and `src/index.js`'s very first import is `'dotenv/config'`
— it must run before `config.js`'s import populates `PORT`/
`ANTHROPIC_API_KEY`/etc. from `process.env`, so ordering matters (see the
comment in `index.js`). `npm start` alone, no flags, now reaches a real
model call whenever `server/.env` has a real key. dotenv never overrides a
variable a host already set, so this is a no-op on Render (which injects
env vars directly — there's no `.env` file there) and only ever helps local
dev.

### Historical comparison (context only — Render is the chosen host)

| Option | Cost/month | Owner setup | Notes |
|---|---|---|---|
| **Render** (web service) — **chosen** | **$7/mo** (Starter, always-on) | See the numbered steps above. | The free tier's cold start (~30-50s) exceeds `MODEL_TIMEOUT_MS`/`MODEL_TIMEOUT_QUESTION_MS`, so this project uses the paid always-on tier, not free. |
| Google Cloud Run | ~$5-10/mo with `min-instances=1` (or scale-to-zero for less, at the cost of the same cold-start trap as Render's free tier) | Write a small `Dockerfile` for `server/` (plain Node process, no framework-specific build step needed), `gcloud run deploy` from the `server` directory, set env vars with `--set-env-vars` or `--set-secrets`. | Not chosen — more setup than Render's dashboard-only flow (a Dockerfile + gcloud CLI). Kept here as the runner-up that was actually compared. |
| Fly.io | Roughly $2-5/mo for the smallest always-on VM (usage-based, no flat free tier) | Install `flyctl`, run `fly launch` from `server/`, then `fly secrets set ANTHROPIC_API_KEY=... ANTHROPIC_WORKSPACE_ID=...`, `fly deploy`. | Not chosen — cheapest option but more CLI-driven than Render's dashboard. |
| Railway | — | — | Ruled out outright (owner used it before elsewhere, found it unreliable) — never compared on cost/setup. |

**How the key gets there without landing in git:** the key is pasted once
into Render's dashboard as an environment variable — never written into a
file the repo tracks. `server/.env` is already listed in the root
`.gitignore` (`.gitignore:2` and the general `.env` rule at
`.gitignore:3`) and confirmed untracked (`git check-ignore -v server/.env`
resolves) — it must stay that way.

**`ANTHROPIC_WORKSPACE_ID` is currently blank** (`server/.env.example:13`).
This is independent of hosting — it's an Anthropic Console setting. It only
matters if the real `ANTHROPIC_API_KEY` turns out to be org-level rather
than workspace-scoped and the org has more than one workspace; if so, every
request fails with the `400 invalid_request_error` documented above under
"Live verification script." The owner won't know which case applies until a
live call is made with the real key on Render — if it 400s with that
specific message, set `ANTHROPIC_WORKSPACE_ID` in Render's dashboard (value
from the Anthropic Console) and redeploy. No action needed up front.

**Not recommended:** a self-managed VPS (e.g. a $4-6/mo droplet). It's the
cheapest raw compute but pushes TLS certificates, a reverse proxy, process
supervision (systemd), and OS security updates onto the owner — Render
handles all of that.
