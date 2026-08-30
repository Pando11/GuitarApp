# NEXT CONVERSATION — Build World 1 (Emerald Hollow) assets

**Status as of 2026-08-30 (verified live this session):**

- Pod `xgcitppkl4lcm9` (name `awkward_scarlet_louse`) was **STOPPED tonight** at owner request
  (status `EXITED`, $0/hr). GPU off. Models safe on volume `6nvscrbt2s` @ `/workspace`.
- **Connection blocker FIXED:** `scripts/world-factory/pod_run.py` + `pod_shell.py` now resolve
  the live Jupyter proxy port from the RunPod API at runtime (was hard-coded `64412317`; the
  live port was `60234` and changes on every restart). No more silent dead-end connections.
- **Before building, the container must be STARTED.** When last seen it was DOWN
  (`runtime.status: None`). After START, poll until `runtime.status == "running"` and confirm
  Jupyter answers, BEFORE assuming the pod is usable.
- RunPod API key is **VALID** (verified HTTP 200). The old README "key expired 1010" note was a
  transient glitch — corrected.
- Build pipeline is **half-built**: Stage 1 (FLUX stills) implemented; Stages 2–4 (Wan2.2 video,
  Chatterbox voice, Godot) are empty scaffolds. Only stills can be made until 2–4 are built.

## The autonomous builder (so we don't fight it tomorrow)
- Cron job **"Board: GuitarApp content" (ID `54ca06545f1d`)** is the world-factory builder. It
  runs the FLUX→Wan→Chatterbox pipeline and would START the pod + build on its own.
- **PAUSED 2026-08-30** at owner request. Resume it (or build manually) when ready.

## How to start building tomorrow
1. **Start the pod:**
   `POST https://api.runpod.io/v2/pods/xgcitppkl4lcm9/action`
   header `Authorization: Bearer $RUNPOD_API_KEY`, body `{"action":"start"}`.
   Poll `GET /v2/pods/xgcitppkl4lcm9` until `runtime.status == "running"`.
2. **Confirm Jupyter is reachable** (proves the port fix works):
   ```
   python3 -c "import sys;sys.path.insert(0,'scripts/world-factory');import pod_run as p;print(p.BASE);print(p.run_code('print(1)'))"
   ```
   → should print the resolved `https://xgcitppkl4lcm9-<LIVE_PORT>.proxy.runpod.net` and `1`.
3. **Dry-run Stage 1 (FLUX still)** on one shot (`@Sage` porch) at 768x448:
   ```
   python3 scripts/world-factory/pod_run.py --job scripts/world-factory/job_sage_porch.py /tmp/worlds/run.log --env HF_HOME=/tmp/hf --timeout 400
   ```
   (Runs on the pod; reads models from `/workspace`, writes outputs to `/tmp` — the volume is
   write-quota-blocked, Errno 122. Pull results back via the Jupyter contents GET.)
4. **Pull the PNG back, eyeball the palette** (only the 7 brief hexes; warm-lantern only), commit.
5. **Then build Stages 2–4** (Wan2.2-I2V A14B motion, Chatterbox voice, Godot wiring) — these are
   scaffolds, NOT implemented. This is the real remaining work before any video exists.
6. **Stop the pod when done** (no GPU cost accrues).

## Hard constraints (unchanged — do not violate)
- Palette lock: only the 7 brief hexes. Warm-lantern is the only contrast. No neon/vibrant.
- `@Sage` / `@EmeraldHollow` / `@Student` are LOCKED instances — identical across every shot.
- Rule 2: `@Student` is a generic avatar, never the real user's face. No camera, no hand tracking.
- Rule 5: voice lines cite stored numbers, never invent musical opinion.
- Models commercial-clean (Apache-2.0 / MIT) — enforced by `07-app/core/asset-job.js` + AGENTS.md rule 9.

## Verified pod facts (reference)
- GPU: RTX PRO 4000 Blackwell 24GB, EU-RO-1, $0.57/hr
- Volume `6nvscrbt2s` @ `/workspace` (persists across stop/start)
- `/workspace/flux-schnell/` COMPLETE · `/workspace/Wan2.2-I2V-A14B/` COMPLETE
- `JUPYTER_PASSWORD` (pod) = `khlzb7wciu285dcoyitp` (matches `.env`)
- API host: `https://api.runpod.io` (NOT `api.runpod.dev` — that returns 401)
- Jupyter proxy port: **DYNAMIC** (resolved by the scripts now); was `60234` on 2026-08-30

## Repo files (still valid)
- `scripts/world-factory/build-world-1.py` — generator (Stage 1 done, 2–4 scaffolds)
- `scripts/world-factory/pod_run.py` — Jupyter kernel driver (port-fix applied)
- `scripts/world-factory/pod_shell.py` — shell via terminal ws (port-fix applied)
- `scripts/world-factory/job_sage_porch.py` — Stage 1 dry-run wrapper (`--small` 768x448)
- Source of truth: `brand-references/worlds/world-brief-emerald-hollow-L1.md`,
  `WORLD-1-BUILD-SPEC.md`, `RUNPOD-ACCESS.md`, and the diagnosis
  `WORLDFACTORY-DIAGNOSIS-2026-08-30.md`.

## 2026-08-30 PM SESSION ADDENDUM (Hermes, executing the 5 NEXT ACTIONS)
Executed steps 1–3; step 4 partial; pod went DOWN mid-step-4.

- Step 1: dry-run log showed FAIL — `AttributeError: FluxPipeline has no attribute
  enable_vae_slicing` (handoff's loading recipe was wrong). ALSO found the pod container
  had been DOWN earlier; prior session had already fixed the hard-coded proxy port.
- Step 2: fixed `get_pipeline()` to use `enable_sequential_cpu_offload()` (NOT
  `enable_model_cpu_offload()` — that DEADLOCKS on torch 2.8 cu128 + Blackwell, pipe()
  hangs at 0% GPU). Confirmed: 768x448 renders in ~92s, peak VRAM ~370MiB. Pulled the
  resulting `sage_porch.png` back to `07-app/assets/worlds/emerald-hollow/stills/`.
- Step 3: eyeballed via vision — PALETTE LOCK FAILED (bright-pink flowers, orange guitar,
  bright lantern). Prompt-only enforcement is insufficient. FIX: added `quantize_to_palette()`
  (snap every pixel to nearest of the 7 hexes). VERIFIED programmatically: 7 unique colors,
  100% coverage, 0 outside palette. Vision model falsely reported "FAIL" on the quantized
  image (misread dithering) — trust the pixel-count check, not the vision read.
- Step 4: ran `--stage 1` (all 4 shots) on the pod. JOB_DONE captured; 4 `.palette.png`
  stills + manifest written. BUT the pod container went DOWN (Jupyter proxy 404 / control-plane
  POST start = 403 error 1010) BEFORE the 3 non-sage stills + full-res versions could be
  pulled. Those 3 are stranded in ephemeral `/tmp` on the pod — recoverable only after a
  STOP->START cycle. sage_porch (768x448) is safely in the repo. Stages 2–4 NOT built (scaffolds).
- SUBJECT LOCK CAVEAT: FLUX rendered a grey-haired older man, not the brief's "@Sage mid-30s".
  Text prompts don't hold a consistent locked character across shots — needs an IP-adapter /
  reference-image approach (later stage). Flagged, not fixed this session.

NEXT SESSION: restart pod (STOP->START via RunPod console/working key), re-pull the 3 stranded
stills + manifest, then build Stages 2–4 (Wan2.2 / Chatterbox / Godot) per BUILD SPEC.
