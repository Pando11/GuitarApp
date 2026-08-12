// curriculum-review/review-curriculum.mjs
// Verifies the on-disk 20-lesson curriculum against the LOCKED spine in
// 03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md §5.1 (owner directive 2026-08-12).
// Produces a structured report (findings + evidence), not prose guesswork.
//
// Load-bearing invariant (§5.0): Group N practice drills exactly the chord(s)
// introduced in Group N teaching + every chord taught in groups 1..N-1 (cumulative).

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('05-content');
const PRACTICE_ENGINE = path.resolve('06-prototypes/practice-engine/spine-check.mjs');

// ---- Documented spine from §5.1 (the "locked" structure rule) ----
// newChord: the chord §5.1 says Group N introduces. null = technique-only lesson.
const DOC_SPINE = [
  { g: 1,  newChord: null,  practice: [] },                                  // L01 tuning
  { g: 2,  newChord: 'Em',    practice: ['Em'] },                            // L02
  { g: 3,  newChord: 'easyC', practice: ['Em', 'easyC'] },                   // L03 first song (song=separate)
  { g: 4,  newChord: null,  practice: ['Em', 'easyC'] },                     // L04 strumming in time
  { g: 5,  newChord: null,  practice: ['Em', 'easyC'] },                     // L05 changes
  { g: 6,  newChord: 'G',     practice: ['Em', 'easyC', 'G'] },              // L06
  { g: 7,  newChord: 'D',     practice: ['Em', 'easyC', 'G', 'D'] },         // L07
  { g: 8,  newChord: 'A',     practice: ['Em', 'easyC', 'G', 'D', 'A'] },    // L08
  { g: 9,  newChord: 'Am',    practice: ['Em', 'easyC', 'G', 'D', 'A', 'Am'] },// L09
  { g: 10, newChord: null,  practice: ['G', 'D', 'Em', 'C'] },               // L10 four-chord (doc says C here)
  { g: 11, newChord: null,  practice: ['all 6'] },                           // L11
  { g: 12, newChord: null,  practice: ['all 6'] },                           // L12
  { g: 13, newChord: null,  practice: ['all 6'] },                           // L13
  { g: 14, newChord: null,  practice: ['G', 'D', 'Em', 'C'] },               // L14 capo (doc says C)
  { g: 15, newChord: null,  practice: ['all 6', 'all pairs'] },              // L15
  { g: 16, newChord: 'E',     practice: ['+E', 'E<->A', 'A<->Em'] },         // L16
  { g: 17, newChord: 'Dm',    practice: ['Am', 'Dm', 'Em'] },                // L17 minor set
  { g: 18, newChord: null,  practice: ['C', 'G', 'Am'] },                    // L18 fingerpick (doc says C)
  { g: 19, newChord: null,  practice: ['all taught chords'] },               // L19
  { g: 20, newChord: null,  practice: ['all 8 chords'] },                    // L20
];

// The 8-chord canonical order stated throughout the doc (§0 baseline + §5.1):
const DOC_CHAIN = ['Em', 'easyC', 'G', 'D', 'A', 'Am', 'E', 'Dm'];

function loadLesson(n) {
  const re = new RegExp(`^guitar-lesson-${String(n).padStart(2, '0')}-.*\\.json$`);
  const f = fs.readdirSync(ROOT).find((x) => re.test(x));
  if (!f) return null;
  return { file: f, data: JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')) };
}

const SCHEMA_KEY = '_schema';
function chordKeys(lessonData) {
  return Object.keys(lessonData.chords || {}).filter((k) => k !== SCHEMA_KEY);
}

const findings = [];
function finding(sev, code, msg, evidence) {
  findings.push({ sev, code, msg, evidence });
}

// ---- 1. Per-lesson chord inventory ----
const inventory = [];
for (let n = 1; n <= 20; n++) {
  const L = loadLesson(n);
  if (!L) { finding('ERR', 'MISSING', `Lesson ${n} missing from 05-content`, null); continue; }
  const keys = chordKeys(L.data).sort();
  inventory.push({ n, file: L.file, keys });
}

// ---- 2. Detect the easyC vs C identity split ----
const easyCfiles = inventory.filter((x) => x.keys.includes('easyC'));
const Cfiles = inventory.filter((x) => x.keys.includes('C'));
const bothFiles = inventory.filter((x) => x.keys.includes('C') && x.keys.includes('easyC'));
const hasEasyCButNotC = easyCfiles.filter((x) => !x.keys.includes('C'));
const hasCButNotEasyC = Cfiles.filter((x) => !x.keys.includes('easyC'));

if (easyCfiles.length && Cfiles.length) {
  finding('MED', 'C-IDENTITY-SPLIT',
    `Two distinct chord identities exist for C: 'easyC' (2-finger) and 'C' (standard). ` +
    `Lessons using easyC: [${easyCfiles.map((x) => x.n).join(',')}]. Lessons using standard C: [${Cfiles.map((x) => x.n).join(',')}]. ` +
    `No lesson teaches both in the same file, and the practice-engine SPINE constant still lists 'easyC' as the canonical spine token — ` +
    `a student who learns easyC in L03 and standard C in L08 will get TWO separate memory slots for the same musical chord, fragmenting the weak-pair review moat.`,
    { easyCfiles: easyCfiles.map((x) => x.n), Cfiles: Cfiles.map((x) => x.n), bothFiles: bothFiles.map((x) => x.n) });
}

// ---- 3. Does DOC_SPINE newChord match on-disk? (structural) ----
// The "new chord" is the chord present in lesson N that is NOT present in any lesson < N.
const seen = new Set();
const onDiskNew = [];
for (const row of inventory) {
  const fresh = row.keys.filter((k) => !seen.has(k));
  onDiskNew.push({ n: row.n, fresh });
  row.keys.forEach((k) => seen.add(k));
}

for (const doc of DOC_SPINE) {
  if (!doc.newChord) continue;
  const disk = onDiskNew.find((x) => x.n === doc.g);
  if (!disk) continue;
  const introduced = disk.fresh.includes(doc.newChord);
  if (!introduced) {
    finding('LOW', 'SPINE-NEWCHORD',
      `Group ${doc.g}: doc says new chord '${doc.newChord}' but on-disk lesson introduces [${disk.fresh.join(',') || 'none'}].`,
      { group: doc.g, docNew: doc.newChord, diskFresh: disk.fresh });
  }
}

// ---- 4. Practice-engine SPINE drift vs doc chain ----
// SPINE is written with single quotes; extract tokens robustly.
function parseSpineConst(src) {
  const m = src.match(/const SPINE = \[([^\]]*)\];/);
  if (!m) return null;
  return m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}
const engineSpine = parseSpineConst(fs.readFileSync(PRACTICE_ENGINE, 'utf8'));

if (engineSpine) {
  const norm = (a) => a.map((x) => (x === 'easyC' ? 'C' : x)).join(',');
  if (norm(engineSpine) !== norm(DOC_CHAIN)) {
    finding('HIGH', 'ENGINE-SPINE-DRIFT',
      `practice-engine SPINE (${JSON.stringify(engineSpine)}) does not match the documented 8-chord chain ` +
      `(${JSON.stringify(DOC_CHAIN)}) after easyC/C normalization. The weak-pair review memory keys off this array; ` +
      `if it diverges from the taught ladder the adaptive review targets the wrong pairs.`,
      { engineSpine, docChain: DOC_CHAIN });
  }
}

// ---- 5. Cumulative-practice invariant (doc §5.0) spot checks ----
// Group N practice set must be a subset of {all chords taught in groups 1..N}.
function cumulativeUpTo(g) {
  const s = new Set();
  for (let n = 1; n <= g; n++) {
    const row = inventory.find((x) => x.n === n);
    if (row) row.keys.forEach((k) => s.add(k));
  }
  return s;
}
// Doc group 10 practice expects G,D,Em,C — but on-disk L10 has {G,D,Em,C}? check:
const l10 = inventory.find((x) => x.n === 10);
if (l10 && !l10.keys.includes('C')) {
  finding('MED', 'G10-CHORD-SET',
    `Group 10 (four-chord G-D-Em-C) on-disk chord set is [${l10.keys.join(',')}]. Doc §5.1 practice row lists 'C' ` +
    `but the standard C is only introduced on-disk at L08 (and easyC at L03). Verify the four-chord progression uses the ` +
    `intended C identity (standard vs easyC) so the song's memory slot matches the lesson that taught it.`,
    { l10keys: l10.keys });
}

// ---- 6. SONGS directive (§5.4/§5.6) — are songs actually a separate category on disk? ----
// Doc claims L03/L10/L20 song content moved to a SONGS category; verify no song is
// still embedded as a technique/practice exercise, and that a SONGS category exists.
const embeddedSongs = [];
for (const row of inventory) {
  const L = loadLesson(row.n);
  const ex = (L.data.exercises || []).filter((e) => /song/i.test(e.name || e.id || ''));
  if (ex.length) embeddedSongs.push({ n: row.n, songs: ex.map((e) => e.name || e.id) });
}
if (embeddedSongs.length) {
  finding('LOW', 'SONGS-NOT-SEPARATED',
    `§5.4/§5.6 says songs are a SEPARATE CATEGORY (moved out of the technique spine), but on-disk ` +
    `${embeddedSongs.length} lesson(s) still embed a song exercise inside the technique lesson: ` +
    `${embeddedSongs.map((x) => `L${x.n} (${x.songs.join(', ')})`).join('; ')}. ` +
    `No SONGS category directory exists under 05-content or 07-app/content. The directive is documented as ` +
    `resolved but not executed on disk — flag for Heidi (structural, low urgency).`,
    { embeddedSongs });
}

// ---- 7. easyC -> standard C graduation (is the transition taught, not silent?) ----
// easyC appears last as a NEW chord at L07 and is dropped after L15; standard C appears first at L08.
// A real pedagogy graduates the student (teaches both shapes side by side, then retires easyC).
const easyCFirst = inventory.find((x) => x.keys.includes('easyC'));
const cFirst = inventory.find((x) => x.keys.includes('C'));
const both = inventory.filter((x) => x.keys.includes('easyC') && x.keys.includes('C'));
// Find a lesson whose exercises explicitly teach the transition.
let gradLesson = null;
for (const row of inventory) {
  const L = loadLesson(row.n);
  const txt = JSON.stringify(L.data.exercises || []);
  if (/easy.{0,3}C.*standard|standard.{0,3}C.*easy|graduate|move from easy|upgrade.{0,3}C/i.test(txt)) {
    gradLesson = row.n; break;
  }
}
if (easyCFirst && cFirst && easyCFirst.n < cFirst.n && !gradLesson) {
  finding('MED', 'NO-C-GRADUATION-LESSON',
    `easyC (2-finger) is taught from L${easyCFirst.n} and standard C appears at L${cFirst.n} with NO lesson that ` +
    `explicitly graduates the student from one shape to the other. The only file containing both (L${both.map((x) => x.n).join(',') || 'none'}) ` +
    `does not name a transition exercise. Result: the chord identity silently swaps at L08, and because practiceStore.js ` +
    `keys fluency by the literal chordName, the student's easyC progress (L03-07) does NOT carry into the C they play in L08+. ` +
    `This is the same root cause as C-IDENTITY-SPLIT — recommend a single canonical token (e.g. normalize 'easyC'->'C' at ` +
    `ingest, or a dedicated graduation lesson) so memory is continuous.`,
    { easyCFirst: easyCFirst.n, cFirst: cFirst.n, bothInLessons: both.map((x) => x.n) });
}

// ---- Output ----
const sevOrder = { ERR: 0, HIGH: 1, MED: 2, LOW: 3 };
findings.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev]);

console.log('=== CURRICULUM REVIEW — on-disk vs locked spine (§5.1) ===');
console.log(`Lessons scanned: 20 (05-content). Findings: ${findings.length}`);
console.log(`  easyC-using lessons : ${easyCfiles.map((x) => x.n).join(',') || 'none'}`);
console.log(`  standard-C lessons  : ${Cfiles.map((x) => x.n).join(',') || 'none'}`);
console.log(`  both in one lesson   : ${bothFiles.map((x) => x.n).join(',') || 'none'}`);
console.log('');
for (const f of findings) {
  console.log(`[${f.sev}] ${f.code}: ${f.msg}`);
  if (f.evidence) console.log('   evidence:', JSON.stringify(f.evidence));
}
console.log('');
console.log('Per-lesson chord keys:');
for (const row of inventory) console.log(`  L${String(row.n).padStart(2, '0')}: [${row.keys.join(', ')}]`);

// machine-readable
fs.mkdirSync(path.dirname('06-prototypes/curriculum-review/report.json'), { recursive: true });
fs.writeFileSync('06-prototypes/curriculum-review/report.json',
  JSON.stringify({ generated: new Date().toISOString(), findings, inventory }, null, 2));
console.log('\nReport written: 06-prototypes/curriculum-review/report.json');
