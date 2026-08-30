#!/bin/bash
# GuitarApp cloud GPU worker setup
# Downloads FLUX.1[schnell] + Wan2.2-I2V onto the RunPod pod

set -e

LOGFILE="/tmp/setup-guitarapp.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "=== GPU ==="
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>&1 || nvidia-smi | head -8

echo "=== DISK ==="
df -h / | tail -1

echo "=== PYTHON ==="
python3 --version 2>/dev/null || python --version 2>/dev/null
pip3 --version 2>/dev/null || pip --version 2>/dev/null

echo "=== INSTALL CORE DEPS ==="
pip install --upgrade pip -q
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 -q 2>&1 | tail -3
pip install diffusers transformers accelerate huggingface_hub safetensors ftfy scipy -q 2>&1 | tail -3

echo "=== VERIFY TORCH CUDA ==="
python3 -c "import torch; print('torch', torch.__version__); print('cuda:', torch.cuda.is_available()); print('device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NONE')" 2>&1

echo "=== MODEL DIRS ==="
mkdir -p /models/flux-schnell /models/wan2.2-weights

echo "=== DOWNLOAD FLUX.1[schnell] (Apache-2.0) ==="
huggingface-cli download black-forest-labs/FLUX.1-schnell --local-dir /models/flux-schnell 2>&1 | tail -5
echo "FLUX size:"
du -sh /models/flux-schnell 2>/dev/null

echo "=== CLONE WAN2.2 REPO (Apache-2.0) ==="
cd /models
git clone --depth 1 https://github.com/Wan-Video/Wan2.2.git 2>&1 | tail -3
cd Wan2.2
pip install -r requirements.txt -q 2>&1 | tail -3

echo "=== DOWNLOAD WAN2.2 WEIGHTS ==="
# Try the main 480P/720P I2V model — download what's available
huggingface-cli download Wan-Video/Wan2.2-I2V-A14B --local-dir /models/wan2.2-weights 2>&1 | tail -5
echo "Wan2.2 size:"
du -sh /models/wan2.2-weights 2>/dev/null

echo "=== SUMMARY ==="
echo "FLUX.1[schnell]: /models/flux-schnell"
ls /models/flux-schnell/ | head -5
echo ""
echo "Wan2.2 repo: /models/Wan2.2"
echo "Wan2.2 weights: /models/wan2.2-weights"
ls /models/wan2.2-weights/ | head -5
echo ""
echo "=== ALL MODELS ON DISK ==="
du -sh /models/* 2>/dev/null
echo ""
echo "SETUP COMPLETE"
