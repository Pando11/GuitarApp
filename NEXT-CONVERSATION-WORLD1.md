# NEXT CONVERSATION — Build World 1 (Emerald Hollow) assets

**Status as of 2026-08-30:** the pipeline is WRITTEN and the pod is LIVE. Stage 1
(FLUX stills) is implemented and has run as far as model-load + render-start on the pod.
The open step is to confirm the first still landed, pull it back, eyeball it, commit.
Everything below is verified on disk / on the pod this session.

## Pod state (real)
- Pod `xgcitppkl4lcm9` (awkward_scarlet_louse), RTX PRO 4000 24GB, EU-RO-1, **RUNNING**.
- Models CONFIRMED COMPLETE on `/workspace`: `flux-schnell/` and `Wan2.2-I2V-A14B/`.
- Credentials in `Desktop/GuitarApp/.env` (RUNPOD_API_KEY, RUNPOD_POD_ID, RUNPOD_JUPYTER_PASSWORD).
- Jupyter proxy: `https://xgcitppkl4lcm9-64412317.proxy.runpod.net` (token = JUPYTER_PASSWORD).
- **RunPod proxy is flaky (intermittent 502s).** `pod_run.py` retries; just re-run on 502.

## CRITICAL constraint discovered this session
- **`/workspace` (network volume) is WRITE-QUOTA-BLOCKED (Errno 122).** Reads work
  (models load fine) but NO writes succeed — including `pod_run.py --deploy ... /workspace/...`
  which silently produced a 0-byte file. Always: read models from `/workspace`, but
  WRITE outputs and DEPLOY scripts to `/tmp` (container disk, writable, 30G free).
- HF cache must point at `/tmp`: set `HF_HOME=/tmp/hf` or it tries the unwritable
  `/workspace/.cache` and warns/fails.

## Files written this session (all in repo)
- `scripts/world-factory/pod_run.py` — Jupyter-kernel driver. Modes:
  - `python3 pod_run.py "code"` — quick run, returns stdout (kernel deleted after).
  - `python3 pod_run.py --deploy local.py /tmp/remote.py` — write file to pod (kernel method).
  - `python3 pod_run.py --job job.py /tmp/x.log --env HF_HOME=/tmp/hf --timeout 400`
    — fire a LONG job in a PERSISTENT kernel that logs to `/tmp/x.log` on the pod;
    polls the log until `JOB_DONE`. Kernel is NOT deleted (kill later with
    `python3 pod_run.py --kill <kernel-id>`).
  - reads pod files via `python3 -c "import sys;sys.path.insert(0,'scripts/world-factory');import pod_run as p;print(p.read_pod_file('/tmp/path'))"`.
- `scripts/world-factory/build-world-1.py` — the generator. Stage 1 (FLUX stills) DONE:
  palette lock (7 hexes), locked @Sage/@EmeraldHollow/@Student instances, mandatory
  negative baked as "AVOID:" tail (FLUX.1[schnell] pipeline has NO negative_prompt arg).
  Stages 2-4 (Wan2.2 / Chatterbox / Godot) are SCAFFOLDS. Has `--small` (768x448) flag.
- `scripts/world-factory/job_sage_porch.py` — wrapper that runs Stage 1 dry-run on one
  shot (@Sage porch) at 768x448.

## Pod environment setup done this session
- Installed on pod: diffusers 0.30.0, transformers 4.45.2, accelerate, safetensors,
  sentencepiece, protobuf. (torch 2.8+cu128 was already present.)
- FLUX loads in ~3.4s with `enable_model_cpu_offload()` + `enable_attention_slicing()`
  + `enable_vae_slicing()`.

## Gotchas already solved (don't re-litigate)
- FLUX OOM at full res 1216x704 on 24GB → use `--small` (768x448) for the dry-run;
  full cinematic res needs more VRAM management (fp8 transformer or lower res).
- `fire_and_forget` writes stdout to a pod log file because the proxy drops the live
  websocket mid-run and RunPod kills detached children when a kernel is deleted — so the
  job MUST run inside ONE persistent kernel that is NOT deleted until JOB_DONE.

## NEXT ACTIONS (exact, in order)
1. Check the dry-run result (a job was fired last; log at `/tmp/worlds/emerald-hollow/stills/run.log`):
   ```
   python3 -c "import sys;sys.path.insert(0,'scripts/world-factory');import pod_run as p;print(p.read_pod_file('/tmp/worlds/emerald-hollow/stills/run.log'))"
   ```
   Also confirm the PNG exists:
   ```
   python3 -c "import sys;sys.path.insert(0,'scripts/world-factory');import pod_run as p;print(p.run_code(\"import os;d='/tmp/worlds/emerald-hollow/stills';print(os.listdir(d) if os.path.isdir(d) else 'no-dir')\",timeout=60))"
   ```
2. If `JOB_DONE` + `sage_porch.png` present: pull it back via contents GET and decode to
   `07-app/assets/worlds/emerald-hollow/stills/sage_porch.png` (read_pod_file returns
   base64 for binaries — decode and write locally).
   If it FAILED (OOM/empty): re-run with `--small` already set (job_sage_porch.py has it);
   if still OOM, add `pipe.transformer.to(torch.float8_e4m3fn)` (Blackwell supports fp8).
3. Eyeball the still: palette must be only the 7 brief hexes (muted/dark, warm lantern
   only); no neon/vibrant; @Sage must match the locked description.
4. Expand to all brief shots (drop `--shot`), run Stages 2-4 (implement Wan2.2/Chatterbox
   per BUILD SPEC), land in `07-app/assets/worlds/emerald-hollow/`, wire Godot.
5. Commit: `scripts/world-factory/*`, the stills, and this handoff. Update the
   "0 produced" count in GAP-REGISTER / BUILD SPEC.

## Hard constraints (copyright/Rule law — do not violate)
- Palette lock: only the 7 brief hexes. Warm-lantern is the only contrast.
- @Sage/@EmeraldHollow/@Student are LOCKED instances — identical across every shot.
- Rule 2: @Student is a generic avatar, never the real user's face.
- Rule 5: voice lines cite stored numbers, never invent musical opinion.
- Models commercial-clean (Apache-2.0 / MIT) — enforced by `07-app/core/asset-job.js`
  (image+video) and AGENTS.md rule 9 (Chatterbox voice).
