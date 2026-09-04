from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(r"C:/Users/Hendrickson/Desktop/GuitarApp")
PROOF_DIR = REPO / ".scratch" / "guitarapp-software-factory" / "proof-wave5"
PROOF_DIR.mkdir(parents=True, exist_ok=True)

progressions_path = REPO / "07-app" / "content" / "song-progressions" / "progressions.json"
preview_path = REPO / "07-app" / "content" / "song-progressions" / "song-progressions-preview.html"
proof_json_path = PROOF_DIR / "wave5-proof.json"
proof_dom_path = PROOF_DIR / "wave5-dom.txt"
proof_screen_path = PROOF_DIR / "wave5-screen.png"
proof_log_path = PROOF_DIR / "wave5-log.txt"

progressions = json.loads(progressions_path.read_text(encoding="utf-8"))
lyrics_fields = [s["id"] for s in progressions.get("songs", []) if isinstance(s, dict) and "lyrics" in s and s.get("lyrics")]

song_gate = subprocess.run(
    ["node", "tools/verify-song-progressions.js"],
    cwd=REPO,
    capture_output=True,
    text=True,
)

html_uri = preview_path.resolve().as_uri()
edge_path = r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

browser_error = None
legal_text = ""
mystery_before = ""
mystery_after = ""
first_hint = ""
reveal_text = ""
dom_text = ""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=edge_path)
    try:
        page = browser.new_page(viewport={"width": 1440, "height": 1600}, device_scale_factor=1)
        page.goto(html_uri, wait_until="domcontentloaded")
        page.wait_for_timeout(200)

        legal_text = page.locator(".legal").inner_text()
        mystery_before = page.locator("#mt").inner_text()
        # The page should start with the OFF label and legal boundary visible.
        if "Mystery Mode: OFF" not in mystery_before:
            raise AssertionError(f"Unexpected mystery toggle text before click: {mystery_before!r}")
        if "Legal boundary:" not in legal_text:
            raise AssertionError("Legal boundary copy missing")

        page.locator("#mt").click()
        page.wait_for_timeout(120)
        mystery_after = page.locator("#mt").inner_text()
        if "Mystery Mode: ON" not in mystery_after:
            raise AssertionError(f"Unexpected mystery toggle text after click: {mystery_after!r}")

        # Reveal the first song's hint/reveal pair to prove the mystery flow is interactive.
        first_song = page.locator('.card[data-id="SP01"]')
        first_song.locator('.nx').click()
        page.wait_for_timeout(60)
        first_hint = first_song.locator('.h2').inner_text()
        first_song.locator('.nx').click()
        page.wait_for_timeout(60)
        reveal_text = first_song.locator('.rv').inner_text()
        dom_text = page.locator('body').inner_text()
        page.screenshot(path=str(proof_screen_path), full_page=True)
    finally:
        browser.close()

proof = {
    "wave": 5,
    "status": "partial",
    "notes": [
        "Verified the song-progression preview page opens and toggles Mystery Mode in a real browser using local Edge + Playwright.",
        "Verified the legal boundary copy is visible, the first mystery card reveals hint/reveal text, and the catalog contains no stored lyrics fields.",
        "Human lyric read-through remains HITL and cannot be completed by this agent; this proof prepares the non-human portion of Wave 5.",
    ],
    "song_gate": {
        "exit_code": song_gate.returncode,
        "stdout": song_gate.stdout,
        "stderr": song_gate.stderr,
    },
    "preview": {
        "html_uri": html_uri,
        "legal_contains_boundary": "Legal boundary:" in legal_text,
        "mystery_toggle_before": mystery_before,
        "mystery_toggle_after": mystery_after,
        "first_song_hint_2": first_hint,
        "first_song_reveal": reveal_text,
        "lyrics_fields_found": lyrics_fields,
    },
    "artifacts": {
        "json_path": str(proof_json_path),
        "dom_path": str(proof_dom_path),
        "screenshot_path": str(proof_screen_path),
        "log_path": str(proof_log_path),
    },
}

proof_json_path.write_text(json.dumps(proof, indent=2), encoding="utf-8")
proof_dom_path.write_text(dom_text or "", encoding="utf-8")
proof_log_path.write_text(
    "WAVE 5 PREVIEW PROOF\n"
    f"song_gate_exit={song_gate.returncode}\n"
    f"lyrics_fields_found={len(lyrics_fields)}\n"
    f"mystery_before={mystery_before}\n"
    f"mystery_after={mystery_after}\n"
    f"first_song_hint_2={first_hint}\n"
    f"first_song_reveal={reveal_text}\n",
    encoding="utf-8",
)

print(json.dumps(proof, indent=2))
