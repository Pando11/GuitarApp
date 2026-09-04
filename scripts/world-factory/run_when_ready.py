#!/usr/bin/env python3
"""
run_when_ready.py — wait for RunPod GPU capacity, then build World 1 Stage 1.

1. Retry pod START until RunPod grants a GPU (free while EXITED, $0/hr).
2. Wait for the Jupyter container to come up (status 200).
3. Deploy build-world-1.py to the pod and run Stage 1 (all 4 brief stills).
4. Pull the 4 palette-locked stills + manifest back into the repo assets dir.

Run in background; notifies on exit. Logs to /tmp/run_when_ready.log.
"""
import os, sys, json, time, base64, io

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)
import pod_run  # resolves .env, provides run_code/fire_and_forget/read_pod_file/_api

LOG = "/tmp/run_when_ready.log"
def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass

POD_ID = pod_run.POD_ID
KEY = os.environ.get("RUNPOD_API_KEY", "")

def api_get(path):
    return pod_run._api(path, "GET")

def api_post(path, data=None):
    return pod_run._api(path, "POST", data=(json.dumps(data).encode() if data is not None else None))

def pod_status():
    d = json.loads(api_get(f"https://api.runpod.io/v2/pods/{POD_ID}").split("]")[-1]
                 if False else _curl_get(f"https://api.runpod.io/v2/pods/{POD_ID}"))
    return d

def _curl_get(url):
    import urllib.request
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")

# ---- 1. retry START until a GPU is granted ---------------------------------
# RunPod behavior:
#   - 400 "not enough free GPUs"  => capacity busy in this region. RETRY.
#   - 403 / error code 1010       => transient Cloudflare proxy glitch (key is
#                                    valid; GET /v2/pods/<id> returns 200). RETRY.
#   - 401                          => auth failure. FATAL (don't hammer).
#   - 2xx on POST action          => start accepted; poll for RUNNING.
MAX_START = 80
START_WAIT = 45
started = False
for i in range(1, MAX_START + 1):
    try:
        out = _curl_get(f"https://api.runpod.io/v2/pods/{POD_ID}")
        d = json.loads(out)
        st = d.get("status")
    except Exception as e:
        st = f"err:{e}"
    if st == "RUNNING":
        log(f"pod already RUNNING (attempt {i})")
        started = True
        break
    # try to start
    try:
        import urllib.request, urllib.error
        # RunPod's edge sits behind Cloudflare, which 403/1010-blocks requests that
        # lack a browser User-Agent. curl works because it sends one; urllib must too.
        req = urllib.request.Request(
            f"https://api.runpod.io/v2/pods/{POD_ID}/action",
            data=json.dumps({"action": "start"}).encode(),
            headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json",
                     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                   "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"},
            method="POST")
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read().decode())
        log(f"start attempt {i}: {resp}")
        # Any 2xx = accepted. RunPod returns success without a literal "starting"
        # status, so treat non-error reply as accepted and go verify RUNNING.
        started = True
        break
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        log(f"start attempt {i} HTTP {e.code}: {body[:160]}")
        if e.code == 401:
            log("  AUTH 401 — key rejected. Aborting (do not retry).")
            sys.exit(4)
        # 400 capacity + 403/1010 transient proxy glitch => both RETRY
        log(f"  transient/retryable (code {e.code}) -> wait {START_WAIT}s")
        time.sleep(START_WAIT)
        continue
    except Exception as e:
        log(f"start attempt {i} exception: {e} -> wait {START_WAIT}s")
        time.sleep(START_WAIT)
        continue

if not started:
    log("GAVE UP: could not obtain a GPU after retries. Pod left EXITED ($0/hr). "
        "Retry later or relocate the pod to a different region. Exiting.")
    sys.exit(2)

# ---- 2. wait for Jupyter container to serve --------------------------------
log("pod starting; waiting for Jupyter (8888) to serve...")
ready = False
for i in range(1, 40):
    # The proxy port reassigns on every restart, so re-resolve each iteration.
    port = pod_run._resolve_jupyter_port()
    pod_run._BASE_PORT = port
    pod_run.BASE = f"https://{POD_ID}-{port}.proxy.runpod.net"
    pod_run.WS_BASE = f"wss://{POD_ID}-{port}.proxy.runpod.net"
    if pod_run._api_is_ready():
        # also confirm a kernel can be created
        try:
            _curl_kernels()
            ready = True
            break
        except Exception:
            pass
    log(f"  jupyter not ready yet (try {i}, port={port})")
    time.sleep(15)
if not ready:
    log("Jupyter did not come up in time. Exiting; pod is RUNNING, safe to retry.")
    sys.exit(3)

def _curl_kernels():
    import urllib.request
    cf = pod_run._COOKIE_JAR
    url = f"{pod_run.BASE}/api/kernels?token={pod_run.PW}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode()

# ---- 3. deploy + run Stage 1 ----------------------------------------------
LOCAL_BUILD = os.path.join(_HERE, "build-world-1.py")
REMOTE_BUILD = "/tmp/build-world-1.py"
log("deploying build-world-1.py to pod...")
try:
    pod_run.deploy_and_run(LOCAL_BUILD, REMOTE_BUILD, timeout=180)
    log("deploy OK")
except Exception as e:
    log(f"deploy failed: {e}")

log("running Stage 1 (all 4 brief stills) as a persistent job...")
code = open(LOCAL_BUILD, encoding="utf-8").read()
log_path = "/tmp/build_stage1.log"
kid = pod_run.fire_and_forget(code, log_path, env={"WORLD_OUT": "/tmp/worlds/emerald-hollow"})
deadline = time.time() + 2400  # 40 min
last = ""
done = False
while time.time() < deadline:
    try:
        logdata = pod_run.read_pod_file(log_path)
    except Exception:
        logdata = ""
    if logdata != last:
        sys.stdout.write(logdata[len(last):])
        sys.stdout.flush()
        last = logdata
    if "JOB_DONE" in logdata:
        done = True
        break
    time.sleep(10)
log(f"Stage 1 job finished={done} (kernel {kid})")
pod_run.kill_job(kid)

# ---- 4. pull stills + manifest back into repo -----------------------------
OUT_DIR = os.path.normpath(os.path.join(_HERE, "..", "..", "07-app", "assets", "worlds", "emerald-hollow", "stills"))
os.makedirs(OUT_DIR, exist_ok=True)
SHOTS = ["sage_porch", "coldopen_walk", "twoshot", "sage_charsheet"]
POD_OUT = "/tmp/worlds/emerald-hollow/stills"
pulled = 0
for name in SHOTS:
    for fn in (f"{name}.palette.png", f"{name}.png"):
        rpath = f"{POD_OUT}/{fn}"
        try:
            raw = pod_run._api(f"/api/contents{rpath}", "GET")
            d = json.loads(raw)
            if d.get("format") == "base64":
                data = base64.b64decode(d["content"])
                dst = os.path.join(OUT_DIR, fn)
                with open(dst, "wb") as f:
                    f.write(data)
                log(f"pulled {fn} -> {dst} ({len(data)} bytes)")
                pulled += 1
        except Exception as e:
            log(f"pull {fn} failed: {e}")
# manifest
try:
    raw = pod_run._api(f"/api/contents{POD_OUT}/manifest.json", "GET")
    d = json.loads(raw)
    if d.get("format") == "base64":
        data = base64.b64decode(d["content"])
        with open(os.path.join(OUT_DIR, "manifest.json"), "wb") as f:
            f.write(data)
        log("pulled manifest.json")
except Exception as e:
    log(f"pull manifest failed: {e}")

log(f"DONE. pulled {pulled} still files into {OUT_DIR}")
