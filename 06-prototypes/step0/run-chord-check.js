// Ship gate: chord correctness, verified by arithmetic. Exit 1 = do not ship.
// AGENTS.md Rule 8: `node run-chord-check.js` must report 0 errors AND 0 warnings.
//
// HISTORICAL DEFECT (fixed 2026-08-11): this gate previously scanned only
// `lessons/L01..L03.json` — 3 stale prototype files. The real shippable
// curriculum is the 23-lesson set in `07-app/content/lessons/` named by that
// folder's `manifest.json`. The old gate reported "safe to ship" while never
// exercising a single shipping lesson — false assurance. We now scan the
// canonical manifest set (the thing that actually ships).
'use strict';
const fs = require('fs'), path = require('path');
const { verifyLesson } = require('./schema/chord-theory-check.js');

const APP_LESSONS_DIR = path.join(__dirname, '..', '..', '07-app', 'content', 'lessons');
const MANIFEST = path.join(APP_LESSONS_DIR, 'manifest.json');

let files;
if (fs.existsSync(MANIFEST)) {
  try {
    files = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).files
      .filter(f => /^guitar-lesson.*\.json$/.test(f));
  } catch (e) {
    console.log('MANIFEST PARSE FAIL: ' + MANIFEST + ' — ' + e.message);
    process.exit(1);
  }
} else {
  // Fallback: every shipping lesson file in the app lessons dir.
  files = fs.readdirSync(APP_LESSONS_DIR).filter(f => /^guitar-lesson.*\.json$/.test(f));
}

let errs = 0, warns = 0, chords = 0, lessons = 0;
for (const f of files) {
  const fp = path.join(APP_LESSONS_DIR, f);
  if (!fs.existsSync(fp)) { console.log('  MISSING ' + f); warns++; continue; }
  const r = verifyLesson(JSON.parse(fs.readFileSync(fp, 'utf8')));
  lessons++;
  for (const c of r.results) {
    chords++; errs += c.errors.length; warns += c.warnings.length;
    console.log((c.ok && !c.warnings.length ? '  OK   ' : '  FLAG ') + f + '  ' + c.key.padEnd(7) +
      c.chordName + ' = ' + c.uniqueNotes.join(' '));
    c.errors.forEach(e => console.log('         ERROR: ' + e));
    c.warnings.forEach(w => console.log('         WARN:  ' + w));
  }
}
console.log('\n' + lessons + ' lessons | ' + chords + ' chords checked | ' + errs + ' errors | ' + warns + ' warnings');
console.log(errs === 0 && warns === 0 ? 'CHORDS-VERIFIED-OK — safe to ship' : (errs === 0 ? 'CHORDS-VERIFIED (warnings only) — safe to ship, review warnings' : 'CHORD CHECK FAILED — do not ship'));
process.exit(errs === 0 && warns === 0 ? 0 : 1);
