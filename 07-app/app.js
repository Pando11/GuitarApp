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
      return appState.getDogfood() || this.isPremium();
    },
    canAccessLesson: function (lessonId) {
      if (appState.getDogfood() || this.isPremium()) return true;
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

  // ============================================================================
  // EVENT EMITTER — Vanilla JS implementation for state change notifications
  // ============================================================================
  function createEventEmitter() {
    const listeners = {};

    return {
      on: function (eventName, callback) {
        if (!listeners[eventName]) listeners[eventName] = [];
        listeners[eventName].push(callback);

        // Return unsubscribe function
        return function unsubscribe() {
          if (!listeners[eventName]) return;
          const idx = listeners[eventName].indexOf(callback);
          if (idx > -1) listeners[eventName].splice(idx, 1);
        };
      },

      once: function (eventName, callback) {
        const unsubscribe = this.on(eventName, function wrapper(data) {
          callback(data);
          unsubscribe();
        });
        return unsubscribe;
      },

      emit: function (eventName, data) {
        if (!listeners[eventName]) return;
        listeners[eventName].forEach(function (callback) {
          try {
            callback(data);
          } catch (e) {
            console.error("[AppStateEmitter] Listener error for " + eventName + ":", e);
          }
        });
      },

      off: function (eventName, callback) {
        if (!listeners[eventName]) return;
        const idx = listeners[eventName].indexOf(callback);
        if (idx > -1) listeners[eventName].splice(idx, 1);
      },

      listenerCount: function (eventName) {
        return listeners[eventName] ? listeners[eventName].length : 0;
      }
    };
  }

  // ============================================================================
  // APP STATE — Encapsulated, observable state management
  // ============================================================================
  const stateEmitter = createEventEmitter();

  const appState = {
    // Private state
    _state: {
      dogfood: typeof location !== "undefined" && location.search.includes("dogfood=1"),
      currentTeacherId: "T1",
      currentTeacher: null,
    },

    // Getters (read-only access to state)
    getDogfood: function () {
      return this._state.dogfood;
    },

    getCurrentTeacherId: function () {
      return this._state.currentTeacherId;
    },

    getCurrentTeacher: function () {
      return this._state.currentTeacher;
    },

    // Setters with event emission
    setTeacher: function (teacher) {
      const normalized = normalizeTeacherProfile(teacher);
      const oldTeacherId = this._state.currentTeacherId;

      this._state.currentTeacher = normalized;
      this._state.currentTeacherId = normalized.id || "T1";

      // Sync with legacy global.__APP__ for backwards compatibility
      if (global.__APP__ && global.__APP__.app) {
        global.__APP__.app.currentTeacher = normalized;
        global.__APP__.app.currentTeacherId = this._state.currentTeacherId;
      }

      // Emit state change event with full context
      stateEmitter.emit("teacher:changed", {
        teacher: normalized,
        teacherId: this._state.currentTeacherId,
        previousTeacherId: oldTeacherId,
        timestamp: Date.now()
      });

      return normalized;
    },

    // Backwards compatibility: expose app object (mutable for legacy code)
    toAppObject: function () {
      return {
        dogfood: this._state.dogfood,
        entitlement: entitlement,
        currentTeacherId: this._state.currentTeacherId,
        currentTeacher: this._state.currentTeacher,
      };
    }
  };

  // Expose the event emitter for subscriptions
  const appEvents = stateEmitter;

  // Create read-only app object for backwards compatibility
  const app = appState.toAppObject();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPremium() {
    return appState.getDogfood() || entitlement.isPremium();
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
    return appState.setTeacher(teacher);
  }

  function currentVoiceProfile() {
    const teacher = appState.getCurrentTeacher();
    if (teacher && teacher.voice) {
      return {
        teacher_id: teacher.id || appState.getCurrentTeacherId() || "T1",
        provider: teacher.voice.provider || DEFAULT_VOICE.provider,
        voice_id: teacher.voice.voice_id || DEFAULT_VOICE.voice_id,
        style: teacher.voice.style || DEFAULT_VOICE.style,
      };
    }
    return clone(DEFAULT_VOICE);
  }

  function composeSpeechRequest(text, overrideVoice) {
    const voice = Object.assign({}, currentVoiceProfile(), overrideVoice || {});
    return {
      text: String(text || ""),
      teacher_id: voice.teacher_id || appState.getCurrentTeacherId() || "T1",
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
          // Fetch audio manifest alongside lessons
          return fetch("./audio/manifest.json")
            .then(function (r) {
              return (r && r.ok) ? r.json() : {};
            })
            .catch(function () {
              return {};
            })
            .then(function (audioManifest) {
              return { manifest: manifest, lessons: lessons, audioManifest: audioManifest };
            });
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
        ).then(function (drills) {
          const result = { index: index, drills: drills };
          // Mirror loadLessons()'s convention: expose the loaded catalog on
          // global.__APP__.CATALOG so other scripts (drillRunner.js's wiring
          // in index.html) can read it without re-fetching.
          if (global.__APP__ && global.__APP__.CATALOG) {
            global.__APP__.CATALOG.practiceIndex = index;
            global.__APP__.CATALOG.practiceDrills = drills;
          }
          return result;
        });
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

  // ── PWA shell hardening (A2.1) ────────────────────────────────────────────
  //
  // The shell is the app: there is no separate index.html to register the SW or
  // link the manifest, so app.js owns both. Everything here is file://-tolerant
  // and ?dogfood=1-tolerant: a failure (e.g. SW unsupported on file://) MUST
  // never hard-block the lesson. dogfood is a URL param only (works on file://
  // and localhost) — there is no server-only guard that could break boot.

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
      // Service workers require a secure context (https or localhost). On file://
      // registration throws — that's expected, not an error. The app still runs.
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

  // BI-8: mount the always-visible "Got it" / "Not yet" buttons on a lesson view.
  // Delegates to core/backupButtons.js (loaded as a non-module <script> before or
  // after this file). Never throws if backupButtons is absent or root is missing.
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

  function shouldEnableEncryptedSync() {
    try {
      if (!global.GuitarApp || !global.GuitarApp.__encryptedSync) return false;
      const search = (typeof location !== 'undefined' && location && location.search) ? String(location.search) : '';
      const params = new URLSearchParams(search);
      const adminEmail = params.get('pbAdminEmail') || params.get('PB_ADMIN_EMAIL');
      const adminPass = params.get('pbAdminPass') || params.get('PB_ADMIN_PASS');
      return !!(adminEmail && adminPass);
    } catch {
      return false;
    }
  }

  async function initEncryptedSync() {
    const syncFns = global.GuitarApp && global.GuitarApp.__encryptedSync;
    if (!syncFns) return;
    if (!shouldEnableEncryptedSync()) return;

    global.GuitarApp.__encryptedSyncState = global.GuitarApp.__encryptedSyncState || {};
    if (global.GuitarApp.__encryptedSyncState.started) return;
    global.GuitarApp.__encryptedSyncState.started = true;

    const search = (typeof location !== 'undefined' && location && location.search) ? String(location.search) : '';
    const params = new URLSearchParams(search);

    const baseUrl = params.get('pbBaseUrl') || 'http://127.0.0.1:8090';
    const adminEmail = params.get('pbAdminEmail') || params.get('PB_ADMIN_EMAIL');
    const adminPass = params.get('pbAdminPass') || params.get('PB_ADMIN_PASS');
    const collection = params.get('pbCollection') || 'student_memory';

    const LOCAL_KEYS = {
      passphrase: 'guitarapp.sync.passphrase',
      studentId: 'guitarapp.sync.studentId',
      practiceStore: 'guitarapp.sync.practiceStore',
      lastLoops: function (level) { return 'guitarapp.sync.lastLoops.' + level; },
    };

    function lsGet(key) {
      try { return global.localStorage && global.localStorage.getItem(key); } catch { return null; }
    }
    function lsSet(key, val) {
      try { global.localStorage && global.localStorage.setItem(key, val); } catch { }
    }

    const studentId = lsGet(LOCAL_KEYS.studentId) || 'student-wave2-live';
    lsSet(LOCAL_KEYS.studentId, studentId);

    let passphrase = lsGet(LOCAL_KEYS.passphrase);
    if (!passphrase) {
      if (typeof syncFns.generateRecoveryPhrase === 'function') {
        passphrase = syncFns.generateRecoveryPhrase(6);
      } else {
        passphrase = 'amber fern river sage tide';
      }
      lsSet(LOCAL_KEYS.passphrase, passphrase);
    }

    async function authSuperuser() {
      const res = await fetch(baseUrl + '/api/collections/_superusers/auth-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: adminEmail, password: adminPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Superuser auth failed: ' + JSON.stringify(data));
      return data.token;
    }

    function deriveLoopsFromStore(store, lessonId) {
      let easyCPasses = 0;
      const sessions = store && Array.isArray(store.sessions) ? store.sessions : [];
      for (const s of sessions) {
        if (s.lessonId !== lessonId) continue;
        const attempts = Array.isArray(s.attempts) ? s.attempts : [];
        for (const a of attempts) {
          if (a && a.verdict === 'pass' && a.chordName === 'easyC') easyCPasses += 1;
        }
      }
      return easyCPasses;
    }

    function writePerformanceState(level, loopsCompleted, opts) {
      const isL1 = level === 1;
      const key = isL1 ? 'guitarapp.wave1.pathb' : 'guitarapp.wave2.pathb.level2';
      const tempoBpm = (opts && opts.tempoBpm) || (isL1 ? 72 : 84);
      const songId = (opts && opts.songId) || 'em-easyc-first-song';
      const state = {
        expectedIndex: 0,
        loopsCompleted: Math.max(0, Math.floor(Number(loopsCompleted) || 0)),
        lastChord: 'Em',
        lastAction: 'follow',
        level: level,
        tempoBpm: tempoBpm,
        songId: songId,
      };
      lsSet(key, JSON.stringify(state));
      lsSet(LOCAL_KEYS.lastLoops(level), String(state.loopsCompleted));
    }

    async function applyPull(authToken) {
      try {
        const pulledEnvelope = await syncFns.pullMemory(studentId, passphrase, {
          live: true,
          authToken,
          baseUrl,
          collection,
        });
        const restoredStore = syncFns.restorePracticeStore(pulledEnvelope);
        lsSet(LOCAL_KEYS.practiceStore, JSON.stringify(restoredStore.toJSON()));

        const l1 = deriveLoopsFromStore(restoredStore, 'L05-strumming-in-time');
        const l2 = deriveLoopsFromStore(restoredStore, 'L12-new-chord-am-big-four');

        writePerformanceState(1, Math.min(l1, 1), { tempoBpm: 72, songId: 'em-easyc-first-song' });
        writePerformanceState(2, Math.min(l2, 3), { tempoBpm: 84, songId: 'em-easyc-first-song' });
      } catch (e) {
        console.warn('[sync] pull skipped (non-fatal):', e && e.message ? e.message : e);
      }
    }

    function loadStore() {
      const raw = lsGet(LOCAL_KEYS.practiceStore);
      if (raw) {
        try {
          return syncFns.PracticeStore.fromJSON(JSON.parse(raw));
        } catch { }
      }
      return new syncFns.PracticeStore({ currentTeacherId: 'T1' });
    }

    function saveStore(store) {
      try { lsSet(LOCAL_KEYS.practiceStore, JSON.stringify(store.toJSON())); } catch { }
    }

    async function pushLevel(level, loopsCompleted, authToken) {
      const isL1 = level === 1;
      const lessonId = isL1 ? 'L05-strumming-in-time' : 'L12-new-chord-am-big-four';
      const targetLoops = isL1 ? 1 : 3;

      const store = loadStore();
      const existing = (store.sessions || []).filter(s => s.lessonId === lessonId).slice(-1)[0];
      const sessionId = existing && existing.id ? existing.id : store.startSession(lessonId, Date.now());

      const lastLoops = Number(lsGet(LOCAL_KEYS.lastLoops(level)) || '0');
      const delta = Math.max(0, Math.floor(loopsCompleted) - lastLoops);
      if (delta <= 0) return;

      for (let i = 0; i < delta; i++) {
        store.logAttempt(sessionId, { chordName: 'Em', verdict: 'pass', ts: Date.now() });
        store.logAttempt(sessionId, { chordName: 'easyC', verdict: 'pass', ts: Date.now() });
      }

      const completed = loopsCompleted >= targetLoops;
      store.finalizeSession(sessionId, {
        completed,
        durationSec: Math.floor(loopsCompleted) * 180,
        lessonId,
      });

      saveStore(store);

      const envelope = syncFns.buildStudentMemoryEnvelope(store, {
        studentId,
        teacherId: store.getTeacher(),
        worldId: 'emerald-hollow',
      });

      await syncFns.pushMemory(studentId, envelope, passphrase, {
        live: true,
        authToken,
        baseUrl,
        collection,
      });

      lsSet(LOCAL_KEYS.lastLoops(level), String(Math.floor(loopsCompleted)));
    }

    async function wireLocalPush(authToken) {
      const watchKeys = {
        'guitarapp.wave1.pathb': 1,
        'guitarapp.wave2.pathb.level2': 2,
      };

      const last = { 1: 0, 2: 0 };
      for (const level of [1, 2]) {
        last[level] = Number(lsGet(LOCAL_KEYS.lastLoops(level)) || '0');
      }

      let pending = null;
      let timer = null;
      let isPushing = false;

      const origSetItem = global.localStorage && global.localStorage.setItem;
      if (typeof origSetItem !== 'function') return;

      global.localStorage.setItem = function (key, value) {
        const out = origSetItem.call(this, key, value);
        try {
          const level = watchKeys[key];
          if (level) {
            const parsed = JSON.parse(value);
            const loopsCompleted = Number(parsed && parsed.loopsCompleted ? parsed.loopsCompleted : 0);
            const prev = last[level] || 0;
            if (loopsCompleted > prev) {
              last[level] = loopsCompleted;
              pending = { level, loopsCompleted };
              if (timer) clearTimeout(timer);
              timer = setTimeout(function () {
                const p = pending;
                pending = null;
                if (!p) return;
                if (isPushing) return;
                isPushing = true;
                pushLevel(p.level, p.loopsCompleted, authToken)
                  .catch(function (e) {
                    console.warn('[sync] push failed (non-fatal):', e && e.message ? e.message : e);
                  })
                  .then(function () {
                    isPushing = false;
                  });
              }, 250);
            }
          }
        } catch { }
        return out;
      };
    }

    try {
      const authToken = await authSuperuser();
      await applyPull(authToken);
      await wireLocalPush(authToken);
    } catch (e) {
      console.warn('[sync] init skipped (non-fatal):', e && e.message ? e.message : e);
    }
  }

  function boot() {
    linkManifest();
    registerServiceWorker();
    loadTeacherCatalog();
    loadPackCatalog();
    loadPractice().catch(function (error) {
      console.warn("[app] practice catalog unavailable (non-fatal):", error && error.message);
    });
    try { initEncryptedSync(); } catch { /* non-fatal */ }
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
    appState,
    appEvents,
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

    // ========================================================================
    // NEW EVENT SUBSCRIPTION HELPERS — Use these in modules to react to state changes
    // ========================================================================

    /**
     * Subscribe to teacher changes
     * Usage: GuitarApp.onTeacherChanged(function(event) {
     *   console.log("Teacher changed:", event.teacher.name);
     *   console.log("From:", event.previousTeacherId, "To:", event.teacherId);
     * });
     */
    onTeacherChanged: function (callback) {
      return appEvents.on("teacher:changed", callback);
    },

    /**
     * Subscribe to teacher changes (one-time only)
     * Usage: GuitarApp.onceTeacherChanged(function(event) { ... });
     */
    onceTeacherChanged: function (callback) {
      return appEvents.once("teacher:changed", callback);
    },

    /**
     * Unsubscribe from teacher changes
     * Usage: GuitarApp.offTeacherChanged(myCallback);
     */
    offTeacherChanged: function (callback) {
      return appEvents.off("teacher:changed", callback);
    },

    /**
     * Get the current state (safe, read-only snapshot)
     * Usage: const state = GuitarApp.getAppState();
     *   state.currentTeacher
     *   state.currentTeacherId
     *   state.dogfood
     */
    getAppState: function () {
      return {
        currentTeacher: appState.getCurrentTeacher(),
        currentTeacherId: appState.getCurrentTeacherId(),
        dogfood: appState.getDogfood()
      };
    }
  });

  global.__APP__ = global.__APP__ || {
    app,
    CATALOG: { lessons: [], teachers: [], packs: [] },
    loadTeacherCatalog,
    loadPackCatalog,
    loadLessons,
    loadPractice,
  };

  // ── Boot (runs only in a real browser; no-op under node) ───────────────────
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})(typeof window !== "undefined" ? window : this);
