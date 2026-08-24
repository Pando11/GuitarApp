// app.js — GuitarApp PWA entry point
//
// The phone PWA does NOT play the pre-rendered wav files in 07-app/audio/l02-voice/.
// Those are a separate proof artifact. The app speaks lessons via LIVE TTS:
//   app.js → speak(persona_line + caption) → POST /api/tts (Chatterbox/OpenAI server-side,
//   or device speechSynthesis fallback).
//
// So a "wrong wording in the audio" bug is fixed by editing the LESSON JSON caption,
// then bumping the SW cache — regenerating wavs changes nothing the phone hears.
//
// Every "pro" feature is gated behind isPremium() = app.dogfood || app.entitlement.isPremium():
//   - renderChat → guardPremium('chat', …) → paywall without dogfood (can't ask)
//   - voice (🗣 Tap-to-talk) button → if (isPremium()) → not rendered without dogfood (can't talk)
//   - 🎤 Verify this chord → if (src.chord && src.chord.frets && isPremium()) → hidden without dogfood (can't "listen")
//
// PRACTICE UI (file://): ES modules blocked over file:// (CORS origin "null"), so the UI uses
// INLINE MIRRORS of the engine. The real on-device CREPE-class listener is mirrored as a browser
// twin (listener-twin.js) — a byte-faithful IIFE transform of the TESTED listener-real.mjs.
// The UI wires getUserMedia → AudioContext → ScriptProcessorNode(4096) → listener.pushFrame().
//
// STATUS: PLACEHOLDER — real file lost in PC transfer (2026-08-23). Scaffolded from guitarapp skill description.
// The real app.js passed app-smoke.mjs (20/0 ✅) + fidelity.mjs (48/0 ✅) per HANDOFF.md 2026-08-16.
// That truth is intact; the file is not.

(function (global) {
  "use strict";

  const app = {
    dogfood: location.search.includes("dogfood=1"),
    entitlement: {
      isPremium: () => false, // stubs until RevenueCat live keys (HANDOFF.md open item #2)
    },
  };

  function isPremium() {
    return app.dogfood || app.entitlement.isPremium();
  }

  function guardPremium(feature, fallback) {
    if (isPremium()) return true;
    console.warn(`[app] ${feature} gated — not premium (no dogfood)`);
    if (fallback) fallback();
    return false;
  }

  // ── TTS (live, not wav playback) ──────────────────────────────────────────

  function speak(text) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      return;
    }
    // Fallback: POST to server-side TTS (Chatterbox/OpenAI)
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "chatterbox-builtin" }),
    })
      .then((r) => r.blob())
      .then((blob) => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play().catch(console.warn);
      })
      .catch(console.warn);
  }

  // ── Lesson loading ────────────────────────────────────────────────────────

  function loadLessons() {
    return fetch("./content/lessons/manifest.json")
      .then((r) => r.json())
      .then((manifest) => Promise.all(manifest.lessons.map((l) => fetch(`./content/lessons/${l.file}`).then((r) => r.json()))))
      .then((lessons) => ({ manifest, lessons }));
  }

  // ── Practice drill loading ────────────────────────────────────────────────

  function loadPractice() {
    return fetch("./content/practice/index.json")
      .then((r) => r.json())
      .then((index) => Promise.all(index.drills.map((d) => fetch(`./content/practice/${d.file}`).then((r) => r.json()))))
      .then((drills) => ({ index, drills }));
  }

  // ── Chord verification (user taps "Verify this chord") ───────────────────

  function verifyChord(chordName) {
    if (!isPremium()) {
      console.warn("[app] chord verification gated — not premium");
      return;
    }
    // Load the chord-theory-check.js data and render the fretboard
    // The fretboard diagram is rendered from the lesson JSON's chords[].fingers
    // and is the precision reference for fingerings (AMENDMENT-06).
    return fetch("./core/chord-theory-check.js")
      .then((r) => r.text())
      .then((source) => {
        // In real app: import the module and call verifyChord(chordName)
        // Here: stub — the actual logic is in 06-prototypes/step0/schema/chord-theory-check.js
        console.log(`[app] verifyChord stub: ${chordName}`);
        return { chord: chordName, frets: null, verified: false };
      });
  }

  // ── Chat (talk-to-the-coach) ──────────────────────────────────────────────

  function renderChat(message) {
    if (!guardPremium("chat", () => console.warn("[app] chat paywalled"))) return;
    // The chat serves real drills from lesson JSON via drillSelector.js (Loop A).
    // chatEngine.js reply() returns a lesson-linked drill, not generic encouragement.
    console.log(`[app] chat: ${message}`);
  }

  // ── Expose ────────────────────────────────────────────────────────────────

  global.GuitarApp = global.GuitarApp || {};
  Object.assign(global.GuitarApp, {
    app,
    isPremium,
    speak,
    loadLessons,
    loadPractice,
    verifyChord,
    renderChat,
  });
})(typeof window !== "undefined" ? window : this);
