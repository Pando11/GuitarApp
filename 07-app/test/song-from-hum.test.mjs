// song-from-hum.test.mjs — verify the constrained "hum -> lesson" matcher.
// Run: node 07-app/test/song-from-hum.test.mjs
import {
  loadCatalog,
  learnedChordSet,
  matchHumToLesson,
  canon,
} from '../core/song-from-hum.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.error(`  ❌ ${name}`);
  }
}

// Real, gate-verified catalog from disk (grounded, not mocked).
const catalog = loadCatalog();

console.log('catalog:', catalog.songs.length, 'songs;', Object.keys(catalog.shapes).length, 'shapes');
check('catalog loaded with >=10 songs', catalog.songs.length >= 10);

// A student who has completed lesson 12 has learned: Em,C,Ceasy,G,D,A,Am (per chord-prereqs).
const learned = learnedChordSet(catalog, 12);
check('Em learned by L12', learned.has('Em'));
check('C learned by L12', learned.has('C'));
check('F NOT learned by L12', !learned.has('F'));

// --- Case 1: exact match to a cleared catalog song (Zombie: Em-Ceasy-G-D) ---
const m1 = matchHumToLesson({
  detectedRoots: ['Em', 'Ceasy', 'G', 'D'],
  learnedChords: learned,
  catalog,
});
check('case1 status=matched', m1.status === 'matched');
check('case1 matched SP01 (Zombie)', m1.matchedSong && m1.matchedSong.id === 'SP01');
check('case1 no protected content', m1.containsProtectedContent === false);
check('case1 disclaimer required', m1.legalDisclaimerRequired === true);
check('case1 returns honestClaim', typeof m1.honestClaim === 'string' && m1.honestClaim.length > 0);

// --- Case 2: out-of-catalog chord is rejected, never guessed ---
const m2 = matchHumToLesson({
  detectedRoots: ['Em', 'C', 'G', 'F'], // F not learned by L12
  learnedChords: learned,
  catalog,
});
check('case2 status=out-of-catalog', m2.status === 'out-of-catalog');
check('case2 rejected F', m2.rejectedRoots.includes('F'));
check('case2 no lesson chords emitted', m2.lessonChords.length === 0);
check('case2 no protected content', m2.containsProtectedContent === false);

// --- Case 3: student-authored loop (no catalog match) ---
const m3 = matchHumToLesson({
  detectedRoots: ['Am', 'G', 'C'], // not an exact catalog multiset
  learnedChords: learnedChordsForAm(catalog),
  catalog,
});
check('case3 status=generic-loop', m3.status === 'generic-loop');
check('case3 honestClaim says YOUR loop', /your loop/i.test(m3.honestClaim));
check('case3 no protected content', m3.containsProtectedContent === false);
check('case3 disclaimer required', m3.legalDisclaimerRequired === true);
check('case3 lessonChords subset of learned', m3.lessonChords.every((c) => learnedChordsForAm(catalog).has(c)));

// --- Invariant sweep: protected content is NEVER produced, disclaimer ALWAYS required ---
for (const m of [m1, m2, m3]) {
  check(`invariant: ${m.status} containsProtectedContent=false`, m.containsProtectedContent === false);
  check(`invariant: ${m.status} legalDisclaimerRequired=true`, m.legalDisclaimerRequired === true);
}

// canon sanity (mirrors chord-canon.js)
check("canon('easyC')==='C'", canon('easyC') === 'C');
check("canon('Ceasy')==='C'", canon('Ceasy') === 'C');

function learnedChordsForAm(cat) {
  // student at L12 already has Am; reuse learned set at L12 for this test.
  return learnedChordSet(cat, 12);
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
