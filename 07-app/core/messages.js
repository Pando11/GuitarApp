// messages.js — F6 encouraging messages. PORTED 1:1 from 06-prototypes/step6/messages/messages.js.
const DAY = 86400000;
export function startOfToday(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

export function factBody(store) {
  const struggled = store.getStruggledChords();
  const clean = store.getCleanChords();
  const minutes = store.practiceMinutesTotal();
  const streak = store.currentStreak();
  if (struggled.length) {
    const c = struggled[0];
    const lesson = store.lessonForChord(c) || 'L01';
    return `Your ${c} isn't ringing clean yet — 2 minutes on it today and it'll click. Open lesson/${lesson} when you're ready.`;
  }
  if (clean.length) {
    const word = streak === 1 ? 'day' : 'days';
    return `Your ${clean[0]} is sounding clean! Keep the streak going — ${streak} ${word} in.`;
  }
  return `You've practiced ${minutes} minutes. Lesson 1 is waiting whenever you are.`;
}

export function withinCap(store, channel, maxPerDay, now = Date.now()) {
  return store.messageCountSinceChannel(startOfToday(now), channel) < maxPerDay;
}

export function send(store, channel, opts = {}) {
  const maxPerDay = opts.maxPerDay || 2;
  if (store.isMuted(channel)) return { sent: false, reason: 'muted' };
  if (!withinCap(store, channel, maxPerDay)) return { sent: false, reason: 'capped' };
  const body = factBody(store);
  const link = /lesson\/(L\w+)/.exec(body);
  const deep = link ? link[1] : null;
  const message = store.recordMessage({ channel, body, lessonDeepLink: deep });
  return { sent: !!message, message, reason: message ? 'ok' : 'muted' };
}
