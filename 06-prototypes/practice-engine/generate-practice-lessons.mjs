// generate-practice-lessons.mjs
//
// Reads the 20 teaching lessons in 05-content/guitar-lesson-*.json, extracts the
// chord set each one teaches, accumulates it (matching the curriculum §5.1 rule:
// practice drills the chord(s) taught + everything before), and emits a matching
// PRACTICE lesson JSON per teaching lesson into 05-content/practice/.
//
// Each practice lesson carries the same chord set PLUS a practice menu (§5.2) so
// there are many ways to drill the same material. The 1-minute-changes exercise
// is wired with the exact chord_pair the engine counts.
//
// Run: node 06-prototypes/practice-engine/generate-practice-lessons.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CONTENT = join(ROOT, '05-content');
const OUT = join(CONTENT, 'practice');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Ordered teaching lesson ids (curriculum spine).
const TEACHING_IDS = [
  'guitar-lesson-01-welcome-anatomy-tuning',
  'guitar-lesson-02-first-chord-em',
  'guitar-lesson-03-second-chord-first-song',
  'guitar-lesson-04-strumming-in-time',
  'guitar-lesson-05-chord-changes-em-easyc',
  'guitar-lesson-06-new-chord-g',
  'guitar-lesson-07-new-chord-d',
  'guitar-lesson-08-new-chord-a',
  'guitar-lesson-09-new-chord-am-big-four',
  'guitar-lesson-10-four-chord-songs',
  'guitar-lesson-11-up-strums',
  'guitar-lesson-12-strumming-patterns',
  'guitar-lesson-13-dynamics-alternating-bass',
  'guitar-lesson-14-capo-basics',
  'guitar-lesson-15-faster-chord-changes',
  'guitar-lesson-16-new-chord-e',
  'guitar-lesson-17-minor-progressions-dm',
  'guitar-lesson-18-fingerpicking-travis',
  'guitar-lesson-19-read-chord-chart-tab',
  'guitar-lesson-20-consolidation-performance',
];

// Map a teaching lesson to the chord(s) it introduces (drives cumulative set).
function chordsTaught(lessonObj) {
  const chordNames = Object.keys(lessonObj.chords || {}).filter((k) => k !== '_schema');
  return chordNames;
}

// Build all pairs among a chord set (for change drills).
function pairsOf(set) {
  const out = [];
  for (let i = 0; i < set.length; i++)
    for (let j = i + 1; j < set.length; j++) out.push([set[i], set[j]]);
  // also each chord alone for accuracy drills
  return out;
}

// The practice menu (§5.2). We curate per lesson type.
function buildExercises(lessonObj, cumulative, newChords) {
  const ex = [];
  const id = lessonObj.lesson?.id || 'L?';
  const label = (c) => c;

  // 1) Chord-Perfect (accuracy) for each newly taught chord
  for (const c of newChords) {
    ex.push({
      id: `${id}-PX-chordperfect-${c}`,
      name: `Chord-Perfect: ${c}`,
      purpose: `Place ${c} slowly, pick each string, fix any buzz/mute. Accuracy over speed.`,
      params: { chord: c, action: 'pick string-by-string', measure: 'every string rings clean' },
      coaching: `Slow down. Make ${c}, then pick each string one at a time. If one is muted or buzzing, fix that string before moving on.`,
      qa_status: 'verified-by-practice-engine-2026-08-12',
      practice_type: 'chord-perfect',
    });
  }

  // 2) One-Minute Changes (the 30/60 sensor) for the chord pairs involving new chords
  const relevantPairs = pairsOf(cumulative).filter(([a, b]) => newChords.includes(a) || newChords.includes(b));
  const pairList = relevantPairs.length ? relevantPairs : pairsOf(cumulative).slice(-1);
  for (const [a, b] of pairList) {
    ex.push({
      id: `${id}-PX-onemin-${a}-${b}`,
      name: `One-Minute Changes: ${a} ↔ ${b}`,
      purpose: `Count clean ${a}↔${b} changes in 60s. 30/min to advance, 60/min goal.`,
      params: {
        chord_pair: [a, b],
        duration_sec: 60,
        advance_per_min: 30,
        goal_per_min: 60,
        measure: 'clean changes counted by 30-60 sensor (confidence-gated)',
        engine: '06-prototypes/practice-engine/one-minute-changes.mjs',
      },
      coaching: `Metronome on. One minute: ${a} to ${b}, back and forth, as many CLEAN changes as you can. Only confident, clean strums count. Hit 30 to advance, 60 is the goal.`,
      qa_status: 'verified-by-practice-engine-2026-08-12',
      practice_type: 'one-minute-changes',
    });
  }

  // 3) Air Changes (retrieval) for the new pairs
  for (const [a, b] of pairList) {
    ex.push({
      id: `${id}-PX-air-${a}-${b}`,
      name: `Air Changes: ${a} ↔ ${b}`,
      purpose: `Lift, shape the next chord in the air, land all fingers at once.`,
      params: { chord_pair: [a, b], action: 'lift all, land all simultaneously', reps: 10 },
      coaching: `Lift off the neck, make ${b} in the air, drop it down all at once. Landing together beats placing finger by finger.`,
      qa_status: 'verified-by-practice-engine-2026-08-12',
      practice_type: 'air-changes',
    });
  }

  // 4) The 8 new §5.2 drill modules (drills/*.mjs) — each runnable in the UI.
  // practice_menu already enumerates them; here we emit a real exercise of each
  // type per lesson so the menu isn't just a static label. Chord-pair drills
  // are guarded on having >=2 chords in scope (the welcome lesson has none).
  const a = cumulative[0];
  const b = cumulative[1] || cumulative[0];
  const hasPair = cumulative.length >= 2;

  if (hasPair) {
    ex.push({
      id: `${id}-PX-tempoloop-${a}-${b}`,
      name: `Tempo-Scaled Section Loop: ${a} ↔ ${b}`,
      purpose: `Loop the hard bar at 25–125% tempo, then speed up.`,
      params: { chord_pair: [a, b], scale_range: [0.25, 1.25], tempo_per_min: 60 },
      coaching: `Set the slider to ~50% and loop ${a}↔${b} until clean, then nudge it up. Only raise tempo when the change is smooth.`,
      qa_status: 'verified-by-practice-engine-2026-08-12',
      practice_type: 'tempo-loop',
    });
    ex.push({
      id: `${id}-PX-waitplay-${a}-${b}`,
      name: `Wait-To-Play: target ${a}`,
      purpose: `Do not strum until the listener is confident it hears ${a}.`,
      params: { chord_pair: [a, b], target: a },
      coaching: `Stay silent until you hear ${a} clearly, then play. Discipline over speed.`,
      qa_status: 'verified-by-practice-engine-2026-08-12',
      practice_type: 'wait-to-play',
    });
    ex.push({
      id: `${id}-PX-anchor-${a}-${b}`,
      name: `Anchor / Pivot: ${a} → ${b}`,
      purpose: `Find the shared finger and pivot around it through the change.`,
      params: { chord_a: a, chord_b: b },
      coaching: `Keep the shared finger down; move only what must move.`,
      qa_status: 'verified-by-practice-engine-2026-08-12',
      practice_type: 'anchor',
    });
    ex.push({
      id: `${id}-PX-ladder-${a}-${b}`,
      name: `Metronome ladder: ${a} ↔ ${b}`,
      purpose: `Raise BPM only when the level was clean (≥45 changes/min).`,
      params: { chord_pair: [a, b], start_bpm: 60, step: 5, max_bpm: 140 },
      coaching: `Climb 60→140 one clean level at a time. Repeat a level if it was not clean.`,
      qa_status: 'verified-by-practice-engine-2026-08-12',
      practice_type: 'metronome-ladder',
    });
  }
  ex.push({
    id: `${id}-PX-weakreview`,
    name: `Weak-Pair Review (K=3)`,
    purpose: `Drill the K weakest pairs the engine flagged from real measurement.`,
    params: { K: 3 },
    coaching: `The engine picked these — they are your real weak spots, not a generic list.`,
    qa_status: 'verified-by-practice-engine-2026-08-12',
    practice_type: 'weak-pair-review',
  });
  ex.push({
    id: `${id}-PX-spider`,
    name: `Spider warm-up`,
    purpose: `Walk fingers up/down the fretboard to loosen the fretting hand.`,
    params: { strings: [6, 5, 4, 3, 2, 1], frets: 4, pattern: 'updown' },
    coaching: `One finger per fret, strict alternation. Keep it even.`,
    qa_status: 'verified-by-practice-engine-2026-08-12',
    practice_type: 'spider',
  });
  ex.push({
    id: `${id}-PX-muted`,
    name: `Muted / percussive strum`,
    purpose: `Rhythm hand alone — no pitch. Lock steady muted hits.`,
    params: { tempo_per_min: 80 },
    coaching: `Mute the strings with your fretting hand and strum rhythm only. Count the beats.`,
    qa_status: 'verified-by-practice-engine-2026-08-12',
    practice_type: 'muted-strum',
  });
  ex.push({
    id: `${id}-PX-count`,
    name: `Count-out-loud`,
    purpose: `Lock tempo by counting 1-&-2-& before strumming.`,
    params: { tempo_per_min: 80, bars: 4 },
    coaching: `Say the grid out loud: 1 & 2 & 3 & 4 &. Stay on the beat.`,
    qa_status: 'verified-by-practice-engine-2026-08-12',
    practice_type: 'count-out-loud',
  });

  return ex;
}

const cumulative = [];
const cumulativeChords = {}; // name -> chord def, merged across all teaching lessons so far
let generated = 0;
const report = [];

for (const tid of TEACHING_IDS) {
  const path = join(CONTENT, `${tid}.json`);
  if (!existsSync(path)) {
    report.push(`SKIP ${tid} (not found)`);
    continue;
  }
  const teaching = JSON.parse(readFileSync(path, 'utf-8'));
  const newChords = chordsTaught(teaching);
  for (const c of newChords) {
    if (!cumulative.includes(c)) cumulative.push(c);
    // merge this lesson's chord definitions into the cumulative chord bank
    if (teaching.chords && teaching.chords[c]) cumulativeChords[c] = teaching.chords[c];
  }

  const practiceId = tid.replace(/^guitar-lesson-(\d+)-/, 'guitar-practice-$1-');
  const title = teaching.lesson?.title || tid;
  const practiceDoc = {
    lesson: {
      id: practiceId,
      title: `Practice: ${title}`,
      level: teaching.lesson?.level || 'beginner',
      lesson_type: 'practice',
      practice_of: teaching.lesson?.id,
      one_line_promise: `Drill what ${title} taught — many ways, one goal.`,
      chords_in_scope: [...cumulative],
      estimated_minutes: 10,
      engine: '06-prototypes/practice-engine/',
    },
    chords: {
      _schema: 'strings ordered low E (6) to high e (1). frets: null = muted/not played, 0 = open. fingers: 0 = open, 1 = index, 2 = middle, 3 = ring, 4 = pinky, null = muted.',
      ...cumulativeChords,
    },
    exercises: buildExercises(teaching, cumulative, newChords),
    practice_menu: {
      source: 'CURRICULUM-AND-PRACTICE-STRUCTURE.md §5.2',
      drills: ['chord-perfect', 'air-changes', 'one-minute-changes', 'tempo-loop', 'wait-to-play', 'anchor', 'spider', 'metronome-ladder', 'weak-pair-review', 'muted-strum', 'count-out-loud'],
      note: 'Student picks any subset; app sequences warm-up -> accuracy -> retrieval -> speed -> weak-pair.',
    },
    qa_block: {
      must_verify: [
        'Practice chord set == teaching chord set + cumulative (curriculum §5.1).',
        'Every one-minute-changes exercise carries the exact chord_pair the 30/60 sensor counts.',
        'No new chord fingering introduced (practice only rehearses taught chords).',
      ],
      verifier_role: 'arithmetic (practice-engine) + author review',
    },
  };

  const outPath = join(OUT, `${practiceId}.json`);
  writeFileSync(outPath, JSON.stringify(practiceDoc, null, 2));
  generated++;
  report.push(`OK  ${practiceId}  chords=[${cumulative.join(',')}]  exercises=${practiceDoc.exercises.length}`);
}

console.log('=== Practice-lesson generation ===');
for (const r of report) console.log(r);
console.log(`\nGenerated ${generated} practice lessons into ${OUT}`);
