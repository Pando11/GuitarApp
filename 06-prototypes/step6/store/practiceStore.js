'use strict';
/*
 * practiceStore.js — Step 6 keystone: the single shared practice-data store.
 *
 * Feeds all four Step 6 sub-features:
 *   F4  chat          -> reads current teacher + practice snapshot
 *   F5  adaptive plan -> reads skill map / struggled chords
 *   F6  messages      -> reads true practice facts + mute flags + frequency cap
 *   F11 streaks       -> reads session log (minutes, completion, skill map)
 *
 * Hard rules enforced here:
 *   - Ban 5: audio/data never leaves the device. This module makes ZERO network
 *     calls. Everything is local (in-memory, optional JSON file persistence).
 *   - Single writer interface: the four features can only mutate state through
 *     these methods, so they can never disagree on "what the data is."
 *
 * The LLM (F4) and SMS/email (F6) are EXTERNAL BOUNDARIES — this store only
 * records that a message was produced; it does not send anything. (Prototype
 * discipline: prove the logic, stub the network boundary.)
 *
 * Run its DONE BAR: node verify-step6-store.js
 */

const STRUGGLE_WINDOW = 5; // recent attempts considered for per-chord state

// --- date helpers (all local-midnight, consistent) ---
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function todayKey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dayBefore(key) { const d = parseKey(key); d.setDate(d.getDate() - 1); return todayKey(d.getTime()); }
function dateDiffDays(a, b) { return Math.round((parseKey(b) - parseKey(a)) / 86400000); }

// Deterministic per-chord state from its attempt tallies.
//   untried  -> no attempts
//   struggling -> any recent (window) attempt failed
//   clean    -> >=2 clean and no recent failure
//   learning -> everything else (some progress, not yet clean)
function stateFor(c) {
  if (c.clean === 0 && c.fail === 0 && c.unsure === 0) return 'untried';
  const recentFail = c.recent.filter(v => v === 'fail').length;
  if (recentFail > 0) return 'struggling';
  if (c.clean >= 2) return 'clean';
  return 'learning';
}

class PracticeStore {
  constructor(initial) {
    const i = initial || {};
    this.sessions = (i.sessions || []).map(s => ({ ...s, attempts: s.attempts.map(a => ({ ...a })) }));
    this.lessonCompletion = { ...(i.lessonCompletion || {}) };
    this.mute = { messages: false, sms: false, email: false, ...(i.mute || {}) };
    this.messageLog = (i.messageLog || []).map(m => ({ ...m }));
    this.helpRequests = (i.helpRequests || []).map(r => ({ ...r })); // Loop C2: student-asked help
    this._nextId = i._nextId || 1;
    this.currentTeacherId = i.currentTeacherId || 'T1';
  }

  // ---------- session + attempt logging ----------
  startSession(lessonId, ts = Date.now()) {
    const id = 's' + (this._nextId++);
    this.sessions.push({ id, lessonId, ts, durationSec: 0, completed: false, attempts: [] });
    return id;
  }

  logAttempt(sessionId, attempt) {
    const s = this.sessions.find(x => x.id === sessionId);
    if (!s) throw new Error('unknown session ' + sessionId);
    if (!['pass', 'fail', 'unsure'].includes(attempt.verdict)) throw new Error('bad verdict: ' + attempt.verdict);
    s.attempts.push({
      chordName: attempt.chordName,
      frets: Array.isArray(attempt.frets) ? attempt.frets.slice() : null,
      verdict: attempt.verdict,
      centsOff: attempt.centsOff || null,
      ts: attempt.ts || Date.now()
    });
    return s.attempts.length;
  }

  finalizeSession(sessionId, opts = {}) {
    const s = this.sessions.find(x => x.id === sessionId);
    if (!s) throw new Error('unknown session ' + sessionId);
    s.completed = !!opts.completed;
    s.durationSec = opts.durationSec || 0;
    if (opts.lessonId) s.lessonId = opts.lessonId;
    if (s.completed && s.lessonId) {
      this.lessonCompletion[s.lessonId] = { completed: true, lastTs: s.ts };
    }
    return s;
  }

  // ---------- skill map (per-chord clean/struggling projection) ----------
  getSkillMap() {
    const byChord = {};
    for (const s of this.sessions) {
      for (const a of s.attempts) {
        if (!a.chordName) continue;
        if (!byChord[a.chordName]) byChord[a.chordName] = { clean: 0, fail: 0, unsure: 0, recent: [] };
        const c = byChord[a.chordName];
        if (a.verdict === 'pass') c.clean++;
        else if (a.verdict === 'fail') c.fail++;
        else c.unsure++;
        c.recent.push(a.verdict);
        if (c.recent.length > STRUGGLE_WINDOW) c.recent.shift();
      }
    }
    const map = {};
    for (const name of Object.keys(byChord)) {
      const c = byChord[name];
      map[name] = { clean: c.clean, fail: c.fail, unsure: c.unsure, state: stateFor(c) };
    }
    return map;
  }

  getStruggledChords() {
    const map = this.getSkillMap();
    return Object.keys(map)
      .filter(n => map[n].state === 'struggling')
      .sort((a, b) => map[b].fail - map[a].fail);
  }

  getCleanChords() {
    const map = this.getSkillMap();
    return Object.keys(map).filter(n => map[n].state === 'clean');
  }

  getLearningChords() {
    const map = this.getSkillMap();
    return Object.keys(map).filter(n => map[n].state === 'learning');
  }

  // Which lesson was a chord last practiced in (real lessonId from the session log).
  lessonForChord(chordName) {
    for (let i = this.sessions.length - 1; i >= 0; i--) {
      if (this.sessions[i].attempts.some(a => a.chordName === chordName)) return this.sessions[i].lessonId || null;
    }
    return null;
  }

  practiceMinutesTotal() {
    return Math.round(this.sessions.reduce((acc, s) => acc + (s.durationSec || 0), 0) / 60);
  }

  // ---------- F7 band engine: last-practice tempo capture ----------
  // The band follows the tempo the student ACTUALLY played at last, not a fixed
  // click. This records a measured practice BPM against a session so the band
  // engine can read lastPracticeTempo(). Clamped to a sane 30..240 BPM window
  // (guitar practice can't be faster/slower than that; rejects garbage input).
  // No existing field is touched, so Step 6 gates are unaffected.
  recordPracticeTempo(sessionId, bpm) {
    const s = this.sessions.find(x => x.id === sessionId);
    if (!s) throw new Error('unknown session ' + sessionId);
    const n = Number(bpm);
    if (!isFinite(n) || n < 30 || n > 240) throw new Error('bpm out of range: ' + bpm);
    s.practiceBpm = Math.round(n);
    return s.practiceBpm;
  }

  // Most recent measured practice BPM across the session log (or null if never
  // recorded). The band engine treats null as "use the lesson's default BPM".
  lastPracticeTempo() {
    for (let i = this.sessions.length - 1; i >= 0; i--) {
      if (this.sessions[i].practiceBpm != null) return this.sessions[i].practiceBpm;
    }
    return null;
  }

  lessonCompleted(lessonId) {
    return !!(this.lessonCompletion[lessonId] && this.lessonCompletion[lessonId].completed);
  }

  completedLessonCount() {
    return Object.keys(this.lessonCompletion).filter(k => this.lessonCompletion[k].completed).length;
  }

  // ---------- streaks (F11) ----------
  _activeDays() {
    const set = new Set(this.sessions.map(s => todayKey(s.ts)));
    return Array.from(set).sort();
  }
  _streakAsOf(ts) {
    const days = this._activeDays();
    if (!days.length) return 0;
    const today = todayKey(ts);
    let cursor = days.includes(today) ? today : dayBefore(today);
    let run = 0;
    while (days.includes(cursor)) { run++; cursor = dayBefore(cursor); }
    return run;
  }
  currentStreak() { return this._streakAsOf(Date.now()); }
  longestStreak() {
    const days = this._activeDays();
    if (!days.length) return 0;
    let best = 1, run = 1;
    for (let i = 1; i < days.length; i++) {
      if (dateDiffDays(days[i - 1], days[i]) === 1) run++; else run = 1;
      if (run > best) best = run;
    }
    return best;
  }

  // ---------- teacher (F4 / F6 persona source) ----------
  setTeacher(id) { this.currentTeacherId = id; }
  getTeacher() { return this.currentTeacherId; }

  // ---------- messages / mute (F6) ----------
  setMute(channel, val) {
    if (!(channel in this.mute)) throw new Error('unknown channel ' + channel);
    this.mute[channel] = !!val;
  }
  isMuted(channel) { return !!(this.mute[channel]); }
  recordMessage(meta) {
    const channel = meta.channel;
    if (!channel || !(channel in this.mute)) throw new Error('unknown channel ' + channel);
    if (this.mute[channel]) return null; // one-tap mute blocks the send
    const m = { ts: meta.ts || Date.now(), channel, body: meta.body || '', lessonDeepLink: meta.lessonDeepLink || null, muted: false };
    this.messageLog.push(m);
    return m;
  }
  messageCountSince(ts) { return this.messageLog.filter(m => m.ts >= ts).length; }
  messageCountSinceChannel(ts, channel) {
    return this.messageLog.filter(m => m.ts >= ts && m.channel === channel).length;
  }

  // ---------- Loop C2: student-initiated help requests (the "you asked about X" trail) ----------
  // A student reaches out ("I can't get this barre chord") -> we record it so a later
  // follow-up can reference THE EXACT THING THEY NAMED, not a generic struggle blast.
  // This is what makes Loop C2 distinct from Loop C1 (app-initiated encouragement).
  studentRequested(chordName, ts = Date.now()) {
    if (!chordName || typeof chordName !== 'string' || !chordName.trim()) throw new Error('bad chordName: ' + chordName);
    this.helpRequests.push({ chordName: chordName.trim(), ts, followedUp: false });
  }
  getPendingHelpRequests() {
    return this.helpRequests.filter(r => !r.followedUp).map(r => ({ ...r }));
  }
  // Mark the oldest pending request for this chord as followed-up so we don't re-nudge the same ask.
  markHelpRequestFollowedUp(chordName) {
    for (const r of this.helpRequests) {
      if (!r.followedUp && r.chordName === chordName) { r.followedUp = true; return true; }
    }
    return false;
  }

  // ---------- persistence (local only; Ban 5) ----------
  toJSON() {
    return {
      sessions: this.sessions, lessonCompletion: this.lessonCompletion, mute: this.mute,
      messageLog: this.messageLog, helpRequests: this.helpRequests, _nextId: this._nextId, currentTeacherId: this.currentTeacherId
    };
  }
  static fromJSON(o) { return new PracticeStore(o); }
}

module.exports = { PracticeStore, todayKey, dayBefore, stateFor };
