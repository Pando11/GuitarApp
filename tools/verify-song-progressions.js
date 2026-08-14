// Ship gate for the SONG-PROGRESSION track (AGENTS.md Rule 8 applied to song lessons).
// Proves, by arithmetic:
//   1. every chord shape in shapes.json actually spells the chord its name claims
//      (delegated to the canonical chord-theory-check.js — no second implementation),
//   2. every chord key referenced by a progression exists in shapes.json,
//   3. every progression's `loop` string only names chords declared in its `chords` list,
//   4. the legal redline holds: no progression file field smuggles in tab/riff content.
// Exit 1 = do not ship.
'use strict';
const fs = require('fs'), path = require('path');
const { verifyLesson } = require(path.join(__dirname, '..', '06-prototypes', 'step0', 'schema', 'chord-theory-check.js'));

const DIR = path.join(__dirname, '..', '07-app', 'content', 'song-progressions');
const shapesDoc = JSON.parse(fs.readFileSync(path.join(DIR, 'shapes.json'), 'utf8'));
const progDoc = JSON.parse(fs.readFileSync(path.join(DIR, 'progressions.json'), 'utf8'));
const prereqs = JSON.parse(fs.readFileSync(path.join(DIR, 'chord-prereqs.json'), 'utf8'));

// ---- TRUST-NOTHING PREREQ CHECK (added 2026-08-14 after hostile audit) ----
// The audit's second CRITICAL: this gate USED to read chord-prereqs.json and trust it,
// while its own comment claimed the values were "recomputed here, not trusted from the
// file". They were not. Setting every first_taught to 1 (and every unlock_after_lesson
// to 1) shipped GREEN — defeating Mystery Mode's entire fairness guarantee by editing a
// generated file. The gate also never opened manifest.json, so manifest<->prereqs drift
// was undetectable.
// Now we RE-DERIVE from the lesson manifest here, in-process, and fail if the committed
// chord-prereqs.json disagrees. The derivation logic lives in derive-chord-prereqs.js and
// is imported — one implementation, not two that can drift.
const { deriveFirstTaught } = require(path.join(__dirname, 'derive-chord-prereqs.js'));
const fresh = deriveFirstTaught(
  path.join(__dirname, '..', '07-app', 'content', 'lessons'),
  shapesDoc.chords
);

let errs = 0, warns = 0;
const fail = m => { console.log('  ERROR: ' + m); errs++; };
const warn = m => { console.log('  WARN:  ' + m); warns++; };

// The committed file is checked FOR AGREEMENT, then discarded in favour of `fresh`.
// Enforcement below uses `fresh` only, so a tampered/stale chord-prereqs.json cannot
// weaken the unlock rule — it can only make the gate go red.
console.log('--- prereq map re-derived from lesson manifest ---');
if (prereqs.total_lessons !== fresh.total_lessons) {
  fail('chord-prereqs.json says total_lessons=' + prereqs.total_lessons +
       ' but the manifest lists ' + fresh.total_lessons + ' — stale. Run: node tools/derive-chord-prereqs.js');
}
for (const [k, v] of Object.entries(fresh.first_taught)) {
  if (prereqs.first_taught[k] !== v) {
    fail('chord-prereqs.json claims "' + k + '" is first taught at lesson ' +
         JSON.stringify(prereqs.first_taught[k]) + ' but the manifest proves it is lesson ' + v +
         ' — file is stale or tampered. Run: node tools/derive-chord-prereqs.js');
  }
}
for (const k of Object.keys(prereqs.first_taught || {})) {
  if (!(k in fresh.first_taught)) {
    fail('chord-prereqs.json claims "' + k + '" is taught, but re-derivation from the manifest ' +
         'finds it is NOT taught anywhere — file is stale or tampered.');
  }
}
if (errs === 0) console.log('  OK   committed prereq map matches a fresh derivation (' +
  fresh.total_lessons + ' lessons)');

// ---- 1. chord shapes: arithmetic verification via the canonical checker ----
console.log('--- shape verification (arithmetic) ---');
const shapeRes = verifyLesson({ chords: shapesDoc.chords });
for (const c of shapeRes.results) {
  const bad = c.errors.length || c.warnings.length;
  console.log((bad ? '  FLAG ' : '  OK   ') + c.key.padEnd(7) + c.chordName + ' = ' + c.uniqueNotes.join(' '));
  c.errors.forEach(fail);
  c.warnings.forEach(warn);
}

// ---- 2/3. progression referential integrity ----
console.log('\n--- progression integrity ---');
const known = new Set(Object.keys(shapesDoc.chords));
// Chord tokens inside a loop string: strip bar counts like "A(4)" and separators.
const tokensOf = loop => loop.split(/\s*-\s*/).map(t => t.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
// A loop token is written in display form (e.g. "F", "C"); map display -> declared key.
const displayOf = key => key.replace(/easy$/, '');

// ---- LEGAL REDLINE DETECTOR (hardened 2026-08-14 after hostile audit) ----
// The previous version was a toy: /\b(tab|tablature|riff notation|e\|-|E\|-|\d+h\d+|\d+p\d+|--\d)/
// A hostile reviewer smuggled tab past it SEVEN different ways, all shipping green:
//   G|-3-5-7-  (only the e/E string label was covered)
//   e│-3-5-7-  (Unicode box-drawing pipe U+2502 instead of ASCII |)
//   "See TAB for the riff" / "Tablature below"  (regex was case-SENSITIVE)
//   "3 5 7 0 2 3"  (numeric-only tab, no pipe or hyphen run)
//   "the riff goes like"  (needed the literal two-word phrase "riff notation")
//   tab hidden in an unknown nested field (scan is whole-object, so this is covered
//   once the patterns themselves are right)
// This is a NECESSARY-BUT-NOT-SUFFICIENT mechanical screen. It cannot detect a lyric
// paraphrase or judge infringement — that stays a human review step (AMENDMENT-12 §6).
// Normalise first (fold Unicode pipes/dashes, lowercase) so homoglyphs can't evade.
const normaliseForRedline = t => String(t)
  .replace(/[\u2502\u2503\u2506\u2507\u250A\u250B\uFF5C\u01C0\u2223\u2758]/g, '|') // pipe homoglyphs
  .replace(/[\u2010-\u2015\u2212]/g, '-')                                          // dash homoglyphs
  .toLowerCase();

// Two tiers of pattern:
//  NOTATION_PATTERNS — actual tab/riff notation. Banned in EVERY field, no exceptions.
//  PROSE_PATTERNS    — words that mean we may be teaching protected material. These are
//    banned in instructional fields (teaches/loop/feel/mystery/coaching) but ALLOWED in
//    `honest_claim`, which exists precisely to say "the recorded riff stays off-limits".
//    Banning them everywhere would flag our own disclaimers — a false positive that
//    would pressure an author to DELETE the disclaimer to get green. That would be worse
//    than the hole it closes.
const NOTATION_PATTERNS = [
  { re: /\btabs?\b/,                       why: 'the word "tab"' },
  { re: /\btablature\b/,                   why: 'the word "tablature"' },
  { re: /[eadgb]\s*\|/,                    why: 'a string-label + pipe (tab staff)' },
  { re: /\|[-\s\d]{3,}/,                   why: 'a pipe followed by a fret run (tab staff)' },
  { re: /-{2,}\d/,                         why: 'a hyphen run into a fret number (tab)' },
  // Slide/hammer notation like 5h7, 7p5, 3b5, 5/7. Time signatures (4/4, 6/8, 3/4, 12/8,
  // 2/4, 9/8) are legitimate musical prose and MUST NOT trip this — an earlier version
  // flagged "slow driving 4/4" and "6/8 rolling arpeggios" as tab. Exclude them explicitly.
  { re: /\d+[hpb]\d+/,                     why: 'hammer-on/pull-off/bend notation' },
  { re: /\d+[\/\\]\d+/,                    why: 'slide notation', unless: /^(2|3|4|5|6|7|9|12)[\/\\](2|4|8|16)$/ },
  { re: /(?:\b\d{1,2}\b[\s-]+){4,}\b\d{1,2}\b/, why: 'a long bare run of fret numbers (numeric tab)' }
];
const PROSE_PATTERNS = [
  { re: /\blicks?\b/,                      why: 'the word "lick" outside honest_claim' },
  { re: /\blyrics?\b/,                     why: 'a lyric reference outside honest_claim' },
  { re: /\bmelody\b|\bmelodic line\b/,     why: 'a melody reference outside honest_claim' }
];
// `riff` and `solo` are allowed ONLY in honest_claim (disclaiming them). Anywhere else,
// including `teaches`, they signal drift toward teaching the protected material.
const DISCLAIM_ONLY = [
  { re: /\briff\b/, why: 'the word "riff" outside honest_claim' },
  { re: /\bsolo\b/, why: 'the word "solo" outside honest_claim' }
];
const HONEST_FIELD = /(^|\.)honest_claim$/;

function scanRedline(obj, pathStr, report) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    const n = normaliseForRedline(obj);
    const isDisclaimer = HONEST_FIELD.test(pathStr);
    const sets = isDisclaimer ? [NOTATION_PATTERNS] : [NOTATION_PATTERNS, PROSE_PATTERNS, DISCLAIM_ONLY];
    for (const set of sets) for (const p of set) {
      const m = p.re.exec(n);
      if (!m) continue;
      // `unless` whitelists a legitimate construct that shares the pattern's shape
      // (e.g. a 4/4 time signature vs a 5/7 slide).
      if (p.unless && p.unless.test(m[0])) continue;
      report(pathStr, p.why, obj);
    }
    return;
  }
  if (Array.isArray(obj)) { obj.forEach((v, i) => scanRedline(v, pathStr + '[' + i + ']', report)); return; }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) scanRedline(v, pathStr ? pathStr + '.' + k : k, report);
  }
}

const seenIds = new Set();
for (const s of progDoc.songs) {
  const label = s.id + ' ' + s.title;
  const declared = s.chords || [];
  for (const k of declared) if (!known.has(k)) fail(label + ': references unknown shape "' + k + '"');
  const declaredDisplay = new Set(declared.map(displayOf));
  const loopTokens = tokensOf(s.loop || '');
  if (!loopTokens.length) fail(label + ': empty loop');
  for (const t of loopTokens) {
    if (!declaredDisplay.has(t)) fail(label + ': loop names "' + t + '" which is not in its chords list [' + [...declaredDisplay].join(' ') + ']');
  }
  // every declared chord should actually be used in the loop (dead entries = drift)
  for (const d of declaredDisplay) if (!loopTokens.includes(d)) warn(label + ': declares "' + d + '" but the loop never uses it');
  // mystery mode completeness
  const m = s.mystery || {};
  if (!m.hint_1 || !m.hint_2 || !m.reveal) fail(label + ': incomplete mystery block (needs hint_1, hint_2, reveal)');
  // Reveal must name the song UNAMBIGUOUSLY. Word-boundary matching is not enough: a short
  // title like "Go" is indistinguishable from ordinary prose ("Let us go play it!"), which
  // the audit exploited to pass a reveal that never really names the song. So we require the
  // title to appear QUOTED — 'Stairway to Heaven' — which is the house style for every
  // reveal anyway, and is decidable rather than a guess.
  const quoted = t => ["'" + t + "'", '"' + t + '"', '\u2018' + t + '\u2019', '\u201c' + t + '\u201d'];
  if (m.reveal && s.title) {
    const rl = m.reveal.toLowerCase();
    if (!quoted(s.title.toLowerCase()).some(q => rl.includes(q))) {
      fail(label + ": reveal must name the song in quotes, e.g. \u2026 '" + s.title + "' \u2026 " +
           '(bare mentions are ambiguous for short titles)');
    }
  }
  // Hint must not leak the title — word-boundary matched, so a short common-word title
  // (audit: a title of "A") doesn't false-positive on ordinary prose.
  const titleRe = s.title ? new RegExp('(^|[^a-z0-9])' +
    s.title.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])', 'i') : null;
  for (const h of [m.hint_1, m.hint_2]) {
    if (h && titleRe && titleRe.test(h.toLowerCase())) fail(label + ': a hint leaks the title before the reveal');
  }
  // Duplicate ids collide in the UI (preview uses data-id) — audit NIT 8.
  if (seenIds.has(s.id)) fail(label + ': duplicate song id "' + s.id + '"');
  seenIds.add(s.id);
  if (!s.honest_claim) fail(label + ': missing honest_claim (what we do and do not teach)');
  if (typeof s.bpm !== 'number' || s.bpm < 40 || s.bpm > 220) fail(label + ': bpm out of sane range');
  // ---- Mystery-Mode unlock rule (owner directive 2026-08-14) ----
  // Mystery Mode is an OPT-IN ADVANCED lane for students already in the program, and it is
  // built over the same verified data. The one non-negotiable fairness guarantee: a song may
  // only be offered once EVERY chord it uses has actually been taught in the curriculum.
  // We enforce this arithmetically against the DERIVED prereq map (derive-chord-prereqs.js),
  // which reads the lesson manifest — so the gate fails closed if anyone adds a song that
  // needs a chord the curriculum never covers, and `unlock_after_lesson` cannot silently
  // disagree with the real last-taught lesson (recomputed here, not trusted from the file).
  const taughtAt = declared.map(k => fresh.first_taught[k]);
  const untaught = declared.filter((k, i) => taughtAt[i] === undefined);
  if (untaught.length) {
    fail(label + ': uses chord(s) never taught in the curriculum [' + untaught.join(', ') +
         '] — a mystery song must not require an untaught chord. Add a lesson or re-voice it.');
  } else {
    const need = Math.max(...taughtAt);
    if (s.unlock_after_lesson !== need) {
      const lastChord = declared[taughtAt.indexOf(need)];
      fail(label + ': unlock_after_lesson is ' + s.unlock_after_lesson + ' but the latest chord ' +
           'it teaches (' + lastChord + ') is first taught at lesson ' + need + '. Set unlock_after_lesson=' + need + '.');
    }
  }
  // ---- 4. legal redline (field-aware deep scan; see REDLINE detector above) ----
  scanRedline(s, '', (fieldPath, why, sample) => {
    fail(label + ': legal redline — ' + why + ' in field "' + fieldPath + '": ' +
         JSON.stringify(String(sample).slice(0, 80)));
  });
  console.log('  OK   ' + label.padEnd(38) + s.loop);
}

const pd = progDoc.songs.filter(s => s.public_domain).length;
console.log('\n' + shapeRes.results.length + ' shapes | ' + progDoc.songs.length + ' progressions | ' +
            pd + ' public-domain | ' + errs + ' errors | ' + warns + ' warnings');
console.log(errs === 0 && warns === 0
  ? 'SONG-PROGRESSIONS-VERIFIED-OK — safe to ship'
  : (errs === 0 ? 'SONG-PROGRESSIONS-VERIFIED (warnings only)' : 'SONG-PROGRESSION CHECK FAILED — do not ship'));
process.exit(errs === 0 && warns === 0 ? 0 : 1);
