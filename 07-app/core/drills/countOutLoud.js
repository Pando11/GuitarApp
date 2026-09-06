// countOutLoud.js — §5.2 drill #11: Count-out-loud (1-&-2-& anchor).
// PORTED 1:1 from 06-prototypes/practice-engine/drills/count-out-loud.mjs,
// do not change behavior, fidelity.mjs diffs it.
//
// The student counts the 8th-note grid out loud to lock tempo before strumming.
// We generate the grid and score how steadily they keep the count. Each counted
// slot is emitted as a strum-event (chord:null — it's a vocal count, not a
// chord) so the result stays in the engine's event contract.
//
// runDrill(params) -> engine-compatible envelope.
export const DRILL = 'count-out-loud';

function rngFromSeed(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

export function buildGrid({ beatsPerBar = 4, bars = 4 } = {}) {
  const labels = [];
  for (let b = 0; b < bars; b++) {
    for (let beat = 1; beat <= beatsPerBar; beat++) {
      labels.push(String(beat)); // downbeat
      labels.push('&');          // offbeat
    }
  }
  return labels; // ['1','&','2','&',...]
}

export function runDrill(params = {}) {
  const {
    tempoPerMin = 80,
    bars = 4,
    beatsPerBar = 4,
    durationMin = 1.0,
    seed = 1,
    accuracy = 0.85,
  } = params;

  const grid = buildGrid({ beatsPerBar, bars });
  const slotMs = (60000 / tempoPerMin) / 2; // 8th-note slot
  const rand = rngFromSeed(seed);
  const counts = [];
  const events = [];
  let onTempo = 0, missed = 0;
  for (let i = 0; i < grid.length; i++) {
    const target = i * slotMs;
    const said = rand() < accuracy;
    let t = null, ok = false;
    if (said) {
      const jitter = (rand() - 0.5) * 0.4 * slotMs;
      t = Math.round(target + jitter);
      ok = Math.abs(jitter) <= 0.2 * slotMs;
      if (ok) onTempo++;
    } else {
      missed++;
    }
    counts.push({ slot: grid[i], expectedMs: Math.round(target), saidAtMs: t, onTempo: ok });
    // emit a strum-shaped event: chord:null (a vocal count), confident = on-tempo
    events.push({ chord: null, confident: ok, t: t == null ? Math.round(target) : t });
  }
  const saidCount = grid.length - missed;
  const score = grid.length > 0 ? onTempo / grid.length : 0;

  return {
    drill: DRILL,
    params: { ...params, tempoPerMin },
    events,
    metrics: { grid, onTempo, missed, said: saidCount },
    ratePerMin: null,
    score,
    passed: score >= 0.8,
    summary: `Counted ${saidCount}/${grid.length} slots @ ${tempoPerMin}/min — ${onTempo} on-tempo.`,
  };
}
