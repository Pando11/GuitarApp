#!/usr/bin/env python3
"""Self-contained capture: montage + measured analysis from a LOCAL video file.
Used when yt-dlp's default client chain 403s (YouTube SABR experiment / no JS runtime).
Mirrors yt-see/yt_analyze logic but skips the download step.
Usage: python3 capture_local.py LOCAL.mp4 --out base [--frames 16 --cols 4 --max-dur 180 --fps 2]
"""
import argparse, json, os, subprocess, sys, tempfile

TILE_W = 320
TILE_H = 180

def run(cmd, **kw):
    print("+ " + " ".join(cmd[:6]) + (" ..." if len(cmd) > 6 else ""), flush=True)
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_entries",
             "stream=width,height", "-show_entries",
             "format=duration", "-of", "json", path])
    try:
        d = json.loads(r.stdout)
        st = next(s for s in d.get("streams", []) if s.get("width"))
        return {"width": st.get("width"), "height": st.get("height"),
                "duration": float(d.get("format", {}).get("duration", 0) or 0)}
    except Exception:
        return {}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", default="out")
    ap.add_argument("--frames", type=int, default=16)
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--max-dur", type=int, default=180)
    ap.add_argument("--fps", type=float, default=2.0)
    args = ap.parse_args()

    vid = args.video
    meta = probe(vid)
    dur = meta.get("duration") or args.max_dur
    dur = min(dur, args.max_dur)
    tmp = tempfile.mkdtemp(prefix="cap_")

    # 1) montage frames
    n = args.frames
    frame_paths = []
    stamps = []
    margin = dur * 0.05
    span = dur - 2 * margin
    for i in range(n):
        t = margin + span * (i + 0.5) / n
        fp = os.path.join(tmp, f"f{i:02d}.jpg")
        run(["ffmpeg", "-y", "-ss", f"{t:.3f}", "-i", vid,
             "-frames:v", "1", "-vf", f"scale={TILE_W}:{TILE_H}", fp])
        if os.path.exists(fp):
            frame_paths.append(fp)
            stamps.append(t)
    n = len(frame_paths)
    inputs = []
    for fp in frame_paths:
        inputs += ["-i", fp]
    scale_parts = "".join(f"[{i}]scale={TILE_W}:{TILE_H}[s{i}];" for i in range(n))
    stack_inputs = "".join(f"[s{i}]" for i in range(n))
    layout = "|".join(f"{(i % args.cols) * TILE_W}_{(i // args.cols) * TILE_H}" for i in range(n))
    filterc = f"{scale_parts}{stack_inputs}xstack=inputs={n}:layout={layout}"
    montage = args.out + "_montage.jpg"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", filterc, "-frames:v", "1", montage])

    # 2) measured analysis
    raw = os.path.join(tmp, "raw.rgb")
    run(["ffmpeg", "-y", "-i", vid, "-vf", f"fps={args.fps},scale=64:36,format=rgb24",
         "-pix_fmt", "rgb24", "-f", "rawvideo", raw])
    W, H = 64, 36
    data = open(raw, "rb").read()
    fb = W * H * 3
    nframes = len(data) // fb
    buckets = {"green": 0, "warm": 0, "grey": 0, "blue": 0, "dark": 0, "bright": 0}
    warm_total = 0
    prev = None
    shots = []
    samples = []
    for i in range(nframes):
        fr = data[i * fb:(i + 1) * fb]
        r = g = b = wg = 0
        for p in range(0, len(fr), 3):
            rr = fr[p]; gg = fr[p + 1]; bb = fr[p + 2]
            r += rr; g += gg; b += bb
            if rr > 150 and bb < 120 and rr >= gg >= bb:
                wg += 1
        npix = len(fr) // 3
        r //= npix; g //= npix; b //= npix
        lum = (r * 0.299 + g * 0.587 + b * 0.114)
        warm_total += wg
        if lum < 40: buckets["dark"] += 1
        elif lum > 200: buckets["bright"] += 1
        if g > r and g > b: buckets["green"] += 1
        if r > 120 and g > 90 and b < 100 and r >= g: buckets["warm"] += 1
        if abs(r - g) < 18 and abs(g - b) < 18: buckets["grey"] += 1
        if b > r and b >= g: buckets["blue"] += 1
        t = i / args.fps
        samples.append({"t": round(t, 2), "r": r, "g": g, "b": b, "lum": round(lum, 1), "warm_glow_px": wg})
        if prev is not None:
            diff = sum(abs(fr[p] - prev[p]) for p in range(0, len(fr), 3)) / npix
            if diff > 22:
                shots.append({"cut_at": round(t, 2), "from_shot": len(shots)})
        prev = fr
    total = max(nframes, 1)
    palette = {k: round(100 * v / total, 1) for k, v in buckets.items()}
    warm_pct = round(100 * warm_total / (nframes * W * H if nframes else 1), 2)
    ar = sum(s["r"] for s in samples) // max(len(samples), 1)
    ag = sum(s["g"] for s in samples) // max(len(samples), 1)
    ab = sum(s["b"] for s in samples) // max(len(samples), 1)
    al = round(sum(s["lum"] for s in samples) / max(len(samples), 1), 1)
    out = {
        "source": meta,
        "sampled_seconds": round(nframes / args.fps, 1),
        "frames_sampled": nframes,
        "overall_avg_rgb": [ar, ag, ab],
        "overall_avg_luminance": al,
        "palette_pct": palette,
        "warm_glow_pct": warm_pct,
        "shot_changes": shots,
        "num_shots": len(shots) + 1,
        "sample_curve": samples,
    }
    with open(args.out + "_data.json", "w") as f:
        json.dump(out, f, indent=2)
    print(json.dumps(out, indent=2)[:1600])
    print("\nWROTE", os.path.abspath(montage), os.path.abspath(args.out + "_data.json"))

if __name__ == "__main__":
    main()
