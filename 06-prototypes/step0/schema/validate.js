'use strict';

/**
 * Hand-rolled validator for GuitarApp Step 0 lesson JSON.
 * ZERO npm dependencies (no ajv). CommonJS.
 *
 * Contract: 06-prototypes/step0/CONTRACT.md
 *
 * validateLesson(obj) -> { valid: boolean, errors: string[] }
 *   - errors name the offending path, e.g. "chords.C.frets must have exactly 6 entries"
 *   - underscore-prefixed keys (e.g. chords._schema, lesson.app_feature_mapping._removed_*)
 *     are metadata and are IGNORED (never rejected).
 */

var REQUIRED_TOP = ['lesson', 'chords', 'exercises', 'avatar_coaching_copy', 'qa_block'];
var REQUIRED_LESSON = ['id', 'title', 'level', 'lesson_type', 'objectives', 'estimated_minutes'];
var REQUIRED_EXERCISE = ['id', 'name', 'purpose', 'params', 'coaching', 'qa_status'];
var VALID_FINGERS = [0, 1, 2, 3, 4];

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isInteger(v) {
  return typeof v === 'number' && Number.isInteger(v);
}

function validateLesson(obj) {
  var errors = [];

  if (!isPlainObject(obj)) {
    errors.push('root must be a JSON object');
    return { valid: false, errors: errors };
  }

  // ---- top-level required keys ----
  REQUIRED_TOP.forEach(function (key) {
    if (!(key in obj)) {
      errors.push('missing required top-level key: ' + key);
    }
  });

  // ---- lesson ----
  if ('lesson' in obj) {
    var lesson = obj.lesson;
    if (!isPlainObject(lesson)) {
      errors.push('lesson must be an object');
    } else {
      REQUIRED_LESSON.forEach(function (key) {
        if (!(key in lesson)) {
          errors.push('lesson.' + key + ' is required');
        }
      });
      if ('lesson_type' in lesson && lesson.lesson_type !== 'technique') {
        errors.push("lesson.lesson_type must be 'technique' (got: " + JSON.stringify(lesson.lesson_type) + ")");
      }
      if ('objectives' in lesson) {
        if (!Array.isArray(lesson.objectives)) {
          errors.push('lesson.objectives must be an array');
        } else {
          if (lesson.objectives.length === 0) {
            errors.push('lesson.objectives must be a non-empty array');
          }
          lesson.objectives.forEach(function (o, i) {
            if (typeof o !== 'string' || o.trim() === '') {
              errors.push('lesson.objectives[' + i + '] must be a non-empty string');
            }
          });
        }
      }
    }
  }

  // ---- chords ----
  if ('chords' in obj) {
    var chords = obj.chords;
    if (!isPlainObject(chords)) {
      errors.push('chords must be an object');
    } else {
      Object.keys(chords).forEach(function (name) {
        if (name.charAt(0) === '_') return; // metadata, ignored
        var chord = chords[name];
        var path = 'chords.' + name;
        if (!isPlainObject(chord)) {
          errors.push(path + ' must be an object');
          return;
        }
        if (typeof chord.name !== 'string' || chord.name.trim() === '') {
          errors.push(path + '.name must be a non-empty string');
        }
        if (!('frets' in chord)) {
          errors.push(path + '.frets is required');
        } else if (!Array.isArray(chord.frets) || chord.frets.length !== 6) {
          errors.push(path + '.frets must have exactly 6 entries');
        } else {
          chord.frets.forEach(function (v, i) {
            if (v !== null && (!isInteger(v) || v < 0 || v > 24)) {
              errors.push(path + '.frets[' + i + '] must be null or an integer 0-24 (got: ' + JSON.stringify(v) + ')');
            }
          });
        }
        if (!('fingers' in chord)) {
          errors.push(path + '.fingers is required');
        } else if (!Array.isArray(chord.fingers) || chord.fingers.length !== 6) {
          errors.push(path + '.fingers must have exactly 6 entries');
        } else {
          chord.fingers.forEach(function (v, i) {
            if (v !== null && VALID_FINGERS.indexOf(v) === -1) {
              errors.push(path + '.fingers[' + i + '] must be null or one of 0,1,2,3,4 (got: ' + JSON.stringify(v) + ')');
            }
          });
        }
        if (!('qa_status' in chord)) {
          errors.push(path + '.qa_status is required');
        } else if (typeof chord.qa_status !== 'string' ||
                   !/^(verified-standard|verified-by-theory-check-\d{4}-\d{2}-\d{2}|QA-PENDING)$/.test(chord.qa_status)) {
          errors.push(path + '.qa_status must be one of verified-standard | verified-by-theory-check-YYYY-MM-DD | QA-PENDING (got: ' + JSON.stringify(chord.qa_status) + ')');
        }
      });
    }
  }

  // ---- exercises ----
  if ('exercises' in obj) {
    var exercises = obj.exercises;
    if (!Array.isArray(exercises)) {
      errors.push('exercises must be an array');
    } else {
      exercises.forEach(function (ex, idx) {
        var path = 'exercises[' + idx + ']';
        if (!isPlainObject(ex)) {
          errors.push(path + ' must be an object');
          return;
        }
        REQUIRED_EXERCISE.forEach(function (key) {
          if (!(key in ex)) {
            errors.push(path + '.' + key + ' is required');
          }
        });
        // 2026-08-08 review: an exercise must not reference a chord that isn't in this lesson.
        // Any short, capital-letter-led string under a chord-reference key is treated as a
        // chord ref; if it's not a key in chords{} it is rejected LOUDLY. (First pass used a
        // chord-name regex, which failed to match deliberately-wrong refs like "Nope".)
        var chordKeys = (obj.chords && typeof obj.chords === 'object')
          ? Object.keys(obj.chords).filter(function (k) { return k.charAt(0) !== '_'; }) : [];
        function scanRefs(v, p) {
          if (typeof v === 'string') {
            if (/^[A-Z]/.test(v) && v.length <= 8 && chordKeys.length) {
              if (chordKeys.indexOf(v) === -1) errors.push(p + ' references chord "' + v + '" which is not in this lesson\'s chords');
            }
          } else if (Array.isArray(v)) { v.forEach(function (x, i) { scanRefs(x, p + '[' + i + ']'); }); }
          else if (v && typeof v === 'object') { Object.keys(v).forEach(function (k) { if (k.charAt(0) !== '_') scanRefs(v[k], p + '.' + k); }); }
        }
        ['chord', 'chords', 'chord_pair', 'target_chord', 'chord_cycle', 'from_chord', 'to_chord', 'chordA', 'chordB'].forEach(function (pk) {
          if (ex.params && pk in ex.params) scanRefs(ex.params[pk], path + '.params.' + pk);
        });
      });
    }
  }

  // ---- avatar_coaching_copy ----
  if ('avatar_coaching_copy' in obj && !isPlainObject(obj.avatar_coaching_copy)) {
    errors.push('avatar_coaching_copy must be an object');
  }

  // ---- qa_block ----
  if ('qa_block' in obj) {
    var qa = obj.qa_block;
    if (!isPlainObject(qa)) {
      errors.push('qa_block must be an object');
    } else {
      var mv = qa.must_verify;
      var mvbs = qa.must_verify_before_ship;
      var hasVerification =
        (Array.isArray(mv) && mv.length > 0) ||
        (Array.isArray(mvbs) && mvbs.length > 0);
      if (!hasVerification) {
        errors.push('qa_block.must_verify is required (non-empty array) — legacy key must_verify_before_ship also accepted');
      }
    }
  }

  return { valid: errors.length === 0, errors: errors };
}

module.exports = { validateLesson };
