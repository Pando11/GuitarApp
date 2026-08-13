// wait-to-play.mjs — §5.2 drill #5: Wait-To-Play.
//
// A CONSTRAINED-listener discipline drill: the student must NOT strum until the
// listener is confident it hears the TARGET chord. We simulate the heard stream,
// then measure discipline (false starts before the target is heard) and
// post-target accuracy. Pure + deterministic via seed.
//
// runDrill(params) -> engine-compatible envelope (events are the heard stream).
import { simulateStrumStream } from '../listener-sim.mjs';

export const DRILL = 'wait-to-play';

function rngFromSeed(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

export function runDrill(params = {}) {
  const {
    pair = ['Em', 'easyC'],
    target = pair[1],           // default: wait for the SECOND chord (a real wait)
    tempoPerMin = 60,
    durationMin = 1.0,
    seed = 1,
    discipline = 1.0,           // 1 => never false-starts; lower => occasional early strum
  } = params;

  // Heard stream: the listener hears the pair alternating, all confident.
  const events = simulateStrumStream({
    A: pair[0], B: pair[1], skillA: 1.0, skillB: 1.0,
    cadencePerMin: tempoPerMin, durationMin, seed,
  });

  const rand = rngFromSeed(seed * 7 + 11);
  let targetHeard = false;
  let targetHeardAtMs = null;
  let falseStarts = 0;
  let studentStrums = 0;
  let correctAfter = 0;

  for (const e of events) {
    const isTarget = e.chord === target;
    const confident = e.confident === true;
    if (!targetHeard) {
      if (confident && isTarget) {
        targetHeard = true;
        targetHeardAtMs = e.t;
      } else if (confident && !isTarget) {
        // before the target is heard, a strum of the wrong chord = false start,
        // unless the disciplined student held back (probability = discipline).
        if (rand() >= discipline) falseStarts += 1;
      }
    } else {
      // after the target is heard the student strums ONLY the target chord.
      if (confident && isTarget) { studentStrums += 1; correctAfter += 1; }
    }
  }

  const waited = falseStarts === 0;
  const accuracy = targetHeard ? (studentStrums > 0 ? correctAfter / studentStrums : 1) : 0;
  const score = (waited ? 0.5 : 0) + 0.5 * accuracy;

  return {
    drill: DRILL,
    params: { ...params, pair, target, tempoPerMin },
    events,
    metrics: { targetHeard, targetHeardAtMs, falseStarts, waited, studentStrums, accuracy },
    ratePerMin: null,
    score,
    passed: waited && accuracy >= 0.8,
    summary: waited
      ? `Waited for ${target}. ${Math.round(accuracy * 100)}% post-target accuracy.`
      : `False-started ${falseStarts}× before hearing ${target}.`,
  };
}
