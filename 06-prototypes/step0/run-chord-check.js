// Ship gate: chord correctness, verified by arithmetic. Exit 1 = do not ship.
'use strict';
const fs = require('fs'), path = require('path');
const { verifyLesson } = require('./schema/chord-theory-check.js');
const dir = path.join(__dirname, 'lessons');
let errs = 0, warns = 0, chords = 0;
for (const f of fs.readdirSync(dir).filter(f => /^L\d+\.json$/.test(f))) {
  const r = verifyLesson(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  for (const c of r.results) {
    chords++; errs += c.errors.length; warns += c.warnings.length;
    console.log((c.ok && !c.warnings.length ? '  OK   ' : '  FLAG ') + f + '  ' + c.key.padEnd(7) +
      c.chordName + ' = ' + c.uniqueNotes.join(' '));
    c.errors.forEach(e => console.log('         ERROR: ' + e));
    c.warnings.forEach(w => console.log('         WARN:  ' + w));
  }
}
console.log('\n' + chords + ' chords checked | ' + errs + ' errors | ' + warns + ' warnings');
console.log(errs === 0 && warns === 0 ? 'CHORDS-VERIFIED-OK — safe to ship' : 'CHORD CHECK FAILED — do not ship');
process.exit(errs === 0 && warns === 0 ? 0 : 1);
