# HANDOFF — RunPod GPU Worker: WAN2.2 Download Resume
**Session:** 2026-08-27→28 (Pacific)
**Goal:** Restart the RunPod pod and finish the Wan2.2-I2V-A14B download that was mid-sync when the pod stopped.
**Status at handoff:** Pod EXITED. FLUX.1[schnell] fully downloaded. Wan2.2 ~12% of files on disk.

---

## What's decided and locked (from this session)

- **Pod:** `awkward_scarlet_louse` / `xgcitppkl4lcm9`, RTX PRO 4000 Blackwell 24GB, $0.57/hr, EU-RO-1, template `runpod-torch-v280` (PyTorch 2.8.0 + cu1281).
- **RunPod API key:** `rpa_3EXVDQSM1ASNZ1WYHR8UYBYM8Q61L1GC5BLPKL6Pmnt9af` — lives in `Desktop/GuitarApp/.env` as `RUNPOD_API_KEY`. Validated 2026-08-27/28 (API `GET api.runpod.io/v2/pods` returned the pod).
- **HuggingFace token:** `hf_TOKEN_REVOKED_AND_REDACTED_2026-09-06` — user-provided same session. Saved on the pod at `/workspace/.cache/huggingface/token`, display name `GuitarApp`. Owner account: `DavidSage8` (Heidi). Token has `fineGrained` scope with `repo.content.read` — gated repos accessible.
- **FLUX.1[schnell] — DONE.** Downloaded to `/workspace/flux-schnell/`, 32GB, 11 files, all weights present and verified. Used `hf download black-forest-labs/FLUX.1-schnell --local-dir /workspace/flux-schnell`.
- **Wan2.2-I2V-A14B — IN PROGRESS.** Synced from HF bucket `DavidSage8/Wan2.2-I2V-A14B-bucket` (126GB, 33 files) to `/workspace/Wan2.2-I2V-A14B/`. Command: `hf buckets sync hf://buckets/DavidSage8/Wan2.2-I2V-A14B-bucket /workspace/Wan2.2-I2V-A14B`. Sync is resume-safe (HF object storage; re-running picks up where it left off).
- **Disk layout on pod:**
  - `/workspace` — 2.0PB network volume (mfs#euro-3.runpod.net:9421), 851TB free. Models go here (30GB pod overlay ran out of space).
  - FLUX → `/workspace/flux-schnell/`
  - WAN2.2 → `/workspace/Wan2.2-I2V-A14B/`
- **The HF bucket is the authoritative source for Wan2.2 weights** — user uploaded them there herself. Do NOT re-download from `Wan-AI/Wan2.2-I2V-A14B` on the Hub; use the bucket.
- **Pod stopped** via `POST https://rest.runpod.io/v1/pods/xgcitppkl4lcm9/stop` at ~00:19 UTC 2026-08-28. Last known running duration: ~1.7 hrs, ~$0.97.

## Pod connection details (live as of stop time — will change on restart)

These are stale — always re-fetch from `GET https://api.runpod.io/v2/pods/xgcitppkl4lcm9` after starting. The values below are from the last API call before stop:

- **SSH direct:** `ssh root@213.173.104.38 -p 34448` (may not work from Windows — see SSH gotchas below)
- **SSH proxy (works):** `ssh xgcitppkl4lcm9-64412317@ssh.runpod.io`
- **Jupyter Lab:** was at `http://100.65.35.23:60120`, password `khlzb7wciu285dcoyitp` (from `env.JUPYTER_PASSWORD` in the pod detail)
- On restart, ports/host/IP will be DIFFERENT — get them fresh from the v2 pod detail.

## SSH gotchas (Windows)

- The **Windows native** `ssh.exe` (`C:\Windows\System32\OpenSSH\ssh.exe`) with `-t` connects but commands hang waiting on the PTY. Use the proxy (`ssh.runpod.io`) with `-tt` and wrap commands in `bash -lc "..."`, OR use Jupyter Lab Terminal.
- The **MSYS/Git** `ssh.exe` does not support the PTY the pod expects → "Your SSH client doesn't support PTY" error. Do NOT use it.
- **Jupyter Lab Terminal** is the cleanest command channel — avoids SSH/PTY issues entirely. Open it via the dashboard or the public URL from the v2 pod detail.

## Resume procedure — step by step

### Step 1: Restart the pod
```
curl -s -X POST -H "Authorization: Bearer rpa_3EXVDQSM1ASNZ1WYHR8UYBYM8Q61L1GC5BLPKL6Pmnt9af" \
  https://rest.runpod.io/v1/pods/xgcitppkl4lcm9/start
```
Wait for `status: RUNNING` from `GET https://api.runpod.io/v2/pods/xgcitppkl4lcm9`.

### Step 2: Get fresh connection details
```
curl -s -H "Authorization: Bearer rpa_3EXVDQSM1ASNZ1WYHR8UYBYM8Q61L1GC5BLPKL6Pmnt9af" \
  https://api.runpod.io/v2/pods/xgcitppkl4lcm9
```
Note the new `ssh.direct`, `ssh.proxy`, and `runtime.ports` (find the `private: 8888, type: "http"` entry for Jupyter). Note the new Jupyter password from `env.JUPYTER_PASSWORD`.

### Step 3: Verify HF token still valid on pod
The token is stored at `/workspace/.cache/huggingface/token`. Check it still works:
```
curl -s -H "Authorization: Bearer hf_TOKEN_REVOKED_AND_REDACTED_2026-09-06" \
  https://huggingface.co/api/whoami-v2
```
Expected: `{"type":"user","name":"DavidSage8",...}`. If the stored token is stale, re-auth on the pod: `hf auth login --token hf_TOKEN_REVOKED_AND_REDACTED_2026-09-06`.

### Step 4: Verify what's already on disk (before re-syncing)
```
du -sh /workspace/flux-schnell/ /workspace/Wan2.2-I2V-A14B/
ls /workspace/Wan2.2-I2V-A14B/ | wc -l
```
FLUX should be 32GB. Wan2.2 should be ~15GB with the small files present (configs, tokenizer, VAE, assets) and the big shards still at 0 bytes or partial.

### Step 5: Resume the Wan2.2 sync
```
mkdir -p /workspace/Wan2.2-I2V-A14B
hf buckets sync hf://buckets/DavidSage8/Wan2.2-I2V-A14B-bucket /workspace/Wan2.2-I2V-A14B
```
The `hf buckets sync` command is resume-safe — it skips files already on the receiver and only transfers what's missing. Let it run to completion (~126GB total; the already-transferred ~15GB won't re-transfer).

**Do NOT use** `hf download Wan-AI/Wan2.2-I2V-A14B` — that hits the Hub repo and is slower / may re-gate. The bucket is the source of truth.

### Step 6: Verify the download completed
After sync finishes:
```
echo "=== WAN2.2 TOTAL ===" && du -sh /workspace/Wan2.2-I2V-A14B/
echo "=== MODEL SHARDS ===" && ls -lh /workspace/Wan2.2-I2V-A14B/high_noise_model/ | grep safetensors
ls -lh /workspace/Wan2.2-I2V-A14B/low_noise_model/ | grep safetensors
ls -lh /workspace/Wan2.2-I2V-A14B/models_t5_umt5-xxl-enc-bf16.pth
echo "=== FLUX CHECK ===" && du -sh /workspace/flux-schnell/
```
Expected final sizes:
- FLUX: **32GB** (already done — should not change)
- Wan2.2: **~126GB** (the bucket's total). High_noise: 6 safetensors shards each ~10GB. Low_noise: 6 safetensors shards each ~10GB. T5: ~11GB. VAE: ~507MB.

### Step 7: Stop the pod when done
```
curl -s -X POST -H "Authorization: Bearer rpa_3EXVDQSM1ASNZ1WYHR8UYBYM8Q61L1GC5BLPKL6Pmnt9af" \
  https://rest.runpod.io/v1/pods/xgcitppkl4lcm9/stop
```
Don't leave it running idle — $0.57/hr adds up.

## The files and their role

| File | Role |
|---|---|
| `Desktop/GuitarApp/.env` | Source of truth for `RUNPOD_API_KEY`, `RUNPOD_POD_ID`, `RUNPOD_POD_NAME`, `RUNPOD_POD_IP`, `RUNPOD_SSH_PORT`, `RUNPOD_JUPYTER_PASSWORD`. Read this FIRST if anything about the pod looks wrong. |
| `skills/software-development/guitarapp-stack/references/runpod-worker.md` | Operational reference: API endpoints, SSH/Jupyter notes, download commands. Note: pod name/IP/port in this file are STALE — re-fetch from API after restart. |
| `/workspace/flux-schnell/` | FLUX.1[schnell] weights (complete). Do not re-download. |
| `/workspace/Wan2.2-I2V-A14B/` | Wan2.2-I2V-A14B weights (partial — to be completed). |
| `DavidSage8/Wan2.2-I2V-A14B-bucket` | HF bucket holding the full Wan2.2 weights (~126GB). The authoritative source. Do not touch/delete — this is user-owned. |

## What NOT to do

- **Do NOT re-download FLUX** — it's done. Verify, don't re-fetch.
- **Do NOT download Wan2.2 from the Hub repo** (`Wan-AI/Wan2.2-I2V-A14B`) — use the user's bucket (`DavidSage8/Wan2.2-I2V-A14B-bucket`). The bucket is faster and bypasses any Hub repo gating.
- **Do NOT leave the pod running idle** — stop it as soon as the sync finishes. Billing is per-hour.
- **Do NOT trust stale IP/port values** from any file — the pod's network details change on every start. Always re-fetch from `GET api.runpod.io/v2/pods/xgcitppkl4lcm9`.
- **Do NOT use the Windows native ssh.exe with `-t`** — it hangs. Use the proxy SSH with `-tt` + `bash -lc`, or Jupyter Lab Terminal.

## Resume cue

**To resume: restart the pod (step 1), get fresh pod details (step 2), verify HF token (step 3), check what's on disk (step 4), then resume the Wan2.2 bucket sync (step 5).** The sync is the only thing left to do — FLUX is complete.

## Cost awareness

- Pod: $0.57/hr (RTX PRO 4000 Blackwell 24GB).
- Previous session: ~1.7 hrs ≈ $0.97, stopped at 00:19 UTC.
- Wan2.2 sync ~126GB over HF object storage: estimate 2-5 hours on the pod's network. Budget ~$1-3 to finish.
- Always stop the pod when the sync is done.

## Skills the next agent should load

- `guitarapp-stack` — has the RunPod operational reference (API endpoints, SSH notes, download commands). Call `skill_view(name='guitarapp-stack')`.
- `handoff` — for writing the next handoff if needed.

## Contact / owner

Heidi Hendrickson — GuitarApp owner. Key decisions (bucket use, HF token, model selection) were made by her this session.
