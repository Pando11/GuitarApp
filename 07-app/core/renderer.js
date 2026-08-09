// renderer.js — Step 0 RENDERER ENGINE. PORTED 1:1 from 06-prototypes/step0/engine/renderer.js.
// CommonJS, ZERO deps, NO DOM. buildManifest(lessonJson) + chordSVG(chord).
// Fretboard correct-by-construction from frets/fingers data only.

import { validateLesson } from './schema/validate.js';

const DEFAULT_SCENE_MS = 6000;
const DEFAULT_INTRO_MS = 5000;
const DEFAULT_WRAP_MS = 5000;
const DEFAULT_CHORD_MS = 8000;

const STRING_COUNT = 6;
const VERIFIED = 'verified-standard';

function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

export function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cloneVerbatim(v) {
  if (Array.isArray(v)) { const a = []; for (let i = 0; i < v.length; i++) a[i] = cloneVerbatim(v[i]); return a; }
  if (isObj(v)) { const o = {}, keys = Object.keys(v); for (let k = 0; k < keys.length; k++) o[keys[k]] = cloneVerbatim(v[keys[k]]); return o; }
  return v;
}

function pickCopy(copy, keys, fallback) {
  if (typeof copy === 'string') return copy;
  if (Array.isArray(copy)) {
    for (let a = 0; a < keys.length; a++) { const idx = keys[a]; if (typeof idx === 'number' && typeof copy[idx] === 'string') return copy[idx]; }
    return typeof copy[0] === 'string' ? copy[0] : fallback;
  }
  if (isObj(copy)) {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (typeof k !== 'string') continue;
      const v = copy[k];
      if (typeof v === 'string' && v.length) return v;
      if (isObj(v)) { if (typeof v.text === 'string' && v.text.length) return v.text; if (typeof v.caption === 'string' && v.caption.length) return v.caption; }
      if (Array.isArray(v) && typeof v[0] === 'string') return v.join(' ');
    }
  }
  return fallback;
}

function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : null; }

function paceMs(tempoBpm, beats, fallbackMs) {
  if (tempoBpm !== null && beats !== null && tempoBpm > 0 && beats > 0) return Math.round((60000 / tempoBpm) * beats);
  return fallbackMs;
}

export function buildManifest(lessonJson) {
  const result = validateLesson(lessonJson);
  if (!result || !result.valid) {
    const errors = (result && Array.isArray(result.errors)) ? result.errors : ['validator returned no result'];
    throw new Error('LESSON SCHEMA INVALID: ' + errors.join('; '));
  }
  const lesson = lessonJson.lesson;
  const copy = lessonJson.avatar_coaching_copy;
  const scenes = [];

  const introCaption = pickCopy(copy, ['intro', 'opening', 'welcome', 'start', 0], lesson.title);
  scenes.push({ id: 'intro', kind: 'intro', caption: introCaption, chord: null, tempoBpm: null, beats: null, durationMs: DEFAULT_INTRO_MS });

  const chordNames = Object.keys(lessonJson.chords);
  for (let c = 0; c < chordNames.length; c++) {
    const key = chordNames[c];
    if (key === '_schema') continue;
    const src = lessonJson.chords[key];
    if (!isObj(src)) continue;
    const chordCopy = cloneVerbatim(src);
    const displayName = (typeof chordCopy.name === 'string' && chordCopy.name.length) ? chordCopy.name : key;
    scenes.push({
      id: 'chord-' + key, kind: 'chord',
      caption: pickCopy(copy, [key, displayName, 'chords', 'chord'], 'Chord: ' + displayName),
      chord: chordCopy, tempoBpm: null, beats: null, durationMs: DEFAULT_CHORD_MS
    });
  }

  const exercises = lessonJson.exercises;
  for (let e = 0; e < exercises.length; e++) {
    const ex = exercises[e];
    const params = isObj(ex.params) ? ex.params : {};
    let tempoBpm = num(params.tempo_bpm); if (tempoBpm === null) tempoBpm = num(params.tempoBpm); if (tempoBpm === null) tempoBpm = num(params.bpm);
    let beats = num(params.beats); if (beats === null) beats = num(params.beat_count); if (beats === null) beats = num(params.reps);
    const exCaption = pickCopy(ex.coaching, ['text', 'caption', 'cue', 'say', 0], null);
    const cap = exCaption === null ? (typeof ex.purpose === 'string' ? ex.purpose : ex.name) : exCaption;
    let exChord = null;
    const ref = ex.chord || params.chord || params.chord_name;
    if (typeof ref === 'string' && ref !== '_schema' && isObj(lessonJson.chords[ref])) exChord = cloneVerbatim(lessonJson.chords[ref]);
    scenes.push({ id: 'exercise-' + ex.id, kind: 'exercise', caption: cap, chord: exChord, tempoBpm, beats, durationMs: paceMs(tempoBpm, beats, DEFAULT_SCENE_MS) });
  }

  scenes.push({ id: 'wrap', kind: 'wrap', caption: pickCopy(copy, ['wrap', 'outro', 'closing', 'end', 'wrap_up'], 'Nice work — practice slowly and stay relaxed.'), chord: null, tempoBpm: null, beats: null, durationMs: DEFAULT_WRAP_MS });

  let total = 0; for (let s = 0; s < scenes.length; s++) total += scenes[s].durationMs;
  return { lessonId: lesson.id, title: lesson.title, estimatedMinutes: lesson.estimated_minutes, scenes, totalDurationMs: total };
}

const PAD_L = 34, PAD_T = 44, COL_W = 26, ROW_H = 30, FRET_ROWS = 5;
const SVG_W = PAD_L + COL_W * (STRING_COUNT - 1) + 34;
const SVG_H = PAD_T + ROW_H * FRET_ROWS + 26;
function stringX(i) { return PAD_L + i * COL_W; }
function fretY(row) { return PAD_T + row * ROW_H; }

export function CHORD_SVG_DOTS(chord) {
  const frets = (chord && Array.isArray(chord.frets)) ? chord.frets : [];
  const fingers = (chord && Array.isArray(chord.fingers)) ? chord.fingers : [];
  let lowest = null, highest = null;
  for (let i = 0; i < frets.length; i++) { const f = frets[i]; if (typeof f === 'number' && f > 0) { if (lowest === null || f < lowest) lowest = f; if (highest === null || f > highest) highest = f; } }
  let baseFret = 1;
  if (lowest !== null && highest !== null && highest > FRET_ROWS) baseFret = lowest;
  const dots = [], markers = [];
  for (let i = 0; i < STRING_COUNT; i++) {
    const f = frets[i], finger = (i < fingers.length) ? fingers[i] : null;
    if (f === null || f === undefined) markers.push({ string: i, type: 'muted', cx: stringX(i), cy: PAD_T - 16 });
    else if (f === 0) markers.push({ string: i, type: 'open', cx: stringX(i), cy: PAD_T - 16 });
    else if (typeof f === 'number' && f > 0) {
      let row = f - baseFret; if (row < 0) row = 0; if (row > FRET_ROWS - 1) row = FRET_ROWS - 1;
      dots.push({ string: i, fret: f, finger: (typeof finger === 'number' && finger > 0) ? finger : null, cx: stringX(i), cy: fretY(row) + ROW_H / 2 });
    }
  }
  return { baseFret, dots, markers, width: SVG_W, height: SVG_H };
}

export function chordSVG(chord) {
  const g = CHORD_SVG_DOTS(chord);
  const name = (chord && typeof chord.name === 'string') ? chord.name : '';
  const parts = [];
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + g.width + ' ' + g.height + '" width="' + g.width + '" height="' + g.height + '" role="img" aria-label="' + esc(name || 'chord diagram') + '">');
  parts.push('<rect x="0" y="0" width="' + g.width + '" height="' + g.height + '" fill="#ffffff"/>');
  const xL = stringX(0), xR = stringX(STRING_COUNT - 1);
  if (g.baseFret === 1) parts.push('<rect x="' + (xL - 2) + '" y="' + (PAD_T - 6) + '" width="' + (xR - xL + 4) + '" height="6" fill="#111111"/>');
  else parts.push('<text x="' + (xL - 12) + '" y="' + (fretY(0) + 20) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#111111" text-anchor="end">' + g.baseFret + 'fr</text>');
  for (let r = 0; r <= FRET_ROWS; r++) parts.push('<line x1="' + xL + '" y1="' + fretY(r) + '" x2="' + xR + '" y2="' + fretY(r) + '" stroke="#555555" stroke-width="1.5"/>');
  for (let s = 0; s < STRING_COUNT; s++) parts.push('<line x1="' + stringX(s) + '" y1="' + fretY(0) + '" x2="' + stringX(s) + '" y2="' + fretY(FRET_ROWS) + '" stroke="#555555" stroke-width="1.5"/>');
  for (const mk of g.markers) {
    if (mk.type === 'open') parts.push('<circle cx="' + mk.cx + '" cy="' + mk.cy + '" r="6" fill="none" stroke="#111111" stroke-width="1.8"/>');
    else parts.push('<g transform="translate(' + mk.cx + ',' + mk.cy + ')"><line x1="-6" y1="-6" x2="6" y2="6" stroke="#b00020" stroke-width="2.2"/><line x1="-6" y1="6" x2="6" y2="-6" stroke="#b00020" stroke-width="2.2"/></g>');
  }
  for (const dot of g.dots) {
    parts.push('<circle cx="' + dot.cx + '" cy="' + dot.cy + '" r="10" fill="#111111"/>');
    if (dot.finger !== null) parts.push('<text x="' + dot.cx + '" y="' + (dot.cy + 4.5) + '" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">' + dot.finger + '</text>');
  }
  if (name) parts.push('<text x="' + (g.width / 2) + '" y="18" font-family="Helvetica,Arial,sans-serif" font-size="15" font-weight="bold" fill="#111111" text-anchor="middle">' + esc(name) + '</text>');
  parts.push('</svg>');
  return parts.join('');
}
