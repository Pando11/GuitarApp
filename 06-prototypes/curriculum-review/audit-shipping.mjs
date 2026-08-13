import fs from 'node:fs';
import path from 'node:path';

const APP = '07-app/content/lessons';
const PRAC = '05-content/practice';
const reApp = /guitar-lesson-(\d+)-.*\.json$/;
const rePrac = /guitar-practice-(\d+)-.*\.json$/;

// ---- §5.2 menu present in every practice lesson? ----
const pfiles = fs.readdirSync(PRAC).filter((f) => /^guitar-practice.*\.json$/.test(f));
console.log('--- §5.2 practice_menu.drills (want >=3) ---');
let menuFail = [];
for (const f of pfiles) {
  const d = JSON.parse(fs.readFileSync(path.join(PRAC, f), 'utf8'));
  const n = +f.match(rePrac)[1];
  const menu = (d.practice_menu && d.practice_menu.drills) || [];
  const ex = (d.exercises || []).length;
  const ok = menu.length >= 3;
  if (!ok) menuFail.push(n);
  console.log(`L${String(n).padStart(2,'0')}: menu=${menu.length} exercises=${ex} -> ${ok ? 'OK' : 'LOW'}`);
}
console.log('Practice lessons with <3 menu drills:', JSON.stringify(menuFail));

// ---- Nature of the 3 extra shipping lessons (L21-23) ----
console.log('\n--- Extra shipping lessons L21-23 (outside locked spine) ---');
for (const n of [21, 22, 23]) {
  const f = fs.readdirSync(APP).find((x) => reApp.test(x) && +x.match(reApp)[1] === n);
  const d = JSON.parse(fs.readFileSync(path.join(APP, f), 'utf8'));
  const lt = d.lesson?.lesson_type || d.lesson?.type || '?';
  const keys = Object.keys(d.chords || {}).filter((k) => k !== '_schema');
  const hasSong = (d.exercises || []).some((e) => /song/i.test(e.name || e.id || ''));
  console.log(`L${n}: title="${d.lesson?.title}" type=${lt} chords=[${keys.join(',')}] songEmbedded=${hasSong}`);
}

// ---- Song-embedding in the SHIPPING set (all 23) ----
console.log('\n--- Songs embedded in shipping technique lessons (all 23) ---');
const songEmbed = [];
for (const f of fs.readdirSync(APP).filter((x) => /^guitar-lesson.*\.json$/.test(x))) {
  const d = JSON.parse(fs.readFileSync(path.join(APP, f), 'utf8'));
  const ex = (d.exercises || []).filter((e) => /song/i.test(e.name || e.id || ''));
  if (ex.length) songEmbed.push({ n: +f.match(reApp)[1], songs: ex.map((e) => e.name || e.id) });
}
console.log(JSON.stringify(songEmbed, null, 0));
console.log('SONGS category dir exists:', fs.existsSync('05-content/songs') || fs.existsSync('07-app/content/songs'));
