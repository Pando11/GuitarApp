/*
 * GuitarApp Step 0 — RENDERER ENGINE
 * CommonJS, ZERO npm deps, NO DOM / window / document access.
 * Authority: 06-prototypes/step0/CONTRACT.md
 *
 * Exports:
 *   buildManifest(lessonJson) -> manifest   (validates LOUDLY, throws on invalid)
 *   chordSVG(chord)           -> SVG string (drawn from frets/fingers data only)
 *   CHORD_SVG_DOTS(chord)     -> array of dot descriptors (pure geometry, testable)
 *
 * Fretboard is correct-by-construction: every dot comes from the chord's own
 * frets[]/fingers[] arrays. Nothing is re-derived, re-typed, or invented.
 * Chord objects in the manifest are COPIED VERBATIM from lessonJson.chords.
 */

'use strict';

var validate = require('../schema/validate.js');

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

// Fallback scene length when no tempo/beats pacing data is present.
var DEFAULT_SCENE_MS = 6000;
var DEFAULT_INTRO_MS = 5000;
var DEFAULT_WRAP_MS = 5000;
var DEFAULT_CHORD_MS = 8000;

var STRING_COUNT = 6;          // index 0 = low E (6th string) .. index 5 = high e (1st)
var VERIFIED = 'verified-standard';

/* ------------------------------------------------------------------ *
 * Small helpers (no DOM, no deps)
 * ------------------------------------------------------------------ */

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Deep clone WITHOUT re-typing values: preserves null / number / string exactly.
function cloneVerbatim(v) {
  if (Array.isArray(v)) {
    var a = [];
    for (var i = 0; i < v.length; i++) { a[i] = cloneVerbatim(v[i]); }
    return a;
  }
  if (isObj(v)) {
    var o = {};
    var keys = Object.keys(v);
    for (var k = 0; k < keys.length; k++) { o[keys[k]] = cloneVerbatim(v[keys[k]]); }
    return o;
  }
  return v; // number | string | boolean | null | undefined — untouched
}

function pickCopy(copy, keys, fallback) {
  if (typeof copy === 'string') { return copy; }
  if (Array.isArray(copy)) {
    for (var a = 0; a < keys.length; a++) {
      var idx = keys[a];
      if (typeof idx === 'number' && typeof copy[idx] === 'string') { return copy[idx]; }
    }
    return typeof copy[0] === 'string' ? copy[0] : fallback;
  }
  if (isObj(copy)) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (typeof k !== 'string') { continue; }
      var v = copy[k];
      if (typeof v === 'string' && v.length) { return v; }
      if (isObj(v)) {
        if (typeof v.text === 'string' && v.text.length) { return v.text; }
        if (typeof v.caption === 'string' && v.caption.length) { return v.caption; }
      }
      if (Array.isArray(v) && typeof v[0] === 'string') { return v.join(' '); }
    }
  }
  return fallback;
}

function num(v) {
  return (typeof v === 'number' && isFinite(v)) ? v : null;
}

// Pacing: derive from tempo/beats when both are present, else fixed default.
function paceMs(tempoBpm, beats, fallbackMs) {
  if (tempoBpm !== null && beats !== null && tempoBpm > 0 && beats > 0) {
    return Math.round((60000 / tempoBpm) * beats);
  }
  return fallbackMs;
}

/* ------------------------------------------------------------------ *
 * buildManifest
 * ------------------------------------------------------------------ */

function buildManifest(lessonJson) {
  var result = validate.validateLesson(lessonJson);
  if (!result || !result.valid) {
    var errors = (result && Array.isArray(result.errors)) ? result.errors : ['validator returned no result'];
    throw new Error('LESSON SCHEMA INVALID: ' + errors.join('; '));
  }

  var lesson = lessonJson.lesson;
  var copy = lessonJson.avatar_coaching_copy;
  var scenes = [];

  /* ---- intro (always first) ---- */
  var introCaption = pickCopy(copy, ['intro', 'opening', 'welcome', 'start', 0], lesson.title);
  scenes.push({
    id: 'intro',
    kind: 'intro',
    caption: introCaption,
    chord: null,
    tempoBpm: null,
    beats: null,
    durationMs: DEFAULT_INTRO_MS
  });

  /* ---- one chord scene per entry in chords (skip _schema) ---- */
  var chordNames = Object.keys(lessonJson.chords);
  for (var c = 0; c < chordNames.length; c++) {
    var key = chordNames[c];
    if (key === '_schema') { continue; }
    var src = lessonJson.chords[key];
    if (!isObj(src)) { continue; }

    // COPIED VERBATIM — no re-derivation of frets/fingers.
    var chordCopy = cloneVerbatim(src);
    var displayName = (typeof chordCopy.name === 'string' && chordCopy.name.length) ? chordCopy.name : key;

    scenes.push({
      id: 'chord-' + key,
      kind: 'chord',
      caption: pickCopy(copy, [key, displayName, 'chords', 'chord'], 'Chord: ' + displayName),
      chord: chordCopy,
      tempoBpm: null,
      beats: null,
      durationMs: DEFAULT_CHORD_MS
    });
  }

  /* ---- one exercise scene per exercise ---- */
  var exercises = lessonJson.exercises;
  for (var e = 0; e < exercises.length; e++) {
    var ex = exercises[e];
    var params = isObj(ex.params) ? ex.params : {};
    var tempoBpm = num(params.tempo_bpm);
    if (tempoBpm === null) { tempoBpm = num(params.tempoBpm); }
    if (tempoBpm === null) { tempoBpm = num(params.bpm); }
    var beats = num(params.beats);
    if (beats === null) { beats = num(params.beat_count); }
    if (beats === null) { beats = num(params.reps); }

    var exCaption = pickCopy(ex.coaching, ['text', 'caption', 'cue', 'say', 0], null);
    if (exCaption === null) { exCaption = (typeof ex.purpose === 'string' ? ex.purpose : ex.name); }

    // Exercise may reference a chord by name — copy it verbatim if it exists.
    var exChord = null;
    var ref = ex.chord || params.chord || params.chord_name;
    if (typeof ref === 'string' && ref !== '_schema' && isObj(lessonJson.chords[ref])) {
      exChord = cloneVerbatim(lessonJson.chords[ref]);
    }

    scenes.push({
      id: 'exercise-' + ex.id,
      kind: 'exercise',
      caption: exCaption,
      chord: exChord,
      tempoBpm: tempoBpm,
      beats: beats,
      durationMs: paceMs(tempoBpm, beats, DEFAULT_SCENE_MS)
    });
  }

  /* ---- wrap (always last) ---- */
  scenes.push({
    id: 'wrap',
    kind: 'wrap',
    caption: pickCopy(copy, ['wrap', 'outro', 'closing', 'end', 'wrap_up'], 'Nice work — practice slowly and stay relaxed.'),
    chord: null,
    tempoBpm: null,
    beats: null,
    durationMs: DEFAULT_WRAP_MS
  });

  var total = 0;
  for (var s = 0; s < scenes.length; s++) { total += scenes[s].durationMs; }

  return {
    lessonId: lesson.id,
    title: lesson.title,
    estimatedMinutes: lesson.estimated_minutes,
    scenes: scenes,
    totalDurationMs: total
  };
}

/* ------------------------------------------------------------------ *
 * Fretboard geometry — pure, data-driven
 * ------------------------------------------------------------------ */

// Layout constants (SVG user units)
var PAD_L = 34, PAD_T = 44, COL_W = 26, ROW_H = 30, FRET_ROWS = 5;
var SVG_W = PAD_L + COL_W * (STRING_COUNT - 1) + 34;
var SVG_H = PAD_T + ROW_H * FRET_ROWS + 26;

function stringX(i) { return PAD_L + i * COL_W; }
function fretY(row) { return PAD_T + row * ROW_H; }

/**
 * CHORD_SVG_DOTS(chord) -> { baseFret, dots, markers }
 * dots: fretted notes { string, fret, finger, cx, cy }
 * markers: open/muted symbols { string, type: 'open'|'muted', cx, cy }
 * Everything derived from chord.frets / chord.fingers ONLY.
 */
function CHORD_SVG_DOTS(chord) {
  var frets = (chord && Array.isArray(chord.frets)) ? chord.frets : [];
  var fingers = (chord && Array.isArray(chord.fingers)) ? chord.fingers : [];

  // Determine window: lowest fretted note (barre chords high on the neck).
  var lowest = null, highest = null, i, f;
  for (i = 0; i < frets.length; i++) {
    f = frets[i];
    if (typeof f === 'number' && f > 0) {
      if (lowest === null || f < lowest) { lowest = f; }
      if (highest === null || f > highest) { highest = f; }
    }
  }
  var baseFret = 1;
  if (lowest !== null && highest !== null && highest > FRET_ROWS) {
    baseFret = lowest;
  }

  var dots = [];
  var markers = [];
  for (i = 0; i < STRING_COUNT; i++) {
    f = frets[i];
    var finger = (i < fingers.length) ? fingers[i] : null;
    if (f === null || f === undefined) {
      markers.push({ string: i, type: 'muted', cx: stringX(i), cy: PAD_T - 16 });
    } else if (f === 0) {
      markers.push({ string: i, type: 'open', cx: stringX(i), cy: PAD_T - 16 });
    } else if (typeof f === 'number' && f > 0) {
      var row = f - baseFret; // 0-based row within the visible window
      if (row < 0) { row = 0; }
      if (row > FRET_ROWS - 1) { row = FRET_ROWS - 1; }
      dots.push({
        string: i,
        fret: f,
        finger: (typeof finger === 'number' && finger > 0) ? finger : null,
        cx: stringX(i),
        cy: fretY(row) + ROW_H / 2
      });
    }
  }
  return { baseFret: baseFret, dots: dots, markers: markers, width: SVG_W, height: SVG_H };
}

/**
 * chordSVG(chord) -> SVG string.
 * NOTE: uses SVG transform ATTRIBUTES only (CSS transforms on <g> are unreliable).
 */
function chordSVG(chord) {
  var g = CHORD_SVG_DOTS(chord);
  var name = (chord && typeof chord.name === 'string') ? chord.name : '';
  var unverified = !(chord && chord.qa_status === VERIFIED);

  var parts = [];
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + g.width + ' ' + g.height +
             '" width="' + g.width + '" height="' + g.height +
             '" role="img" aria-label="' + esc(name || 'chord diagram') + '">');
  parts.push('<rect x="0" y="0" width="' + g.width + '" height="' + g.height + '" fill="#ffffff"/>');

  var xL = stringX(0), xR = stringX(STRING_COUNT - 1);

  // Nut (thick) when window starts at fret 1, else a thin line + position label.
  if (g.baseFret === 1) {
    parts.push('<rect x="' + (xL - 2) + '" y="' + (PAD_T - 6) + '" width="' + (xR - xL + 4) +
               '" height="6" fill="#111111"/>');
  } else {
    parts.push('<text x="' + (xL - 12) + '" y="' + (fretY(0) + 20) +
               '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#111111" text-anchor="end">' +
               g.baseFret + 'fr</text>');
  }

  // Frets (horizontal)
  for (var r = 0; r <= FRET_ROWS; r++) {
    parts.push('<line x1="' + xL + '" y1="' + fretY(r) + '" x2="' + xR + '" y2="' + fretY(r) +
               '" stroke="#555555" stroke-width="1.5"/>');
  }
  // Strings (vertical)
  for (var s = 0; s < STRING_COUNT; s++) {
    parts.push('<line x1="' + stringX(s) + '" y1="' + fretY(0) + '" x2="' + stringX(s) +
               '" y2="' + fretY(FRET_ROWS) + '" stroke="#555555" stroke-width="1.5"/>');
  }

  // Open / muted markers above the nut
  for (var m = 0; m < g.markers.length; m++) {
    var mk = g.markers[m];
    if (mk.type === 'open') {
      parts.push('<circle cx="' + mk.cx + '" cy="' + mk.cy + '" r="6" fill="none" stroke="#111111" stroke-width="1.8"/>');
    } else {
      parts.push('<g transform="translate(' + mk.cx + ',' + mk.cy + ')">' +
                 '<line x1="-6" y1="-6" x2="6" y2="6" stroke="#b00020" stroke-width="2.2"/>' +
                 '<line x1="-6" y1="6" x2="6" y2="-6" stroke="#b00020" stroke-width="2.2"/></g>');
    }
  }

  // Finger dots
  for (var d = 0; d < g.dots.length; d++) {
    var dot = g.dots[d];
    parts.push('<circle cx="' + dot.cx + '" cy="' + dot.cy + '" r="10" fill="#111111"/>');
    if (dot.finger !== null) {
      parts.push('<text x="' + dot.cx + '" y="' + (dot.cy + 4.5) +
                 '" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">' +
                 dot.finger + '</text>');
    }
  }

  // Name
  if (name) {
    parts.push('<text x="' + (g.width / 2) + '" y="18" font-family="Helvetica,Arial,sans-serif" font-size="15" font-weight="bold" fill="#111111" text-anchor="middle">' +
               esc(name) + '</text>');
  }

  // QA badge removed from the diagram at owner request 2026-08-07 — DISPLAY ONLY.
  // Data-level QA is UNCHANGED: chord.qa_status and qa_block.guitarist_signoff are
  // still required by the schema and still gate ship (Hard Ban 7 / Step 4 bar).
  void unverified;

  parts.push('</svg>');
  return parts.join('');
}

module.exports = {
  buildManifest: buildManifest,
  chordSVG: chordSVG,
  CHORD_SVG_DOTS: CHORD_SVG_DOTS,
  DEFAULT_SCENE_MS: DEFAULT_SCENE_MS
};
