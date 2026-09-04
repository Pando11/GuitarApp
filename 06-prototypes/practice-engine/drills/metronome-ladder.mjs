// metronome-ladder.mjs — §5.2 drill #8: Metronome ladder.
//
// Raise the BPM only when the previous level was CLEAN (rate >= threshold).
// Pure: listener-sim + the 30/60 sensor drive the ladder.
//
// runDrill(params) -> engine-compatible envelope (ratePerMin = top level's rate).
import { simulateStrumStream } from '../listener-sim.mjs';
import { measureOneMinute } from '../one-minute-changes.mjs';

export const DRILL = 'metronome-ladder';

export function runDrill(params = {}) {
  const {
    pair = ['Em', 'easyC'],
    startBpm = 60,
    maxBpm = 140,
    step = 5,
    cleanRatePerMin = 45,
    rounds = 8,
    seed = 1,
    skillA = 0.85,
    skillB = 0.8,
  } = params;

  const levels = [];
  let bpm = startBpm;
  let achieved = bpm;
  for (let i = 0; i < rounds && bpm <= maxBpm; i++) {
    const events = simulateStrumStream({
      A: pair[0], B: pair[1], skillA, skillB,
      cadencePerMin: bpm, durationMin: 1.0, seed: seed + i * 101,
    });
    const m = measureOneMinute(pair, events, 1.0);
    const clean = m.ratePerMin >= cleanRatePerMin;
    const advanced = clean && bpm + step <= maxBpm;
    levels.push({ level: i + 1, bpm, ratePerMin: m.ratePerMin, clean, advanced });
    achieved = bpm;
    if (advanced) bpm += step;
  }
  const passed = levels.length > 0 && levels[levels.length - 1].bpm > startBpm;
  const topRate = levels.length ? Math.max(...levels.map((l) => l.ratePerMin)) : 0;
  return {
    drill: DRILL,
    params: { ...params, pair, startBpm, maxBpm, step, cleanRatePerMin },
    events: [],
    metrics: { levels, topBpm: achieved, topRatePerMin: topRate },
    ratePerMin: topRate,
    score: Math.max(0, Math.min(1, (achieved - startBpm) / Math.max(1, maxBpm - startBpm))),
    passed,
    summary: `Climbed ${startBpm} → ${achieved}/min over ${levels.length} level${levels.length === 1 ? '' : 's'}.`,
  };
}
