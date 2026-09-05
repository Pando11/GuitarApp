# GuitarApp State Management Refactor Guide

## Overview

The refactored `app.js` introduces event-driven state management to replace the mutable, unobservable global `app` object. This prevents state mutations from going unnoticed and enables reactive updates across modules.

---

## Problems Solved

### 1. Global Object Mutability (Lines 58-100)
**Before:** Any code could directly mutate `app.currentTeacher` without triggering updates elsewhere.
```js
// UNSAFE - no notification of change
app.currentTeacher = newTeacher;
app.currentTeacherId = "T2";
```

**After:** State changes go through controlled setters with automatic event emission.
```js
// SAFE - emits "teacher:changed" event
GuitarApp.setCurrentTeacher(newTeacher);
```

### 2. setCurrentTeacher() Has No Event Emission (Lines 91-100)
**Before:** Function mutated state but had no way to notify subscribers.
```js
function setCurrentTeacher(teacher) {
  const normalized = normalizeTeacherProfile(teacher);
  app.currentTeacher = normalized;
  app.currentTeacherId = normalized.id || "T1";
  // ... no event emission
  return normalized;
}
```

**After:** Every call emits a detailed `teacher:changed` event.
```js
function setCurrentTeacher(teacher) {
  return appState.setTeacher(teacher);
  // Automatically emits: 
  // { teacher, teacherId, previousTeacherId, timestamp }
}
```

---

## New Event Emitter Pattern

A lightweight, zero-dependency event emitter handles all state notifications:

```js
createEventEmitter() {
  on(eventName, callback)      // Subscribe to an event
  once(eventName, callback)    // Subscribe once
  emit(eventName, data)        // Emit an event
  off(eventName, callback)     // Unsubscribe
  listenerCount(eventName)     // Get listener count
}
```

### Event: `teacher:changed`
Emitted whenever `setCurrentTeacher()` is called.

**Payload:**
```js
{
  teacher: { id, name, voice },        // New teacher object
  teacherId: "T1",                      // New teacher ID
  previousTeacherId: "T1",              // Previous teacher ID
  timestamp: 1693584321000             // ISO timestamp
}
```

---

## How to Subscribe to State Changes

### Pattern 1: Listen for Teacher Changes
```js
// Register a listener that fires every time teacher changes
GuitarApp.onTeacherChanged(function(event) {
  console.log("Teacher switched:", event.teacher.name);
  console.log("From:", event.previousTeacherId, "→", event.teacherId);
  
  // Example: Update UI
  document.getElementById("teacher-name").textContent = event.teacher.name;
});
```

### Pattern 2: Listen Once
```js
// Listener fires only on the first change, then auto-unsubscribes
GuitarApp.onceTeacherChanged(function(event) {
  console.log("Initial teacher loaded:", event.teacher.name);
});
```

### Pattern 3: Manual Unsubscribe
```js
function myListener(event) {
  console.log("Teacher changed:", event.teacher.name);
}

// Subscribe
const unsubscribe = GuitarApp.onTeacherChanged(myListener);

// Later: unsubscribe
unsubscribe();
// or
GuitarApp.offTeacherChanged(myListener);
```

### Pattern 4: Get Current State (Snapshot)
```js
// Read current state without subscribing
const state = GuitarApp.getAppState();
console.log(state.currentTeacher.name);     // "Sage"
console.log(state.currentTeacherId);        // "T1"
console.log(state.dogfood);                 // true/false

// This snapshot is read-only; changes must use setCurrentTeacher()
```

---

## Complete Module Example

Here's how a hypothetical `voice-selector.js` module would use the new event system:

### File: `voice-selector.js`
```js
// voice-selector.js — A module that reacts to teacher changes

(function(GuitarApp, document) {
  "use strict";

  // Initialize: render current teacher
  function initVoiceSelector() {
    const state = GuitarApp.getAppState();
    renderVoiceProfile(state.currentTeacher);
    
    console.log("[voice-selector] Initialized for teacher:", state.currentTeacherId);
  }

  // Listen for teacher changes
  function setupListeners() {
    GuitarApp.onTeacherChanged(function(event) {
      console.log("[voice-selector] Teacher changed to:", event.teacher.name);
      
      // Update UI to reflect new voice settings
      renderVoiceProfile(event.teacher);
      
      // Optionally: refresh speech synthesis
      preloadVoice(event.teacher.voice);
    });
  }

  function renderVoiceProfile(teacher) {
    if (!teacher) return;
    
    const el = document.getElementById("voice-info");
    if (!el) return;
    
    el.innerHTML = `
      <h3>${teacher.name}'s Voice</h3>
      <p>Provider: ${teacher.voice.provider}</p>
      <p>Voice ID: ${teacher.voice.voice_id}</p>
      <p>Style: ${teacher.voice.style}</p>
    `;
  }

  function preloadVoice(voiceConfig) {
    console.log("[voice-selector] Preloading voice:", voiceConfig.voice_id);
    // Send voice config to TTS service for validation
  }

  // Bootstrap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      initVoiceSelector();
      setupListeners();
    });
  } else {
    initVoiceSelector();
    setupListeners();
  }

})(window.GuitarApp, window.document);
```

### In HTML:
```html
<script src="app.js"></script>
<script src="voice-selector.js"></script>

<div id="voice-info">Loading...</div>

<button onclick="GuitarApp.setCurrentTeacher({id: 'T2', name: 'Maestro', voice: {...}})">
  Switch Teacher
</button>
```

When the button is clicked:
1. `setCurrentTeacher()` updates internal state
2. `teacher:changed` event is emitted
3. `voice-selector.js` listener fires automatically
4. UI updates to show new teacher's voice profile

---

## Real-World Use Cases

### Use Case 1: Analytics Tracking
```js
GuitarApp.onTeacherChanged(function(event) {
  // Track teacher switches for analytics
  analytics.track("teacher_switched", {
    from_id: event.previousTeacherId,
    to_id: event.teacherId,
    teacher_name: event.teacher.name,
    timestamp: event.timestamp
  });
});
```

### Use Case 2: Voice Synchronization
```js
GuitarApp.onTeacherChanged(function(event) {
  const voice = event.teacher.voice;
  
  // Update speech synthesis settings
  window.speechSynthesis.cancel();
  updateSpeechConfig({
    provider: voice.provider,
    voiceId: voice.voice_id,
    style: voice.style
  });
  
  // Preload voice in background
  fetch("/api/voice/preload", {
    method: "POST",
    body: JSON.stringify({ teacherId: event.teacherId })
  }).catch(console.warn);
});
```

### Use Case 3: Lesson Content Adaptation
```js
GuitarApp.onTeacherChanged(function(event) {
  // Load lesson pack specific to teacher
  const packId = getPrefixByTeacher(event.teacher.id);
  
  fetch(`./content/packs/${packId}/lessons.json`)
    .then(r => r.json())
    .then(lessons => updateLessonPanel(lessons))
    .catch(console.warn);
});

function getPrefixByTeacher(teacherId) {
  const map = { T1: "core", T4: "blues", T5: "country" };
  return map[teacherId] || "core";
}
```

### Use Case 4: UI State Persistence
```js
GuitarApp.onTeacherChanged(function(event) {
  // Remember user's last chosen teacher in localStorage
  try {
    localStorage.setItem("guitarapp.lastTeacherId", event.teacherId);
  } catch (e) {
    console.warn("[persistence] Failed to save teacher preference");
  }
});

// On app startup, restore preference
function restoreTeacherPreference() {
  const saved = localStorage.getItem("guitarapp.lastTeacherId");
  if (saved) {
    const catalog = GuitarApp.getAppState().catalog || [];
    const teacher = catalog.find(t => t.id === saved);
    if (teacher) GuitarApp.setCurrentTeacher(teacher);
  }
}
```

---

## Backwards Compatibility

The refactor maintains 100% backwards compatibility:

1. **`app` object still exists** (read-only facade)
   ```js
   console.log(GuitarApp.app.currentTeacherId);  // Still works
   ```

2. **`setCurrentTeacher()` signature unchanged**
   ```js
   GuitarApp.setCurrentTeacher(teacherObj);  // Identical API
   ```

3. **`global.__APP__` still synced** (legacy fallback)
   ```js
   window.__APP__.app.currentTeacher;  // Still mirrors state
   ```

4. **Existing code continues to work** (but won't react to changes)
   ```js
   // Old way still works, just doesn't notify anyone:
   const teacher = GuitarApp.app.currentTeacher;
   ```

---

## Migration Checklist

If you have modules reading `app.currentTeacher` directly:

### Before:
```js
const teacher = window.GuitarApp.app.currentTeacher;
console.log(teacher.name);
```

### After (Reactive):
```js
// Option A: Get current state
const state = GuitarApp.getAppState();
console.log(state.currentTeacher.name);

// Option B: Subscribe to changes
GuitarApp.onTeacherChanged(function(event) {
  console.log("Teacher updated:", event.teacher.name);
});
```

---

## API Reference

### State Access
- `GuitarApp.getAppState()` → `{ currentTeacher, currentTeacherId, dogfood }`

### State Mutation
- `GuitarApp.setCurrentTeacher(teacher)` → Returns normalized teacher

### Event Subscription
- `GuitarApp.onTeacherChanged(callback)` → Unsubscribe function
- `GuitarApp.onceTeacherChanged(callback)` → Unsubscribe function
- `GuitarApp.offTeacherChanged(callback)` → Void

### Internal (Advanced)
- `GuitarApp.appEvents` → Direct access to EventEmitter
- `GuitarApp.appState` → Direct access to state object

---

## Troubleshooting

**Q: Why doesn't direct mutation of `app.currentTeacher` trigger updates?**
A: By design. Always use `setCurrentTeacher()` to ensure listeners are notified.

**Q: How do I know if a listener has been triggered?**
A: Add a log statement in your callback:
```js
GuitarApp.onTeacherChanged(function(event) {
  console.log("[my-module] Teacher changed:", event);
});
```

**Q: Can I have multiple listeners?**
A: Yes. All listeners for the same event fire independently:
```js
GuitarApp.onTeacherChanged(listener1);
GuitarApp.onTeacherChanged(listener2);  // Both will fire
```

**Q: What if my listener throws an error?**
A: The error is caught and logged. Other listeners still execute:
```js
// Even if listener1 throws, listener2 will still fire
GuitarApp.onTeacherChanged(listener1);  // throws error
GuitarApp.onTeacherChanged(listener2);  // executes anyway
```

---

## Performance Notes

- **Event emission is synchronous** (not async/deferred)
- **Listeners are called in subscription order** (FIFO)
- **No memory leaks** if you unsubscribe via returned function
- **Emitter stores listeners in a Map**, so lookup is O(1)

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| State mutability | Uncontrolled | Controlled via `setCurrentTeacher()` |
| Observer pattern | None | Built-in EventEmitter |
| Change detection | Manual polling | Automatic notifications |
| Listener cleanup | N/A | Unsubscribe function returned |
| Backwards compat | N/A | 100% maintained |
| Dependencies | None | None (vanilla JS) |
