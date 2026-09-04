#!/usr/bin/env bash
set -e
cd "C:/Users/Hendrickson/Desktop/GuitarApp"
export FAL_KEY="$(grep '^FAL_KEY=' .env | head -1 | cut -d= -f2-)"
echo "FAL_KEY length: ${#FAL_KEY}"
python scripts/world-factory/fal_stage3.py
