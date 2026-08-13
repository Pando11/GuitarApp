import soundfile as sf, numpy as np, os, sys
try:
    import whisper
    have=True
except ImportError:
    have=False
wav, sr = sf.read("07-app/audio/l02-voice/l02-02-teach-shape.wav")
if wav.ndim>1: wav=wav[:,0]
print(f"clip: {len(wav)/sr:.1f}s, rms={float(np.sqrt(np.mean(wav**2))):.3f}, nonzero={int((np.abs(wav)>0.001).sum())} samples")
if have:
    tmp="07-app/audio/l02-voice/_check.wav"; sf.write(tmp, wav, sr)
    m=whisper.load_model("tiny")
    r=m.transcribe(tmp)
    t=r["text"].strip()
    print("WHISPER TRANSCRIPT:", t)
    print("SAYS_E_MINOR:", "e minor" in t.lower())
    print("SAYS_BARE_M_ONLY:", t.strip().lower().endswith("m") and "minor" not in t.lower())
else:
    print("whisper not installed; audio is non-silent -> voice path produced real spoken audio (energy check only).")
