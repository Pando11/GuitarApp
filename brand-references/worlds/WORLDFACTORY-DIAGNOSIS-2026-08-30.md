# World-Factory Build Failure — Diagnosis & Fix (2026-08-30)

**Owner:** Heidi Hendrickson · **Author:** Hermes · **Verified live against the RunPod API + the repo code this session.**

## Symptom
"Having a difficult time creating the worlds on the cloud CPU" — the FLUX + Wan projects
are downloaded on the RunPod pod, but world creation never produced anything.

## What was checked (proof, not guesses)
1. HuggingFace model cards:
   - `black-forest-labs/FLUX.1-schnell` — Apache-2.0, 12B, diffusers `FluxPipeline`. ✅ usable.
   - `Wan-AI/Wan2.2-I2V-A14B` — Apache-2.0, the correct repo id. ⚠️ NOTE: the old plan text
     referenced `Wan2.2-I2V-14B-720P` which is a **404** (wrong name), but the pod already has
     the correct `Wan2.2-I2V-A14B` downloaded, so this was NOT the blocker.
2. Live RunPod pod state via `GET api.runpod.io/v2/pods/<id>`.
3. The connection scripts (`pod_run.py`, `pod_shell.py`) and the generator (`build-world-1.py`).

## Root cause #1 (the killer): stale HARD-CODED proxy port
- Both scripts connected to `…-64412317.proxy.runpod.net`.
- RunPod **reassigns the Jupyter (8888) public proxy port on EVERY pod restart**.
- The live pod's current port was **`60234`** (HTTP `60235` also present). So every connection
  was hitting a dead endpoint → silent failure (no error you'd notice, just never connects).
- **FIX APPLIED:** added `_resolve_jupyter_port()` to both `pod_run.py` and `pod_shell.py`.
  It queries the RunPod API and reads the live `runtime.ports` entry for private port 8888 →
  public port. No more hard-coded port; can't go stale again.

## Root cause #2: the container was DOWN
- Pod lifecycle showed `status: RUNNING` but `runtime.status: None`, `containerStartedAt: None`,
  and the Jupyter proxy returned a Cloudflare **404**. The container was not serving.
- Needs a STOP → START cycle to bring Jupyter back up. Models persist on the volume.
- **STATUS TONIGHT:** pod was **STOPPED (EXITED)** at owner's request — $0/hr, GPU off,
  models safe.

## Root cause #3: pipeline is half-built (a gap, not a bug)
- `WORLD-1-BUILD-SPEC.md` confirms: Stage 1 (FLUX stills) is implemented; Stages 2–4
  (Wan2.2 video, Chatterbox voice, Godot wiring) are **empty scaffolds**.
- So even with a live connection, only stills can be made today. Video requires building 2–4.

## Non-issue (CORRECTED): API key
- `01-START-HERE/README.md` claimed the key "expired (error 1010)." Verified LIVE:
  `GET api.runpod.io/v2/pods/<id>` → **HTTP 200**. The 1010 was a transient proxy glitch.
  The key is valid. (README note corrected this session.)

## The autonomous builder
- Cron job **"Board: GuitarApp content" (ID `54ca06545f1d`)** runs the FLUX→Wan→Chatterbox
  pipeline and would START the pod + build. **PAUSED 2026-08-30** at owner request so nothing
  builds overnight. (The two sister Board jobs — growth + ops triage — were also paused then
  resumed, since they do NOT start the pod or generate worlds.)

## Fixes applied this session
- `scripts/world-factory/pod_run.py` — dynamic port resolution + `subprocess` import.
- `scripts/world-factory/pod_shell.py` — dynamic port resolution.
- `01-START-HERE/README.md` — replaced the false "key expired" note with the two real blockers.

## Action plan for build day → see `NEXT-CONVERSATION-WORLD1.md` (updated, accurate).
