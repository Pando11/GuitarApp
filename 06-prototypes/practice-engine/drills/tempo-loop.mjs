// tempo-loop.mjs — §5.2 drill #4: Tempo-Scaled Section Loop.
//
// Loops the HARD bar (the chord change) at a scaled tempo so the student can
// drill the difficult transition slowly, then speed up. Pure: uses the
// deterministic listener-sim to fake the audio and the 30/60 sensor to score.
//
// runDrill(params) returns an engine-compatible result envelope:
//   { drill, params, events:[{chord,confident,t}], metrics, ratePerMin, score, passed, summary }
import { simulateStrumStream } from '../listener-sim.mjs';
import { measureOneMinute } from '../one-minute-changes.mjs';

export const DRILL = 'tempo-loop';

// scale: 0.25..1.25 (25%..125% of base tempo). Clamped.
export function runDrill(params = {}) {
  const {
    pair = ['Em', 'easyC'],
    tempoPerMin = 60,
    scale = 1.0,
    durationMin = 1.0,
    seed = 1,
    skillA = 0.85,
    skillB = 0.8,
  } = params;

  const s = Math.max(0.25, Math.min(1.25, scale));
  const effectiveTempo = Math.round(tempoPerMin * s);
  const events = simulateStrumStream({
    A: pair[0], B: pair[1], skillA, skillB,
    cadencePerMin: effectiveTempo, durationMin, seed,
  });
  const m = measureOneMinute(pair, events, durationMin);
  const score = Math.max(0, Math.min(1, m.ratePerMin / 60));

  return {
    drill: DRILL,
    params: { ...params, pair, tempoPerMin, scale: s, effectiveTempo },
    events,
    metrics: { effectiveTempo, changes: m.changes, ratePerMin: m.ratePerMin, advance: m.advance, goal: m.goal },
    ratePerMin: m.ratePerMin,
    score,
    passed: m.advance,
    summary: `Looped ${pair[0]}↔${pair[1]} at ${effectiveTempo}/min (${Math.round(s * 100)}% of ${tempoPerMin}). ${m.changes} changes = ${m.ratePerMin}/min.`,
  };
}
