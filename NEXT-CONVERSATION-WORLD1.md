# NEXT CONVERSATION — Build World 1 (Emerald Hollow) assets

**Status as of 2026-08-30 (PM, after the "fresh pod" attempt):**

## What is ACTUALLY the blocker (the real root cause)
The recurring "the video of the world never gets created" is NOT a connection bug.
Connection bugs (stale hard-coded proxy port, FluxPipeline deadlock, API-key-1010) are
FIXED in the scripts. The real gap, stated plainly in `WORLD-1-BUILD-SPEC.md`:
> **Stages 2–4 (Wan2.2 video, Chatterbox voice, Godot) were NEVER BUILT — they are empty
> `print("NOT IMPLEMENTED")` scaffolds.** Only FLUX stills (PNG) have ever been produced.
> A still is not a video. That is why no video was ever made.

## What got DONE this session
1. **Stage 2 (Wan2.2 image-to-video) is now REAL code** — `scripts/world-factory/stage2_wan.py`.
   It calls the model dir's own `generate.py --task i2v-14B` (Wan2.2 ships its OWN pipeline
   under `wan/`, it is NOT a diffusers class). Feeds each FLUX still as the I2V first frame,
   slow dolly/pull-out motion per the brief, mandatory negative prompt. Outputs `clips/*.mp4`.
2. **`pull_asset.py`** — pulls binary (PNG/MP4) files/dirs back from the pod via Jupyter
   contents API (base64). The volume `/workspace` is WRITE-QUOTA-BLOCKED (Errno 122), so
   generation writes to the pod's ephemeral `/tmp` and this is how it comes home.
3. **`probe_pod.py`** — on-pod probe that prints `generate.py` existence + `--help` (real arg
   names) + FLUX stills presence. MUST be run before the Stage-2 job (no guessing the args).
4. **Pod is RUNNING** via `xgcitppkl4lcm9` (volume `6nvscrbt2s` @ `/workspace`, models present).
   Earlier today it was on a full EU-RO-1 host (`400 not enough free GPUs`); a STOP→START cycle
   brought it back up on a live host. The stray blank-volume pod `r3lvb2trneq6bv` was terminated.

## VERIFIED facts (do not re-derive — these are real, confirmed this session)
- RunPod API key in `.env` is **VALID** (GET → HTTP 200). The old "expired 1010" note was a
  transient control-plane 403, not a dead key.
- API host: `https://api.runpod.io` (NOT `api.runpod.dev`). REST v2 = `https://api.runpod.io/v2/pods/<id>`.
- Pod `xgcitppkl4lcm9`, GPU RTX PRO 4000 Blackwell 24GB, EU-RO-1, ~$0.57/hr.
- Volume `6nvscrbt2s` = the model store (`flux-schnell/` + `Wan2.2-I2V-A14B/`, both COMPLETE).
- Jupyter proxy port is **DYNAMIC** — resolved at runtime by `pod_run.py`/`pod_shell.py`
  (`_resolve_jupyter_port()`). Last seen `60267`. NEVER hard-code it.
- `pod_run.py` works: `python -c "import sys;sys.path.insert(0,'scripts/world-factory');import pod_run as p;print(p.BASE);print(p.run_code('print(1)'))"` should print the live BASE + `1`.
- Stage 1 (FLUX) is PROVEN: `enable_sequential_cpu_offload()` (NOT `enable_model_cpu_offload()`
  — that DEADLOCKS), `num_inference_steps=4`, `guidance_scale=0.0`. Palette lock via
  `quantize_to_palette()` (snap every pixel to the 7 brief hexes) — VERIFIED 100% coverage.
  One still (`sage_porch.palette.png`, 768x448) is already in `07-app/assets/worlds/emerald-hollow/stills/`.

## ⚠️ OPEN UNKNOWN the next session MUST re-check first
The pod's `runtime.status` was `None` / Jupyter returned 404 at the moment of handoff (the
container was mid-boot / in the known "RUNNING but not serving" state). Run this FIRST:
```
export $(grep -E '^RUNPOD_API_KEY=' .env | xargs)
curl -H "Authorization: Bearer $RUNPOD_API_KEY" https://api.runpod.io/v2/pods/xgcitppkl4lcm9
# check runtime.status == "running" and ports has 8888->public
PW=$(grep '^RUNPOD_JUPYTER_PASSWORD=' .env | cut -d= -f2)
PORT=<the live 8888 public port>
curl -s -o /dev/null -w "%{http_code}\n" "https://xgcitppkl4lcm9-${PORT}.proxy.runpod.net/api/status?token=$PW"
# must be 200 before any job. If not: STOP -> START again (control-plane flake / not-serving).
```

## BUILD ORDER (next session — this is the actual "make the video" plan)
1. **Re-confirm pod is serving** (above). If Jupyter 404 / runtime None → STOP→START, re-poll.
2. **PROBE** (no guessing Wan args): `python scripts/world-factory/pod_run.py --job scripts/world-factory/probe_pod.py /tmp/probe.log --timeout 120`
   → read log; confirm `generate.py` path + real `--task`/`--size`/`--frame_num` arg names;
     confirm FLUX stills dir exists. If arg names differ from `stage2_wan.py`, patch the script.
3. **STAGE 1 re-run (full res, all 4 shots)** so we have fresh palette-locked stills to animate:
   `python scripts/world-factory/pod_run.py --job scripts/world-factory/job_all_stills.py /tmp/s1.log --env HF_HOME=/tmp/hf --timeout 700`
   (job_all_stills = runpy build-world-1.py --stage 1 --out /tmp/worlds/emerald-hollow/stills)
4. **PULL stills back** + verify palette by PIXEL COUNT (not by eye — vision can misread dithering):
   `python scripts/world-factory/pull_asset.py /tmp/worlds/emerald-hollow/stills 07-app/assets/worlds/emerald-hollow/stills`
   then a local check that every PNG resolves to exactly the 7 hexes.
5. **STAGE 2 = THE VIDEO (the deliverable that kept failing):**
   `python scripts/world-factory/pod_run.py --job scripts/world-factory/stage2_wan.py /tmp/s2.log --env HF_HOME=/tmp/hf --timeout 1800`
   → produces `clips/B00_walkin.mp4`, `B01_meetsage.mp4`, `B02_twoshot.mp4`.
6. **PULL clips back** to `07-app/assets/worlds/emerald-hollow/clips/`.
7. **STAGE 3 (voice) — optional, secondary:** if Chatterbox is installed on the pod, render @Sage
   lines; else flag and defer (Kokoro isn't installed locally; installing is a separate step).
   Mux audio into clips with local `ffmpeg` (present at `C:/Users/Hendrickson/AppData/Local/Microsoft/WinGet/Links/ffmpeg`).
8. **LAND + GATE:** run `07-app/core/asset-job.js` model check (FLUX.1[schnell] + Wan2.2-I2V-A14B
   only — both Apache-2.0, both pass). Update GAP-REGISTER "0 produced" → real count.
9. **STOP POD** when done (no GPU cost accrues): POST `/v2/pods/xgcitppkl4lcm9/action` `{"action":"stop"}`.

## Hard constraints (unchanged)
- Palette lock: only the 7 brief hexes. Warm-lantern is the only contrast. No neon/vibrant.
- `@Sage` / `@EmeraldHollow` / `@Student` are LOCKED instances — identical across every shot.
- Rule 2: `@Student` is a generic avatar, never the real user's face. No camera, no hand tracking.
- Rule 5: voice lines cite stored numbers, never invent musical opinion.
- Models commercial-clean (Apache-2.0 / MIT) — enforced by `asset-job.js` + AGENTS.md rule 9.
- The volume `/workspace` is WRITE-BLOCKED (Errno 122) — always generate into `/tmp` on the pod,
  then `pull_asset.py` back. Don't write outputs to `/workspace`.

## Files in repo now (valid)
- `scripts/world-factory/build-world-1.py` — Stage 1 (FLUX stills, PROVEN) + stage2/3/4 placeholders
- `scripts/world-factory/stage2_wan.py` — **NEW: real Wan2.2 Stage 2 runner**
- `scripts/world-factory/pull_asset.py` — **NEW: binary pull from pod**
- `scripts/world-factory/probe_pod.py` — **NEW: probe generate.py args + stills**
- `scripts/world-factory/pod_run.py` / `pod_shell.py` — port-fix applied (working)
- `scripts/world-factory/job_sage_porch.py` — Stage 1 dry-run wrapper (sage_porch, --small)
- Source of truth: `brand-references/worlds/world-brief-emerald-hollow-L1.md`, `WORLD-1-BUILD-SPEC.md`, `RUNPOD-ACCESS.md`.
