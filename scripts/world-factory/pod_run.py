#!/usr/bin/env python3
"""
pod_run.py — Execute Python on the RunPod Jupyter pod.

Why this exists: RunPod exposes Jupyter (no ssh shell we can drive from bash).
The kernel websocket is the only way to run GPU code. The RunPod proxy is
flaky (intermittent 502s on both REST and websocket handshakes), so every
network call retries with backoff.

Modes:
  python3 pod_run.py "print('hi')"                 # quick run, returns stdout
  python3 pod_run.py script.py                     # run a local file's contents
  python3 pod_run.py --deploy local.py remote.py   # write file to pod, run it
  python3 pod_run.py --job job.py /tmp/x.log --env HF_HOME=/tmp/hf --timeout 400
        # fire a LONG job in a persistent kernel that logs to /tmp/x.log on the
        # pod; poll the log until JOB_DONE. Kernel is NOT deleted mid-run.
  python3 pod_run.py --kill <kernel-id>            # delete a persistent kernel

Env (from Desktop/GuitarApp/.env): RUNPOD_API_KEY, RUNPOD_POD_ID, RUNPOD_JUPYTER_PASSWORD
"""
import os, sys, json, time, base64, urllib.request, urllib.error, http.cookiejar, websocket

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
BASE = f"https://{POD_ID}-64412317.proxy.runpod.net"

_COOKIE_JAR = http.cookiejar.CookieJar()
_OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_COOKIE_JAR))

MSG_ID = 1
SESSION = "pod-run-%d" % int(time.time())


def _api(path, method="GET", data=None, retries=12):
    url = f"{BASE}{path}" + (f"?token={PW}" if "?" not in path else f"&token={PW}")
    last = None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        if method != "GET":
            xsrf = None
            for c in _COOKIE_JAR:
                if c.name == "_xsrf":
                    xsrf = c.value
            if xsrf:
                req.add_header("X-XSRF-Token", xsrf)
        try:
            with _OPENER.open(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (502, 503):
                time.sleep(4 + attempt * 3)
                continue
            raise
    raise last


def _api_is_ready() -> bool:
    url = f"{BASE}/api/status?token={PW}"
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    try:
        with _OPENER.open(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


def read_pod_file(remote_path: str) -> str:
    """Read a (text) file from the pod via the Jupyter contents GET API."""
    raw = _api(f"/api/contents{remote_path}", method="GET")
    d = json.loads(raw)
    if d.get("format") == "base64":
        return base64.b64decode(d["content"]).decode("utf-8", "replace")
    return d.get("content", "")


def _open_kernel_ws(kid):
    ws_url = f"wss://{POD_ID}-64412317.proxy.runpod.net/api/kernels/{kid}/channels?token={PW}"
    for attempt in range(8):
        try:
            return websocket.create_connection(ws_url, timeout=30, skip_utf8_validation=True)
        except Exception:
            if attempt == 7:
                raise
            for _ in range(6):
                if _api_is_ready():
                    break
                time.sleep(3)
            time.sleep(2 + attempt * 2)
    raise RuntimeError("could not open kernel websocket")


def _send(ws, msg_type, content):
    global MSG_ID
    MSG_ID += 1
    msg = {
        "header": {"msg_id": f"client-{MSG_ID}", "username": "hermes", "session": SESSION,
                   "msg_type": msg_type, "version": "5.0"},
        "parent_header": {"msg_id": "exec-%d" % int(time.time() * 1000), "session": SESSION,
                          "username": "hermes", "msg_type": "execute_request", "version": "5.0"},
        "metadata": {}, "content": content,
    }
    ws.send(json.dumps(msg))


def run_code(code: str, timeout: int = 600):
    """Run code in a fresh kernel, return combined stdout/stderr. Kernel deleted after."""
    _api("/api/kernels", method="GET")
    kid = json.loads(_api("/api/kernels", method="POST", data=b"{}"))["id"]
    ws = _open_kernel_ws(kid)
    outputs = []
    _send(ws, "execute_request", {"code": code, "silent": False, "store_history": True,
                                  "user_expressions": {}, "allow_stdin": False})
    saw_reply = False
    deadline = time.time() + timeout
    while time.time() < deadline and not saw_reply:
        try:
            raw = ws.recv()
        except websocket.WebSocketTimeoutException:
            continue
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", "replace")
        m = json.loads(raw)
        mt = m.get("header", {}).get("msg_type") or m.get("msg_type")
        c = m.get("content", {})
        if mt == "stream":
            outputs.append(c.get("text", ""))
        elif mt in ("execute_result", "display_data"):
            outputs.append(json.dumps(c.get("data", {}), ensure_ascii=False))
        elif mt == "error":
            outputs.append("ERROR: " + "\n".join(c.get("traceback", [c.get("ename", ""), c.get("evalue", "")])))
        elif mt == "execute_reply":
            if c.get("status") == "error":
                outputs.append("ERROR: " + str(c.get("evalue")))
            saw_reply = True
            break
    ws.close()
    try:
        _api(f"/api/kernels/{kid}", method="DELETE")
    except Exception:
        pass
    return "\n".join(outputs)


def fire_and_forget(code: str, log_path: str, env: dict = None):
    """Start a long job in a persistent kernel that writes stdout/stderr to log_path
    on the pod. Returns the kernel id (NOT deleted). Poll read_pod_file(log_path)
    until 'JOB_DONE', then call kill_job(kid)."""
    _api("/api/kernels", method="GET")
    kid = json.loads(_api("/api/kernels", method="POST", data=b"{}"))["id"]
    ws = _open_kernel_ws(kid)
    env_line = "".join(f"os.environ['{k}']='{v}'\n" for k, v in (env or {}).items())
    wrapped = (
        "import sys, os\n" + env_line +
        f"os.makedirs(os.path.dirname('{log_path}'), exist_ok=True)\n"
        f"_logf = open('{log_path}', 'w')\n"
        "sys.stdout = _logf\n"
        "sys.stderr = _logf\n"
        "try:\n"
        "    exec(compile(__code__, '<job>', 'exec'))\n"
        "except Exception:\n"
        "    import traceback; traceback.print_exc()\n"
        "finally:\n"
        "    _logf.write('\\nJOB_DONE\\n'); _logf.flush(); _logf.close()\n"
    )
    wrapped = wrapped.replace("__code__", repr(code))
    _send(ws, "execute_request", {"code": wrapped, "silent": False, "store_history": True,
                                  "user_expressions": {}, "allow_stdin": False})
    t0 = time.time()
    started = False
    while time.time() - t0 < 30:
        try:
            raw = ws.recv()
        except websocket.WebSocketTimeoutException:
            continue
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", "replace")
        m = json.loads(raw)
        mt = m.get("header", {}).get("msg_type") or m.get("msg_type")
        if mt in ("status", "execute_reply"):
            started = True
            break
    ws.close()
    print(f"job started in kernel {kid} (confirmed={started})", file=sys.stderr)
    return kid


def kill_job(kid: str):
    try:
        _api(f"/api/kernels/{kid}", method="DELETE")
    except Exception:
        pass


def deploy_and_run(local_path, remote_path, run_args="", timeout=600):
    with open(local_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    write_code = (
        "import base64, os\n"
        f"data = base64.b64decode('{b64}')\n"
        f"os.makedirs(os.path.dirname('{remote_path}'), exist_ok=True)\n"
        f"open('{remote_path}','wb').write(data)\n"
        f"print('DEPLOYED', '{remote_path}', len(data))\n"
    )
    print(run_code(write_code, timeout=120), file=sys.stderr)
    run_code(
        f"import subprocess,sys; r=subprocess.run([sys.executable,'{remote_path}'"
        f"{', '+run_args if run_args else ''}], capture_output=True, text=True); "
        f"print(r.stdout); print(r.stderr); print('RC', r.returncode)",
        timeout=timeout,
    )


def main():
    args = sys.argv[1:]
    timeout = 600
    if "--timeout" in args:
        i = args.index("--timeout")
        timeout = int(args[i + 1])
        args = args[:i] + args[i + 2:]
    if not args:
        print("usage: pod_run.py <code-or-file.py> [--timeout N]", file=sys.stderr)
        print("       pod_run.py --deploy <local.py> <remote.py> [run-args] [--timeout N]", file=sys.stderr)
        print("       pod_run.py --job <local.py|code> <log-path> [--env K=V ...] [--timeout N]", file=sys.stderr)
        print("       pod_run.py --kill <kernel-id>", file=sys.stderr)
        sys.exit(2)
    if args[0] == "--deploy":
        deploy_and_run(args[1], args[2], args[3] if len(args) > 3 else "", timeout=timeout)
        return
    if args[0] == "--job":
        src, log_path = args[1], args[2]
        env = {}
        rest = args[3:]
        if "--env" in rest:
            for kv in rest[rest.index("--env") + 1:]:
                if "=" in kv:
                    k, v = kv.split("=", 1)
                    env[k] = v
        code = open(src, encoding="utf-8").read() if os.path.isfile(src) else src
        kid = fire_and_forget(code, log_path, env=env)
        deadline = time.time() + timeout
        last = ""
        while time.time() < deadline:
            try:
                log = read_pod_file(log_path)
            except Exception:
                log = ""
            if log != last:
                sys.stdout.write(log[len(last):])
                sys.stdout.flush()
                last = log
            if "JOB_DONE" in log:
                break
            time.sleep(8)
        print(f"\n[job kernel {kid} finished]", file=sys.stderr)
        return
    if args[0] == "--kill" and len(args) > 1:
        kill_job(args[1])
        print(f"killed kernel {args[1]}")
        return
    src = args[0]
    code = open(src, encoding="utf-8").read() if os.path.isfile(src) else src
    print(run_code(code, timeout=timeout))


if __name__ == "__main__":
    main()
