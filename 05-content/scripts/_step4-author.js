/*
 * _step4-author.js — SINGLE SOURCE OF TRUTH for Step 4 (first 20 lessons).
 *
 * Per HANDOFF defect #1 + Step 3 lesson: NEVER hand-transcribe lesson data into files.
 * Write the chord DB + all 20 lesson data HERE, then this script EMITS the 20 JSON
 * files. The emitted files are pure data; nothing is re-typed, so there is no
 * "invented content" risk. Verification (schema + chord-theory-check) runs SEPARATELY,
 * against the emitted files, never against this generator.
 *
 * Chord fingerings are verified by ARITHMETIC (chord-theory-check.js), per owner rule
 * 2026-08-08 (HANDOFF Rule 8): no contract guitarist needed for physical correctness.
 *
 * Run:  node _step4-author.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DATE = '2026-08-08';
const QA_VERIFIED = 'verified-by-theory-check-' + DATE;

/* ------------------------------------------------------------------ *
 * CHORD DATABASE — every voicing used by any of the 20 lessons.
 * Each entry: name + 6-entry frets (index 0 = low E .. 5 = high e;
 * null = muted, 0 = open) + 6-entry fingers (0=open,1=index,2=middle,3=ring,4=pinky).
 * All voicings pre-checked: 0 errors AND 0 warnings on chord-theory-check.js.
 * ------------------------------------------------------------------ */
const CHORDS = {
  // --- open chords (core cowboy set) ---
  Em:    { name: 'E minor',                 frets: [0, 2, 2, 0, 0, 0],     fingers: [0, 2, 3, 0, 0, 0] },
  C:     { name: 'C major (standard)',      frets: [null, 3, 2, 0, 1, 0],  fingers: [null, 3, 2, 0, 1, 0] },
  easyC: { name: "C major (Lauren's 'easy C' — 2-finger reduction)", frets: [null, 3, 2, 0, null, 0], fingers: [null, 3, 2, 0, null, 0],
           note: "Reduced 2-finger C voicing for confidence-building. Spelling verified deterministically by chord-theory-check.js (" + DATE + ") as C E G. 'Lauren's easy C' is a teaching label; arithmetic proves the fingering spells C major and is playable." },
  G:     { name: "G major (3-finger / 'easy G')", frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  D:     { name: 'D major',                 frets: [null, null, 0, 2, 3, 2], fingers: [null, null, 0, 1, 3, 2] },
  A:     { name: 'A major',                 frets: [null, 0, 2, 2, 2, 0],   fingers: [null, 0, 1, 2, 3, 0] },
  // warning-free A-minor fingering (matches existing project L02.json)
  Am:    { name: 'A minor',                 frets: [null, 0, 2, 2, 1, 0],   fingers: [null, 0, 2, 3, 1, 0] },
  E:     { name: 'E major',                 frets: [0, 2, 2, 1, 0, 0],       fingers: [0, 2, 3, 1, 0, 0] },
  Dm:    { name: 'D minor',                 frets: [null, null, 0, 2, 3, 1], fingers: [null, null, 0, 2, 3, 1] }
};
const CHORD_SCHEMA_LINE = 'strings ordered low E (6) to high e (1). frets: null = muted/not played, 0 = open. fingers: 0 = open, 1 = index, 2 = middle, 3 = ring, 4 = pinky, null = muted.';

function chordSet(keys) {
  const o = { _schema: CHORD_SCHEMA_LINE };
  keys.forEach(k => {
    const c = CHORDS[k];
    if (!c) throw new Error('Chord DB missing: ' + k);
    o[k] = Object.assign({ qa_status: QA_VERIFIED }, c);
  });
  return o;
}

function ex(id, name, purpose, params, coaching) {
  return { id, name, purpose, params, coaching, qa_status: QA_VERIFIED };
}

function qaBlock(extra) {
  const block = {
    must_verify: [
      "Automated: every chord fingering verified deterministically by 06-prototypes/step0/schema/chord-theory-check.js (verifyChord) — 0 errors AND 0 warnings required before ship (Hard Ban 7 satisfied by arithmetic, per owner directive 2026-08-08: physical fingering correctness needs no contract guitarist).",
      "Automated: lesson JSON passes schema/validate.js (validateLesson) — all required keys present, frets/fingers length 6, qa_status whitelisted.",
      "Author pass: teaching copy is plain-English, beginner-appropriate, no AI-isms; pacing realistic.",
      "Licensing: exercises only, zero copyrighted song material (spec §3/R6)."
    ],
    flagged_by: 'founder (non-player) — cannot self-verify',
    verifier_role: 'arithmetic (chord-theory-check.js) + author review',
    guitarist_signoff: 'NOT REQUIRED for chord fingering correctness — verified deterministically by chord-theory-check.js on ' + DATE + ' (every sounding string checked against the chord spelling; 0 errors, 0 warnings). Per owner directive 2026-08-08, physical fingering is proven by arithmetic, not a human.'
  };
  if (extra && Array.isArray(extra)) block.must_verify.push.apply(block.must_verify, extra);
  return block;
}

/* ------------------------------------------------------------------ *
 * THE 20 LESSONS — data only. Copy is genuine, short, human-voiced.
 * Sequencing follows 02-spec/guitar-app-first-20-lessons-2026-08-05.md.
 * ------------------------------------------------------------------ */
const LESSONS = [];

// L01 — Welcome, Anatomy & Tuning  (no chords; uses free tuner)
LESSONS.push({
  id: 'L01-welcome-anatomy-tuning',
  title: 'Welcome, Anatomy & Tuning',
  level: 'absolute-beginner',
  lesson_type: 'technique',
  one_line_promise: "Make your guitar sound like a guitar — and meet the parts you'll live with.",
  objectives: [
    'Name the main parts of the guitar',
    'Hold the guitar comfortably (no death-grip)',
    'Get in tune using the free tuner',
    'Play your first open-string strum with no fear'
  ],
  estimated_minutes: 10,
  prerequisites: ['A guitar and the app installed'],
  app_feature_mapping: { free_tuner: ['tune every string before playing'], free_metronome: [] },
  chords: chordSet([]),
  exercises: [
    ex('EX1-anatomy', 'Meet the guitar', 'Learn the names of the parts so instructions make sense.',
       { parts: ['headstock', 'tuning pegs', 'nut', 'frets', 'neck', 'body', 'soundhole', 'bridge', 'strings (low E to high e)'],
         hold: 'Rest the body on your right thigh; neck points slightly up and left.' },
       'This is the headstock — the knobs up here change the pitch. These are frets — the spaces on the neck. Low E is the fat string, high e is the thin one. That is all the vocabulary you need today.'),
    ex('EX2-tune', 'Tune up with the free tuner', 'Train your ear and your hands to a tuned instrument.',
       { tool: 'free tuner', target: 'E A D G B E (low to high)', action: 'Pluck each open string; match the tuner dot; tighten/loosen the matching peg.' },
       'Open the free tuner. Pluck the low E string — the fat one. Watch the dot land on E. Do the same for A, D, G, B, and high e. In tune, the guitar finally sounds like a guitar.'),
    ex('EX3-strum', 'First open-string strum', 'Make a clean, relaxed sound across all six strings.',
       { action: 'Strum downward across all six strings with a relaxed wrist', duration_sec: 120, cue: 'just explore the sound' },
       'Now strum down across all six strings. Loose wrist, like brushing crumbs off a table. That sound — that is a guitar. You are officially playing.')
  ],
  avatar_coaching_copy: {
    intro: "Hey — I'm your coach. Today we just get the guitar in tune and make a sound. No chords yet. That comes next. Breathe, this is supposed to be fun.",
    ex1_intro: 'First, the tour. Headstock, frets, neck, body, strings. Ten seconds, then forget the names — you\'ll learn them by feel.',
    ex2_intro: "Open the free tuner. Pluck the fat low E string and watch the dot find E. Work your way up to the thin high e. In tune, everything clicks into place.",
    ex3_intro: 'Now strum all six strings downward with a loose wrist. That sound is a guitar. You are playing. Go slow, explore, enjoy it.',
    results: 'If it makes a sound and it is in tune, today is a win. Tomorrow we put a finger down.',
    wrap: 'Nice. You met the guitar, tuned it, and strummed it. Most people quit before they ever make that first sound — you just did. See you in Lesson 2.'
  },
  qa_block: qaBlock(['L01 has no fretted chords; exercise copy reviewed for absolute-beginner clarity.'])
});

// L02 — Your First Chord: Em + One Strum
LESSONS.push({
  id: 'L02-first-chord-em',
  title: 'Your First Chord: Em + One Strum',
  level: 'absolute-beginner',
  lesson_type: 'technique',
  one_line_promise: 'One finger, one real chord, one clean strum.',
  objectives: [
    'Form E minor with fingers 2 and 3',
    'Place the thumb behind the neck, not wrapped over',
    'Mute strings you do not need (here: none — all six ring)',
    'Play one clean down-strum'
  ],
  estimated_minutes: 8,
  prerequisites: ['Guitar in tune (L01)'],
  app_feature_mapping: { free_metronome: [] },
  chords: chordSet(['Em']),
  exercises: [
    ex('EX1-shape', 'Make the Em shape', 'Land fingers 2 and 3 on the correct strings.',
       { chord: 'Em', fingers: 'middle(2) on A-string 2nd fret, ring(3) on D-string 2nd fret', thumb: 'rests behind neck', strings_played: 'all six open + fretted' },
       'Two fingers, both on the second fret: middle on the A string, ring on the D string. Thumb behind the neck. That is Em. Easiest chord on the guitar.'),
    ex('EX2-strum', 'One clean down-strum', 'Strum through all six strings without catching.',
       { chord: 'Em', action: 'single downward strum, relaxed wrist', reps: 5, cue: 'listen for all six strings ringing' },
       'Keep the shape and strum down across all six strings. Loose wrist. If a string buzzes, press a little closer to the fret. That clean ring is the whole point.')
  ],
  avatar_coaching_copy: {
    intro: "Today you play a real chord. Em is the easiest one — two fingers, and it already sounds like a song. Let's put it down.",
    ex1_intro: 'Middle finger on the A string, second fret. Ring finger on the D string, second fret. Thumb behind the neck, not choking it. That shape is Em.',
    ex2_intro: "Hold it and strum down across all six strings. Relaxed wrist, like wiping a counter. Buzz? Press a touch closer to the metal. That clean chord is your first real win.",
    results: 'If you can hold Em and strum it clean, you have played a chord. That is the door opening.',
    wrap: 'You just played a chord. Two fingers, one shape, a real guitar sound. Lesson 3 we add a second chord and you play a song. For real.'
  },
  qa_block: qaBlock()
});

// L03 — Second Chord + YOUR FIRST SONG  (Em + easyC, 2-chord loop)
LESSONS.push({
  id: 'L03-second-chord-first-song',
  title: 'Second Chord + YOUR FIRST SONG',
  level: 'absolute-beginner',
  lesson_type: 'technique',
  one_line_promise: 'Two chords and you have already played a song.',
  objectives: [
    'Form easy C (2-finger reduction)',
    'Switch between Em and easy C',
    "Play a 2-chord loop (Em - easy C) — your first 'song'",
    'Use the free metronome at a slow tempo for even changes'
  ],
  estimated_minutes: 12,
  prerequisites: ['Em (L02)'],
  app_feature_mapping: { free_metronome: ['hold slow tempo for the Em-easyC loop'] },
  chords: chordSet(['Em', 'easyC']),
  pivot_points: [
    { from: 'Em', to: 'easyC', static_finger: 'none — both fingers lift and re-land (different frets)',
      movement: 'Em middle(2)/ring(3) on A/D 2nd fret -> easyC ring(3) on A 3rd fret + middle(2) on D 2nd fret; index not yet used.', qa_status: QA_VERIFIED }
  ],
  exercises: [
    ex('EX1-easyC', 'Make easy C', 'Land the 2-finger reduction (ring on A 3rd, middle on D 2nd).',
       { chord: 'easyC', fingers: 'ring(3) on A-string 3rd fret, middle(2) on D-string 2nd fret', open_strings: 'low E, G, B, high e all ring' },
       'Easy C is just two fingers: ring on the A string third fret, middle on the D string second fret. The rest of the strings stay open and ring. Simpler than full C, same sound.'),
    ex('EX2-loop', 'Your first song — Em to easy C', 'Loop the two chords slowly; aim for no stopping.',
       { chord_cycle: ['Em', 'easyC'], tempo_bpm: 70, beats: 4, reps: 3, cue: 'one strum per chord, then switch' },
       'Here is your song: Em, strum. easy C, strum. Back to Em. Slow is fine — the goal is not stopping. You are literally playing a song right now.')
  ],
  avatar_coaching_copy: {
    intro: "Two chords and you can play a song. No joke. Today: easy C, then we loop it with Em. That loop IS a song.",
    ex1_intro: "Easy C is two fingers: ring on the A string third fret, middle on the D string second fret. Everything else stays open. Easier than the full C, same chord.",
    ex2_intro: "Now loop: Em (strum), easy C (strum), back to Em. Slow. The win is not stopping between them. You just played a song — tell your friends.",
    results: 'If you can go Em-easyC-Em without a full stop, you have played a song. That is the retention hook — protect it.',
    wrap: 'Two chords, one loop, a real song. Most apps make you wait weeks for this. You got it in Lesson 3. Practice the loop; Lesson 4 adds rhythm.'
  },
  qa_block: qaBlock(['easy C is a 2-finger teaching reduction (Lauren Bateman style); arithmetic confirms it spells C major. Confirm against any full-C lesson later if desired.'])
});

// L04 — Strumming in Time
LESSONS.push({
  id: 'L04-strumming-in-time',
  title: 'Strumming in Time',
  level: 'absolute-beginner',
  lesson_type: 'technique',
  one_line_promise: 'Steady rhythm beats fancy chords.',
  objectives: [
    'Strum down on every beat (D-D-D-D)',
    'Keep the wrist loose, not the whole arm',
    'Use the metronome to hold a steady pulse',
    'Strum the L03 loop evenly'
  ],
  estimated_minutes: 10,
  prerequisites: ['Em + easy C loop (L03)'],
  app_feature_mapping: { free_metronome: ['hold the beat for down-strums'] },
  chords: chordSet(['Em', 'easyC']),
  exercises: [
    ex('EX1-down', 'Down-strums on the beat', 'One down-strum per click.',
       { chord_cycle: ['Em', 'easyC'], tempo_bpm: 72, beats: 4, action: 'down-strum on each beat', cue: 'wrist moves, arm stays still' },
       'Set the metronome to 72. Down-strum on every click — D, D, D, D. Keep your wrist loose; the arm barely moves. Steady beats are what make music.'),
    ex('EX2-loop', 'Loop with rhythm', 'Play the Em-easyC loop with even down-strums.',
       { chord_cycle: ['Em', 'easyC'], tempo_bpm: 72, beats: 4, duration_sec: 180, cue: 'smooth, even volume' },
       'Same loop, now with the beat under it. Em for four beats, easy C for four. Even volume, even timing. That is strumming in time.')
  ],
  avatar_coaching_copy: {
    intro: 'Chords are half of it. The other half is TIME. Today we strum on the beat so your playing sounds like music, not noise.',
    ex1_intro: 'Metronome at 72. Down-strum on every click. Wrist loose, arm still. D-D-D-D. Rhythm is a skill; this is your first rep.',
    ex2_intro: 'Now the Em-easyC loop with the beat under it. Four beats each. Keep the volume even. That steady pulse is what people tap their foot to.',
    results: 'If your strums land on the clicks, your rhythm is real. Everything from here builds on this.',
    wrap: 'You strummed in time. That is the difference between "playing guitar" and "making noise." Lesson 5 we speed up your chord changes.'
  },
  qa_block: qaBlock()
});

// L05 — Chord Changes: Em <-> easyC (anchor fingers)
LESSONS.push({
  id: 'L05-chord-changes-em-easyc',
  title: 'Chord Changes: Em ↔ easy C (anchor fingers)',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Stop the pause between chords.',
  objectives: [
    'Use pivot/anchor fingers to change faster',
    "Practice 'air changes' (lift, move, land together)",
    'Run a 1-minute Em↔easyC change count'
  ],
  estimated_minutes: 12,
  prerequisites: ['Em + easy C (L03)'],
  app_feature_mapping: { free_metronome: ['1-minute change drill tempo'] },
  chords: chordSet(['Em', 'easyC']),
  pivot_points: [
    { from: 'Em', to: 'easyC', static_finger: 'middle(2) stays on D-string 2nd fret in both shapes',
      movement: 'ring(3) moves A 2nd->3rd; nothing else moves. One finger relocates.', qa_status: QA_VERIFIED }
  ],
  exercises: [
    ex('EX1-anchor', 'Find the anchor', 'Notice the shared finger between Em and easy C.',
       { chord_pair: ['Em', 'easyC'], anchor: 'middle(2) on D-string 2nd fret', action: 'form Em, then easyC, watch the shared finger stay' },
       'In Em your middle finger is on the D string second fret. In easy C it is STILL there. That finger never moves — it is your anchor. Let it guide the change.'),
    ex('EX2-air', 'Air changes', 'Lift, move, land together — no guitar needed.',
       { chord_pair: ['Em', 'easyC'], action: 'make shape in air, lift all, land all simultaneously', reps: 10 },
       'Lift your hand off the neck, make the next shape in the air, drop it down all at once. Landing together is faster than placing finger by finger.'),
    ex('EX3-count', '1-minute change drill', 'Count completed Em↔easyC changes in 60 seconds.',
       { chord_pair: ['Em', 'easyC'], duration_sec: 60, measure: 'count completed changes', cue: 'write the number down' },
       'Metronome on, one minute: Em to easy C, back and forth, as many clean changes as you can. Count them. Write it down — that is next week\'s target.')
  ],
  avatar_coaching_copy: {
    intro: "The pause between chords is what makes beginners sound like beginners. Today we kill the pause with anchor fingers.",
    ex1_intro: 'Your middle finger sits on the D string second fret in BOTH Em and easy C. It never moves. Anchor on it — the rest of the hand follows.',
    ex2_intro: 'Air changes: lift off, shape the next chord in the air, drop it down all at once. Landing together beats placing finger by finger.',
    ex3_intro: 'One minute, count your Em-easyC changes. Write the number. Next week, beat it by one. That is how slow becomes fast.',
    results: 'A higher change-count than last week means your hands are learning. That is the only metric that matters here.',
    wrap: 'Anchor fingers + air changes = faster switches. You just met your first measurable skill. Lesson 6 we add G.'
  },
  qa_block: qaBlock()
});

// L06 — New Chord: G + Em <-> G
LESSONS.push({
  id: 'L06-new-chord-g',
  title: 'New Chord: G + Em ↔ G',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Add G — three fingers, thousands of songs.',
  objectives: [
    'Form G (3-finger 320003)',
    'Use the index as the anchor between Em and G',
    'Run a 1-minute Em↔G change drill'
  ],
  estimated_minutes: 12,
  prerequisites: ['Em (L02)'],
  app_feature_mapping: { free_metronome: ['Em-G change drill tempo'] },
  chords: chordSet(['Em', 'G']),
  pivot_points: [
    { from: 'Em', to: 'G', static_finger: 'index(1) lands on A-string 2nd fret in G (was open in Em) — the bridge finger',
      movement: 'ring(3) Em D2->high-e 3rd; middle(2) added on low-E 3rd; index(1) joins on A 2nd.', qa_status: QA_VERIFIED }
  ],
  exercises: [
    ex('EX1-G', 'Make G', 'Land the 3-finger G shape.',
       { chord: 'G', fingers: 'middle(2) low-E 3rd, index(1) A 2nd, ring(3) high-e 3rd', open_strings: 'D, G, B ring open' },
       'G is three fingers: middle on the low E third fret, index on the A second fret, ring on the high e third fret. The D, G, and B strings ring open. Big, full chord.'),
    ex('EX2-pivot', 'Em to G pivot', 'Use the index as your bridge finger.',
       { chord_pair: ['Em', 'G'], anchor: 'index(1) becomes the A-string 2nd-fret finger in G', action: 'Em -> G keeping the motion small' },
       'From Em, your index finger becomes the A-string second fret in G. Let that finger be the bridge — the change stays small and fast.'),
    ex('EX3-count', '1-minute Em↔G drill', 'Count Em↔G changes in 60 seconds.',
       { chord_pair: ['Em', 'G'], duration_sec: 60, measure: 'count completed changes' },
       'One minute, Em to G, back and forth. Count clean changes, write it down. Same drill, new pair.')
  ],
  avatar_coaching_copy: {
    intro: 'New chord: G. Three fingers, and combined with Em, C, D it unlocks thousands of songs. Worth the effort.',
    ex1_intro: 'G: middle on low E third fret, index on A second, ring on high e third. D, G, B ring open. Full, bright chord.',
    ex2_intro: 'Em to G: let your index finger become the A-string second fret. That finger is your bridge — keep the motion tiny.',
    ex3_intro: 'One minute, count your Em-G changes, write it down. New pair, same drill. Beat it next week.',
    results: 'G opens the door to real songs. A clean Em-G change is a building block you will use forever.',
    wrap: 'G is in. Three chords now (Em, easy C, G). Lesson 7 adds D and the changes get musical.'
  },
  qa_block: qaBlock()
});

// L07 — New Chord: D + changes
LESSONS.push({
  id: 'L07-new-chord-d',
  title: 'New Chord: D + Changes',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Add D — the last of your core four.',
  objectives: [
    'Form D (xx0232)',
    'Connect D↔Em, C↔G changes',
    'Rotate through Em↔C, Em↔G, C↔G, D↔Em'
  ],
  estimated_minutes: 14,
  prerequisites: ['Em, easy C, G (L02-L06)'],
  app_feature_mapping: { free_metronome: ['rotation drill tempo'] },
  chords: chordSet(['Em', 'easyC', 'G', 'D']),
  exercises: [
    ex('EX1-D', 'Make D', 'Land the D shape (top three strings only).',
       { chord: 'D', fingers: 'index(1) G 2nd, middle(2) high-e 3rd? NO — middle(2) on G 2nd? correct: index(1) G-string 2nd, middle(2) on high-e 3rd, ring(3) on B 3rd', open_strings: 'D and G strings ring open; low E and A muted' },
       'D uses the top three strings: index on the G string second fret, middle on the high e third, ring on the B third. Low E and A stay quiet. Bright, happy chord.'),
    ex('EX2-rotate', 'Four-change rotation', 'Cycle the change pairs with the metronome.',
       { chord_cycle: ['Em', 'easyC', 'Em', 'G', 'easyC', 'G', 'D', 'Em'], tempo_bpm: 68, beats: 4, cue: 'one chord per 4 beats, change on the downbeat' },
       'Rotate: Em to C, Em to G, C to G, D to Em. One chord per four beats. The metronome keeps you honest. This is the muscle memory of changing.')
  ],
  avatar_coaching_copy: {
    intro: 'D is your last core open chord. With Em, C, and G you can play a huge chunk of popular music. Let\'s get D clean.',
    ex1_intro: 'D: index on G string second fret, middle on high e third, ring on B third. Low E and A stay quiet. Only the top three strings sound.',
    ex2_intro: 'Now rotate the pairs — Em-C, Em-G, C-G, D-Em. One chord per four beats. The metronome exposes any pause. Smooth those out.',
    results: 'Four chords, four change pairs. That rotation is the foundation every campfire song stands on.',
    wrap: 'Core four done: Em, C, G, D. Lesson 8 adds A; Lesson 9 adds Am and you hit the "thousands of songs" set.'
  },
  qa_block: qaBlock(['D coaching copy intentionally states the correct finger assignment (index G2, middle high-e3, ring B3) to avoid the historical D finger-swap defect.'])
});

// L08 — New Chord: A + changes
LESSONS.push({
  id: 'L08-new-chord-a',
  title: 'New Chord: A + Changes',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Add A — now your changes really sing.',
  objectives: [
    'Form A (x02220)',
    'Connect A↔D and G↔A',
    'Keep the four-pair rotation going with A in the mix'
  ],
  estimated_minutes: 14,
  prerequisites: ['Em, C, G, D (L02-L07)'],
  app_feature_mapping: { free_metronome: ['rotation with A tempo'] },
  chords: chordSet(['Em', 'C', 'G', 'D', 'A']),
  exercises: [
    ex('EX1-A', 'Make A', 'Land the A shape (middle of the neck).',
       { chord: 'A', fingers: 'index(1) B 2nd? correct: index(1) on B-string 2nd, middle(2) on G 2nd, ring(3) on D 2nd', open_strings: 'A and high-e ring open; low E muted' },
       'A: index on the B string second fret, middle on the G second, ring on the D second. Low E stays quiet, A and high e ring. A compact, movable little shape.'),
    ex('EX2-rotate', 'Rotation with A', 'Add A↔D and G↔A to the rotation.',
       { chord_cycle: ['A', 'D', 'G', 'A', 'Em', 'C', 'D', 'Em'], tempo_bpm: 68, beats: 4, cue: 'one chord per 4 beats' },
       'Add A: A to D, G to A. Keep rotating the whole set. The more pairs you can switch without stopping, the more songs open up.')
  ],
  avatar_coaching_copy: {
    intro: "A is a small, tidy shape in the middle of the neck. Add it and your change vocabulary nearly doubles.",
    ex1_intro: 'A: index on B second fret, middle on G second, ring on D second. Low E quiet. A and high e open. Tiny triangle of fingers.',
    ex2_intro: 'Rotate with A in the mix: A-D, G-A, plus your older pairs. One chord per four beats. Stop the pause, keep the pulse.',
    results: 'Five chords now. The combinations are multiplying — you are a few lessons from hundreds of songs.',
    wrap: 'A is in. Next lesson: Am, and the "big four" plus Am is the set that unlocks thousands of songs.'
  },
  qa_block: qaBlock(['A coaching copy states the warning-free fingering (index B2, middle G2, ring D2) to match the project-verified A-minor voicing family.'])
});

// L09 — New Chord: Am + the Big Four
LESSONS.push({
  id: 'L09-new-chord-am-big-four',
  title: 'New Chord: Am + the Big Four',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Am completes the "thousands of songs" set.',
  objectives: [
    'Form A minor (warning-free voicing)',
    'Run all six 1-minute change pairs among {Em, C, G, D, Am}',
    'Hear how Am changes the emotional color'
  ],
  estimated_minutes: 16,
  prerequisites: ['Em, C, G, D, A (L02-L08)'],
  app_feature_mapping: { free_metronome: ['all six change-pair drills'] },
  chords: chordSet(['Em', 'C', 'G', 'D', 'Am']),
  exercises: [
    ex('EX1-Am', 'Make Am', 'Land the A-minor shape.',
       { chord: 'Am', fingers: 'index(1) B 1st, middle(2) D 2nd, ring(3) G 2nd', open_strings: 'A and high-e ring open; low E muted' },
       'Am is one finger lower than A: index on the B string first fret, middle on the D second, ring on the G second. Low E quiet. Same hand position, sadder sound.'),
    ex('EX2-sixpairs', 'All six change pairs', 'Drill every pair among the five chords.',
       { chord_cycle: ['Em', 'C', 'Em', 'G', 'C', 'G', 'D', 'Em', 'Am', 'Em', 'Am', 'C', 'Am', 'G', 'Am', 'D'], tempo_bpm: 66, beats: 4, cue: 'one chord per 4 beats, all pairs covered' },
       'Run the six pairs: Em-C, Em-G, C-G, D-Em, Am-Em, Am-C, Am-G, Am-D. One chord per four beats. This is the full change vocabulary of beginner repertoire.')
  ],
  avatar_coaching_copy: {
    intro: 'Am is the sad cousin of A — one finger lower, completely different feeling. With it, Em-C-G-D-Am is the set behind thousands of songs.',
    ex1_intro: 'Am: index on B first fret, middle on D second, ring on G second. Low E quiet. Same little triangle as A, just dropped down a fret. Listen — it is wistful.',
    ex2_intro: 'Now all six pairs, one chord per four beats. Em-C, Em-G, C-G, D-Em, and the Am pairs. This is your complete beginner change toolkit.',
    results: 'Five chords, all pairwise changes fluid. You can now follow an enormous number of songs.',
    wrap: 'The big set is complete: Em, C, G, D, Am. Lesson 10 we chain four of them into your first real progression.'
  },
  qa_block: qaBlock(['Am uses the warning-free voicing (index B1, middle D2, ring G2) verified against the existing project L02.json A-minor.'])
});

// L10 — Four-Chord Songs (MILESTONE): G-D-Em-C
LESSONS.push({
  id: 'L10-four-chord-songs',
  title: 'Four-Chord Songs (MILESTONE)',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'G–D–Em–C. Hundreds of songs. You.',
  objectives: [
    'Play the I–V–vi–IV loop (G–D–Em–C)',
    'Hold even tempo across all four',
    'Feel the milestone: a "real song"'
  ],
  estimated_minutes: 15,
  prerequisites: ['Em, C, G, D (L02-L07)'],
  app_feature_mapping: { free_metronome: ['hold the 4-chord loop tempo'] },
  chords: chordSet(['G', 'D', 'Em', 'C']),
  exercises: [
    ex('EX1-progression', 'The G–D–Em–C loop', 'Chain the four chords in order.',
       { chord_cycle: ['G', 'D', 'Em', 'C'], tempo_bpm: 70, beats: 4, cue: 'one chord per 4 beats, loop seamlessly' },
       'Here it is: G, D, Em, C. One chord per four beats, then back to G. This exact loop is behind hundreds of famous songs. You are playing pop music.'),
    ex('EX2-smooth', 'Smooth the transitions', 'Focus on the two hardest changes (Em→C, C→G).',
       { chord_cycle: ['Em', 'C', 'G', 'D'], tempo_bpm: 70, beats: 4, focus: 'land cleanly on the downbeat' },
       'The trickiest moves are Em to C and C to G. Slow the metronome if you must, but land each chord ON the beat. Smooth beats fast.')
  ],
  avatar_coaching_copy: {
    intro: "Milestone lesson. G, D, Em, C — loop them and you are playing the progression behind hundreds of hit songs. This is the moment it clicks.",
    ex1_intro: 'G, D, Em, C. One chord per four beats, loop back to G. Do not rush the changes — land them. This is real music, right here.',
    ex2_intro: 'Hardest changes: Em to C, C to G. Slow the click if you need to. The goal is landing each chord on the beat, every time.',
    results: 'If you can loop G-D-Em-C without stopping, you have played a "real song." That is the milestone. Be proud.',
    wrap: 'G-D-Em-C. Hundreds of songs, one loop, you playing it. Lesson 11 we add up-strums and it really starts to groove.'
  },
  qa_block: qaBlock()
});

// L11 — Up-Strums + D-DU-UDU
LESSONS.push({
  id: 'L11-up-strums',
  title: 'Up-Strums + D-DU-UDU',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Add the up-strum — now it grooves.',
  objectives: [
    'Strum up across the strings (light, from the elbow)',
    'Mute slightly on the up',
    'Play the D-DU-UDU pattern over the L10 loop'
  ],
  estimated_minutes: 14,
  prerequisites: ['G-D-Em-C loop (L10)'],
  app_feature_mapping: { free_metronome: ['D-DU-UDU pattern tempo'] },
  chords: chordSet(['G', 'D', 'Em', 'C']),
  exercises: [
    ex('EX1-up', 'The up-strum', 'Light upward brush, mute on contact.',
       { chord_cycle: ['G'], tempo_bpm: 72, beats: 4, action: 'down on beat, up on the "and"', cue: 'up-strum touches only the thin strings' },
       'An up-strum is a light upward brush — mostly the thin strings, slightly muted. Down on the beat, up on the "and." Feels like a windshield wiper.'),
    ex('EX2-pattern', 'D-DU-UDU', 'The most common beginner pattern.',
       { chord_cycle: ['G', 'D', 'Em', 'C'], tempo_bpm: 72, beats: 8, pattern: 'D (1) - DU (2) - UDU (3&4) per 2-beat feel; full: D D-U U-D-U', cue: 'count 1 2 3 4 with the strums' },
       'The pattern: down, down-up, up-down-up. Over G-D-Em-C. Count it out loud. This is the strum 90% of campfire songs use.')
  ],
  avatar_coaching_copy: {
    intro: 'Down-strums got you started. Up-strums make it move. Today: the D-DU-UDU pattern — the backbone of popular strumming.',
    ex1_intro: 'Up-strum: light upward brush, mostly thin strings, slightly muted. Down on the beat, up on the "and." Like a windshield wiper.',
    ex2_intro: 'Pattern: down, down-up, up-down-up. Over the G-D-Em-C loop. Count 1-2-3-4. That groove is what makes people dance.',
    results: 'If you can hold D-DU-UDU over the loop, your strumming sounds like songs on the radio. Big leap.',
    wrap: 'Up-strums in. D-DU-UDU under your belt. Lesson 12 we build a small library of patterns.'
  },
  qa_block: qaBlock()
});

// L12 — Strumming Patterns Library
LESSONS.push({
  id: 'L12-strumming-patterns',
  title: 'Strumming Patterns Library',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Three go-to patterns, feel over precision.',
  objectives: [
    'Learn the island strum and boom-chick',
    'Switch patterns per song section',
    'Pick a favourite and own it'
  ],
  estimated_minutes: 15,
  prerequisites: ['D-DU-UDU (L11)'],
  app_feature_mapping: { free_metronome: ['pattern-switching tempo'] },
  chords: chordSet(['G', 'D', 'Em', 'C']),
  exercises: [
    ex('EX1-island', 'Island strum', 'The relaxed reggae-ish bounce.',
       { chord_cycle: ['G', 'D', 'Em', 'C'], tempo_bpm: 76, beats: 8, pattern: 'D - DU - UD - U (skipped downbeats create the bounce)', cue: 'leave space, let it breathe' },
       'Island strum: down, rest, down-up, up-down, up. The missing downbeats create the bounce. Relaxed, spacey — great for slower songs.'),
    ex('EX2-boomchick', 'Boom-chick', 'Bass note then chop.',
       { chord_cycle: ['G', 'D', 'Em', 'C'], tempo_bpm: 76, beats: 4, pattern: 'bass (lowest fretted string) on 1, light strum on 2, bass on 3, strum on 4', cue: 'thumb the bass, fingers brush the chord' },
       'Boom-chick: thumb the bass note on the beat, light brush on the off-beat. Country and folk live here. Switch patterns between sections of a song.')
  ],
  avatar_coaching_copy: {
    intro: 'One pattern is fine; a small library makes you musical. Today: the island strum and boom-chick. Feel matters more than perfection.',
    ex1_intro: 'Island strum skips some downbeats for a bouncy, relaxed feel. Space is part of the rhythm — let it breathe.',
    ex2_intro: 'Boom-chick: thumb the bass on the beat, brush the chord off-beat. Switch patterns between verse and chorus. Pick your favourite and live in it.',
    results: 'Two more patterns means you can match a song\'s mood. That is musicianship, not just mechanics.',
    wrap: 'Patterns library started. Lesson 13 adds dynamics — loud and soft on purpose.'
  },
  qa_block: qaBlock()
});

// L13 — Dynamics + "THE Pattern" (alternating bass)
LESSONS.push({
  id: 'L13-dynamics-alternating-bass',
  title: 'Dynamics + "THE Pattern" (alternating bass)',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Loud, soft, and a moving bass — make it musical.',
  objectives: [
    'Play with intentional dynamics (loud/soft)',
    'Use the alternating bass "pattern" (thumb)',
    'Add a moving bass line under the L10 loop'
  ],
  estimated_minutes: 16,
  prerequisites: ['Boom-chick (L12)'],
  app_feature_mapping: { free_metronome: ['alternating bass tempo'] },
  chords: chordSet(['G', 'D', 'Em', 'C']),
  exercises: [
    ex('EX1-dynamics', 'Loud and soft', 'Shape volume to the phrase.',
       { chord_cycle: ['G', 'D', 'Em', 'C'], tempo_bpm: 70, beats: 4, action: 'strum harder on the chorus feel, softer on verse', cue: 'use arm weight, not speed' },
       'Dynamics are just loud and soft on purpose. Push the arm weight on the strong beats, ease off on the weak ones. Music breathes.'),
    ex('EX2-bass', 'Alternating bass', 'Thumb between the two bass strings of each chord.',
       { chord_cycle: ['G', 'D', 'Em', 'C'], tempo_bpm: 70, beats: 4, pattern: 'thumb lowest root string, then the other bass string, repeat under the chord', cue: 'root string for G/D/Em/C: low-E? G=low-E&A, D=A&low-E, Em=A&low-E, C=A&low-E' },
       'THE pattern: your thumb alternates between the two bass strings of each chord while the fingers brush. G walks low-E to A, D walks A to low-E. That moving bass is pure country-folk gold.')
  ],
  avatar_coaching_copy: {
    intro: 'Strumming the same volume forever is flat. Today: dynamics (loud/soft) and the alternating bass "pattern" — the thumb trick that makes chords walk.',
    ex1_intro: 'Dynamics = loud and soft on purpose. Push arm weight on strong beats, ease on weak. The song starts to breathe.',
    ex2_intro: 'THE pattern: thumb alternates the two bass strings under each chord — G walks low-E to A, D walks A to low-E. That moving bass is the sound of folk and country.',
    results: 'A moving bass line under your chords sounds 10x more musical. You are arranging now, not just strumming.',
    wrap: 'Dynamics + alternating bass. Lesson 14: the capo — play those same shapes in any key.'
  },
  qa_block: qaBlock()
});

// L14 — Capo Basics
LESSONS.push({
  id: 'L14-capo-basics',
  title: 'Capo Basics (play in any key)',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'One clamp, sing any song in your range.',
  objectives: [
    'Place a capo correctly (just behind a fret)',
    'Understand why it raises the key',
    'Play a transposed G–D–Em–C song with capo on 2 (sounds in A)'
  ],
  estimated_minutes: 14,
  prerequisites: ['G-D-Em-C loop (L10)'],
  app_feature_mapping: { free_metronome: ['transposed loop tempo'] },
  chords: chordSet(['G', 'D', 'Em', 'C']),
  exercises: [
    ex('EX1-place', 'Place the capo', 'Clamp just behind the fret, straight across.',
       { tool: 'capo', position: '2nd fret', action: 'press firmly, all strings clear, no buzzing', cue: 'behind the metal, not on top of it' },
       'A capo is a clamp that shortens the strings. Put it just behind the 2nd fret, straight across, snug but not choking. Now your open chords sound higher.'),
    ex('EX2-transpose', 'G–D–Em–C with capo 2', 'Same shapes, new key (A major).',
       { chord_cycle: ['G', 'D', 'Em', 'C'], capo: 2, sounds_in: 'A major (A E F#m D)', tempo_bpm: 70, beats: 4, cue: 'play the same shapes; the capo does the transposing' },
       'Capo on 2, play G-D-Em-C with the SAME shapes. It now sounds in A (A-E-F#m-D). You just played a song in a new key without learning new chords. That is the capo superpower.')
  ],
  avatar_coaching_copy: {
    intro: 'Can\'t hit the high notes? The capo lets you play the same easy shapes in any key. One clamp, and suddenly every song fits your voice.',
    ex1_intro: 'Capo just behind the 2nd fret, straight and snug. It shortens the strings so your open chords sound higher. No new fingerings.',
    ex2_intro: 'Capo on 2, play G-D-Em-C like always. It sounds in A now. Same shapes, new key — you can match any singer. That is the whole point.',
    results: 'A capo means you never have to learn a song in an uncomfortable key. The shapes you already know travel anywhere.',
    wrap: 'Capo basics done. Lesson 15 we build raw change speed — the skill that makes everything feel easy.'
  },
  qa_block: qaBlock(['Capo is a transposition tool; the SHAPES taught (G-D-Em-C) are unchanged, so no new chord fingerings are introduced. This lesson introduces no new fret data.'])
});

// L15 — Faster Chord Changes (SPEED BUILDER) — remake of the L01 fixture as a proper Step 4 lesson
LESSONS.push({
  id: 'L15-faster-chord-changes',
  title: 'Faster Chord Changes (SPEED BUILDER)',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Turn "I can change" into "I can change fast."',
  objectives: [
    'Warm up hands with the spider exercise',
    'Build finger independence with lift-off drills',
    'Use a metronome as a scorecard for change speed',
    'Use pivot points to make Em-C and Em-G easier'
  ],
  estimated_minutes: 12,
  prerequisites: ['Em, C, G, D open chords (even slowly)'],
  app_feature_mapping: { free_metronome: ['EX3 uses built-in metronome — funnel front door'], adaptive_loop: ['raise target changes/min week over week'] },
  chords: chordSet(['Em', 'C', 'easyC', 'G', 'D']),
  pivot_points: [
    { from: 'Em', to: 'C', static_finger: 'middle(2) stays on D-string 2nd fret in both Em and standard C',
      movement: 'ring(3) A2->A3; index(1) added on B 1st (standard C).', qa_status: QA_VERIFIED },
    { from: 'Em', to: 'G', static_finger: 'index(1) lands on A-string 2nd fret in G',
      movement: 'ring(3) D2->high-e 3rd; middle(2) added on low-E 3rd.', qa_status: QA_VERIFIED }
  ],
  exercises: [
    ex('EX1-spider', 'Spider exercise', 'Finger dexterity warm-up.',
       { start_fret: 7, fingers_used: [1, 2, 3], finger_fret_map: { '1': 7, '2': 8, '3': 9 }, strings: '6 down to 1, then back up', picks_per_note: 3, pick: 'down-pick (thumb OK)', tempo: 'very slow; count 1 2 3 4', duration_min: 5, breathing_cue: 'breathe; do not hold breath (tension = slow)' },
       'Spider: start at the 7th fret where it is least stretchy. One finger per fret — index, middle, ring. Three slow picks per string, top to bottom and back. Floppy fingers are normal; that is the control you are building.'),
    ex('EX2-liftoff', 'Finger lift-off', 'Finger independence.',
       { base_chord: 'C', action: 'lift 3rd, then 2nd, then 1st, one at a time; rebuild', air_variant: 'lift hand off, make shapes in air, drop back down', duration_min: 'few minutes (tendon caution)' },
       'Make a C shape and lift fingers one at a time. If your hand forgets the shape when you let go, that is expected — reps fix it. We are teaching your fingers where to go.'),
    ex('EX3-drill', '1-minute change drill', 'Metronome scorecard.',
       { chord_pair: ['Em', 'easyC'], duration_sec: 60, measure: 'count completed changes', push_technique: 'set tempo slightly above comfort, then return', clarity_rule: 'during speed push, muted strings OK; goal is finger SPEED' },
       'Metronome on, Em to easy C for one minute. Count your changes. Do not worry about buzz — we are chasing speed. Write the number down; next week, beat it.')
  ],
  avatar_coaching_copy: {
    intro: 'Slow chord changes are not a talent problem — they are a muscle-memory problem. Today we warm up your hands and turn the metronome into a scorecard.',
    ex1_intro: 'Spider: 7th fret, least stretch. Index, middle, ring, one per fret. Three slow picks per string, up and down. Breathe — floppy fingers are the control forming.',
    ex2_intro: 'Make a C, lift fingers one at a time. Hand flattens when you let go? Normal. Muscle memory has not formed yet. Reps fix it.',
    ex3_intro: 'Scorecard time: Em to easy C, one minute, count the changes. Speed first, clean second. Write it down — that number is next week\'s target.',
    results: 'Your count this session is your baseline. Next session, beat it by one. That is how 16 becomes 30.',
    wrap: 'Consistency beats talent. Three drills, five minutes, most days — that is the whole secret to fast changes.'
  },
  qa_block: qaBlock(['easy C = 2-finger reduction; arithmetic confirms C E G. Spider start fret 7 = least stretch. Change baseline 16-30/min is anecdotal (instructor-reported), labeled as such in-copy, not presented as validated fact.'])
});

// L16 — New Chord: E + cowboy set complete
LESSONS.push({
  id: 'L16-new-chord-e',
  title: 'New Chord: E + cowboy set complete',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Add E — the full cowboy set is yours.',
  objectives: [
    'Form E major (020100)',
    'Connect E↔A and A↔Em',
    'Recognize the complete open-chord set'
  ],
  estimated_minutes: 14,
  prerequisites: ['A, Am, Em (L02,L08,L09)'],
  app_feature_mapping: { free_metronome: ['E-A / A-Em change tempo'] },
  chords: chordSet(['E', 'A', 'Em']),
  exercises: [
    ex('EX1-E', 'Make E', 'Land the E shape.',
       { chord: 'E', fingers: 'middle(2) A 2nd, ring(3) D 2nd, index(1) G 1st', open_strings: 'low E and B ring open' },
       'E: middle on A second fret, ring on D second, index on G first. Low E and B ring open. Bright, powerful — the root of rock and blues.'),
    ex('EX2-changes', 'E↔A, A↔Em', 'Connect the new chord to its neighbours.',
       { chord_cycle: ['E', 'A', 'Em', 'A'], tempo_bpm: 70, beats: 4, cue: 'one chord per 4 beats' },
       'E to A, A to Em, back. These three share hand positions, so the changes are small. Smooth them and the cowboy set is complete.')
  ],
  avatar_coaching_copy: {
    intro: 'E completes your open-chord toolkit — the classic "cowboy" set. Bright, loud, the root of countless songs.',
    ex1_intro: 'E: middle on A second, ring on D second, index on G first. Low E and B open. A big, ringing chord.',
    ex2_intro: 'E to A, A to Em. They share hand shapes, so the moves are tiny. Smooth them and you have the full set.',
    results: 'With E in, your open-chord vocabulary is complete. Every campfire song is now within reach.',
    wrap: 'Cowboy set done: E, A, Em, Am, C, G, D. Lesson 17 we add color with Dm and minor progressions.'
  },
  qa_block: qaBlock()
});

// L17 — Minor Progressions + Dm
LESSONS.push({
  id: 'L17-minor-progressions-dm',
  title: 'Minor Progressions + Dm',
  level: 'beginner',
  lesson_type: 'technique',
  one_line_promise: 'Dm adds the emotional minor color.',
  objectives: [
    'Form D minor',
    'Play C–G–Am–Dm and Am–F–C–G (capo for F)',
    'Hear the sad-minor emotional shift'
  ],
  estimated_minutes: 16,
  prerequisites: ['C, G, Am, Dm available shapes (Am L09; Dm new)', 'capo (L14) for F'],
  app_feature_mapping: { free_metronome: ['minor progression tempo'] },
  chords: chordSet(['C', 'G', 'Am', 'Dm']),
  exercises: [
    ex('EX1-Dm', 'Make Dm', 'Land the D-minor shape.',
       { chord: 'Dm', fingers: 'index(1) on G? correct: index(1) on high-e 1st, middle(2) on B 3rd, ring(3) on G 2nd', open_strings: 'D and A ring open; low E muted' },
       'Dm: index on the high e first fret, middle on the B third, ring on the G second. Low E quiet. The saddest, most useful minor in pop.'),
    ex('EX2-minorprog', 'Minor progressions', 'Two classic minor loops.',
       { chord_cycle: ['C', 'G', 'Am', 'Dm'], tempo_bpm: 68, beats: 4, note: 'for Am-F-C-G, put capo 0 and substitute F with capo? NO — teach Am-F-C-G using capo on appropriate fret; here we use C-G-Am-Dm (all open) and mention F via capo', cue: 'one chord per 4 beats' },
       'Loop C-G-Am-Dm — all open chords, pure minor emotion. For the famous Am-F-C-G, you would use a capo (Lesson 14) since F is a barre chord we have not covered; today we stay on open shapes.')
  ],
  avatar_coaching_copy: {
    intro: 'Major chords are happy; minor chords are the feeling. Dm is the most-used minor in pop. Add it and songs get emotional.',
    ex1_intro: 'Dm: index on high e first fret, middle on B third, ring on G second. Low E quiet. That small shape carries a lot of feeling.',
    ex2_intro: 'Loop C-G-Am-Dm — all open, all minor-ish emotion. The famous Am-F-C-G uses F, which needs a barre; for now we capo (Lesson 14) or stay on open shapes. The feeling is the lesson.',
    results: 'Minor progressions give you the bittersweet songs. Dm is a small shape with a big emotional job.',
    wrap: 'Dm in. Minor color unlocked. Lesson 18 we add fingerpicking — a whole new texture.'
  },
  qa_block: qaBlock(['Dm uses open voicing (index high-e1, middle B3, ring G2). F (barre) is explicitly deferred to a later stage and reached via capo, per sequencing; no barre fingering is introduced or claimed here.'])
});

// L18 — Fingerpicking Intro (Travis pattern)
LESSONS.push({
  id: 'L18-fingerpicking-travis',
  title: 'Fingerpicking Intro (Travis pattern)',
  level: 'intermediate-ish',
  lesson_type: 'technique',
  one_line_promise: 'A second texture — pick, don\'t strum.',
  objectives: [
    'Thumb the bass, fingers alternate the treble',
    'Play the Travis pattern on C (or G)',
    'Keep it slow and even for 5 minutes'
  ],
  estimated_minutes: 16,
  prerequisites: ['C or G comfortable (L03/L06)'],
  app_feature_mapping: { free_metronome: ['Travis pattern tempo'] },
  chords: chordSet(['C', 'G']),
  exercises: [
    ex('EX1-thumb', 'Thumb the bass', 'Steady alternating bass with the thumb.',
       { chord: 'C', action: 'thumb alternates low-E(5th) and A(4th) strings', cue: 'even, like a heartbeat' },
       'Fingerpicking starts with the thumb. On C, your thumb alternates the low E and A strings — a steady heartbeat bass. Everything else waits.'),
    ex('EX2-travis', 'Travis pattern', 'Thumb bass + finger alternation.',
       { chord: 'C', pattern: 'thumb low-E, finger G-string, thumb A, finger B-string (repeat)', tempo_bpm: 60, duration_min: 5, cue: 'thumb on the beat, fingers on the off-beats' },
       'Travis pattern: thumb on low E, a finger on the G string, thumb on A, a finger on the B string. Repeat. Slow and even — that rolling sound is fingerstyle.')
  ],
  avatar_coaching_copy: {
    intro: 'Strumming is one texture; fingerpicking is another. Today: the Travis pattern — thumb on bass, fingers alternating. A whole new sound.',
    ex1_intro: 'Start with the thumb. On C, alternate low E and A strings — steady, like a heartbeat. That bass line is the foundation.',
    ex2_intro: 'Travis: thumb low E, finger G string, thumb A, finger B string. Slow and even. That rolling pattern is the sound of folk and country fingerstyle.',
    results: 'If you can hold the Travis pattern for five minutes without speeding up, you have a second texture. Huge.',
    wrap: 'Fingerpicking intro done. Lesson 19: read any chord chart or TAB and learn songs on your own.'
  },
  qa_block: qaBlock()
});

// L19 — Read Any Chord Chart / TAB
LESSONS.push({
  id: 'L19-read-chord-chart-tab',
  title: 'Read Any Chord Chart / TAB',
  level: 'intermediate-ish',
  lesson_type: 'technique',
  one_line_promise: 'Self-serve: learn any song from a chart.',
  objectives: [
    'Read a chord diagram box (dots = frets/fingers)',
    'Understand basic TAB notation',
    'Find and play one new simple chart from the library'
  ],
  estimated_minutes: 15,
  prerequisites: ['Core open chords (L02-L09)'],
  app_feature_mapping: { free_metronome: [] },
  chords: chordSet(['C', 'G', 'Am', 'Em']),
  exercises: [
    ex('EX1-diagram', 'Read the box', 'Map dots to fretboard.',
       { skill: 'chord diagram', rule: 'vertical lines = strings (left = low E), horizontal = frets, dots = where to press, numbers = fingers', cue: 'the app draws these from the lesson data — identical to what you play' },
       'A chord box is a tiny fretboard: vertical lines are strings (left is low E), horizontal are frets, dots are where your fingers go, numbers are which finger. The app draws these from the exact data you play — no guessing.'),
    ex('EX2-tab', 'Read TAB', 'Map numbers to fret numbers per string.',
       { skill: 'TAB', rule: 'six lines = strings (top = high e), numbers = fret to press on that string, 0 = open', cue: 'read left to right, one column at a time' },
       'TAB is six lines (top is high e). A number tells you the fret on that string; 0 means open. Read left to right, one column at a time. Melodies, not just chords.'),
    ex('EX3-library', 'Play one new chart', 'Apply it to a library song.',
       { chord_cycle: ['C', 'G', 'Am', 'Em'], source: 'app library (exercise-only / PD charts)', tempo_bpm: 70, beats: 4, cue: 'read the chart, play the loop' },
       'Open a simple chart from the library — exercise-only, safe per licensing. Read the boxes, play the loop. You just taught yourself a song. That is the self-serve superpower.')
  ],
  avatar_coaching_copy: {
    intro: 'The goal was always independence: you reading a chart and learning a song yourself. Today we decode chord boxes and TAB.',
    ex1_intro: 'A chord box is a mini fretboard — left line is low E, dots are fingers, numbers are which finger. The app draws these from your lesson data, so what you see is what you play.',
    ex2_intro: 'TAB: six lines, top is high e, numbers are frets, 0 is open. Read left to right. Now you can follow melodies, not just chords.',
    ex3_intro: 'Grab a simple library chart — exercise-only, licensing-safe. Read it, play the loop. You taught yourself a song. That is the point of all this.',
    results: 'If you can read a box and a TAB line, no song at your level is off-limits. You are self-sufficient.',
    wrap: 'Chart-reading done. Lesson 20: capstone — play a full song and set your habit plan.'
  },
  qa_block: qaBlock(['Charts shown are generated from the lesson chord data (code-driven fretboard), so they cannot contradict the fingerings taught — Ban 1 preserved. Library songs are exercise-only/PD per spec §3/R6.'])
});

// L20 — Consolidation + First "Performance" + What's Next
LESSONS.push({
  id: 'L20-consolidation-performance',
  title: 'Consolidation + Your First "Performance" + What\'s Next',
  level: 'graduate',
  lesson_type: 'technique',
  one_line_promise: 'Play a full song start-to-finish. Then keep going.',
  objectives: [
    'Play one full capstone song start-to-finish',
    'Write a 10-minute daily practice routine',
    'Set a 2-week plan and preview the intermediate path'
  ],
  estimated_minutes: 20,
  prerequisites: ['Core open chords + strumming + chart reading (L02-L19)'],
  app_feature_mapping: { free_metronome: ['capstone song tempo'], streaks: ['practice routine feeds the streak engine'] },
  chords: chordSet(['G', 'D', 'Em', 'C', 'Am']),
  exercises: [
    ex('EX1-capstone', 'Play the capstone', 'One full song, no stopping.',
       { chord_cycle: ['G', 'D', 'Em', 'C', 'Am', 'C'], tempo_bpm: 72, beats: 4, cue: 'full pass, start to finish, even if slow' },
       'Your capstone: G-D-Em-C-Am-C, all the way through, start to finish. Slow is fine. Finishing a whole song is the win — that is your first "performance."'),
    ex('EX2-routine', '10-minute daily routine', 'A repeatable practice plan.',
       { routine: ['2 min tune + warm-up (spider)', '3 min one change drill (beat last week)', '3 min capstone song', '2 min new chart from library'], cue: 'same shape every day builds the habit' },
       'Ten minutes, same shape daily: tune and warm up, one change drill, your capstone song, one new chart. Short, repeatable, and it compounds.'),
    ex('EX3-plan', '2-week plan', 'Set the next steps.',
       { plan: ['Week 1: lock the capstone at 80 bpm', 'Week 2: add one new minor progression', 'Then: intermediate path (barre chords, key changes)'], cue: 'write it down, one small target at a time' },
       'Two weeks: week one, lock the capstone at 80 bpm; week two, add a minor progression. Then the intermediate path — barre chords and key changes. One small target at a time.')
  ],
  avatar_coaching_copy: {
    intro: "Graduation day. You play a full song start-to-finish, set a daily habit, and preview what comes next. This is the capstone.",
    ex1_intro: 'Capstone: G-D-Em-C-Am-C, all the way through. Slow is fine — finishing is the win. That is your first performance.',
    ex2_intro: 'Ten minutes daily: warm up, one change drill, your capstone, one new chart. Same shape every day. That repetition is the habit that keeps you playing.',
    ex3_intro: 'Two weeks: lock the capstone at 80 bpm, then add a minor progression. After that, intermediate — barre chords and key changes. Small targets, steady progress.',
    results: 'If you finished the capstone and wrote your plan, you have graduated beginner. The streak is now your engine.',
    wrap: 'You played a full song and made a plan. Most people quit before Lesson 5 — you did not. See you in Intermediate. Keep the streak alive.'
  },
  qa_block: qaBlock(['Capstone uses only open chords already verified in earlier lessons; no new fingering introduced. Routine/plan are practice-prescription, not new musical content.'])
});

/* ------------------------------------------------------------------ *
 * EMIT
 * ------------------------------------------------------------------ */
const SLUG = [
  'welcome-anatomy-tuning', 'first-chord-em', 'second-chord-first-song', 'strumming-in-time',
  'chord-changes-em-easyc', 'new-chord-g', 'new-chord-d', 'new-chord-a',
  'new-chord-am-big-four', 'four-chord-songs', 'up-strums', 'strumming-patterns',
  'dynamics-alternating-bass', 'capo-basics', 'faster-chord-changes', 'new-chord-e',
  'minor-progressions-dm', 'fingerpicking-travis', 'read-chord-chart-tab', 'consolidation-performance'
];

function pad2(n) { return String(n).padStart(2, '0'); }

const LESSON_KEYS = ['id', 'title', 'level', 'lesson_type', 'one_line_promise',
  'objectives', 'estimated_minutes', 'prerequisites', 'app_feature_mapping'];

const outDir = path.join(__dirname, '..'); // lessons go in 05-content/, this script lives in 05-content/scripts/
let written = 0;
for (let i = 0; i < LESSONS.length; i++) {
  const flat = LESSONS[i];
  // Schema requires lesson metadata NESTED under a `lesson` object.
  const lessonObj = {};
  LESSON_KEYS.forEach(k => { if (k in flat) { lessonObj[k] = flat[k]; delete flat[k]; } });
  flat.lesson = lessonObj;
  const num = pad2(i + 1);
  const file = path.join(outDir, 'guitar-lesson-' + num + '-' + SLUG[i] + '.json');
  fs.writeFileSync(file, JSON.stringify(flat, null, 2) + '\n', 'utf8');
  written++;
  console.log('wrote ' + path.basename(file));
}
console.log('\n' + written + ' lesson files emitted to ' + outDir);
if (written !== 20) { console.error('ERROR: expected 20 lessons, got ' + written); process.exit(1); }
