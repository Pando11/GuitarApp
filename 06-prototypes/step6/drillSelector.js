'use strict';
/*
 * drillSelector.js — Loop A drill-serving (Step 6, TASK-A1).
 *
 * Turns an "I can't get this <chord>" moment into an ACTUAL served drill pulled
 * from our real lesson JSON (05-content/guitar-lesson-*.json), instead of only
 * encouraging text. This closes the last unfinished piece of the student-help
 * loop (ideas 1 + 4 from COMPLAINTS-TO-FEATURES.md: auto-serve practice on the
 * stuck thing + break into baby steps).
 *
 * Hard rules obeyed:
 *   - Ban 5: reads LOCAL lesson files only. ZERO network calls.
 *   - Ban 6: cites ONLY real lesson data (exercise name, coaching copy, chord
 *     pair, lesson id). It never invents a physical diagnosis or a drill that
 *     does not exist in the curriculum. If no drill matches, it returns null so
 *     the caller can fall back to the generic encouragement text (which is also
 *     data-derived).
 *
 * A drill is "for chord X" when its params.chord_pair array contains X. We return
 * the first match, preferring a drill whose purpose/name suggests a small step.
 *
 * Run its DONE BAR: node verify-step6-loopA.js
 */
const fs = require('fs');
const path = require('path');

// Lessongs live relative to repo root. Allow override for tests.
const LESSON_DIR = process.env.GUITAR_LESSON_DIR
  || path.resolve(__dirname, '..', '..', '05-content');

function loadLessons() {
  let files;
  try {
    files = fs.readdirSync(LESSON_DIR).filter(f => /^guitar-lesson-.*\.json$/.test(f));
  } catch (e) {
    return [];
  }
  const out = [];
  for (const f of files) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(LESSON_DIR, f), 'utf8'));
      const meta = d.lesson || {};
      out.push({
        file: f,
        lessonId: meta.id || f.replace(/^guitar-lesson-/, '').replace(/\.json$/, ''),
        title: meta.title || '',
        chords: d.chords || {},
        exercises: Array.isArray(d.exercises) ? d.exercises : []
      });
    } catch (e) {
      // skip malformed lesson files; do not throw (Ban 5: local read only)
    }
  }
  return out;
}

// Find a real drill (exercise) whose chord_pair includes the target chord.
// Returns { lessonId, lessonTitle, exerciseName, coaching, chordPair } or null.
function findDrillForChord(chordName, lessons) {
  if (!chordName || typeof chordName !== 'string' || !chordName.trim()) return null;
  const c = chordName.trim();
  const list = lessons || loadLessons();
  for (const lesson of list) {
    for (const ex of lesson.exercises) {
      const pair = (ex.params && ex.params.chord_pair) || [];
      if (Array.isArray(pair) && pair.includes(c)) {
        return {
          lessonId: lesson.lessonId,
          lessonTitle: lesson.title,
          exerciseName: ex.name,
          coaching: ex.coaching || '',
          chordPair: pair,
          // Prefer a "baby step" drill: one whose name suggests a small/first move.
          isStepDrill: /\b(air|anchor|find|first|mini|slow|step|lift|land)\b/i.test(ex.name || '')
        };
      }
    }
  }
  return null;
}

// Convenience: drill for the student's TOP struggled chord (from the store).
function drillForStruggle(store, lessons) {
  const struggled = store.getStruggledChords();
  if (!struggled.length) return null;
  return findDrillForChord(struggled[0], lessons);
}

module.exports = { loadLessons, findDrillForChord, drillForStruggle, LESSON_DIR };
