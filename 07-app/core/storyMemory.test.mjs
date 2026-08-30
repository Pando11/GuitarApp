// storyMemory.test.mjs — ADR-0005 Layer 2 STORY MEMORY self-test.
//
// Run: node 07-app/core/storyMemory.test.mjs
//
// Asserts the derived memory is Rule-5-safe and comes from playing data only:
//   (a) comeback===true when lastActiveDays>7, false otherwise,
//   (b) nemesis equals the expected most-struggled chord,
//   (c) every milestone string contains a digit (proves it cites a number),
//   (d) no banned praise words ('great','natural','talented','gifted','prodigy')
//       appear in any output string.
// FAKE store only — no real student data, no network.

import { getStoryMemory, COMEBACK_THRESHOLD_DAYS } from './storyMemory.js';

const BANNED = ['great', 'natural', 'talented', 'gifted', 'prodigy'];

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

// Build a fake store exposing the same PracticeStore surface storyMemory reads.
function makeFakeStore({ daysAgo, skillMap, cleanChords, struggledChords, learningChords, helpRequests, longestStreak, practiceMinutes, lessonsCompleted }) {
  const now = Date.now();
  return {
    sessions: [{ id: 's1', lessonId: 'L01', ts: now - daysAgo * DAY_MS, durationSec: practiceMinutes * 60, completed: true, attempts: [] }],
    getSkillMap: () => skillMap,
    getCleanChords: () => cleanChords,
    getStruggledChords: () => struggledChords,
    getLearningChords: () => learningChords,
    getPendingHelpRequests: () => helpRequests.map((r) => ({ ...r })),
    longestStreak: () => longestStreak,
    practiceMinutesTotal: () => practiceMinutes,
    completedLessonCount: () => lessonsCompleted,
    currentStreak: () => 0,
  };
}
const DAY_MS = 86400000;

// Nemesis case: F has the worst clean/fail ratio (1 clean / 9 fail).
const NEMESIS_MAP = {
  Em: { clean: 2, fail: 1, unsure: 0, state: 'clean' },
  F: { clean: 1, fail: 9, unsure: 0, state: 'struggling' },
  Bm: { clean: 5, fail: 0, unsure: 0, state: 'clean' },
};

// Store with a comeback (8 days idle) — also carries the nemesis + milestones.
const storeComeback = makeFakeStore({
  daysAgo: 8, skillMap: NEMESIS_MAP, cleanChords: ['Em', 'Bm'], struggledChords: ['F'],
  learningChords: [], helpRequests: [], longestStreak: 5, practiceMinutes: 42, lessonsCompleted: 8,
});
// Store with a recent session (today) — same playing data, no comeback.
const storeRecent = makeFakeStore({
  daysAgo: 0, skillMap: NEMESIS_MAP, cleanChords: ['Em', 'Bm'], struggledChords: ['F'],
  learningChords: [], helpRequests: [], longestStreak: 5, practiceMinutes: 42, lessonsCompleted: 8,
});

console.log('\n=== storyMemory Rule-5 self-test ===');
console.log('  (comeback threshold = ' + COMEBACK_THRESHOLD_DAYS + ' days)');

const mem = getStoryMemory(storeComeback);
console.log('  comeback memory: ' + JSON.stringify(mem));

// (a) comeback boolean follows the 7-day threshold.
check('comeback true when lastActiveDays > 7', mem.comeback === true);
check('comeback false when lastActiveDays <= 7', getStoryMemory(storeRecent).comeback === false);

// (b) nemesis is the worst clean/fail ratio chord.
check('nemesis equals most-struggled chord F', mem.nemesis === 'F');

// (c) every milestone cites a number.
check('every milestone string contains a digit', mem.milestones.length > 0 && mem.milestones.every((m) => /\d/.test(m)));

// (d) no banned praise words in any output string.
const outStrings = [mem.nemesis, ...mem.milestones].filter((s) => typeof s === 'string');
const hit = outStrings.map((s) => s.toLowerCase()).find((s) => BANNED.some((w) => s.includes(w))) || null;
check('no banned praise words in output', hit === null);

// Negative control: the scan must actually detect a banned word.
const control = 'You are a natural, great prodigy!';
check('negative control: banned scan DETECTS freelanced praise', BANNED.some((w) => control.toLowerCase().includes(w)));

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) { console.log('OVERALL: PASS'); process.exit(0); }
else { console.log('OVERALL: FAIL'); process.exit(1); }
