#!/usr/bin/env python3
"""
pull_asset.py — pull binary assets (PNG/MP4) from the RunPod pod back to this
machine, via the Jupyter contents API (base64). The pod volume /workspace is
write-quota-blocked (Errno 122), so generation writes to the pod's ephemeral
/tmp; this is how we get it home.

Usage:
  python pull_asset.py <remote_path> <local_path>
  python pull_asset.py /tmp/worlds/emerald-hollow/stills 07-app/assets/worlds/emerald-hollow/stills
"""
import os, sys, json, base64, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "scripts", "world-factory"))
import pod_run as P


def pull_file(remote_path: str, local_path: str):
    raw = P._api(f"/api/contents{remote_path}", method="GET")
    d = json.loads(raw)
    if d.get("type") == "directory":
        os.makedirs(local_path, exist_ok=True)
        pulled = 0
        for child in d.get("content", []):
            if child.get("type") == "file":
                pull_file(remote_path.rstrip("/") + "/" + child["name"],
                          os.path.join(local_path, child["name"]))
                pulled += 1
        print(f"[pull] dir {remote_path} -> {local_path} ({pulled} files)")
        return
    # file
    fmt = d.get("format")
    if fmt == "base64":
        data = base64.b64decode(d["content"])
    else:
        data = d.get("content", "").encode("utf-8", "replace")
    os.makedirs(os.path.dirname(local_path) or ".", exist_ok=True)
    with open(local_path, "wb") as f:
        f.write(data)
    print(f"[pull] {remote_path} -> {local_path} ({len(data)} bytes)")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: pull_asset.py <remote_path> <local_path>", file=sys.stderr)
        sys.exit(2)
    pull_file(sys.argv[1], sys.argv[2])
