import sys, subprocess
# Install missing deps for FLUX T5 tokenizer + protobuf, and point HF cache to /tmp
# (the /workspace volume is write-quota-blocked, so caches must live on container disk).
pkgs = ["sentencepiece", "protobuf"]
cmd = [sys.executable, "-m", "pip", "install", "--no-cache-dir"] + pkgs
print("RUN:", " ".join(cmd), flush=True)
r = subprocess.run(cmd, capture_output=True, text=True)
print(r.stdout[-1500:], flush=True)
print("RC", r.returncode, flush=True)
print("DONE_DEPS2", flush=True)
