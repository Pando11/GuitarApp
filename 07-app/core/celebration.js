// celebration.js — V2-FEATURES / A4.4
// buildCelebration(numbers) -> celebration built from STORED NUMBERS ONLY (Rule 5).
// NO invented praise. Two-layer privacy note (local-first).
// Rule 5 / Rule 9 safe.

export const BANNED_PRAISE = ['great', 'natural', 'talented', 'gifted', 'prodigy', 'star'];

export function buildCelebration(numbers = {}) {
  const n = numbers || {};
  const lines = [];
  const reported = {};
  if (n.streakDays != null) {
    reported.streakDays = n.streakDays;
    lines.push('Current streak: ' + n.streakDays + ' day' + (n.streakDays === 1 ? '' : 's') + '.');
  }
  if (n.chordsCleaned != null) {
    reported.chordsCleaned = n.chordsCleaned;
    lines.push('Chords cleaned this week: ' + n.chordsCleaned + '.');
  }
  if (n.daysPracticed != null) {
    reported.daysPracticed = n.daysPracticed;
    lines.push('Days practiced: ' + n.daysPracticed + '.');
  }
  if (n.totalSessions != null) {
    reported.totalSessions = n.totalSessions;
    lines.push('Total sessions: ' + n.totalSessions + '.');
  }
  if (n.minutesPracticed != null) {
    reported.minutesPracticed = n.minutesPracticed;
    lines.push('Minutes practiced: ' + n.minutesPracticed + '.');
  }

  const text = lines.join(' ');

  const privacy = {
    layer1: 'Local-first: these numbers are stored on this device only.',
    layer2: 'Nothing is uploaded to a server or shared unless you explicitly export or sync.',
  };

  return {
    text,
    numbers: reported,
    privacy,
    localFirst: true,
  };
}

export default buildCelebration;
