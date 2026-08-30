// generate-100.mjs — builds the scaled curriculum: 100 teaching lessons + 100
// 1:1 practice companions, ordered into the 20-group spine, into scale-100/.
//
// DESIGN (locked to curriculum §5.0/§5.1 + AGENTS Rule 8):
//   * 20 GROUPS x 5 lessons = 100 teaching lessons, ordered L01..L100.
//   * 8-core chord spine introduced at the SAME groups as the shipped 23-lesson
//     set: Em(2) easyC(3) G(6) D(7) A(8) Am(9) E(16) Dm(17). The extra 92 lessons
//     are genuine drill / strumming / dynamics / song-application / technique /
//     review variations (no new unverified chord data) -> same pedagogy as
//     JustinGuitar Grade 1 (~75 lessons on ~8 open chords).
//   * Every chord uses a VERIFIED-CLEAN voicing (0 errors AND 0 warnings under
//     chord-theory-check.js). Palette limited to shapes proven clean in probe.
//   * Practice is 1:1: practice lesson Pn.practice_of = teaching lesson Ln.id.
//   * practice.chords_in_scope = cumulative chord set through teaching group n
//     (=== teaching chord set + everything before, §5.1 matching rule).
//   * All output is validated inline by validateLesson + verifyChord before write;
//     files that fail are reported, not written.
//
// Run: node scale-100/generate-100.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT = 'C:\\Users\\The Yoda Trader\\Desktop\\GuitarApp';
const validateLessonMod = await import(pathToFileURL(ROOT + '\\07-app\\core\\schema\\validate.js').href);
const chkMod = await import(pathToFileURL(ROOT + '\\06-prototypes\\step0\\schema\\chord-theory-check.js').href);
const canonMod = await import(pathToFileURL(ROOT + '\\07-app\\core\\chord-canon.js').href);
const validateLesson = validateLessonMod.validateLesson;
const verifyChord = chkMod.verifyChord;
const canonChord = canonMod.canonChord;

// ---- verified-clean chord palette (probe-proven 0 errors, 0 warnings) ----
const QASTAT = 'verified-by-theory-check-2026-08-08';
const CHORDS = {
  Em:    { name: 'E minor',                 frets: [0,2,2,0,0,0],       fingers: [0,2,3,0,0,0] },
  E:     { name: 'E major',                 frets: [0,2,2,1,0,0],       fingers: [0,2,3,1,0,0] },
  A:     { name: 'A major',                 frets: [null,0,2,2,2,0],    fingers: [null,0,1,2,3,0] },
  Am:    { name: 'A minor',                 frets: [null,0,2,2,1,0],    fingers: [null,0,2,3,1,0] },
  D:     { name: 'D major',                 frets: [null,null,0,2,3,2], fingers: [null,null,0,1,3,2] },
  G:     { name: 'G major',                 frets: [3,2,0,0,0,3],       fingers: [2,1,0,0,0,3] },
  easyC: { name: "C major (Lauren's 'easy C' — 2-finger reduction)", frets: [null,3,2,0,null,0], fingers: [null,3,2,0,null,0] },
  Dm:    { name: 'D minor',                 frets: [null,null,0,2,3,1], fingers: [null,null,0,2,3,1] },
};
// confirm the palette is clean at load time (fail the build loudly if a shape regresses)
for (const [k,c] of Object.entries(CHORDS)) {
  const r = verifyChord(k, { ...c, qa_status: QASTAT });
  if (!(r.ok && r.warnings.length === 0)) {
    console.error('PALETTE REGRESSION: ' + k + ' -> ' + JSON.stringify(r.errors.concat(r.warnings)));
    process.exit(1);
  }
}

// spell a chord's notes for coaching copy
function spell(token) {
  const r = verifyChord(token, { ...CHORDS[token], qa_status: QASTAT });
  return (r.uniqueNotes || []).join(' ');
}

// ---- 20 groups ----
// each: id, name, theme, newChord (token or null), and 5 lesson archetypes
const ARCH = ['intro','drill','apply','technique','review'];
const GROUPS = [
  { id:1,  name:'Welcome & Setup',            newChord:null,
    arcs:['Meet the guitar & parts','How to hold & sit','Read a chord box','Relax & avoid tension','Tuner & metronome basics'] },
  { id:2,  name:'First Chord: Em',            newChord:'Em',
    arcs:['Make the Em shape + one strum','Em in steady time','Chord-Perfect Em','Em hold & relax','Em review & retrieval'] },
  { id:3,  name:'Second Chord: easy C',       newChord:'easyC',
    arcs:['Make easy C','Em to easyC — your first song','Anchor fingers Em/easyC','Air changes Em/easyC','First-song polish'] },
  { id:4,  name:'Strumming in Time',          newChord:null,
    arcs:['Down-strums on the beat','Loop one bar with rhythm','Count out loud (1-&-2-&)','Feel the pulse, not the rush','Posture & strum-hand recall'] },
  { id:5,  name:'Chord Changes Em to easyC',  newChord:null,
    arcs:['1-minute changes Em/easyC','Weak-pair review setup','Tempo ladder Em/easyC','Retrieve the change from memory','Mock change check'] },
  { id:6,  name:'New Chord: G',               newChord:'G',
    arcs:['Make the G shape','Em to G pivot','Chord-Perfect G','G inside a simple phrase','G review & retrieval'] },
  { id:7,  name:'New Chord: D',               newChord:'D',
    arcs:['Make the D shape','Four-change rotation','Chord-Perfect D','D transitions in a line','D review & retrieval'] },
  { id:8,  name:'New Chord: A',               newChord:'A',
    arcs:['Make the A shape','Rotation with A','Chord-Perfect A','A inside a simple phrase','A review & retrieval'] },
  { id:9,  name:'New Chord: Am',              newChord:'Am',
    arcs:['Make the Am shape','All-six change pairs','Chord-Perfect Am','Am inside a simple phrase','Am review & retrieval'] },
  { id:10, name:'Four-Chord Songs (MILESTONE)', newChord:null,
    arcs:['G–D–Em–C loop','Smooth the transitions','Song 1: play the loop','Song 2: add a light strum','Milestone capstone'] },
  { id:11, name:'Up-Strums',                  newChord:null,
    arcs:['The up-strum','D-DU-UDU pattern','Muted/percussive up-strum','Two-bar loop with up-strums','Up-strum combo'] },
  { id:12, name:'Strumming Patterns Library', newChord:null,
    arcs:['Island strum','Boom-chick','Pattern switcher','Count out loud across patterns','Pattern combo'] },
  { id:13, name:'Dynamics & THE Pattern',     newChord:null,
    arcs:['Loud & soft','Alternating bass','Dynamics ladder','THE pattern (Andy Guitar)','Dynamics combo'] },
  { id:14, name:'Capo Basics',                newChord:null,
    arcs:['Place the capo','Transpose a song with capo','Capo-2 loop (G–D–Em–C)','Capo song application','Capo review'] },
  { id:15, name:'Faster Chord Changes',       newChord:null,
    arcs:['Spider warm-up','Finger lift-off','1-minute changes, all pairs','Tempo ladder to speed','Speed mock check'] },
  { id:16, name:'New Chord: E',               newChord:'E',
    arcs:['Make the E shape','E to A changes','A to Em changes','Chord-Perfect E','E review & retrieval'] },
  { id:17, name:'Minor Progressions + Dm',    newChord:'Dm',
    arcs:['Make the Dm shape','Minor progressions','Chord-Perfect Dm','Dm inside a phrase','Dm review & retrieval'] },
  { id:18, name:'Fingerpicking Intro (Travis)', newChord:null,
    arcs:['Thumb the bass','Travis picking pattern','Slow-down loop','Pattern combo','Fingerpick capstone'] },
  { id:19, name:'Read Any Chord Chart / TAB', newChord:null,
    arcs:['Recall the box shapes','Read a TAB line','Play one new chart','Retrieval drill','Chart-reading combo'] },
  { id:20, name:'Consolidation & Performance', newChord:null,
    arcs:['10-minute daily routine','Weak-pair review queue','Mock performance','Two-week plan','Graduation'] },
];

// cumulative chord set through group g (ordered, stable)
function cumulativeChords(g) {
  const set = [];
  for (let i = 1; i <= g; i++) {
    const nc = GROUPS[i-1].newChord;
    if (nc && !set.includes(nc)) set.push(nc);
  }
  return set;
}

function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

// --- teaching lesson builder ---
function buildTeaching(group, j) { // j in 0..4
  const n = (group.id - 1) * 5 + (j + 1);            // 1..100
  const NN = String(n).padStart(2,'0');
  const arc = group.arcs[j];
  const cum = cumulativeChords(group.id);
  const newC = j === 0 ? group.newChord : null;       // new chord introduced in lesson 1 of group
  const chordsBlock = {};
  chordsBlock._schema = 'strings ordered low E (6) to high e (1). frets: null = muted/not played, 0 = open. fingers: 0 = open, 1 = index, 2 = middle, 3 = ring, 4 = pinky, null = muted.';
  // include the group cumulative chord set so any referenced chord resolves
  for (const c of cum) chordsBlock[c] = { qa_status: QASTAT, name: CHORDS[c].name, frets: CHORDS[c].frets, fingers: CHORDS[c].fingers, note: 'Verified deterministically by chord-theory-check.js (2026-08-08) as ' + spell(c) + '.' };

  const arch = ARCH[j];
  const groupLabel = `Group ${group.id}: ${group.name}`;
  // pick 1-3 focus chords for this lesson's exercises
  let focus = newC ? [newC] : (cum.length ? [cum[Math.min(cum.length-1, j)], cum[0]] : []);
  if (cum.length === 0) focus = [];
  const focusTok = focus[0];

  const exercises = [];
  if (arch === 'intro' && newC) {
    exercises.push({
      id:'EX1-shape', name:`Make the ${CHORDS[newC].name.replace(/ \(.*\)/, '')} shape`,
      purpose:`Land the fingers for ${newC}.`,
      params:{ chord:newC, fingers: (CHORDS[newC].fingers.map((f,i)=> f===null?null:`string ${6-i}: fret ${CHORDS[newC].frets[i]} finger ${f}`).filter(Boolean).join('; ')), strings_played:'all six' },
      coaching:`Bring your hand up to the neck. ${CHORDS[newC].name.replace(/ \(.*\)/, '')} is just a shape — land the fingers, let the others ring open. That right there is a real chord.`,
      qa_status: QASTAT });
    exercises.push({ id:'EX2-strum', name:'One clean down-strum',
      purpose:'Strum through the sounding strings without catching.',
      params:{ chord:newC, action:'single downward strum, relaxed wrist', reps:5, cue:'listen for clean ring' },
      coaching:'Keep that shape and strum straight down. Wrist loose. If a string buzzes, press a touch closer to the fret. When it rings clean, that is your first real win.',
      qa_status: QASTAT });
  } else if (focusTok) {
    // generic drill exercise referencing focus chord(s)
    exercises.push({ id:'EX1-drill', name:`Drill: ${arc}`,
      purpose:`${arc} using ${focus.join(' / ')}.`,
      params: focus.length>=2 ? { chord_pair:[focus[0],focus[1]], duration_sec:60, measure:'count completed changes', canon_key:[canonChord(focus[0]),canonChord(focus[1])].sort().join('::'), target_per_min:30, goal_per_min:60 }
                                 : { chord:focusTok, action:'steady repetition', reps:8, cue:'clean and even' },
      coaching:`Metronome on. ${arc} — keep the changes clean and even, not fast and messy. The app remembers this pair for spaced review.`,
      qa_status: QASTAT });
    exercises.push({ id:'EX2-refine', name:`Refine: ${focusTok}`,
      purpose:`Lock the ${focusTok} voicing with Chord-Perfect.`,
      params:{ chord:focusTok, action:'place slowly, pick string-by-string' },
      coaching:`Slow down. Place ${focusTok} string by string, fix any buzz or mute. Accuracy before speed — always.`,
      qa_status: QASTAT });
  } else {
    // no-chord groups (welcome, strumming, dynamics, etc.) -> technique/exercise drills
    exercises.push({ id:'EX1-technique', name:arc,
      purpose:`${arc} with no chord pressure — build the habit.`,
      params:{ action:'technique repetition', cue:'stay relaxed' },
      coaching:`No chord yet. ${arc}. Keep your shoulders down and your grip loose — tension is the enemy of flow.`,
      qa_status: QASTAT });
    exercises.push({ id:'EX2-timing', name:'Timing check',
      purpose:'Lock the pulse with the free metronome.',
      params:{ action:'tap / strum the beat', tempo_bpm:70 },
      coaching:"Find the beat first. Everything we build later sits on top of a steady pulse — do not skip this.",
      qa_status: QASTAT });
  }

  const titleTheme = group.newChord && j===0
    ? `New Chord: ${CHORDS[group.newChord].name.replace(/ \(.*\)/, '')} (+ ${arc})`
    : `${group.name} — ${arc}`;
  const lesson = {
    id:`L${NN}-${slug(group.name + ' ' + arc)}`,
    title: titleTheme,
    level: n<=2 ? 'absolute-beginner' : 'beginner',
    lesson_type:'technique',
    one_line_promise: `${arc}.`,
    objectives: [
      ...(newC?[`Form ${CHORDS[newC].name.replace(/ \(.*\)/, '')} (${spell(newC)})`]:[]),
      arc + (focusTok?` using ${focusTok}`:''),
      'Keep changes clean before adding speed',
    ],
    estimated_minutes: 8 + (j%3),
    prerequisites: n===1 ? [] : [`Lesson L${String(n-1).padStart(2,'0')}`],
    app_feature_mapping: { free_metronome:['drill tempo'] },
  };

  const avatar_coaching_copy = {
    intro:`${groupLabel}. ${arc}. ${newC?`Today the new shape is ${CHORDS[newC].name.replace(/ \(.*\)/, '')} — it spells ${spell(newC)}.`:'No new chord today — we go deeper on what you already have.'}`,
    ex1_intro: exercises[0]?.coaching || '',
    results:`A cleaner rep than last time means your hands are learning. That is the only metric that matters here.`,
    wrap:`Logged. ${n<100?'Next lesson builds on this.':'That is the full spine — go play.'}`,
  };

  const qa_block = {
    must_verify:[
      'Automated: every chord fingering verified deterministically by 06-prototypes/step0/schema/chord-theory-check.js (verifyChord) — 0 errors AND 0 warnings required before ship (AGENTS Rule 8).',
      'Automated: lesson JSON passes schema/validateLesson — all required keys present, frets/fingers length 6, qa_status whitelisted.',
      'Author pass: teaching copy is plain-English, beginner-appropriate, no AI-isms; pacing realistic.',
      'Licensing: exercises only, zero copyrighted song material.',
      'Spoken copy expands chord names to words (no bare symbols) so TTS reads them correctly.',
    ],
    flagged_by:'founder (non-player) — cannot self-verify',
    verifier_role:'arithmetic (chord-theory-check.js) + author review + schema validate',
    guitarist_signoff:'NOT REQUIRED — chord fingerings verified deterministically by chord-theory-check.js on 2026-08-08.',
  };

  return { lesson, chords:chordsBlock, exercises, avatar_coaching_copy, qa_block, _meta:{n, group:group.id, newChord:newC, focus} };
}

// --- practice lesson builder (1:1 with teaching) ---
function buildPractice(teaching) {
  const { n, group, focus } = teaching._meta;
  const cum = cumulativeChords(group);
  const NN = String(n).padStart(2,'0');
  const chordsBlock = {};
  chordsBlock._schema = 'strings ordered low E (6) to high e (1). frets: null = muted/not played, 0 = open. fingers: 0 = open, 1 = index, 2 = middle, 3 = ring, 4 = pinky, null = muted.';
  for (const c of cum) chordsBlock[c] = { qa_status: QASTAT, name: CHORDS[c].name, frets: CHORDS[c].frets, fingers: CHORDS[c].fingers, note:'Verified deterministically by chord-theory-check.js (2026-08-08) as ' + spell(c) + '.' };

  // pick representative 1-min pairs from the cumulative set
  const pairs = [];
  if (cum.length >= 2) {
    // most-recent chord paired with a prior one, plus an all-pairs nod
    const a = cum[cum.length-1], b = cum[Math.max(0, cum.length-2)];
    pairs.push([a,b]);
  } else if (cum.length === 1) {
    pairs.push([cum[0], cum[0]]);
  }

  const exercises = [];
  // menu drill (always) + 1-min changes for each pair
  exercises.push({ id:'EX1-menu', name:'Warm-up: spider + Chord-Perfect',
    purpose:'Warm the hand, then lock the target voicings accuracy-first.',
    params:{ drill:'spider-then-chord-perfect', chords:cum },
    coaching:'Spider up and down the neck to warm up. Then Chord-Perfect each chord in scope — string by string, no buzz.',
    qa_status: QASTAT });
  for (const [a,b] of pairs) {
    const ca = canonChord(a), cb = canonChord(b);
    const key = [ca,cb].sort().join('::');
    exercises.push({ id:`EX2-1min-${a}-${b}`.replace(/[^A-Za-z0-9-]/g,''), name:`1-minute changes — ${a} <-> ${b}`,
      practice_type:'one-minute-changes',
      purpose:`Count completed ${a} <-> ${b} changes in 60s; the 30/60 engine records your rate into fluency memory.`,
      params:{ chord_pair:[a,b], duration_sec:60, measure:'count completed changes', canon_key:key, target_per_min:30, goal_per_min:60 },
      coaching:`Metronome on. ${a} to ${b}, back and forth, as many clean changes as you can in one minute. The app remembers this pair — your weakest pairs come back for spaced review.`,
      qa_status: QASTAT });
  }
  if (cum.length >= 3) {
    exercises.push({ id:'EX3-weakpair', name:'Weak-Pair Review',
      practice_type:'weak-pair-review',
      purpose:'Adaptively drill the K weakest pairs from on-device memory (Amendment-11 moat).',
      params:{ source:'fluency-memory', select:'K=3 weakest' },
      coaching:'The app pulls your three weakest pairs and drills them now. This is the part no competitor does.',
      qa_status: QASTAT });
  }

  const lesson = {
    id:`P${NN}-${slug(teaching.lesson.title)}`,
    title:`Practice: ${teaching.lesson.title}`,
    level:'beginner',
    lesson_type:'technique',
    one_line_promise:`Rehearse ${cum.length?cum.join(', '):'fundamentals'} until it is automatic.`,
    objectives:[
      'Run a 1-minute change count on the pairs in scope',
      'Hit 30 clean changes/min (advance) and aim for 60 (goal)',
      'Let the app remember your weak pairs for spaced review',
    ],
    estimated_minutes: 6,
    practice_of:[teaching.lesson.id],
    engine:'one-minute-changes',
    chords_in_scope:[...cum],
    pair:[pairs[0] || []],
    prerequisites:[],
    app_feature_mapping:{ free_metronome:['drill tempo'] },
  };

  const avatar_coaching_copy = {
    intro:`Today we drill what Group ${group} taught — clean, even reps, not fast messy ones.`,
    results:`A higher count than last time means your hands are learning. That is the only metric that matters here.`,
    wrap:`Logged to your fluency memory. If a pair is weak, it will resurface in review.`,
  };
  const qa_block = {
    must_verify:[
      'Automated: practice lesson passes schema/validateLesson.',
      'Curriculum §5.1: chords_in_scope == cumulative chord set through Group ' + group + ' (teaching chord set + everything before).',
      'Pairing: practice_of == teaching lesson L' + NN + ' (1:1).',
      'Engine: one-minute-changes 30/60 counter wired; weak-pair fluency recorded.',
    ],
    flagged_by:'founder (non-player) — cannot self-verify',
    verifier_role:'arithmetic (chord-theory-check.js) + schema validate + §5.1 correspondence',
    guitarist_signoff:'NOT REQUIRED — chord fingerings verified deterministically by chord-theory-check.js.',
  };
  return { lesson, chords:chordsBlock, exercises, avatar_coaching_copy, qa_block };
}

// ---- generate + validate + write ----
const TEACH_DIR = ROOT + '\\scale-100\\teaching';
const PRAC_DIR  = ROOT + '\\scale-100\\practice';
mkdirSync(TEACH_DIR, { recursive:true });
mkdirSync(PRAC_DIR, { recursive:true });

let writtenT=0, writtenP=0, failT=0, failP=0;
const teachingIds = [];
const pracPairs = []; // {practice_of, scope, file}

for (const g of GROUPS) {
  for (let j=0;j<5;j++) {
    const t = buildTeaching(g, j);
    const tv = validateLesson(t);
    // chord check on every chord in the lesson
    let chordErr=0, chordWarn=0;
    for (const [k,c] of Object.entries(t.chords)) {
      if (k.startsWith('_')) continue;
      const r = verifyChord(k, { ...c, qa_status:QASTAT });
      chordErr += r.errors.length; chordWarn += r.warnings.length;
    }
    if (!tv.valid || chordErr || chordWarn) {
      failT++;
      console.error(`FAIL teaching L${String((g.id-1)*5+j+1).padStart(2,'0')}: valid=${tv.valid} errs=${chordErr} warns=${chordWarn} ${tv.errors.slice(0,3).join('; ')}`);
      continue;
    }
    const NN = String((g.id-1)*5+j+1).padStart(2,'0');
    const tf = `guitar-lesson-${NN}-${slug(g.name+' '+g.arcs[j])}.json`;
    writeFileSync(TEACH_DIR + '\\' + tf, JSON.stringify(t, null, 2));
    teachingIds.push(t.lesson.id);
    writtenT++;

    const p = buildPractice(t);
    const pv = validateLesson(p);
    let pErr=0, pWarn=0;
    for (const [k,c] of Object.entries(p.chords)) {
      if (k.startsWith('_')) continue;
      const r = verifyChord(k, { ...c, qa_status:QASTAT });
      pErr += r.errors.length; pWarn += r.warnings.length;
    }
    if (!pv.valid || pErr || pWarn) {
      failP++;
      console.error(`FAIL practice P${NN}: valid=${pv.valid} errs=${pErr} warns=${pWarn} ${pv.errors.slice(0,3).join('; ')}`);
      continue;
    }
    const pf = `guitar-practice-${NN}-${slug(t.lesson.title)}.json`;
    writeFileSync(PRAC_DIR + '\\' + pf, JSON.stringify(p, null, 2));
    pracPairs.push({ file:pf, practice_of:t.lesson.id, scope:[...cumulativeChords(g.id)], group:g.id });
    writtenP++;
  }
}

// manifest
writeFileSync(ROOT + '\\scale-100\\manifest.json', JSON.stringify({
  generated: new Date().toISOString(),
  groups: 20, teaching_lessons: writtenT, practice_lessons: writtenP,
  chord_intro_order: ['Em','easyC','G','D','A','Am','E','Dm'],
  practice_pairs: pracPairs,
}, null, 2));

console.log(`\n=== GENERATED ===`);
console.log(`teaching : ${writtenT}/100 written, ${failT} failed`);
console.log(`practice : ${writtenP}/100 written, ${failP} failed`);
console.log(failT===0 && failP===0 ? 'ALL 200 FILES VALID + CHORD-CLEAN' : 'SOME FILES FAILED — see above');
process.exit(failT===0 && failP===0 ? 0 : 1);
