// teacher.js — F3 TEACHER ENGINE. PORTED 1:1 from 06-prototypes/step3/engine/teacher.js.
// HARD INVARIANT: a teacher is COSMETIC ONLY. applyTeacher never mutates the manifest.

function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function cloneVerbatim(v) {
  if (Array.isArray(v)) { const a = []; for (let i = 0; i < v.length; i++) a[i] = cloneVerbatim(v[i]); return a; }
  if (isObj(v)) { const o = {}, keys = Object.keys(v); for (let k = 0; k < keys.length; k++) o[keys[k]] = cloneVerbatim(v[keys[k]]); return o; }
  return v;
}
function deepFreeze(o) {
  if (!isObj(o) && !Array.isArray(o)) return o;
  Object.freeze(o);
  Object.keys(o).forEach(function (k) { deepFreeze(o[k]); });
  return o;
}

const FORBIDDEN_TEACHER_KEYS = ['chords', 'chord', 'exercises', 'lesson', 'frets', 'fingers', 'scenes', 'caption', 'captions', 'tempoBpm', 'beats', 'qa_block'];
const REQUIRED_SCENE_KINDS = ['intro', 'chord', 'exercise', 'wrap'];

export function validateTeacher(t) {
  const errors = [];
  if (!isObj(t)) return { valid: false, errors: ['teacher is not an object'] };
  if (typeof t.id !== 'string' || !t.id.length) errors.push('teacher.id missing');
  if (typeof t.codename !== 'string' || !t.codename.length) errors.push('teacher.codename missing');
  if (typeof t.name !== 'string' || !t.name.length) errors.push('teacher.name missing');
  if (typeof t.tagline !== 'string' || !t.tagline.length) errors.push('teacher.tagline missing');
  if (typeof t.teaching_style !== 'string' || t.teaching_style.length < 120) errors.push('teacher.teaching_style missing or too short (needs a real few-sentence description)');
  if (!isObj(t.persona)) errors.push('teacher.persona missing');
  else ['summary', 'tone'].forEach(function (k) { if (typeof t.persona[k] !== 'string' || !t.persona[k].length) errors.push('teacher.persona.' + k + ' missing'); });
  if (!isObj(t.voice)) errors.push('teacher.voice missing');
  else ['provider', 'voice_id', 'style'].forEach(function (k) { if (typeof t.voice[k] !== 'string' || !t.voice[k].length) errors.push('teacher.voice.' + k + ' missing'); });
  if (!isObj(t.skin)) errors.push('teacher.skin missing');
  else if (!isObj(t.skin.palette)) errors.push('teacher.skin.palette missing');
  if (typeof t.handoff_line !== 'string' || !t.handoff_line.length) errors.push('teacher.handoff_line missing (fire/hire requires it)');
  if (!isObj(t.persona_lines)) errors.push('teacher.persona_lines missing');
  else REQUIRED_SCENE_KINDS.forEach(function (k) { if (typeof t.persona_lines[k] !== 'string' || !t.persona_lines[k].length) errors.push('teacher.persona_lines.' + k + ' missing'); });
  if (isObj(t.persona_lines)) Object.keys(t.persona_lines).forEach(function (k) { if (typeof t.persona_lines[k] !== 'string') errors.push('teacher.persona_lines.' + k + ' must be a plain string (no nested data)'); });
  (function scan(node, trail) {
    if (Array.isArray(node)) { node.forEach(function (v, i) { scan(v, trail + '[' + i + ']'); }); return; }
    if (!isObj(node)) return;
    Object.keys(node).forEach(function (k) {
      if (trail === 'teacher' && k === 'persona_lines') return;
      if (FORBIDDEN_TEACHER_KEYS.indexOf(k) !== -1) errors.push('teacher file contains LESSON CONTENT key "' + k + '" at ' + trail + '.' + k);
      scan(node[k], trail + '.' + k);
    });
  })(t, 'teacher');
  return { valid: errors.length === 0, errors };
}

export const LESSON_CONTENT_KEYS = ['id', 'kind', 'caption', 'chord', 'tempoBpm', 'beats', 'durationMs'];
export const TEACHER_FIELDS = ['teacherId', 'voice', 'persona', 'skin', 'speech'];

// In the app, teacher JSON is loaded over fetch (not fs). loadTeacher wraps a parsed object.
export function loadTeacher(parsedOrRaw) {
  const raw = parsedOrRaw;
  const r = validateTeacher(raw);
  if (!r.valid) throw new Error('TEACHER SCHEMA INVALID: ' + r.errors.join('; '));
  return deepFreeze(raw);
}

export function applyTeacher(manifest, teacher) {
  if (!isObj(manifest) || !Array.isArray(manifest.scenes)) throw new Error('applyTeacher: manifest invalid');
  const tv = validateTeacher(teacher);
  if (!tv.valid) throw new Error('TEACHER SCHEMA INVALID: ' + tv.errors.join('; '));
  const view = {
    lessonId: manifest.lessonId, title: manifest.title,
    estimatedMinutes: manifest.estimatedMinutes, totalDurationMs: manifest.totalDurationMs,
    teacherId: teacher.id, teacherCodename: teacher.codename, teacherName: teacher.name,
    teacherTagline: teacher.tagline, teacherTeachingStyle: teacher.teaching_style,
    voice: cloneVerbatim(teacher.voice), persona: cloneVerbatim(teacher.persona), skin: cloneVerbatim(teacher.skin),
    scenes: []
  };
  for (let i = 0; i < manifest.scenes.length; i++) {
    const s = manifest.scenes[i];
    const out = {};
    for (let c = 0; c < LESSON_CONTENT_KEYS.length; c++) out[LESSON_CONTENT_KEYS[c]] = cloneVerbatim(s[LESSON_CONTENT_KEYS[c]]);
    const line = teacher.persona_lines[s.kind];
    if (typeof line !== 'string') throw new Error('TEACHER MISSING PERSONA LINE for scene kind "' + s.kind + '"');
    out.teacherId = teacher.id;
    out.speech = { style: teacher.voice.style, voice_id: teacher.voice.voice_id, persona_line: line, says: s.caption };
    view.scenes.push(out);
  }
  return view;
}

export function lessonContentProjection(viewOrManifest) {
  return {
    lessonId: viewOrManifest.lessonId, totalDurationMs: viewOrManifest.totalDurationMs,
    scenes: viewOrManifest.scenes.map(function (s) {
      const o = {}; LESSON_CONTENT_KEYS.forEach(function (k) { o[k] = cloneVerbatim(s[k]); }); return o;
    })
  };
}
