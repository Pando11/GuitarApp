#!/usr/bin/env python3
"""
relocate_pod.py — clone the World-1 pod onto a DIFFERENT (free) GPU in EU-RO-1,
reusing the same persistent /workspace volume so the downloaded models stay put.

Why: EU-RO-1 has no free RTX PRO 4000 Blackwell right now (start returns 400
"not enough free GPUs"). Same datacenter => same volume mount, no re-download.
RunPod charges $0/hr while old pod is EXITED.

Steps:
  1. Read the EXITED source pod config (image, ports, env, volume).
  2. Try candidate GPUs in order until one STARTS successfully.
  3. On success, write the new pod id + jupyter port to /tmp/relocate_result.json
     and print RELAY:NEW_POD_ID.
"""
import os, sys, json, time, urllib.request, urllib.error

_HERE = os.path.dirname(os.path.abspath(__file__))
for _cand in (os.path.join(_HERE, "..", "..", ".env"), os.path.join(os.getcwd(), ".env")):
    if os.path.exists(_cand):
        with open(_cand) as _f:
            for _line in _f:
                _line = _line.strip()
                if not _line or _line.startswith("#") or "=" not in _line:
                    continue
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

KEY = os.environ["RUNPOD_API_KEY"]
SRC = os.environ.get("RUNPOD_POD_ID", "xgcitppkl4lcm9")
T = os.path.join(os.environ.get("LOCALAPPDATA", "/tmp"), "Temp")

# GPU candidates: 24GB-class first (smooth Wan2.2-14B @720p, no re-download),
# then 20GB/16GB fallbacks (sequential cpu_offload) only if the 24GB cards are full.
CANDIDATES = [
    "NVIDIA RTX PRO 4500 Blackwell",
    "NVIDIA RTX PRO 6000 Blackwell Workstation Edition",
    "NVIDIA RTX 4000 Ada Generation",
    "NVIDIA RTX A4000",
]

def api(path, method="GET", data=None):
    url = f"https://api.runpod.io/v2{path}"
    req = urllib.request.Request(url, data=(json.dumps(data).encode() if data is not None else None), method=method)
    req.add_header("Authorization", f"Bearer {KEY}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8", "replace") or "{}")
    except Exception as e:
        return 0, {"error": str(e)}

# 1. read source config
st, src = api(f"/pods/{SRC}")
src = (src.get("pods") or [src])[0]
print(f"[relocate] source pod {SRC} status={src.get('status')}")
image = src.get("image") or "runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404"
ports = src.get("ports") or ["8888/http"]
env = src.get("env") or {}
vol = (src.get("mounts") or {}).get("network") or []
volume_id = vol[0].get("volumeId") if vol else None
vol_path = vol[0].get("path") if vol else "/workspace"
print(f"[relocate] image={image} ports={ports} volPath={vol_path} volId={volume_id}")

# 2. try candidates
for gpu in CANDIDATES:
    payload = {
        "name": f"guitarapp-world1-{gpu.split()[-2].lower() if 'PRO' in gpu else 'relocated'}",
        "image": image,
        "gpuTypeId": gpu,
        "gpuCount": 1,
        "ports": ports,
        "containerDiskInGb": src.get("containerDiskInGb") or 40,
        "env": env,
        "dataCenterId": "EU-RO-1",
    }
    if volume_id:
        payload["networkVolumeId"] = volume_id
    else:
        payload["volumeInGb"] = 50
        payload["volumeMountPath"] = vol_path
    print(f"[relocate] trying GPU={gpu} ...", flush=True)
    code, resp = api("/pods", "POST", payload)
    print(f"  POST -> HTTP {code}: {json.dumps(resp)[:200]}", flush=True)
    if code in (200, 201) and resp.get("id"):
        new_id = resp["id"]
        # persist result
        out = {"old_pod": SRC, "new_pod": new_id, "gpu": gpu, "volume_id": volume_id, "status": resp.get("status")}
        with open(os.path.join(T, "relocate_result.json"), "w") as f:
            json.dump(out, f, indent=2)
        print(f"RELAY:NEW_POD_ID={new_id} GPU={gpu}")
        # update .env POD_ID pointer so pod_run.py uses it
        _envp = os.path.join(_HERE, "..", "..", ".env")
        if os.path.exists(_envp):
            txt = open(_envp).read()
            if "RUNPOD_POD_ID=" in txt:
                import re
                txt2 = re.sub(r"RUNPOD_POD_ID=.*", f"RUNPOD_POD_ID={new_id}", txt)
                open(_envp, "w").write(txt2)
                print(f"[relocate] updated .env RUNPOD_POD_ID -> {new_id}")
        sys.exit(0)
    # not started (capacity) -> try next
    time.sleep(3)

print("[relocate] ALL candidates rejected (capacity). Leaving EXITED pod as-is.")
sys.exit(2)
