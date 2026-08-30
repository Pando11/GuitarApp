// independent-verify-songs.mjs — re-verify the SONGS track with REAL gates.
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT='C:\\Users\\The Yoda Trader\\Desktop\\GuitarApp';
const {validateLesson}=await import(pathToFileURL(ROOT+'\\07-app\\core\\schema\\validate.js').href);
const {verifyChord}=await import(pathToFileURL(ROOT+'\\06-prototypes\\step0\\schema\\chord-theory-check.js').href);
const Q='verified-by-theory-check-2026-08-08';
const TD=ROOT+'\\scale-100\\songs\\teaching', PD=ROOT+'\\scale-100\\songs\\practice';
const read=d=>readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(d+'\\'+f,'utf8')));
const T=read(TD), P=read(PD);
let err=0;
// 1) every teaching file passes schema + chord gate
for(const t of T){
  const v=validateLesson(t); if(!v.valid){err++;console.log('SCHEMA',t.lesson.id,v.errors.slice(0,2));continue;}
  for(const[k,c]of Object.entries(t.chords)){if(k.startsWith('_'))continue;const r=verifyChord(k,{...c,qa_status:Q});if(!r.ok||r.warnings.length){err++;console.log('CHORD',t.lesson.id,k,r.errors.concat(r.warnings));}}
}
// 2) every practice: schema ok, 1:1 practice_of, chords_in_scope == its teaching chords
const Tmap=new Map(T.map(t=>[t.lesson.id,t]));
for(const p of P){
  const v=validateLesson(p); if(!v.valid){err++;console.log('PSCHEMA',p.lesson.id,v.errors.slice(0,2));continue;}
  if(!Array.isArray(p.lesson.practice_of)||p.lesson.practice_of.length!==1){err++;console.log('PAIR',p.lesson.id,'practice_of not single array');continue;}
  const tid=p.lesson.practice_of[0]; const tch=Tmap.get(tid);
  if(!tch){err++;console.log('ORPHAN',p.lesson.id,'->',tid);continue;}
  const scopeSet=new Set(p.lesson.chords_in_scope), teachSet=new Set(Object.keys(tch.chords).filter(k=>!k.startsWith('_')));
  for(const c of teachSet)if(!scopeSet.has(c)){err++;console.log('SCOPE',p.lesson.id,'missing',c);}
  if(p.lesson.chords_in_scope.length!==teachSet.size){err++;console.log('SCOPESZ',p.lesson.id);}
}
console.log(`SONGS verify: teaching=${T.length} practice=${P.length} errors=${err}`);
console.log(err===0?'INDEPENDENT GATE: PASS':'INDEPENDENT GATE: FAIL');
process.exit(err===0?0:1);
