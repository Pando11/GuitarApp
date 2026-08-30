const { verifyChord } = require('C:\\Users\\The Yoda Trader\\Desktop\\GuitarApp\\06-prototypes\\step0\\schema\\chord-theory-check.js');
const shapes = {
  "C":   {name:"C major", frets:[null,3,2,0,null,0], fingers:[null,3,2,0,null,0]},
  "Cstd":{name:"C major (standard)", frets:[null,3,2,0,1,0], fingers:[null,3,2,0,1,0]},
  "G":   {name:"G major", frets:[3,2,0,0,0,3], fingers:[2,1,0,0,0,3]},
  "G3":  {name:"G major (3-finger)", frets:[3,2,0,0,0,null], fingers:[2,1,0,0,0,null]},
  "D":   {name:"D major", frets:[null,null,0,2,3,2], fingers:[null,null,0,1,3,2]},
  "A":   {name:"A major", frets:[null,0,2,2,2,0], fingers:[null,0,1,2,3,0]},
  "Am":  {name:"A minor", frets:[null,0,2,2,1,0], fingers:[null,0,1,2,3,0]},
  "E":   {name:"E major", frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0]},
  "Em":  {name:"E minor", frets:[0,2,2,0,0,0], fingers:[0,2,3,0,0,0]},
  "Dm":  {name:"D minor", frets:[null,null,0,2,3,1], fingers:[null,null,0,2,3,1]},
  "E7":  {name:"E7", frets:[0,2,0,1,0,0], fingers:[0,2,0,1,0,0]},
  "A7":  {name:"A7", frets:[null,0,2,0,2,0], fingers:[null,0,2,0,3,0]},
  "D7":  {name:"D7", frets:[null,null,0,2,1,2], fingers:[null,null,0,2,1,3]},
  "G7":  {name:"G7", frets:[3,2,0,0,0,1], fingers:[2,1,0,0,0,1]},
  "C7":  {name:"C7", frets:[null,3,2,0,1,0], fingers:[null,3,2,0,1,0]},
  "Am7": {name:"A minor 7", frets:[null,0,2,0,1,0], fingers:[null,0,2,0,1,0]},
  "Em7": {name:"E minor 7", frets:[0,2,0,0,0,0], fingers:[0,2,0,0,0,0]},
  "Dm7": {name:"D minor 7", frets:[null,null,0,2,1,1], fingers:[null,null,0,2,1,1]},
  "Cmaj7":{name:"C major 7", frets:[null,3,2,0,0,0], fingers:[null,3,2,0,0,0]},
  "Gmaj7":{name:"G major 7", frets:[3,2,0,0,0,null], fingers:[2,1,0,0,0,null]},
  "Asus2":{name:"A sus 2", frets:[null,0,2,2,0,0], fingers:[null,0,1,2,0,0]},
  "Dsus2":{name:"D sus 2", frets:[null,null,0,2,3,0], fingers:[null,null,0,1,3,0]},
  "Esus4":{name:"E sus 4", frets:[0,2,2,2,0,0], fingers:[0,2,3,4,0,0]},
  "Dsus4":{name:"D sus 4", frets:[null,null,0,2,3,3], fingers:[null,null,0,1,2,3]},
  "Emadd9":{name:"E minor add 9", frets:[0,2,2,0,0,2], fingers:[0,2,3,0,0,4]},
  "Cadd9":{name:"C add 9", frets:[null,3,2,0,3,0], fingers:[null,2,1,0,3,0]}
};
let prob=[];
for (const [k,c] of Object.entries(shapes)){
  const r = verifyChord(k,c);
  const clean = r.ok && r.warnings.length===0;
  if(!clean) prob.push(k);
  console.log((clean?'CLEAN ':'FLAG  ')+k.padEnd(7)+' '+c.name.padEnd(18)+' '+JSON.stringify(r.uniqueNotes)+(clean?'':'  >> '+r.errors.concat(r.warnings).join(' ; ')));
}
console.log('\nPROBLEM SHAPES ('+prob.length+'): '+prob.join(', '));
