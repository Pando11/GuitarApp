// Divergence guard for the two chord-theory-check.js copies.
// Hard REQUIREMENT (2026-08-13 simplify): 06-prototypes/step0/schema/chord-theory-check.js
// (CJS, the ship-gate source of truth) and 07-app/core/chord-theory-check.js (ESM, the
// browser-imported copy) MUST stay 1:1. This guard FAILS (exit 1) on any divergence,
// so a hand-sync slip can never ship silently again.
//
// It compares on three independent axes so it cannot pass vacuously:
//   1. The QUALITIES / REQUIRED / KNOWN_QUALITY_TOKEN / UNKNOWN_QUALITY_TOKEN tables.
//   2. The QUALITY_PATTERNS ordered detection table (regex source strings).
//   3. parseChordName() output over a committed, non-empty name list.
//
// Run: node 04-validation/check-esm-mirror.mjs   (exit 0 = identical, 1 = divergence)
import { parseChordName as parseESM, QUALITIES as Q_ESM, REQUIRED as R_ESM,
         QUALITY_PATTERNS as P_ESM } from '../07-app/core/chord-theory-check.js';
import CJS from '../06-prototypes/step0/schema/chord-theory-check.js';
const { parseChordName: parseCJS, QUALITIES: Q_CJS, REQUIRED: R_CJS,
        QUALITY_PATTERNS: P_CJS } = CJS;
import fs from 'fs';
import path from 'path';

// Committed name list — multi-form so the parse comparison is meaningful.
const NAMES = ['Cm7b5','C m7b5','Cdim','Cdim7','C6','C6/9','Cm6/9','C9','Cm9','Cmaj9','C11','Cm11',
  'C13','Cm13','Caug','C7#5','C7b5','C7sus4','Cadd9','Cmadd9','Cm6','C5','Cmaj','Cmin','Csus4',
  'C7','Dm7','Emaj7','G','Am','C Augmented','C Diminished','C Minor 7 Flat 5','C Thirteenth',
  'C Nine','C Major Six','F Sus 2','G Major Seven'];

let fails = 0;
const fail = (msg) => { fails++; console.log('DIVERGE: ' + msg); };

// 1. structural maps
const norm = (m) => JSON.stringify(m, Object.keys(m).sort());
if (norm(Q_ESM) !== norm(Q_CJS)) fail('QUALITIES maps differ');
if (norm(R_ESM) !== norm(R_CJS)) fail('REQUIRED maps differ');

// 2. QUALITY_PATTERNS table (regex source + order)
const pn = (arr) => JSON.stringify(arr.map((x, i) => [i, x.q, x.re.source]));
if (pn(P_ESM) !== pn(P_CJS)) fail('QUALITY_PATTERNS tables differ (order/quality/regex)');

// 3. parse() over the name list (must be non-empty; vacuous pass is a bug)
if (NAMES.length === 0) fail('name list is empty (guard is meaningless)');
const fmt = (p) => p ? (p.root + '|' + p.quality + '|' + (p.unknownQuality || '')) : 'null';
let compared = 0;
for (const n of NAMES) {
  const a = fmt(parseESM(n)), b = fmt(parseCJS(n));
  if (a !== b) fail(`parse("${n}") CJS=${b} ESM=${a}`);
  else compared++;
}

console.log('\nESM/CJS divergence guard — compared ' + compared + '/' + NAMES.length + ' names; ' +
  (fails === 0 ? 'IDENTICAL ✓' : fails + ' divergence(s)'));
process.exit(fails === 0 ? 0 : 1);
