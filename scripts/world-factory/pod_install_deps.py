import sys, subprocess, json
# Run on the pod: install the HuggingFace stack needed to load FLUX.1[schnell]
# from /workspace/flux-schnell (a diffusers FluxPipeline, diffusers 0.30.0.dev0).
# torch 2.8+cu128 is already present; do NOT reinstall torch.
pkgs = [
    "safetensors",
    "huggingface_hub",
    "accelerate",
    "transformers==4.45.2",   # compatible with diffusers 0.30 dev; pin to avoid API drift
    "diffusers==0.30.0",
]
cmd = [sys.executable, "-m", "pip", "install", "--no-cache-dir"] + pkgs
print("RUN:", " ".join(cmd), flush=True)
r = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:\n", r.stdout[-3000:], flush=True)
print("STDERR:\n", r.stderr[-3000:], flush=True)
print("RETURNCODE:", r.returncode, flush=True)
# verify
import importlib.util as u
for m in ["diffusers", "transformers", "accelerate", "safetensors"]:
    print(m, bool(u.find_spec(m)), flush=True)
print("DONE_INSTALL", flush=True)
