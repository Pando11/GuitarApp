# How to get into RunPod (GuitarApp world-factory pod)

Verified working 2026-08-29. Keep this note in sync with reality — it's the only
access cheat-sheet we have.

## What's there
- Pod: `xgcitppkl4lcm9` (name: `awkward_scarlet_louse`)
- GPU: NVIDIA RTX PRO 4000 Blackwell 24GB — $0.57/hr, EU-RO-1
- Network volume `6nvscrbt2s` mounted at `/workspace` (PERSISTS across stop/start)
- Models on `/workspace`, both COMPLETE:
  - `flux-schnell/` (FLUX.1[schnell] for stills)
  - `Wan2.2-I2V-A14B/` (Wan2.2 for motion: high/low_noise_model 6 shards each, VAE, umt5-xxl, T5)
- Credentials: `Desktop/GuitarApp/.env` (RUNPOD_API_KEY + pod id/ip/ports)

## IMPORTANT — wrong host bites you
- Use **`https://api.runpod.io`** (REST v2). `api.runpod.dev` returns 404 — don't use it.
- The API key in `.env` WORKS (HTTP 200). If you get 403/404, it's the wrong host or
  the pod is stopped — not a dead key.

## Start the pod (if EXITED)
```
POST https://api.runpod.io/v2/pods/xgcitppkl4lcm9/action
Header: Authorization: Bearer <RUNPOD_API_KEY>
Body:   {"action":"start"}
```
Poll `GET /v2/pods/xgcitppkl4lcm9` until `"status":"RUNNING"` (takes ~30–60s).
Stop later with `{"action":"stop"}` (models are safe on the volume).

## Open the filesystem (Jupyter)
- Proxy URL: `https://xgcitppkl4lcm9-64412317.proxy.runpod.net`
- Auth: append `?token=<JUPYTER_PASSWORD>` (the `JUPYTER_PASSWORD` value is in the pod's
  env — fetch it from `GET /v2/pods/xgcitppkl4lcm9`, field `env.JUPYTER_PASSWORD`).
- Browse files: `https://<proxy>/api/contents/workspace?type=directory&token=<pw>`
- Models live at `/workspace/flux-schnell` and `/workspace/Wan2.2-I2V-A14B`.

## SSH (alternative, if keys set)
```
ssh xgcitppkl4lcm9-64412317@ssh.runpod.io
```
(Pod `PUBLIC_KEY` was null at setup — SSH needs a key added or password; Jupyter is the
reliable route.)

## Quick reference — how Heidi's agent reached it
1. Read `Desktop/GuitarApp/.env` for `RUNPOD_API_KEY`.
2. `curl -H "Authorization: Bearer $KEY" https://api.runpod.io/v2/pods/xgcitppkl4lcm9`
   → grab `env.JUPYTER_PASSWORD`.
3. If `status` != RUNNING, POST the start action above, poll until RUNNING.
4. Hit the Jupyter proxy URL with `?token=` to read/run files.
