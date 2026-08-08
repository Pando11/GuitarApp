/*
 * GuitarApp Step 3 — SESSION ENGINE (fire/hire mid-lesson)
 * CommonJS, ZERO npm deps, NO DOM access.
 * Authority: 06-prototypes/step3/CONTRACT.md
 *
 * Position (sceneIndex + elapsedInSceneMs) is owned by the SESSION,
 * never by the teacher. Hiring a new teacher cannot move the student.
 */

'use strict';

var teacherEngine = require('./teacher.js');

function createSession(manifest, teacher) {
  if (!manifest || !Array.isArray(manifest.scenes) || !manifest.scenes.length) {
    throw new Error('createSession: manifest invalid or empty');
  }

  var state = {
    sceneIndex: 0,
    elapsedInSceneMs: 0,
    teacher: teacher,
    view: teacherEngine.applyTeacher(manifest, teacher),
    history: [],          // audit trail of every hire
    lastHandoffLine: null
  };

  function currentScene() {
    return state.view.scenes[state.sceneIndex];
  }

  function position() {
    return {
      sceneIndex: state.sceneIndex,
      elapsedInSceneMs: state.elapsedInSceneMs,
      sceneId: currentScene().id,
      totalElapsedMs: (function () {
        var t = 0;
        for (var i = 0; i < state.sceneIndex; i++) { t += state.view.scenes[i].durationMs; }
        return t + state.elapsedInSceneMs;
      })()
    };
  }

  /* Advance the playhead by ms, rolling into later scenes. Clamps at the end. */
  function advance(ms) {
    if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) {
      throw new Error('advance: ms must be a non-negative number');
    }
    var remaining = ms;
    while (remaining > 0) {
      var dur = currentScene().durationMs;
      var left = dur - state.elapsedInSceneMs;
      if (remaining < left) {
        state.elapsedInSceneMs += remaining;
        remaining = 0;
      } else if (state.sceneIndex < state.view.scenes.length - 1) {
        remaining -= left;
        state.sceneIndex += 1;
        state.elapsedInSceneMs = 0;
      } else {
        state.elapsedInSceneMs = dur;   // clamp at end of lesson
        remaining = 0;
      }
    }
    return position();
  }

  function seek(sceneIndex, elapsedInSceneMs) {
    if (sceneIndex < 0 || sceneIndex >= state.view.scenes.length) {
      throw new Error('seek: sceneIndex out of range');
    }
    state.sceneIndex = sceneIndex;
    state.elapsedInSceneMs = Math.max(0,
      Math.min(elapsedInSceneMs || 0, state.view.scenes[sceneIndex].durationMs));
    return position();
  }

  /* FIRE/HIRE — the DONE BAR mechanic.
   * Position MUST be byte-identical before and after. */
  function hire(newTeacher) {
    var before = position();
    var beforeContent = JSON.stringify(teacherEngine.lessonContentProjection(state.view));

    var newView = teacherEngine.applyTeacher(manifest, newTeacher);
    var afterContent = JSON.stringify(teacherEngine.lessonContentProjection(newView));

    if (beforeContent !== afterContent) {
      throw new Error(
        'FIRE/HIRE ABORTED: teacher "' + newTeacher.id +
        '" would change lesson content. Teachers are cosmetic-only.'
      );
    }

    var fired = state.teacher ? state.teacher.id : null;
    state.teacher = newTeacher;
    state.view = newView;
    /* position untouched — that is the entire point */
    state.lastHandoffLine = newTeacher.handoff_line;
    state.history.push({
      firedTeacherId: fired,
      hiredTeacherId: newTeacher.id,
      atSceneIndex: before.sceneIndex,
      atElapsedInSceneMs: before.elapsedInSceneMs,
      handoffLine: newTeacher.handoff_line
    });

    var after = position();
    if (after.sceneIndex !== before.sceneIndex ||
        after.elapsedInSceneMs !== before.elapsedInSceneMs ||
        after.sceneId !== before.sceneId) {
      throw new Error('FIRE/HIRE BUG: position moved during teacher swap');
    }

    return {
      handoffLine: newTeacher.handoff_line,
      teacherId: newTeacher.id,
      position: after,
      scene: currentScene()
    };
  }

  return {
    get teacherId() { return state.teacher.id; },
    get view() { return state.view; },
    get history() { return state.history.slice(); },
    get lastHandoffLine() { return state.lastHandoffLine; },
    currentScene: currentScene,
    position: position,
    advance: advance,
    seek: seek,
    hire: hire,
    contentFingerprint: function () {
      return JSON.stringify(teacherEngine.lessonContentProjection(state.view));
    }
  };
}

module.exports = { createSession: createSession };
