# HANDOFF — Nous Portal account swap (DONE) + deferred wayfinder redline

Date: 2026-08-28
Owner: Heidi (Pando11 account) · machine: C:\Users\Hendrickson

## What this session was actually about

The user opened with a two-part request:
1. (Original job, DEFERRED) Use the boris-prompts skill to redline the wayfinder
   plan + GuitarApp build plan, then write a subagent deploy plan to build the app.
2. (Became the real work) The user believed this Hermes agent was on the "wrong"
   Nous Portal account and wanted to switch to the account that holds their tokens.

The account issue consumed the session. The redline/build-plan was NOT started.
Context ran high, so the user asked for a handoff instead of continuing.

## ACCOUNT SWAP — DONE and verified

### The real situation (verified, not assumed)
- The agent was signed into the user's OWN account via an OAuth device_code token
  for hhendrickson8@gmail.com. That was the "wrong" one only in the sense that the
  user wanted the Pando11 account active.
- `hermes login` no longer exists in this version. Account management is
  `hermes auth` (interactive menu) and `hermes auth add/remove/list/status`.

### What was done (exact, replayable)
1. User added their Pando11 static API key via `hermes auth` → Add → API key.
   Label "Guitar". It landed as nous credential #2.
   (The key was pasted in the user's terminal — it is now in terminal history on
   this machine. Recommend rotating a fresh key from portal.nousresearch.com if
   Heidi wants it clean.)
2. PROBLEM I CAUSED: I then ran `hermes auth remove nous 1` to delete the old
   hhendrickson8 device_code token. This cleared the `providers.nous` inference
   block, and the agent went to "not logged into Nous Portal" — inference was dead.
   Root cause: `hermes auth add --type api-key` stores the key in the credential
   POOL but does NOT populate the live `providers.nous` inference block. Only the
   OAuth flow does that. So removing the OAuth before the key was active = signed out.
3. FIX: I hand-wrote `providers.nous` in auth.json from the already-stored Pando11
   key (access_token + base_url + agent_key shaped the way OAuth would write it).
   Also deduped the double "Guitar" pool entry and set active_provider: nous.
4. VERIFIED by two live `hermes chat -q` calls — both returned real answers
   (e.g. "4" for 2+2). Inference is live and authenticated as Pando11.

### Final verified state
- auth.json `providers.nous`: populated from Pando11 key.
- credential_pool.nous: single entry, label "Guitar", auth_type api_key.
- Old hhendrickson8 OAuth: removed. No fallback to old account.
- `hermes auth status nous` → would show "logged in" / key present.

### Traps for next time (so this isn't repeated)
- Do NOT remove an OAuth credential until you have confirmed the replacement key
  actually carries inference. The `auth add --type api-key` path does NOT activate
  inference by itself.
- `hermes portal login` re-runs OAuth against the DEFAULT Portal login
  (hhendrickson8), NOT Pando11. Do not use it to "fix" a Pando11 swap — it puts the
  old account back.
- If a future `hermes update` or hard `hermes auth reset` wipes `providers.nous`,
  the manual block write is the recovery. This is a tool gap (api-key add should
  promote to active), not user error.

## MODEL SETTING — done per user instruction
- User said "just pick hy3:free for now."
- Set: `hermes config set model.default tencent/hy3:free` (provider nous).
- NOTE: hy3:free is FREE-TIER. It does NOT spend Pando11 subscription tokens.
  When the user wants to use the paid plan, run `hermes model` and pick the
  plan's model. Do not guess the model name — discover it via `hermes model`
  picker (the /models browse endpoint returns 403 for static API keys, so you
  cannot auto-list it).

### Cron warning (not yet fixed)
- 1 enabled unpinned cron job has a stored model_snapshot that now differs from the
  global model (it will fail closed on next run, not silently use the new model).
- This is the Woody daily ops inbox scan job (from memory: c27ecc0dbe73, 0 2 * * *,
  deliver origin / Ops Meeting chat).
- Fix when convenient: `hermes cron list`, then
  `hermes cron edit <job_id> --provider nous --model tencent/hy3:free`.
- Heidi was offered this; she did not ask to do it this session.

## DEFERRED JOB — the actual original request (not started)

Boris redline of the wayfinder plan + GuitarApp build plan, then a subagent
deploy plan to build the app.

### Files already gathered this session (read them cold — they're the source of truth)
- Wayfinder skill: `C:\Users\Hendrickson\AppData\Local\hermes\skills\engineering\wayfinder\SKILL.md`
- GuitarApp adaptation: `...\skills\engineering\wayfinder\references\guitarapp-wayfinder-adaptation.md`
- Live wayfinder map (the real current plan): `C:\Users\Hendrickson\Desktop\GuitarApp\.scratch\wayfinder\map.md`
  — Status: "destination reached, all 10 tickets resolved" (01–10).
- Older/stale build plan (DO NOT treat as current): `...\02-spec\guitar-build-plan.md`
  (dated 2026-08-04, superseded by AMENDMENT-04/05/16 and the wayfinder map).
- Boris skill: `...\skills\workflow\boris-prompts\SKILL.md`

### Self-check findings already surfaced (the redline should target these)
Joining the map's "Decisions so far" claims against on-disk reality found drift:
- PRACTICE-REMIX Q5 PROTOTYPE: map says "built and owner-verdicted
  (practice-remix-q5-prototype.html)" — but that file does NOT exist on disk.
  The other two prototypes DO exist:
  `06-prototypes/song-discovery-q5-prototype.html` and
  `06-prototypes/song-styles-q5-prototype.html`. Verify before trusting the
  "It all looks good" verdict claim.
- LESSON COUNT: map/handoff say "25 lessons." On disk there are 20 lesson JSONs
  in `05-content/` (guitar-lesson-01 .. 10 plus others). The "25" is the
  AMENDMENT-15 curriculum TARGET (25-lesson order), not 25 built lessons.
  The map's "18 amendments / 4 ADRs / 19 core ESM modules / ship gates green"
  claims CHECKED OUT as true on disk.
- ASSETS GAP (expected, not drift): FLUX/Wan dirs missing, `assets/` missing,
  `.venv-kokoro` missing, `godot` not on PATH. The map correctly marks these
  out-of-scope for the planning map. They are the real build blockers for the
  world-factory pipeline (ticket 08) and must be in the subagent build plan.

### Constraints the redline + build plan must respect (legal floor)
- Rule 5: LLM prose-only, cites stored numbers, no invented musical opinion.
- Rule 9: license blocklist = copyright law. Commercial-clean + free only
  (Apache-2.0 / MIT): FLUX.1[schnell], Wan2.1-I2V, Chatterbox, Kokoro-82M,
  Godot 4.x, ACE-Step, YuE. Blocked: ElevenLabs, Midjourney, SVD, MusicGen, Suno.
- Rule 2: no camera, no hand tracking.
- AMENDMENT chain is current truth (05–17). AMENDMENT-17 (World 1 teacher +
  performance ladder) is PROPOSED, not yet ratified.
- Student memory: PocketBase (AMENDMENT-16), always-on encrypted, ciphertext only.

## Suggested skills for the next session
- `boris-prompts` — for the visible rewrite + silent two-view self-check on the redline.
- `wayfinder` — to read the map correctly (plan-not-build discipline).
- `handoff` — this doc's own format.
- `delegate_task` — for the subagent deploy plan (parallel build agents).
- `guitarapp` skill (global: `AppData\Local\hermes\skills\software-development\guitarapp`)
  — for build-session conventions.

## Resume cue (next session)
1. Re-read `.scratch/wayfinder/map.md` (the live plan) — NOT guitar-build-plan.md.
2. Run the Boris two-view join: map claims vs. disk (re-verify the 3 findings above,
   especially the missing practice-remix prototype).
3. Write the REDLINED plan to `...\02-spec\` or `.scratch\` as a new markdown file.
4. Then write the SUBAGENT DEPLOY PLAN: which build pieces (schema/renderer, tuner/
   metronome, lesson player, curriculum renderer, progress, subs, world-factory
   FLUX→Wan→Chatterbox→Godot, PocketBase backend) become parallel delegate_task
   agents, with the asset/install blockers called out first.
5. Do NOT start building — the user asked for a plan, not execution.

## Account note for the next agent
The agent is now correctly on Pando11. If you see "not logged into Nous Portal,"
do NOT run `hermes portal login` (that re-adds hhendrickson8). Re-populate
`providers.nous` from the stored "Guitar" pool key as documented above.
