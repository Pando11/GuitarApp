const { verifyChord } = require('C:\\Users\\The Yoda Trader\\Desktop\\GuitarApp\\06-prototypes\\step0\\schema\\chord-theory-check.js');
const shapes = {
  "Am(real)": {name:"A minor", frets:[null,0,2,2,2,0], fingers:[null,0,1,2,3,0]},
  "G7": {name:"G7", frets:[3,2,0,0,0,1], fingers:[3,2,0,0,0,1]},
  "C7": {name:"C7", frets:[null,3,2,3,1,0], fingers:[null,3,2,4,1,0]},
  "Am7": {name:"A minor 7", frets:[null,0,2,0,1,0], fingers:[null,0,2,0,1,0]},
  "Em7": {name:"E minor 7", frets:[0,2,0,0,0,0], fingers:[0,2,0,0,0,0]},
  "Dm7": {name:"D minor 7", frets:[null,null,0,2,1,1], fingers:[null,null,0,2,1,1]},
  "Cmaj7": {name:"C major 7", frets:[null,3,2,0,0,0], fingers:[null,3,2,0,0,0]},
};
for (const [k,c] of Object.entries(shapes)){
  const r = verifyChord(k,c);
  const clean = r.ok && r.warnings.length===0;
  console.log((clean?'CLEAN ':'FLAG  ')+k.padEnd(9)+' '+JSON.stringify(r.uniqueNotes)+(clean?'':'  >> '+r.errors.concat(r.warnings).join(' ; ')));
}
