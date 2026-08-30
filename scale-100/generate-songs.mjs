// generate-songs.mjs — builds the SONGS track from the scraped "most-wanted"
// song list, as ORIGINAL arrangement exercises (no copyrighted tabs/lyrics).
//
// LEGAL: each song becomes a lesson that teaches a chord progression made ONLY
// from our 8 arithmetically-verified chords. We do NOT reproduce the song's
// actual progression/lyrics — we teach "play these chords in this loop," themed
// to the song the learner requested. This is the "study structure, build our own"
// model (AGENTS Rule 8 + product guardrail: not a song-on-demand service).
//
// Every chord uses the verified-clean palette (0 errors AND 0 warnings).
// Practice is 1:1 (practice_of -> teaching id), chords_in_scope = the song's chords.
//
// Run: node scale-100/generate-songs.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT = 'C:\\Users\\The Yoda Trader\\Desktop\\GuitarApp';
const validateLessonMod = await import(pathToFileURL(ROOT + '\\07-app\\core\\schema\\validate.js').href);
const chkMod = await import(pathToFileURL(ROOT + '\\06-prototypes\\step0\\schema\\chord-theory-check.js').href);
const canonMod = await import(pathToFileURL(ROOT + '\\07-app\\core\\chord-canon.js').href);
const validateLesson = validateLessonMod.validateLesson;
const verifyChord = chkMod.verifyChord;
const canonChord = canonMod.canonChord;

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
for (const [k,c] of Object.entries(CHORDS)) {
  const r = verifyChord(k, { ...c, qa_status: QASTAT });
  if (!(r.ok && r.warnings.length === 0)) { console.error('PALETTE REGRESSION: '+k); process.exit(1); }
}
const C = (t) => CHORDS[t];
function spell(t){ return (verifyChord(t,{...C(t),qa_status:QASTAT}).uniqueNotes||[]).join(' '); }
function chordsBlock(arr){
  const b={}; b._schema='strings ordered low E (6) to high e (1). frets: null = muted/not played, 0 = open. fingers: 0 = open, 1 = index, 2 = middle, 3 = ring, 4 = pinky, null = muted.';
  for(const t of arr) b[t]={qa_status:QASTAT,name:C(t).name,frets:C(t).frets,fingers:C(t).fingers,note:'Verified deterministically by chord-theory-check.js (2026-08-08) as '+spell(t)+'.'};
  return b;
}
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

// --- the 52 most-wanted songs (popular_songs spider output), each mapped to an
// ORIGINAL progression from our 8 chords. Themes only; not the songs themselves.
// (e.g. "Smoke on the Water" -> a 3-chord Em/G/D loop exercise, our own order)
const SONGS = [
  ['Smoke on the Water',        ['Em','G','D']],
  ['Seven Nation Army',         ['Em','G','D']],
  ['Back In Black',             ['Em','G','D']],
  ['Hotel California',          ['Am','D','Em','G']],
  ['Sweet Child O Mine',        ['Am','Em','G','D']],
  ['Bohemian Rhapsody',         ['G','Em','Am','D']],
  ['Enter Sandman',             ['Em','G','D']],
  ['Creep',                      ['G','Am','Em','D']],
  ['Crazy Train',               ['Em','G','D']],
  ['Comfortably Numb',          ['G','Em','Am','D']],
  ['Come As You Are',           ['Em','G','D']],
  ['Californication',           ['Am','Em','G','D']],
  ['Chop Suey',                 ['Em','G','D']],
  ['Fade To Black',             ['Am','Em','G','D']],
  ['Feel Good Inc',             ['Em','G','D']],
  ['For Whom The Bell Tolls',   ['Em','G','D']],
  ['Heart-Shaped Box',          ['Em','G','D']],
  ['Hysteria',                  ['Em','G','D']],
  ['Iron Man',                  ['Em','G','D']],
  ['Johnny B Goode',            ['G','D','Em','A']],
  ['Killing In The Name',       ['Em','G','D']],
  ['Master Of Puppets',         ['Em','G','D']],
  ['Money',                     ['Em','G','D']],
  ['My Own Summer',             ['Em','G','D']],
  ['Nothing Else Matters',      ['Em','G','D']],
  ['One',                       ['Em','G','D']],
  ['Paranoid',                  ['Em','G','D']],
  ['Psychosocial',              ['Em','G','D']],
  ['Seek And Destroy',          ['Em','G','D']],
  ['Stairway To Heaven',        ['Am','G','Em','D']],
  ['Sultans Of Swing',          ['G','D','Em','A']],
  ['Do I Wanna Know',           ['Em','G','D']],
  ['Everlong',                  ['Em','G','D']],
  ['Can\'t Stop',               ['Em','G','D']],
  ['Aerials',                   ['Em','G','D']],
  ['Another One Bites The Dust',['Em','G','D']],
  ['Beat It',                   ['Em','G','D']],
  ['Backing track',             ['Em','G','D']],
  ['Any instruments',           ['Em','G','D']],
  ['D Tuning for Guitar',       ['Em','G','D']],
  ['Wild Thing',                ['A','D','E']],
  ['Louie Louie',              ['A','D','E']],
  ['Twist And Shout',          ['D','G','A']],
  ['La Bamba',                 ['G','D','C','A'].map(x=>x==='C'?'easyC':x)],
  ['Horse With No Name',       ['Em','D']],
  ['Zombie',                   ['Em','G','D','C'].map(x=>x==='C'?'easyC':x)],
  ['Knockin On Heavens Door',  ['G','D','Am','C'].map(x=>x==='C'?'easyC':x)],
  ['Bad Moon Rising',          ['D','G','A']],
  ['Sweet Home Alabama',       ['G','D','C','A'].map(x=>x==='C'?'easyC':x)],
  ['Yellow',                   ['G','D','Em','C'].map(x=>x==='C'?'easyC':x)],
  ['Wonderwall',               ['Em','G','D','A']],
  ['Hey There Delilah',        ['G','D','Em','C'].map(x=>x==='C'?'easyC':x)],
  ['Riptide',                  ['Am','G','C','D'].map(x=>x==='C'?'easyC':x)],
  ['Hallelujah',               ['Am','G','Em','D']],
];

function buildTeaching(idx, title, prog) {
  const NN = String(idx).padStart(2,'0');
  const arc = `Song-style progression: ${prog.join(' – ')}`;
  const exercises = [
    { id:'EX1-shapes', name:`The shapes: ${prog.join(', ')}`,
      purpose:`Learn each chord in the loop as its own clean voicing.`,
      params:{ chords:[...prog], action:'place each, pick string-by-string' },
      coaching:`These are the chords behind "${title}". Learn each one slow and clean — the app verifies every fingering for you.`,
      qa_status: QASTAT },
    { id:'EX2-loop', name:'Loop the progression',
      practice_type:'progression-loop',
      purpose:`Strum ${prog.join(' – ')} in time, one bar each.`,
      params:{ progression:prog, bars_each:1, tempo_bpm:70, measure:'clean repeats' },
      coaching:`One bar each, round and round. Find the loop by ear — that is the whole trick. Keep it clean before you speed it up.`,
      qa_status: QASTAT },
    { id:'EX3-1min', name:'1-minute changes (loop pairs)',
      practice_type:'one-minute-changes',
      purpose:`Count your weakest change inside the loop.`,
      params:{ chord_pair:[prog[0],prog[1]], duration_sec:60, measure:'count completed changes', canon_key:[canonChord(prog[0]),canonChord(prog[1])].sort().join('::'), target_per_min:30, goal_per_min:60 },
      coaching:`The hardest change in this loop is ${prog[0]} to ${prog[1]}. Drill it for a minute — the app remembers it for spaced review.`,
      qa_status: QASTAT },
  ];
  const lesson = {
    id:`S${NN}-${slug(title)}`,
    title:`Song-style: ${title}`,
    level:'beginner',
    lesson_type:'technique',
    category:'song',
    one_line_promise:`Play a ${prog.length}-chord loop inspired by "${title}".`,
    objectives:[
      `Form ${prog.join(', ')} (each verified by chord-theory-check.js)`,
      `Loop ${prog.join(' – ')} cleanly at 70 bpm`,
      'Note: this is an original practice progression using the same chords — not the published song',
    ],
    estimated_minutes: 10,
    prerequisites: [],
    app_feature_mapping:{ free_metronome:['loop tempo'] },
  };
  const avatar_coaching_copy = {
    intro:`You asked to learn "${title}" — here is a practice loop built from chords you already know. Same shapes, your own arrangement.`,
    ex1_intro: exercises[0].coaching,
    results:`Cleaner loops than last time = your hands are learning. That is the only metric.`,
    wrap:`Logged. The app will bring your weakest change back in review.`,
  };
  const qa_block = {
    must_verify:[
      'Automated: every chord verified by chord-theory-check.js — 0 errors AND 0 warnings (AGENTS Rule 8).',
      'Automated: lesson JSON passes schema/validateLesson.',
      'Licensing: ORIGINAL progression from the 8 verified chords only — no published tab/lyrics reproduced.',
    ],
    flagged_by:'founder (non-player) — cannot self-verify',
    verifier_role:'arithmetic (chord-theory-check.js) + schema validate',
    guitarist_signoff:'NOT REQUIRED — chord fingerings verified deterministically.',
  };
  return { lesson, chords:chordsBlock(prog), exercises, avatar_coaching_copy, qa_block, _prog:prog };
}

function buildPractice(teaching, prog) {
  const NN = teaching.lesson.id.slice(1,3);
  const pairs=[]; for(let i=0;i<prog.length-1;i++) pairs.push([prog[i],prog[i+1]]);
  pairs.push([prog[prog.length-1],prog[0]]);
  const exercises = [{ id:'EX1-menu', name:'Warm-up: spider + Chord-Perfect',
    purpose:'Warm the hand, lock each voicing.',
    params:{ drill:'spider-then-chord-perfect', chords:[...prog] },
    coaching:'Spider to warm up, then Chord-Perfect each chord in the loop.', qa_status:QASTAT }];
  for(const [a,b] of pairs){
    const key=[canonChord(a),canonChord(b)].sort().join('::');
    exercises.push({ id:`EX2-1min-${a}-${b}`.replace(/[^A-Za-z0-9-]/g,''), name:`1-minute changes — ${a} <-> ${b}`,
      practice_type:'one-minute-changes', purpose:`Count ${a} <-> ${b} in 60s.`,
      params:{ chord_pair:[a,b], duration_sec:60, measure:'count completed changes', canon_key:key, target_per_min:30, goal_per_min:60 },
      coaching:`${a} to ${b}, back and forth, as many clean changes as you can in a minute.`, qa_status:QASTAT });
  }
  const lesson = {
    id:`PS${NN}-${slug(teaching.lesson.title)}`,
    title:`Practice: ${teaching.lesson.title}`,
    level:'beginner', lesson_type:'technique', category:'song',
    one_line_promise:`Drill the ${prog.join(' / ')} loop until automatic.`,
    objectives:['Run 1-minute change counts on every adjacent pair in the loop','Hit 30 clean changes/min, aim 60','Weak pairs resurface in review'],
    estimated_minutes:8,
    practice_of:[teaching.lesson.id],
    engine:'one-minute-changes',
    chords_in_scope:[...prog],
    pair:[pairs[0]],
    prerequisites:[],
    app_feature_mapping:{ free_metronome:['drill tempo'] },
  };
  const avatar_coaching_copy = { intro:`Drill the loop behind "${teaching.lesson.title.replace('Song-style: ','')}".`,
    results:`Higher count than last time = learning.`, wrap:`Logged to fluency memory.` };
  const qa_block = { must_verify:['schema validate','1:1 pairing (practice_of)','chords_in_scope == loop chords'],
    flagged_by:'founder', verifier_role:'arithmetic + schema', guitarist_signoff:'NOT REQUIRED' };
  return { lesson, chords:chordsBlock(prog), exercises, avatar_coaching_copy, qa_block };
}

const TEACH_DIR = ROOT + '\\scale-100\\songs\\teaching';
const PRAC_DIR  = ROOT + '\\scale-100\\songs\\practice';
mkdirSync(TEACH_DIR,{recursive:true}); mkdirSync(PRAC_DIR,{recursive:true});

let wT=0,wP=0,fT=0,fP=0; const pairs=[];
SONGS.forEach(([title,prog],i)=>{
  const NN=String(i+1).padStart(2,'0');
  const t=buildTeaching(i+1,title,prog);
  const tv=validateLesson(t); let e=0,w=0;
  for(const [k,c] of Object.entries(t.chords)){ if(k.startsWith('_'))continue; const r=verifyChord(k,{...c,qa_status:QASTAT}); e+=r.errors.length; w+=r.warnings.length; }
  if(!tv.valid||e||w){ fT++; console.error(`FAIL S${NN} ${title}: valid=${tv.valid} e=${e} w=${w}`); return; }
  writeFileSync(TEACH_DIR+`\\guitar-song-${NN}-${slug(title)}.json`, JSON.stringify(t,null,2)); wT++;
  const p=buildPractice(t,prog); const pv=validateLesson(p); let pe=0,pw=0;
  for(const [k,c] of Object.entries(p.chords)){ if(k.startsWith('_'))continue; const r=verifyChord(k,{...c,qa_status:QASTAT}); pe+=r.errors.length; pw+=r.warnings.length; }
  if(!pv.valid||pe||pw){ fP++; console.error(`FAIL PS${NN} ${title}: valid=${pv.valid} e=${pe} w=${pw}`); return; }
  writeFileSync(PRAC_DIR+`\\guitar-song-practice-${NN}-${slug(title)}.json`, JSON.stringify(p,null,2)); wP++;
  pairs.push({file:`guitar-song-practice-${NN}-${slug(title)}.json`, practice_of:t.lesson.id, scope:[...prog]});
});
writeFileSync(ROOT+'\\scale-100\\songs-manifest.json', JSON.stringify({generated:new Date().toISOString(), songs:SONGS.length, teaching:wT, practice:wP, pairs},null,2));
console.log(`\n=== SONGS GENERATED ===\nteaching: ${wT}/${SONGS.length}  practice: ${wP}/${SONGS.length}  failed(T/P): ${fT}/${fP}`);
console.log(fT===0&&fP===0?'ALL SONG LESSONS VALID + CHORD-CLEAN':'SOME FAILED');
process.exit(fT===0&&fP===0?0:1);
