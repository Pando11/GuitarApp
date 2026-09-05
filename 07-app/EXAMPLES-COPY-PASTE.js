// EXAMPLES-COPY-PASTE.js
// Ready-to-use module examples demonstrating GuitarApp state management
// Copy and paste these into your own modules

// ============================================================================
// EXAMPLE 1: Simple Voice Manager Module
// ============================================================================
// File: voice-manager.js
// Purpose: React to teacher changes and update TTS settings

(function(GuitarApp, global) {
  "use strict";

  if (!GuitarApp) {
    console.error("[voice-manager] GuitarApp not loaded");
    return;
  }

  const VoiceManager = {
    currentConfig: null,

    init: function() {
      // Load current teacher's voice on startup
      const state = GuitarApp.getAppState();
      this.updateConfig(state.currentTeacher);

      // Subscribe to all future changes
      GuitarApp.onTeacherChanged(function(event) {
        VoiceManager.updateConfig(event.teacher);
      });

      console.log("[voice-manager] Initialized with teacher:", state.currentTeacherId);
    },

    updateConfig: function(teacher) {
      if (!teacher || !teacher.voice) {
        console.warn("[voice-manager] Invalid teacher object");
        return;
      }

      this.currentConfig = {
        provider: teacher.voice.provider,
        voiceId: teacher.voice.voice_id,
        style: teacher.voice.style,
        teacherId: teacher.id
      };

      // Apply config to speech synthesis API
      this.applySpeechConfig();

      // Optional: Notify other systems
      if (global.dispatchEvent) {
        try {
          global.dispatchEvent(new CustomEvent("guitarapp:voice-changed", {
            detail: this.currentConfig
          }));
        } catch (e) {
          console.warn("[voice-manager] Custom event dispatch failed:", e.message);
        }
      }
    },

    applySpeechConfig: function() {
      // Example: Apply to speechSynthesis API
      if (!("speechSynthesis" in window)) {
        console.warn("[voice-manager] speechSynthesis not available");
        return;
      }

      console.log("[voice-manager] Applying config:", this.currentConfig);

      // In a real app, you'd update your TTS service here:
      // ttsService.setVoice(this.currentConfig.voiceId);
      // ttsService.setStyle(this.currentConfig.style);
    },

    getConfig: function() {
      return this.currentConfig;
    }
  };

  global.GuitarApp = global.GuitarApp || {};
  global.GuitarApp.VoiceManager = VoiceManager;

  // Bootstrap on DOM ready
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        VoiceManager.init();
      });
    } else {
      VoiceManager.init();
    }
  }

})(window.GuitarApp, window);


// ============================================================================
// EXAMPLE 2: Teacher Selector Dropdown
// ============================================================================
// File: teacher-selector.js
// Purpose: UI component that displays teacher options and switches on selection

(function(GuitarApp, document) {
  "use strict";

  if (!GuitarApp) return;

  const TeacherSelector = {
    selectEl: null,
    teachers: [],
    currentTeacherId: null,

    init: function(selectElementId) {
      this.selectEl = document.getElementById(selectElementId);
      if (!this.selectEl) {
        console.warn("[teacher-selector] Element not found:", selectElementId);
        return;
      }

      // Get initial state
      const state = GuitarApp.getAppState();
      this.currentTeacherId = state.currentTeacherId;

      // Fetch teacher catalog
      this.loadTeachers();

      // Subscribe to remote changes (e.g., from another tab/module)
      GuitarApp.onTeacherChanged(function(event) {
        TeacherSelector.currentTeacherId = event.teacherId;
        TeacherSelector.updateSelectValue();
      });

      // Handle user selections
      this.selectEl.addEventListener("change", function(e) {
        const teacherId = e.target.value;
        TeacherSelector.selectTeacher(teacherId);
      });
    },

    loadTeachers: function() {
      // In production, fetch from your catalog endpoint
      // For now, use local data
      GuitarApp.loadTeacherCatalog().then(function(teachers) {
        TeacherSelector.teachers = teachers;
        TeacherSelector.renderOptions();
      }).catch(function(err) {
        console.error("[teacher-selector] Failed to load teachers:", err);
      });
    },

    renderOptions: function() {
      if (!this.selectEl) return;

      this.selectEl.innerHTML = "";
      this.teachers.forEach(function(teacher) {
        const option = document.createElement("option");
        option.value = teacher.id;
        option.textContent = teacher.name || "Unknown";
        if (teacher.id === this.currentTeacherId) {
          option.selected = true;
        }
        this.selectEl.appendChild(option);
      }.bind(this));
    },

    updateSelectValue: function() {
      if (!this.selectEl) return;
      this.selectEl.value = this.currentTeacherId;
    },

    selectTeacher: function(teacherId) {
      const teacher = this.teachers.find(function(t) { return t.id === teacherId; });
      if (!teacher) {
        console.warn("[teacher-selector] Teacher not found:", teacherId);
        return;
      }

      // Update app state - this will trigger all listeners
      GuitarApp.setCurrentTeacher(teacher);
    }
  };

  // Bootstrap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      TeacherSelector.init("teacher-select");
    });
  } else {
    TeacherSelector.init("teacher-select");
  }

})(window.GuitarApp, document);

// HTML Usage:
// <select id="teacher-select">
//   <option>Loading...</option>
// </select>


// ============================================================================
// EXAMPLE 3: Analytics/Tracking Module
// ============================================================================
// File: analytics.js
// Purpose: Log state changes for analytics

(function(GuitarApp) {
  "use strict";

  if (!GuitarApp) return;

  const AnalyticsTracker = {
    sessionStartTime: Date.now(),
    teacherSwitchCount: 0,

    init: function() {
      const state = GuitarApp.getAppState();

      // Log initial teacher
      this.logEvent("session_start", {
        initialTeacherId: state.currentTeacherId,
        dogfood: state.dogfood,
        timestamp: this.sessionStartTime
      });

      // Log every teacher switch
      GuitarApp.onTeacherChanged(function(event) {
        AnalyticsTracker.teacherSwitchCount++;
        AnalyticsTracker.logEvent("teacher_switched", {
          from: event.previousTeacherId,
          to: event.teacherId,
          teacherName: event.teacher.name,
          switchCount: AnalyticsTracker.teacherSwitchCount,
          sessionElapsed: Date.now() - AnalyticsTracker.sessionStartTime
        });
      });

      console.log("[analytics] Initialized");
    },

    logEvent: function(eventName, data) {
      const payload = {
        event: eventName,
        data: data,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      console.log("[analytics]", eventName, payload);

      // In production: send to analytics backend
      // fetch("/api/analytics", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload)
      // }).catch(console.warn);
    }
  };

  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.AnalyticsTracker = AnalyticsTracker;

  // Auto-init on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      AnalyticsTracker.init();
    });
  } else {
    AnalyticsTracker.init();
  }

})(window.GuitarApp);


// ============================================================================
// EXAMPLE 4: Lesson Loader - Load content per teacher
// ============================================================================
// File: lesson-loader.js
// Purpose: Dynamically load lesson content when teacher changes

(function(GuitarApp, fetch) {
  "use strict";

  if (!GuitarApp) return;

  const LessonLoader = {
    currentLessons: [],
    isLoading: false,

    init: function() {
      const state = GuitarApp.getAppState();
      this.loadLessonsForTeacher(state.currentTeacherId);

      // Reload lessons whenever teacher changes
      GuitarApp.onTeacherChanged(function(event) {
        LessonLoader.loadLessonsForTeacher(event.teacherId);
      });

      console.log("[lesson-loader] Initialized");
    },

    loadLessonsForTeacher: function(teacherId) {
      if (this.isLoading) {
        console.warn("[lesson-loader] Already loading, skipping duplicate request");
        return;
      }

      this.isLoading = true;
      console.log("[lesson-loader] Loading lessons for teacher:", teacherId);

      // Construct path based on teacher
      const packId = this.getPackIdForTeacher(teacherId);
      const url = "./content/lessons/" + packId + "/manifest.json";

      fetch(url)
        .then(function(r) {
          if (!r.ok) throw new Error("Lessons not found for " + packId);
          return r.json();
        })
        .then(function(manifest) {
          LessonLoader.currentLessons = manifest.lessons || [];
          LessonLoader.renderLessonList();
          console.log("[lesson-loader] Loaded", LessonLoader.currentLessons.length, "lessons");
        })
        .catch(function(err) {
          console.warn("[lesson-loader] Failed to load lessons:", err.message);
          LessonLoader.currentLessons = [];
          LessonLoader.renderLessonList();
        })
        .finally(function() {
          LessonLoader.isLoading = false;
        });
    },

    getPackIdForTeacher: function(teacherId) {
      // Map teacher IDs to content packs
      const packMap = {
        "T1": "core",
        "T2": "core",
        "T3": "core",
        "T4": "blues",
        "T5": "country"
      };
      return packMap[teacherId] || "core";
    },

    renderLessonList: function() {
      const container = document.getElementById("lessons-list");
      if (!container) return;

      if (this.currentLessons.length === 0) {
        container.innerHTML = "<p>No lessons available</p>";
        return;
      }

      container.innerHTML = this.currentLessons.map(function(lesson, idx) {
        return `
          <div class="lesson-item" data-lesson-id="${lesson.id}">
            <h4>${lesson.title || ("Lesson " + (idx + 1))}</h4>
            <button onclick="GuitarApp.startLesson('${lesson.id}')">Start</button>
          </div>
        `;
      }).join("");
    }
  };

  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.LessonLoader = LessonLoader;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      LessonLoader.init();
    });
  } else {
    LessonLoader.init();
  }

})(window.GuitarApp, window.fetch);

// HTML Usage:
// <div id="lessons-list"></div>


// ============================================================================
// EXAMPLE 5: Persistent User Preference
// ============================================================================
// File: teacher-preference.js
// Purpose: Remember user's favorite teacher and restore on reload

(function(GuitarApp, localStorage) {
  "use strict";

  if (!GuitarApp) return;

  const STORAGE_KEY = "guitarapp.preferences.teacherId";

  const PreferenceManager = {
    init: function() {
      // Restore saved preference on load
      const saved = this.getSavedTeacherId();
      if (saved) {
        console.log("[preferences] Restoring teacher preference:", saved);
        this.restoreTeacher(saved);
      }

      // Save whenever teacher changes
      GuitarApp.onTeacherChanged(function(event) {
        PreferenceManager.saveTeacherId(event.teacherId);
        console.log("[preferences] Saved teacher preference:", event.teacherId);
      });
    },

    saveTeacherId: function(teacherId) {
      try {
        localStorage.setItem(STORAGE_KEY, teacherId);
      } catch (e) {
        console.warn("[preferences] Failed to save preference:", e.message);
      }
    },

    getSavedTeacherId: function() {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        console.warn("[preferences] Failed to read preference:", e.message);
        return null;
      }
    },

    restoreTeacher: function(teacherId) {
      // Note: Teacher catalog might not be loaded yet, so we defer this
      GuitarApp.loadTeacherCatalog().then(function(teachers) {
        const teacher = teachers.find(function(t) { return t.id === teacherId; });
        if (teacher) {
          GuitarApp.setCurrentTeacher(teacher);
        } else {
          console.warn("[preferences] Saved teacher not found:", teacherId);
        }
      }).catch(console.warn);
    }
  };

  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.PreferenceManager = PreferenceManager;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      PreferenceManager.init();
    });
  } else {
    PreferenceManager.init();
  }

})(window.GuitarApp, window.localStorage);


// ============================================================================
// EXAMPLE 6: Multi-Tab Synchronization (using broadcast channel)
// ============================================================================
// File: multi-tab-sync.js
// Purpose: Keep teacher selection in sync across browser tabs

(function(GuitarApp, BroadcastChannel) {
  "use strict";

  if (!GuitarApp || !BroadcastChannel) {
    console.warn("[multi-tab-sync] BroadcastChannel not available");
    return;
  }

  const MultiTabSync = {
    channel: null,

    init: function() {
      this.channel = new BroadcastChannel("guitarapp-state");

      // Listen for changes from other tabs
      this.channel.onmessage = function(event) {
        if (event.data.type === "teacher_changed") {
          console.log("[multi-tab-sync] Received change from another tab:", event.data.teacherId);
          // Note: Don't call setCurrentTeacher here to avoid loop
          // Just update the UI if needed
        }
      };

      // Broadcast local changes to other tabs
      GuitarApp.onTeacherChanged(function(event) {
        MultiTabSync.channel.postMessage({
          type: "teacher_changed",
          teacherId: event.teacherId,
          timestamp: event.timestamp
        });
        console.log("[multi-tab-sync] Broadcasted change to other tabs");
      });

      console.log("[multi-tab-sync] Initialized");
    },

    close: function() {
      if (this.channel) {
        this.channel.close();
      }
    }
  };

  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.MultiTabSync = MultiTabSync;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      MultiTabSync.init();
    });
  } else {
    MultiTabSync.init();
  }

})(window.GuitarApp, window.BroadcastChannel);


// ============================================================================
// EXAMPLE 7: Debug Panel - View current state in real-time
// ============================================================================
// File: debug-panel.js
// Purpose: Display app state for debugging/development

(function(GuitarApp, document) {
  "use strict";

  if (!GuitarApp) return;

  const DebugPanel = {
    panelEl: null,
    eventLog: [],
    maxLogEntries: 50,

    init: function() {
      // Create debug panel HTML
      this.createPanel();

      // Display initial state
      this.updateStateDisplay();

      // Update on every state change
      GuitarApp.onTeacherChanged(function(event) {
        DebugPanel.logEvent(event);
        DebugPanel.updateStateDisplay();
      });

      console.log("[debug-panel] Initialized (Press Ctrl+Shift+D to toggle)");

      // Keyboard shortcut to show/hide
      document.addEventListener("keydown", function(e) {
        if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
          DebugPanel.panelEl.style.display =
            DebugPanel.panelEl.style.display === "none" ? "block" : "none";
        }
      });
    },

    createPanel: function() {
      this.panelEl = document.createElement("div");
      this.panelEl.id = "debug-panel";
      this.panelEl.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        width: 400px;
        height: 300px;
        background: #222;
        color: #0f0;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border: 1px solid #0f0;
        overflow-y: auto;
        z-index: 9999;
        display: none;
      `;
      document.body.appendChild(this.panelEl);
    },

    updateStateDisplay: function() {
      const state = GuitarApp.getAppState();
      const html = `
        <h3 style="margin: 0; color: #0f0;">[APP STATE]</h3>
        <pre style="margin: 5px 0; color: #0f0;">${JSON.stringify(state, null, 2)}</pre>
        <h3 style="margin: 10px 0 5px 0; color: #f00;">[EVENT LOG]</h3>
        <div style="max-height: 150px; overflow-y: auto; background: #111; padding: 5px;">
          ${this.eventLog.map(function(e) {
            return `<div style="color: #ff0; margin: 2px 0;">${e}</div>`;
          }).join("")}
        </div>
      `;
      this.panelEl.innerHTML = html;
    },

    logEvent: function(event) {
      const timestamp = new Date().toLocaleTimeString();
      const entry = `[${timestamp}] Teacher: ${event.previousTeacherId} → ${event.teacherId}`;
      this.eventLog.unshift(entry);
      if (this.eventLog.length > this.maxLogEntries) {
        this.eventLog.pop();
      }
    }
  };

  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.DebugPanel = DebugPanel;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      DebugPanel.init();
    });
  } else {
    DebugPanel.init();
  }

})(window.GuitarApp, document);

// Keyboard: Ctrl+Shift+D to toggle the panel
