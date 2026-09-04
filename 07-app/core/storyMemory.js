// storyMemory.js — ADR-0005 Layer 2 STORY MEMORY (BI-4).
//
// Reads Layer-1 PracticeStore PLAYING DATA ONLY and derives narrative beats.
// Banned by Rule 5: any mood, personality, or praise inference. Every string
// this module emits cites a real stored number (or is a raw chord label).
// No network. Deterministic for identical input numbers.

// The "comeback" beat fires when the student has been away longer than this.
export const COMEBACK_THRESHOLD_DAYS = 7;

const DAY_MS = 86400000;

// Days since the last practice session. -1 when no session was ever logged.
function computeLastActiveDays(store) {
  const sessions = store.sessions || [];
  let lastTs = -Infinity;
  for (const s of sessions) if (typeof s.ts === 'number' && s.ts > lastTs) lastTs = s.ts;
  if (lastTs === -Infinity) return -1;
  return Math.round((Date.now() - lastTs) / DAY_MS);
}

// The chord with the worst clean/fail ratio (most struggled). null when none.
function computeNemesis(store) {
  const map = store.getSkillMap();
  let worst = null;
  let worstRatio = -1;
  for (const name of Object.keys(map)) {
    const { clean, fail } = map[name];
    const total = clean + fail;
    if (total === 0) continue; // no clean/fail signal yet
    const ratio = fail / total; // higher = more struggled
    if (ratio > worstRatio) { worstRatio = ratio; worst = name; }
  }
  return worst;
}

// Fact-only milestones; each one cites a stored number (Rule 5).
function computeMilestones(store) {
  const map = store.getSkillMap();
  const milestones = [];
  const clean = store.getCleanChords();
  if (clean.length) {
    const name = clean[0];
    const d = map[name];
    const tries = d.clean + d.fail + d.unsure;
    milestones.push(`First clean chord: ${name} (cleaned after ${tries} tries)`);
  }
  const longest = store.longestStreak();
  if (longest >= 1) milestones.push(`Longest streak: ${longest} day(s)`);
  const mins = store.practiceMinutesTotal();
  if (mins > 0) milestones.push(`Total practice time: ${mins} minutes`);
  const lessons = store.completedLessonCount();
  if (lessons > 0) milestones.push(`Lessons completed: ${lessons}`);
  return milestones;
}

// Public entry: derive the Layer-2 story memory object from a PracticeStore.
export function getStoryMemory(store) {
  const lastActiveDays = computeLastActiveDays(store);
  return {
    lastActiveDays,
    comeback: lastActiveDays > COMEBACK_THRESHOLD_DAYS,
    nemesis: computeNemesis(store),
    milestones: computeMilestones(store),
    helpPending: store.getPendingHelpRequests().length,
  };
}
