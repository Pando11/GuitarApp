#!/usr/bin/env node
// verify-finger-copy.js — guard against the L02 "fourth finger" class of bug.
//
// AGENTS rule 8 proves the frets/fingers DATA spells the chord (arithmetic). But the
// SPOKEN / caption copy lives separately (lesson JSON avatar_coaching_copy + exercises,
// and the Python audio script that renders the wavs). A wording edit could call the
// ring finger "fourth finger" / "pinky" while the data says 3 and the checker wouldn't
// catch it. This script closes that gap: it asserts the finger NAMES used in spoken text
// match the finger NUMBERS in the chord data, and hard-fails on the dangerous tokens
// "fourth finger" / "4th finger" / "pinky" (we never label fingers that way).
//
// Run: node 04-validation/verify-finger-copy.js
// Exit 0 = clean, 1 = mismatch found.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NAME_NUM = { index: 1, middle: 2, ring: 3, pinky: 4 };
const NUM_NAME = { 1: 'index', 2: 'middle', 3: 'ring', 4: 'pinky' };

// Pull finger NUMBERS named in a block of spoken text.
// Matches: "middle finger", "ring finger", "your second finger", "finger two", "third finger"...
function impliedFingers(text) {
  if (!text) return new Set();
  const t = ' ' + text.toLowerCase() + ' ';
  const out = new Set();
  // name + " finger"
  for (const [name, num] of Object.entries(NAME_NUM)) {
    if (new RegExp('(?:^|[^a-z])' + name + '\\s+finger(?:[^a-z]|$)').test(t)) out.add(num);
  }
  // "Nth finger" / "finger N"
  const ord = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };
  for (const [w, num] of Object.entries(ord)) {
    if (new RegExp('(?:^|[^a-z])' + w + '\\s+finger(?:[^a-z]|$)').test(t)) out.add(num);
    if (new RegExp('finger\\s+' + num + '(?:[^a-z]|$)').test(t)) out.add(num);
  }
  return out;
}

function chordFingerNums(chord) {
  const f = (chord && Array.isArray(chord.fingers)) ? chord.fingers : [];
  const s = new Set();
  for (const x of f) if (typeof x === 'number' && x > 0) s.add(x);
  return s;
}

// Dangerous tokens that should never appear as a fingering label.
// 1) The literal wrong-fingering words.
// 2) NUMERAL synonyms ("finger two", "second finger", "third finger"...) — these are the
//    root-cause class: a TTS voice (e.g. OpenAI "onyx" at rate 1.1) can render "finger two"
//    as "finger four" / "finger to", which a listener maps to the wrong hand position. The
//    unambiguous, TTS-safe forms are the ANATOMICAL names ("middle finger", "ring finger")
//    plus the FRET numbers ("second fret"). We forbid numeral synonyms in spoken copy so the
//    L02 "fourth finger = ring finger" class of misread can never be reintroduced. (Verified:
//    no lesson currently uses any numeral-finger synonym; see the 2026-08-12 fix.)
const DANGEROUS = [
  /\bfourth\s+finger\b/, /\b4th\s+finger\b/, /\bpinky\b/,
  /\bfinger\s+(one|two|three|four|five)\b/,
  /\b(first|second|third|fourth|fifth)\s+finger\b/,
];

let errors = 0;
const warn = (m) => console.log('WARN  ' + m);
const err = (m) => { errors++; console.log('ERROR ' + m); };

// 1) Every lesson JSON under 07-app/content/lessons.
const lessonDir = path.join(ROOT, '07-app', 'content', 'lessons');
for (const f of fs.readdirSync(lessonDir).filter((x) => x.endsWith('.json'))) {
  const json = JSON.parse(fs.readFileSync(path.join(lessonDir, f), 'utf8'));
  const chords = json.chords || {};
  const spoken = [];
  const copy = json.avatar_coaching_copy || {};
  for (const k in copy) if (typeof copy[k] === 'string') spoken.push(copy[k]);
  for (const ex of json.exercises || []) if (ex.coaching) spoken.push(ex.coaching);
  const text = spoken.join(' ');

  for (const re of DANGEROUS) if (re.test(text.toLowerCase())) {
    err(`${f}: spoken copy contains dangerous fingering token "${re}" — fix to index/middle/ring.`);
  }

  // Lessons that teach *technique* (pick grip, strumming arm, posture) reference the
  // index/middle fingers for the picking or fretting hand but carry no chord — skip the
  // "named finger not in chord" ERROR there (e.g. L21 hold-the-pick: index finger grips the pick).
  const isTechniqueNoChord = (json.lesson && json.lesson.lesson_type === 'technique' && Object.keys(chords).filter((c) => c !== '_schema').length === 0);
  const implied = impliedFingers(text);
  const used = new Set();
  for (const cname in chords) {
    if (cname === '_schema') continue;
    for (const n of chordFingerNums(chords[cname])) used.add(n);
  }
  for (const n of implied) if (!used.has(n) && !isTechniqueNoChord) {
    err(`${f}: spoken copy names finger ${n} (${NUM_NAME[n]}) but no chord in this lesson uses it.`);
  }
  for (const n of used) if (!implied.has(n)) {
    warn(`${f}: chord uses finger ${n} (${NUM_NAME[n]}) but spoken copy doesn't name it (may be fine if taught by shape).`);
  }
}

// 2) The Python audio script that produced the wavs (single-source since 2026-08-11).
const pyPath = path.join(ROOT, '07-app', 'audio', 'generate-warm-voice.py');
if (fs.existsSync(pyPath)) {
  const py = fs.readFileSync(pyPath, 'utf8');
  // Pull every string literal in the SCENES dict region if present, else whole file.
  const body = (py.match(/SCENES\s*=\s*\{([\s\S]*?)\n\};/) || [null, py])[1];
  const strings = (body.match(/"([^"]*)"/g) || []).map((s) => s.slice(1, -1)).join(' ');
  for (const re of DANGEROUS) if (re.test(strings.toLowerCase())) {
    err(`generate-warm-voice.py: audio script contains dangerous fingering token "${re}".`);
  }
  // L02 Em uses only fingers 2 and 3.
  const implied = impliedFingers(strings);
  for (const n of implied) if (n !== 2 && n !== 3) {
    err(`generate-warm-voice.py: audio script names finger ${n} but L02 Em uses only 2 and 3.`);
  }
}

if (errors === 0) console.log('\nFINGER-COPY CHECK: 0 errors — spoken names match chord data.');
else console.log(`\nFINGER-COPY CHECK: ${errors} error(s) found.`);
process.exit(errors ? 1 : 0);
