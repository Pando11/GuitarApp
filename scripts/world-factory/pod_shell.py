#!/usr/bin/env python3
"""
pod_shell.py — Run a shell command on the RunPod pod via the Jupyter terminal
websocket, with retry/backoff for RunPod's flaky proxy (502s on both REST and
websocket handshakes).

Why: the pod only exposes Jupyter (no ssh shell driveable from bash). The kernel
websocket protocol is fussy; a terminal websocket is just a shell, which is far
more robust for running `python build-world-1.py`.

Usage:
  python3 pod_shell.py "nvidia-smi --query-gpu=name,memory.used --format=csv"
  python3 pod_shell.py --file run_me.sh
  python3 pod_shell.py "long command" --timeout 1800
"""
import os, sys, time, json, uuid, subprocess, urllib.request, urllib.error, http.cookiejar, websocket

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.abspath(os.path.join(_HERE, "..", ".."))
for _cand in (os.path.join(_REPO, ".env"), os.path.join(os.getcwd(), ".env")):
    if os.path.exists(_cand):
        with open(_cand) as _f:
            for _line in _f:
                _line = _line.strip()
                if not _line or _line.startswith("#") or "=" not in _line:
                    continue
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

POD_ID = os.environ["RUNPOD_POD_ID"]
PW = os.environ["RUNPOD_JUPYTER_PASSWORD"]

def _resolve_jupyter_port():
    """Resolve the live Jupyter (8888) public proxy port from the RunPod API.
    RunPod reassigns proxy ports on every pod restart, so a hard-coded port
    goes stale and every connection silently fails. Resolve from the API instead."""
    key = os.environ.get("RUNPOD_API_KEY", "")
    if key and POD_ID:
        try:
            out = subprocess.run(
                ["curl", "-s", "--max-time", "25", "-H", f"Authorization: Bearer {key}",
                 f"https://api.runpod.io/v2/pods/{POD_ID}"],
                capture_output=True, text=True, timeout=40).stdout
            d = json.loads(out)
            for x in (d.get("runtime", {}) or {}).get("ports", []) or []:
                if str(x.get("private")) == "8888" and x.get("public"):
                    return str(x["public"])
        except Exception:
            pass
    return "64412317"  # legacy fallback (stale after restart)

_BASE_PORT = _resolve_jupyter_port()
BASE = f"https://{POD_ID}-{_BASE_PORT}.proxy.runpod.net"
TERM_WS = f"wss://{POD_ID}-{_BASE_PORT}.proxy.runpod.net/api/terminals/websocket/1?token={PW}"


def _ready() -> bool:
    """Return True if the Jupyter proxy is responding (not 502)."""
    url = f"{BASE}/api/terminals?token={PW}"
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


def _ws_connect(retries=8):
    last = None
    for i in range(retries):
        # wait until proxy is healthy before attempting handshake
        for _ in range(6):
            if _ready():
                break
            time.sleep(3)
        try:
            ws = websocket.create_connection(TERM_WS, timeout=30, skip_utf8_validation=True)
            return ws
        except Exception as e:
            last = e
            time.sleep(3 + i * 2)
    raise RuntimeError(f"could not open terminal websocket after {retries} tries: {last}")


def run(cmd: str, timeout: int = 1200):
    ws = _ws_connect()
    try:
        # Ensure a terminal exists (create if needed)
        # Drain any banner
        sentinel = f"__POD_DONE_{uuid.uuid4().hex}__"
        # Send the command; echo sentinel so we know when it finished.
        full = cmd + f"\n echo {sentinel} $?\n"
        ws.send(full)
        buf = []
        t0 = time.time()
        while time.time() - t0 < timeout:
            try:
                m = ws.recv()
            except websocket.WebSocketTimeoutException:
                continue
            if isinstance(m, bytes):
                m = m.decode("utf-8", "replace")
            buf.append(m)
            if sentinel in "".join(buf):
                break
        out = "".join(buf)
        # Strip everything up to the command echo and after the sentinel line.
        return out
    finally:
        try:
            ws.close()
        except Exception:
            pass


def main():
    args = sys.argv[1:]
    timeout = 1200
    if "--timeout" in args:
        i = args.index("--timeout")
        timeout = int(args[i + 1])
        args = args[:i] + args[i + 2:]
    src = args[0] if args else None
    if src == "--file":
        cmd = open(args[1], encoding="utf-8").read()
    elif os.path.isfile(src):
        cmd = open(src, encoding="utf-8").read()
    else:
        cmd = src
    print(run(cmd, timeout=timeout))


if __name__ == "__main__":
    main()
