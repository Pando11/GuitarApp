// app.js — GuitarApp PWA shell
//
// Live TTS path:
//   speak(persona line + lesson copy) -> speechSynthesis fallback OR POST /api/tts
// Voice choice is locked by the current teacher profile. For World 1 that teacher is
// Sage (T1) in Emerald Hollow, using a Chatterbox built-in voice.
//
// Dogfood unlock:
//   isPremium() = app.dogfood || app.entitlement.isPremium()
// This keeps chat / talk / chord-verify accessible in the shipped preview.

(function (global) {
  "use strict";

  const CORE_TEACHER_PATHS = [
    "./content/teachers/T1.json",
    "./content/teachers/T2.json",
    "./content/teachers/T3.json"
  ];
  const PACK_TEACHER_PATHS = [
    "./content/packs/blues/T4.json",
    "./content/packs/country/T5.json"
  ];
  const PACKS = [
    { id: "blues", title: "Blues Pack", teacherId: "T4", manifest: "./content/packs/blues/T4.json" },
    { id: "country", title: "Country Pack", teacherId: "T5", manifest: "./content/packs/country/T5.json" }
  ];
  const DEFAULT_VOICE = Object.freeze({
    teacher_id: "T1",
    provider: "chatterbox",
    voice_id: "builtin-sage-emerald-v1",
    style: "warm, calm, medium-slow"
  });

  const entitlement = {
    premiumOverride: false,
    isPremium: function () {
      return this.premiumOverride === true;
    },
    canAccessFeature: function (feature) {
      if (feature === "tuner") return true;
      return app.dogfood || this.isPremium();
    },
    canAccessLesson: function (lessonId) {
      if (app.dogfood || this.isPremium()) return true;
      return /^L0?1\b/.test(String(lessonId || ""));
    },
    startFreeTrial: function () {
      this.premiumOverride = true;
      return true;
    },
    cancel: function () {
      this.premiumOverride = false;
      return false;
    }
  };

  const app = {
    dogfood: typeof location !== "undefined" && location.search.includes("dogfood=1"),
    entitlement: entitlement,
    currentTeacherId: "T1",
    currentTeacher: null,
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPremium() {
    return app.dogfood || app.entitlement.isPremium();
  }

  function guardPremium(feature, fallback) {
    if (isPremium()) return true;
    console.warn("[app] " + feature + " gated — not premium (no dogfood)");
    if (fallback) fallback();
    return false;
  }

  function normalizeTeacherProfile(raw) {
    const teacher = raw && typeof raw === "object" ? clone(raw) : {};
    teacher.id = teacher.id || "T1";
    teacher.name = teacher.name || "Sage";
    teacher.voice = teacher.voice || clone(DEFAULT_VOICE);
    if (!teacher.voice.provider) teacher.voice.provider = DEFAULT_VOICE.provider;
    if (!teacher.voice.voice_id) teacher.voice.voice_id = DEFAULT_VOICE.voice_id;
    if (!teacher.voice.style) teacher.voice.style = DEFAULT_VOICE.style;
    return teacher;
  }

  function setCurrentTeacher(teacher) {
    const normalized = normalizeTeacherProfile(teacher);
    app.currentTeacher = normalized;
    app.currentTeacherId = normalized.id || "T1";
    if (global.__APP__ && global.__APP__.app) {
      global.__APP__.app.currentTeacher = normalized;
      global.__APP__.app.currentTeacherId = app.currentTeacherId;
    }
    return normalized;
  }

  function currentVoiceProfile() {
    if (app.currentTeacher && app.currentTeacher.voice) {
      return {
        teacher_id: app.currentTeacher.id || app.currentTeacherId || "T1",
        provider: app.currentTeacher.voice.provider || DEFAULT_VOICE.provider,
        voice_id: app.currentTeacher.voice.voice_id || DEFAULT_VOICE.voice_id,
        style: app.currentTeacher.voice.style || DEFAULT_VOICE.style,
      };
    }
    return clone(DEFAULT_VOICE);
  }

  function composeSpeechRequest(text, overrideVoice) {
    const voice = Object.assign({}, currentVoiceProfile(), overrideVoice || {});
    return {
      text: String(text || ""),
      teacher_id: voice.teacher_id || app.currentTeacherId || "T1",
      provider: voice.provider || DEFAULT_VOICE.provider,
      voice_id: voice.voice_id || DEFAULT_VOICE.voice_id,
      style: voice.style || DEFAULT_VOICE.style,
    };
  }

  function speak(text, overrideVoice) {
    const payload = composeSpeechRequest(text, overrideVoice);
    if ("speechSynthesis" in window && !(overrideVoice && overrideVoice.forceServer)) {
      const utterance = new SpeechSynthesisUtterance(payload.text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.voiceHint = payload.voice_id;
      utterance.providerHint = payload.provider;
      window.speechSynthesis.speak(utterance);
      return Promise.resolve(payload);
    }
    return fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        const audio = new Audio(URL.createObjectURL(blob));
        return audio.play().catch(console.warn).then(function () { return payload; });
      })
      .catch(function (error) {
        console.warn(error);
        return payload;
      });
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Fetch failed (" + r.status + "): " + url);
      return r.json();
    });
  }

  function loadTeacherCatalog() {
    const paths = CORE_TEACHER_PATHS.concat(PACK_TEACHER_PATHS);
    return Promise.all(paths.map(fetchJson)).then(function (teachers) {
      const normalized = teachers.map(normalizeTeacherProfile);
      if (global.__APP__ && global.__APP__.CATALOG) {
        global.__APP__.CATALOG.teachers = normalized;
      }
      const sage = normalized.find(function (teacher) { return teacher.id === "T1"; }) || normalized[0] || null;
      if (sage) setCurrentTeacher(sage);
      return normalized;
    }).catch(function (error) {
      console.warn("[app] teacher catalog unavailable:", error && error.message);
      const fallback = [normalizeTeacherProfile({ id: "T1", name: "Sage", voice: clone(DEFAULT_VOICE) })];
      if (global.__APP__ && global.__APP__.CATALOG) {
        global.__APP__.CATALOG.teachers = fallback;
      }
      setCurrentTeacher(fallback[0]);
      return fallback;
    });
  }

  function loadPackCatalog() {
    const packs = PACKS.map(clone);
    if (global.__APP__ && global.__APP__.CATALOG) {
      global.__APP__.CATALOG.packs = packs;
    }
    return Promise.resolve(packs);
  }

  function loadLessons() {
    return fetch("./content/lessons/manifest.json")
      .then(function (r) {
        if (!r.ok) throw new Error("Lesson catalog unavailable (" + r.status + ")");
        return r.json();
      })
      .then(function (manifest) {
        const files = Array.isArray(manifest.files)
          ? manifest.files
          : Array.isArray(manifest.lessons)
            ? manifest.lessons.map(function (lesson) { return lesson.file || lesson; })
            : [];
        if (!files.length) throw new Error("Lesson catalog is empty");
        return Promise.all(
          files.map(function (file) {
            return fetch("./content/lessons/" + file).then(function (r) {
              if (!r.ok) throw new Error("Lesson unavailable: " + file);
              return r.json();
            });
          })
        ).then(function (lessons) {
          if (global.__APP__ && global.__APP__.CATALOG) {
            global.__APP__.CATALOG.lessons = lessons.map(function (raw) {
              return {
                id: raw && raw.lesson ? raw.lesson.id : "",
                title: raw && raw.lesson ? raw.lesson.title : "",
                raw: raw,
              };
            });
          }
          return { manifest: manifest, lessons: lessons };
        });
      });
  }

  function loadPractice() {
    return fetch("./content/practice/index.json")
      .then(function (r) {
        if (!r.ok) throw new Error("Practice catalog unavailable (" + r.status + ")");
        return r.json();
      })
      .then(function (index) {
        const entries = Array.isArray(index.pairs) ? index.pairs : index.drills || [];
        return Promise.all(
          entries.map(function (entry) {
            return fetch("./content/practice/" + entry.file).then(function (r) {
              if (!r.ok) throw new Error("Practice drill unavailable: " + entry.file);
              return r.json();
            });
          })
        ).then(function (drills) { return { index: index, drills: drills }; });
      });
  }

  function verifyChord(chordName) {
    if (!isPremium()) {
      console.warn("[app] chord verification gated — not premium");
      return Promise.resolve(null);
    }
    return fetch("./core/chord-theory-check.js")
      .then(function (r) { return r.text(); })
      .then(function () {
        console.log("[app] verifyChord stub: " + chordName);
        return { chord: chordName, frets: null, verified: false };
      });
  }

  function renderChat(message) {
    if (!guardPremium("chat", function () { console.warn("[app] chat paywalled"); })) return;
    console.log("[app] chat: " + message);
  }

  function linkManifest() {
    try {
      if (typeof document === "undefined") return;
      if (document.querySelector('link[rel="manifest"]')) return;
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "./manifest.webmanifest";
      (document.head || document.documentElement).appendChild(link);
    } catch (e) {
      console.warn("[app] manifest link skipped (non-fatal):", e && e.message);
    }
  }

  function registerServiceWorker() {
    try {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
      if (typeof location !== "undefined" && location.protocol === "file:") {
        console.warn("[app] service worker skipped on file:// (unsupported); app still works");
        return;
      }
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch(function (err) {
          console.warn("[app] service worker registration failed (non-fatal):", err && err.message);
        });
    } catch (e) {
      console.warn("[app] service worker registration skipped (non-fatal):", e && e.message);
    }
  }

  function mountBackupButtons(rootEl, opts) {
    try {
      const bb = global.GuitarApp && global.GuitarApp.BackupButtons;
      if (bb && typeof bb.mountBackupButtons === "function") {
        return bb.mountBackupButtons(rootEl, opts);
      }
      console.warn("[app] backupButtons not loaded — self-report UI skipped (non-fatal)");
    } catch (e) {
      console.warn("[app] backupButtons mount skipped (non-fatal):", e && e.message);
    }
    return function noopCleanup() {};
  }

  function boot() {
    linkManifest();
    registerServiceWorker();
    loadTeacherCatalog();
    loadPackCatalog();
    try {
      if (typeof document !== "undefined") {
        const root =
          document.getElementById("lesson-view") ||
          document.querySelector("[data-lesson-view]");
        if (root) {
          mountBackupButtons(root, {
            onReport: function (report) {
              const cls = (function () {
                const bb = global.GuitarApp && global.GuitarApp.BackupButtons;
                return bb && typeof bb.classifyReport === "function"
                  ? bb.classifyReport(report)
                  : { source: "student-said", value: report };
              })();
              console.log("[app] BI-8 student self-report:", cls);
              try {
                global.dispatchEvent(new CustomEvent("guitarapp:self-report", { detail: cls }));
              } catch (e) { }
            },
          });
        }
      }
    } catch (e) {
      console.warn("[app] boot backup-buttons step skipped (non-fatal):", e && e.message);
    }
  }

  global.GuitarApp = global.GuitarApp || {};
  Object.assign(global.GuitarApp, {
    app,
    isPremium,
    setCurrentTeacher,
    currentVoiceProfile,
    composeSpeechRequest,
    speak,
    loadTeacherCatalog,
    loadPackCatalog,
    loadLessons,
    loadPractice,
    verifyChord,
    renderChat,
    linkManifest,
    registerServiceWorker,
    mountBackupButtons,
    boot,
  });

  global.__APP__ = global.__APP__ || {
    app,
    CATALOG: { lessons: [], teachers: [], packs: [] },
    loadTeacherCatalog,
    loadPackCatalog,
    loadLessons,
    loadPractice,
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})(typeof window !== "undefined" ? window : this);
