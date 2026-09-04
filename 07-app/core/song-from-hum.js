// song-from-hum.js — Phase-1 "hum a song -> instant lesson" matcher (SUNO-STYLE proposal, item #22).
//
// HARD CONSTRAINTS (AGENTS.md / AMENDMENT-05 / AMENDMENT-12 / AMENDMENT-14):
//  - CONSTRAINED MATCHING ONLY. This module never does open-ended audio transcription,
//    never invents a musical judgement, and never emits riffs / melodies / lyrics / TAB.
//  - The on-device pitch engine (see listening-engine.js, Ban 3) extracts chord ROOTS from
//    the student's hum, constrained to the chords they have already learned. THIS module only
//    maps that already-constrained root list onto the verified chord catalog.
//  - Matching to a cleared catalog song re-uses content that has ALREADY passed the
//    AMENDMENT-12/14 legal + accuracy review (progressions.json). No new protected surface.
//  - A student-authored "generic loop" uses ONLY the student's own hummed chords. We never
//    claim it is any specific song.
//  - counsel sign-off before PAID launch is still required (AMENDMENT-14 legal gate), exactly
//    as for Mystery Mode. This module proves mechanics, not legal safety.
//
// Every returned plan carries:
//  - containsProtectedContent: ALWAYS false (we never output riffs/lyrics/melody/TAB)
//  - legalDisclaimerRequired: ALWAYS true (nominative use; "not affiliated / not endorsed")

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Canonical chord identity. The on-disk data uses TWO alias conventions for the same
// musical chord: `easyC` (Lauren's 2-finger reduction) and `Ceasy` (same thing, suffix form).
// Both spell the SAME chord (proven by chord-theory-check), so we collapse them to the root
// so the matcher never sees two phantom chords (cf. chord-canon.js root-cause fix).
export function canon(root) {
  if (root == null) return root;
  let k = String(root).trim();
  const lower = k.toLowerCase();
  if (lower.startsWith('easy') && lower.length > 4) k = k.slice(4); // easyC / easyc -> C
  else if (lower.endsWith('easy') && lower.length > 4) k = k.slice(0, -4); // Ceasy / Feasy -> C / F
  // Normalize case: "c" -> "C", "Am" stays "Am", "A7" stays "A7".
  return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
}

// Stable multiset key so ['Em','C','G','D'] == ['C','Em','G','D'].
function setKey(roots) {
  return JSON.stringify([...roots].map(canon).sort());
}

// Load the verified catalog from disk (real, gate-checked data).
export function loadCatalog(rootDir) {
  const base = rootDir ||
    join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'song-progressions');
  const prog = JSON.parse(readFileSync(join(base, 'progressions.json'), 'utf8'));
  const shapes = JSON.parse(readFileSync(join(base, 'shapes.json'), 'utf8'));
  const prereqs = JSON.parse(readFileSync(join(base, 'chord-prereqs.json'), 'utf8'));
  return { songs: prog.songs, shapes: shapes.chords, firstTaught: prereqs.first_taught };
}

// Chords the student has been taught up to (and including) `currentLesson`.
export function learnedChordSet(catalog, currentLesson) {
  const set = new Set();
  for (const [chord, lesson] of Object.entries(catalog.firstTaught)) {
    if (lesson <= currentLesson) set.add(canon(chord));
  }
  return set;
}

// Core matcher. `detectedRoots` are chord-root tokens the on-device engine extracted,
// already constrained to the student's learned set by the caller.
// Returns a lesson-plan object. NEVER emits riffs / lyrics / melody / TAB.
export function matchHumToLesson({ detectedRoots = [], learnedChords, catalog }) {
  if (!catalog || !learnedChords) {
    throw new Error('matchHumToLesson requires { detectedRoots, learnedChords, catalog }');
  }

  // 1) Constrained-input gate: reject anything outside the learned set.
  //    We will not guess a chord the student has not been taught.
  const outOfCatalog = [...new Set(detectedRoots.map(canon))]
    .filter((r) => !learnedChords.has(r));
  if (outOfCatalog.length > 0) {
    return {
      status: 'out-of-catalog',
      rejectedRoots: outOfCatalog,
      matchedSong: null,
      lessonChords: [],
      honestClaim:
        'Some of what you hummed uses chords you have not learned yet. We only match to chords you already know — we will not guess.',
      containsProtectedContent: false,
      legalDisclaimerRequired: true,
      note: 'Constrained matching only (AMENDMENT-05/12): no free transcription, no riffs/lyrics.',
    };
  }

  // 2) Exact multiset match to an already-cleared catalog song.
  const humKey = setKey(detectedRoots);
  for (const song of catalog.songs) {
    if (setKey(song.chords) === humKey) {
      return {
        status: 'matched',
        matchedSong: { id: song.id, title: song.title, artist: song.artist },
        lessonChords: song.chords,
        honestClaim: song.honest_claim,
        containsProtectedContent: false,
        legalDisclaimerRequired: true,
        note:
          'Matched to an already-cleared catalog progression (AMENDMENT-12/14). ' +
          'Nominative use only; not affiliated / not endorsed.',
      };
    }
  }

  // 3) Generic loop: the student's own chords, no specific song claimed.
  return {
    status: 'generic-loop',
    matchedSong: null,
    lessonChords: [...new Set(detectedRoots.map(canon))],
    honestClaim:
      "This is YOUR loop — chords you hummed, built only from chords you've learned. " +
      'We are not claiming it is any specific song, and we are not teaching any riff, melody, or lyric.',
    containsProtectedContent: false,
    legalDisclaimerRequired: true,
    note: 'Student-authored practice loop. No catalog match; no protected content.',
  };
}
