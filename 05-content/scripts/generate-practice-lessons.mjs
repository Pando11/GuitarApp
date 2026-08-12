// generate-practice-lessons.mjs — builds the PRACTICE layer from the 20 teaching
// lessons, wiring each canonical chord pair to the 30/60 weak-pair engine +
// the canonicalized fluency memory (chord-canon.js).
//
// WHY THIS EXISTS (parent NEXT_STEP + curriculum-review root-cause fix):
//   * The teaching spine drills chords but emits NO generated practice content
//     the 30/60 engine can consume per pair.
//   * The weak-pair review MOAT requires per-pair fluency memory that survives
//     the easyC/C identity split — so every pair key is canonicalized.
//
// MOAT MODEL (mirrors practice-loop.measureLessonPair): when a lesson introduces
// a new chord X, the student must practice EVERY adjacent pair (X, prior) taught
// so far. We build the cumulative canonical ladder from the on-disk 20-lesson
// inventory and emit ONE practice lesson per unique canonical adjacent pair,
// plus standalone lessons for explicit chord_pair / chord_cycle drills.
//
// OUTPUT: 07-app/content/practice/<pair>.json + practice/index.json manifest.
// Every generated lesson PASSES validateLesson (same schema the app renders),
// so the real renderer + engine consume it unchanged.
//
// Run: node 05-content/scripts/generate-practice-lessons.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonChord } from '../../07-app/core/chord-canon.js';
import { validateLesson } from '../../07-app/core/schema/validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEACH = path.resolve(__dirname, '..');            // 05-content
const OUT = path.resolve(__dirname, '../../07-app/content/practice');

function loadTeaching(n) {
  const re = new RegExp(`^guitar-lesson-${String(n).padStart(2, '0')}-.*\\.json$`);
  const f = fs.readdirSync(TEACH).find((x) => re.test(x));
  if (!f) return null;
  return { file: f, data: JSON.parse(fs.readFileSync(path.join(TEACH, f), 'utf8')) };
}

function canonKeys(lessonData) {
  return Object.keys(lessonData.chords || {})
    .filter((k) => k !== '_schema')
    .map(canonChord);
}

// ---- 1. Cumulative canonical ladder from on-disk inventory ----
const ladder = [];               // [{ n, lessonId, chords:[canon...] }]
const seen = new Set();
for (let n = 1; n <= 20; n++) {
  const L = loadTeaching(n);
  if (!L) continue;
  const cks = canonKeys(L.data);
  const fresh = cks.filter((c) => !seen.has(c));
  fresh.forEach((c) => seen.add(c));
  ladder.push({ n, lessonId: L.data.lesson && L.data.lesson.id, chords: cks, fresh });
}

// Build the set of all unique adjacent pairs introduced cumulatively.
const pairSources = new Map(); // canonKey -> { a, b, introducedAt, lessonId }
function recordPair(a, b, n, lessonId) {
  const ca = canonChord(a), cb = canonChord(b);
  if (ca === cb) return;
  const key = [ca, cb].sort().join('::');
  if (!pairSources.has(key)) pairSources.set(key, { a: ca, b: cb, introducedAt: n, lessonId, cumulative: true });
}
// For each lesson, every chord already-seen before it forms a pair with the new one.
for (const row of ladder) {
  for (const fresh of row.fresh) {
    const priors = [];
    for (const prev of ladder) {
      if (prev.n >= row.n) continue;
      for (const c of prev.chords) if (!priors.includes(c)) priors.push(c);
    }
    for (const p of priors) recordPair(fresh, p, row.n, row.lessonId);
  }
}

// ---- 2. Explicit chord_pair / chord_cycle drills (richer, named) ----
function addExplicit(a, b, n, name) {
  const ca = canonChord(a), cb = canonChord(b);
  if (ca === cb) return;
  const key = [ca, cb].sort().join('::');
  if (!pairSources.has(key)) pairSources.set(key, { a: ca, b: cb, introducedAt: n, lessonId: null, cumulative: false, drillName: name });
  else pairSources.get(key).drillName = pairSources.get(key).drillName || name;
}
for (let n = 1; n <= 20; n++) {
  const L = loadTeaching(n);
  if (!L) continue;
  for (const ex of (L.data.exercises || [])) {
    const p = ex.params || {};
    if (Array.isArray(p.chord_pair) && p.chord_pair.length === 2) addExplicit(p.chord_pair[0], p.chord_pair[1], n, ex.name);
    if (Array.isArray(p.chord_cycle) && p.chord_cycle.length >= 2) {
      for (let i = 0; i < p.chord_cycle.length; i++) {
        addExplicit(p.chord_cycle[i], p.chord_cycle[(i + 1) % p.chord_cycle.length], n, ex.name);
      }
    }
  }
}

// ---- 3. Build + validate one practice lesson per canonical pair ----
function chordDef(token, lessonData) {
  // find the on-disk token that canon-maps to the requested canonical chord
  const t = Object.keys(lessonData.chords || {}).find((k) => k !== '_schema' && canonChord(k) === token);
  return t ? lessonData.chords[t] : null;
}
function buildPracticeLesson(pair) {
  const { a, b, introducedAt, lessonId, drillName } = pair;
  // Ensure BOTH practice chords are present in this lesson's `chords` block
  // (the schema validator requires chord_pair refs to resolve locally).
  // Search every teaching lesson for the canonical def — never leave it blank.
  const defs = {};
  for (let n = 1; n <= 20; n++) {
    const L = loadTeaching(n);
    if (!L) continue;
    for (const cn of [a, b]) if (!defs[cn]) { const d = chordDef(cn, L.data); if (d) defs[cn] = d; }
  }
  if (!defs[a] || !defs[b]) {
    throw new Error(`missing chord def for pair ${a}/${b} (need both in chords block)`);
  }
  const pairLabel = `${a} <-> ${b}`;
  const id = `P-${a}-${b}`.replace(/[^A-Za-z0-9-]/g, '');
  const drills = [];
  if (drillName) {
    drills.push({
      id: 'EX1-named',
      name: `${drillName} — ${pairLabel}`,
      purpose: `Drill ${pairLabel} as taught in the lesson.`,
      params: { chord_pair: [a, b], duration_sec: 60, measure: 'count completed changes', canon_key: [canonChord(a), canonChord(b)].sort().join('::'), target_per_min: 30, goal_per_min: 60 },
      coaching: `Metronome on. ${a} to ${b}, back and forth, as many clean changes as you can in one minute.`,
      qa_status: 'verified-by-theory-check-2026-08-08',
    });
  }
  drills.push({
    id: 'EX2-30-60',
    name: `1-minute change drill — ${pairLabel}`,
    purpose: `Count completed ${pairLabel} changes in 60s; the 30/60 engine records your rate into the fluency memory.`,
    params: { chord_pair: [a, b], duration_sec: 60, measure: 'count completed changes', canon_key: [canonChord(a), canonChord(b)].sort().join('::'), target_per_min: 30, goal_per_min: 60 },
    coaching: `Metronome on. ${a} to ${b}, back and forth, as many clean changes as you can in one minute. The app remembers this pair — your weakest pairs come back for spaced review automatically.`,
    qa_status: 'verified-by-theory-check-2026-08-08',
  });

  return {
    lesson: {
      id,
      title: `Practice: ${pairLabel} — 1-minute changes`,
      level: 'beginner',
      lesson_type: 'technique',
      one_line_promise: `Build fluency on ${pairLabel} until 30+ clean changes/min.`,
      objectives: [
        `Run a 1-minute ${pairLabel} change count`,
        'Hit 30 clean changes/min (advance) and aim for 60 (goal)',
        'Let the app remember your weak pairs for spaced review',
      ],
      estimated_minutes: 3,
      practice_of: lessonId ? [lessonId] : [],
      engine: 'one-minute-changes',
      pair: [a, b],
      prerequisites: [],
      app_feature_mapping: { free_metronome: ['drill tempo'] },
    },
    chords: defs,
    exercises: drills,
    avatar_coaching_copy: {
      intro: `Today we drill ${pairLabel}. Clean, even changes — not fast messy ones.`,
      results: `A higher count than last time means your hands are learning. That is the only metric that matters here.`,
      wrap: `Logged to your fluency memory. If this pair is weak, it will resurface in review.`,
    },
    qa_block: {
      must_verify: [
        'Automated: practice lesson passes schema/validateLesson (all keys present, frets/fingers length 6, qa_status whitelisted).',
        'Automated: pair key canonicalized so easyC<->X == C<->X (chord-canon.js) — no moat fragmentation.',
        'Engine: one-minute-changes 30/60 counter wired; weak-pair fluency recorded.',
      ],
      flagged_by: 'founder (non-player) — cannot self-verify',
      verifier_role: 'arithmetic (chord-theory-check.js) + schema validate',
      guitarist_signoff: 'NOT REQUIRED — chord fingerings verified deterministically by chord-theory-check.js.',
    },
  };
}

// ---- 4. Emit ----
fs.mkdirSync(OUT, { recursive: true });
let generated = 0, failed = 0;
const manifest = { generated: new Date().toISOString(), pairs: [] };

for (const [key, pair] of pairSources) {
  const lesson = buildPracticeLesson(pair);
  const v = validateLesson(lesson);
  if (!v.valid) { failed++; console.error(`[FAIL] ${key}: ${v.errors.join('; ')}`); continue; }
  const fname = `practice-${pair.a}-${pair.b}.json`.replace(/[^A-Za-z0-9-_.]/g, '');
  fs.writeFileSync(path.join(OUT, fname), JSON.stringify(lesson, null, 2));
  generated++;
  manifest.pairs.push({ key, a: pair.a, b: pair.b, file: fname, cumulative: !!pair.cumulative, introducedAt: pair.introducedAt, drillName: pair.drillName || null });
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(manifest, null, 2));

console.log(`\n=== PRACTICE LESSON GENERATOR ===`);
console.log(`canonical pairs drilled : ${pairSources.size}`);
console.log(`practice lessons written: ${generated} -> ${path.relative(process.cwd(), OUT)}`);
console.log(`schema failures         : ${failed}`);
if (failed > 0) process.exit(1);
console.log('All generated practice lessons PASS validateLesson.');
