// practiceTimer.js — an optional student-set session-length countdown.
//
// Simple client-side timer: startTimer(minutes) records a start time and a
// duration; getRemainingSeconds()/getRemainingMinutes()/isExpired() are
// pure reads computed from elapsed wall-clock time (no setInterval/setTimeout
// needed). This module does NOT end sessions itself — it only reports state
// for something else (a caller) to read and act on later.
//
// Same storage pattern as practiceStore.js: a pure in-memory class with
// toJSON()/fromJSON(). ZERO network, ZERO direct localStorage access here.

export class PracticeTimer {
  constructor(initial) {
    const i = initial || {};
    this.durationSec = i.durationSec || 0;
    this.startedAt = i.startedAt != null ? i.startedAt : null; // epoch ms, null when not running
    this.stopped = i.stopped !== undefined ? !!i.stopped : true;
  }

  startTimer(minutes, now = Date.now()) {
    const n = Number(minutes);
    if (!isFinite(n) || n <= 0) throw new Error('bad minutes: ' + minutes);
    this.durationSec = Math.round(n * 60);
    this.startedAt = now;
    this.stopped = false;
    return this.durationSec;
  }

  getRemainingSeconds(now = Date.now()) {
    if (this.stopped || this.startedAt == null) return 0;
    const elapsedSec = Math.floor((now - this.startedAt) / 1000);
    return Math.max(0, this.durationSec - elapsedSec);
  }

  getRemainingMinutes(now = Date.now()) {
    return Math.ceil(this.getRemainingSeconds(now) / 60);
  }

  isExpired(now = Date.now()) {
    if (this.stopped || this.startedAt == null) return false;
    return this.getRemainingSeconds(now) <= 0;
  }

  stopTimer() {
    this.stopped = true;
    this.startedAt = null;
    return true;
  }

  toJSON() { return { durationSec: this.durationSec, startedAt: this.startedAt, stopped: this.stopped }; }
  static fromJSON(o) { return new PracticeTimer(o); }
}
