// independent-verify.mjs — re-validate the scale-100 output with the REAL gates,
// not the generator's self-check. Mirrors 06-prototypes/step0/run-chord-check.js
// and 06-prototypes/practice-engine/validate-practice-lessons.mjs logic but pointed
// at scale-100/. Proves: (1) chord gate 0 err/0 warn, (2) validateLesson, (3) §5.1.

import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT = 'C:\\Users\\The Yoda Trader\\Desktop\\GuitarApp';
const validateLessonMod = await import(pathToFileURL(ROOT + '\\07-app\\core\\schema\\validate.js').href);
const chkMod = await import(pathToFileURL(ROOT + '\\06-prototypes\\step0\\schema\\chord-theory-check.js').href);
const validateLesson = validateLessonMod.validateLesson;
const verifyChord = chkMod.verifyChord;

const TD = ROOT + '\\scale-100\\teaching';
const PD = ROOT + '\\scale-100\\practice';

const teachFiles = readdirSync(TD).filter(f => f.endsWith('.json'));
const pracFiles  = readdirSync(PD).filter(f => f.endsWith('.json'));

// ---- (1)+(2) chord + schema gate over teaching ----
let cErr=0,cWarn=0,tSchFail=0,tChordFail=0, tCount=0;
for (const f of teachFiles) {
  const L = JSON.parse(readFileSync(TD+'\\'+f,'utf8'));
  tCount++;
  const v = validateLesson(L); if(!v.valid){ tSchFail++; console.log('SCHEMA FAIL '+f+': '+v.errors.slice(0,4).join(' | ')); }
  for (const [k,c] of Object.entries(L.chords||{})) {
    if(k.startsWith('_')) continue;
    const r = verifyChord(k,c);
    cErr+=r.errors.length; cWarn+=r.warnings.length;
    if(!(r.ok && r.warnings.length===0)){ tChordFail++; console.log('CHORD FAIL '+f+' '+k+': '+r.errors.concat(r.warnings).join(' ; ')); }
  }
}

// ---- practice: schema + §5.1 correspondence ----
let pSchFail=0, pChordFail=0, pCorrFail=0, pCount=0;
let scopeMismatch=0, pairMismatch=0, orphanPractice=0;
for (const f of pracFiles) {
  const P = JSON.parse(readFileSync(PD+'\\'+f,'utf8'));
  pCount++;
  const v = validateLesson(P); if(!v.valid){ pSchFail++; console.log('PRAC SCHEMA FAIL '+f+': '+v.errors.slice(0,4).join(' | ')); }
  for (const [k,c] of Object.entries(P.chords||{})) {
    if(k.startsWith('_')) continue;
    const r = verifyChord(k,c);
    if(!(r.ok && r.warnings.length===0)){ pChordFail++; console.log('PRAC CHORD FAIL '+f+' '+k); }
  }
  // §5.1: chords_in_scope must equal cumulative chord set of its group
  const grpArr = P.lesson.practice_of; // array, e.g. ["L01-..."]
  const grpId = Array.isArray(grpArr) ? grpArr[0] : grpArr;
  const m = String(grpId).match(/^L(\d{1,3})-/) || String(grpId).match(/^L(\d{2})-/);
  if(!m){ orphanPractice++; console.log('ORPHAN PRACTICE '+f+' (no Lnn id '+grpId+')'); continue; }
  const n = parseInt(m[1],10);
  const groupId = Math.floor((n-1)/5)+1;
  // recompute cumulative from the SAME 20-group definition the generator used:
  // chord intro order by group id: 2 Em,3 easyC,6 G,7 D,8 A,9 Am,16 E,17 Dm
  const introByGroup = {2:'Em',3:'easyC',6:'G',7:'D',8:'A',9:'Am',16:'E',17:'Dm'};
  const cum=[];
  for(let gi=1; gi<=groupId; gi++){ const nc=introByGroup[gi]; if(nc && !cum.includes(nc)) cum.push(nc); }
  const scope = P.lesson.chords_in_scope||[];
  const same = [...scope].sort().join(',')===cum.slice().sort().join(',');
  if(!same){ scopeMismatch++; pCorrFail++; console.log('SCOPE FAIL '+f+': scope['+scope+'] != cum['+cum+']'); }
  // every chords_in_scope resolved in chords block
  for(const c of scope){ if(!P.chords[c]){ pCorrFail++; console.log('SCOPE CHORD MISSING '+f+' '+c); } }
  // 1-min pairs subset of scope
  for(const ex of P.exercises){
    if(ex.practice_type==='one-minute-changes'){
      const [a,b]=ex.params.chord_pair;
      if(!scope.includes(a)||!scope.includes(b)){ pairMismatch++; pCorrFail++; console.log('PAIR OUT OF SCOPE '+f+' '+a+'/'+b); }
    }
  }
}

console.log('\n================ INDEPENDENT VERIFICATION ================');
console.log(`TEACHING : ${tCount} files | schema fails=${tSchFail} | chord fails=${tChordFail} | chord errors=${cErr} warnings=${cWarn}`);
console.log(`PRACTICE : ${pCount} files | schema fails=${pSchFail} | chord fails=${pChordFail} | corr fails=${pCorrFail}`);
console.log(`CORR     : scopeMismatch=${scopeMismatch} pairMismatch=${pairMismatch} orphan=${orphanPractice}`);
const allOk = (tSchFail+tChordFail+pSchFail+pChordFail+pCorrFail)===0 && cErr===0 && cWarn===0;
console.log(allOk ? 'VERIFIED-OK — 0 errors, 0 warnings, §5.1 intact' : 'VERIFICATION FAILED');
process.exit(allOk?0:1);
