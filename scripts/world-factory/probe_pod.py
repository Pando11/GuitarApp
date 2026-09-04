#!/usr/bin/env python3
"""On-pod probe: confirm Wan2.2 generate.py exists + its real argument names and
task values, and that FLUX stills dir is present. Returns JSON the local side
can read. Run via pod_run --job."""
import os, json, subprocess, sys

WAN_DIR = "/workspace/Wan2.2-I2V-A14B"
GEN = os.path.join(WAN_DIR, "generate.py")
out = {}
out["wan_dir_exists"] = os.path.isdir(WAN_DIR)
out["generate_py_exists"] = os.path.isfile(GEN)
out["wan_dir_listing"] = sorted(os.listdir(WAN_DIR)) if out["wan_dir_exists"] else []
if out["generate_py_exists"]:
    try:
        r = subprocess.run([sys.executable, GEN, "--help"], capture_output=True, text=True, timeout=120)
        help_txt = (r.stdout + r.stderr)
        out["help_rc"] = r.returncode
        # extract --task choices if present
        import re
        m = re.search(r"--task\s+[^\n]*", help_txt)
        out["task_arg_line"] = m.group(0) if m else None
        out["help_tail"] = help_txt[-1500:]
    except Exception as e:
        out["help_error"] = str(e)
# FLUX stills check
stills = "/tmp/worlds/emerald-hollow/stills"
out["stills_dir_exists"] = os.path.isdir(stills)
out["stills_listing"] = sorted(os.listdir(stills)) if out["stills_dir_exists"] else []
print(json.dumps(out, indent=2))
print("PROBE_DONE")
