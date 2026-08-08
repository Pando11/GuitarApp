/*
 * GuitarApp Step 3 — TEACHER ENGINE
 * CommonJS, ZERO npm deps, NO DOM access.
 * Authority: 06-prototypes/step3/CONTRACT.md
 *
 * HARD INVARIANT: a teacher is COSMETIC ONLY.
 * applyTeacher() never mutates the manifest and never changes lesson content.
 */

'use strict';

var fs = require('fs');
var path = require('path');

/* Lesson-content fields that MUST be identical under every teacher. */
var LESSON_CONTENT_KEYS = [
  'id', 'kind', 'caption', 'chord', 'tempoBpm', 'beats', 'durationMs'
];

/* Fields a teacher view model is allowed to ADD. Anything else = violation. */
var TEACHER_FIELDS = ['teacherId', 'voice', 'persona', 'skin', 'speech'];

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function cloneVerbatim(v) {
  if (Array.isArray(v)) {
    var a = [];
    for (var i = 0; i < v.length; i++) { a[i] = cloneVerbatim(v[i]); }
    return a;
  }
  if (isObj(v)) {
    var o = {}, keys = Object.keys(v);
    for (var k = 0; k < keys.length; k++) { o[keys[k]] = cloneVerbatim(v[keys[k]]); }
    return o;
  }
  return v;
}

function deepFreeze(o) {
  if (!isObj(o) && !Array.isArray(o)) { return o; }
  Object.freeze(o);
  Object.keys(o).forEach(function (k) { deepFreeze(o[k]); });
  return o;
}

/* ------------------------------------------------------------------ *
 * loadTeacher — validates LOUDLY. A teacher file containing lesson
 * content is a contract violation and must throw.
 * ------------------------------------------------------------------ */

var FORBIDDEN_TEACHER_KEYS = [
  'chords', 'chord', 'exercises', 'lesson', 'frets', 'fingers',
  'scenes', 'caption', 'captions', 'tempoBpm', 'beats', 'qa_block'
];

var REQUIRED_SCENE_KINDS = ['intro', 'chord', 'exercise', 'wrap'];

function validateTeacher(t) {
  var errors = [];
  if (!isObj(t)) { return { valid: false, errors: ['teacher is not an object'] }; }

  if (typeof t.id !== 'string' || !t.id.length) { errors.push('teacher.id missing'); }
  if (typeof t.codename !== 'string' || !t.codename.length) { errors.push('teacher.codename missing'); }
  if (typeof t.name !== 'string' || !t.name.length) { errors.push('teacher.name missing'); }
  if (typeof t.tagline !== 'string' || !t.tagline.length) { errors.push('teacher.tagline missing'); }
  /* teaching_style is the human-readable "so-and-so teaches like this" blurb the
   * student reads when choosing. Must be real prose, not a stub. */
  if (typeof t.teaching_style !== 'string' || t.teaching_style.length < 120) {
    errors.push('teacher.teaching_style missing or too short (needs a real few-sentence description)');
  }

  if (!isObj(t.persona)) {
    errors.push('teacher.persona missing');
  } else {
    ['summary', 'tone'].forEach(function (k) {
      if (typeof t.persona[k] !== 'string' || !t.persona[k].length) {
        errors.push('teacher.persona.' + k + ' missing');
      }
    });
  }

  if (!isObj(t.voice)) {
    errors.push('teacher.voice missing');
  } else {
    ['provider', 'voice_id', 'style'].forEach(function (k) {
      if (typeof t.voice[k] !== 'string' || !t.voice[k].length) {
        errors.push('teacher.voice.' + k + ' missing');
      }
    });
  }

  if (!isObj(t.skin)) {
    errors.push('teacher.skin missing');
  } else if (!isObj(t.skin.palette)) {
    errors.push('teacher.skin.palette missing');
  }

  if (typeof t.handoff_line !== 'string' || !t.handoff_line.length) {
    errors.push('teacher.handoff_line missing (fire/hire requires it)');
  }

  if (!isObj(t.persona_lines)) {
    errors.push('teacher.persona_lines missing');
  } else {
    REQUIRED_SCENE_KINDS.forEach(function (k) {
      if (typeof t.persona_lines[k] !== 'string' || !t.persona_lines[k].length) {
        errors.push('teacher.persona_lines.' + k + ' missing');
      }
    });
  }

  /* persona_lines is keyed BY SCENE KIND (intro/chord/exercise/wrap), so its keys
   * legitimately collide with lesson-content names. It is exempt from the key scan,
   * but every value must be a plain string — no nested lesson data may hide there. */
  if (isObj(t.persona_lines)) {
    Object.keys(t.persona_lines).forEach(function (k) {
      if (typeof t.persona_lines[k] !== 'string') {
        errors.push('teacher.persona_lines.' + k + ' must be a plain string (no nested data)');
      }
    });
  }

  /* Fail CLOSED: any lesson-content-looking key anywhere else in the teacher file. */
  (function scan(node, trail) {
    if (Array.isArray(node)) {
      node.forEach(function (v, i) { scan(v, trail + '[' + i + ']'); });
      return;
    }
    if (!isObj(node)) { return; }
    Object.keys(node).forEach(function (k) {
      if (trail === 'teacher' && k === 'persona_lines') { return; }  // exempt, checked above
      if (FORBIDDEN_TEACHER_KEYS.indexOf(k) !== -1) {
        errors.push('teacher file contains LESSON CONTENT key "' + k + '" at ' + trail + '.' + k);
      }
      scan(node[k], trail + '.' + k);
    });
  })(t, 'teacher');

  return { valid: errors.length === 0, errors: errors };
}

function loadTeacher(idOrPath) {
  var p = idOrPath;
  if (!/[\\/]/.test(idOrPath) && !/\.json$/.test(idOrPath)) {
    p = path.join(__dirname, '..', 'teachers', idOrPath + '.json');
  }
  var raw;
  try {
    raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    throw new Error('TEACHER LOAD FAILED: ' + p + ' — ' + e.message);
  }
  var r = validateTeacher(raw);
  if (!r.valid) {
    throw new Error('TEACHER SCHEMA INVALID: ' + r.errors.join('; '));
  }
  return deepFreeze(raw);
}

/* ------------------------------------------------------------------ *
 * applyTeacher(manifest, teacher) -> VIEW MODEL
 * Pure. Does not mutate manifest. Lesson content copied verbatim.
 * ------------------------------------------------------------------ */

function applyTeacher(manifest, teacher) {
  if (!isObj(manifest) || !Array.isArray(manifest.scenes)) {
    throw new Error('applyTeacher: manifest invalid');
  }
  var tv = validateTeacher(teacher);
  if (!tv.valid) { throw new Error('TEACHER SCHEMA INVALID: ' + tv.errors.join('; ')); }

  var view = {
    lessonId: manifest.lessonId,
    title: manifest.title,
    estimatedMinutes: manifest.estimatedMinutes,
    totalDurationMs: manifest.totalDurationMs,
    teacherId: teacher.id,
    teacherCodename: teacher.codename,
    teacherName: teacher.name,
    teacherTagline: teacher.tagline,
    teacherTeachingStyle: teacher.teaching_style,
    voice: cloneVerbatim(teacher.voice),
    persona: cloneVerbatim(teacher.persona),
    skin: cloneVerbatim(teacher.skin),
    scenes: []
  };

  for (var i = 0; i < manifest.scenes.length; i++) {
    var s = manifest.scenes[i];
    var out = {};
    /* lesson content — VERBATIM, untouched */
    for (var c = 0; c < LESSON_CONTENT_KEYS.length; c++) {
      var key = LESSON_CONTENT_KEYS[c];
      out[key] = cloneVerbatim(s[key]);
    }
    /* teacher-owned additions only */
    var line = teacher.persona_lines[s.kind];
    if (typeof line !== 'string') {
      throw new Error('TEACHER MISSING PERSONA LINE for scene kind "' + s.kind + '"');
    }
    out.teacherId = teacher.id;
    out.speech = {
      style: teacher.voice.style,
      voice_id: teacher.voice.voice_id,
      persona_line: line,          // teacher-owned framing, NOT lesson content
      says: s.caption              // the lesson's own words, unchanged
    };
    view.scenes.push(out);
  }
  return view;
}

/* Extract only the lesson-content projection of a view model / manifest.
 * Two teachers' projections must be byte-identical JSON. */
function lessonContentProjection(viewOrManifest) {
  return {
    lessonId: viewOrManifest.lessonId,
    totalDurationMs: viewOrManifest.totalDurationMs,
    scenes: viewOrManifest.scenes.map(function (s) {
      var o = {};
      LESSON_CONTENT_KEYS.forEach(function (k) { o[k] = cloneVerbatim(s[k]); });
      return o;
    })
  };
}

module.exports = {
  loadTeacher: loadTeacher,
  validateTeacher: validateTeacher,
  applyTeacher: applyTeacher,
  lessonContentProjection: lessonContentProjection,
  LESSON_CONTENT_KEYS: LESSON_CONTENT_KEYS,
  TEACHER_FIELDS: TEACHER_FIELDS
};
