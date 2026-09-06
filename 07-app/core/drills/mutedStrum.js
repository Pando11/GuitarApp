// mutedStrum.js — §5.2 drill #10: Muted / percussive strum.
// PORTED 1:1 from 06-prototypes/practice-engine/drills/muted-strum.mjs,
// do not change behavior, fidelity.mjs diffs it.
//
// Rhythm hand alone — no fretting, no pitch. Every strum is a muted (chord:null)
// percussive hit. We score tempo steadiness: on-beat vs off-beat hits.
// Strum events carry chord:null (permitted by the strum-event contract).
//
// runDrill(params) -> engine-compatible envelope.
export const DRILL = 'muted-strum';

function rngFromSeed(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

export function runDrill(params = {}) {
  const {
    tempoPerMin = 80,
    durationMin = 1.0,
    seed = 1,
    accuracy = 0.85, // chance a scheduled hit actually lands on-beat
  } = params;

  const beatMs = 60000 / tempoPerMin;
  const totalBeats = Math.max(1, Math.floor((durationMin * 60000) / beatMs));
  const rand = rngFromSeed(seed);
  const events = [];
  let onBeat = 0, offBeat = 0;
  for (let i = 0; i < totalBeats; i++) {
    const onBeatTarget = i * beatMs;
    if (rand() < accuracy) {
      const jitter = (rand() - 0.5) * 0.3 * beatMs; // +/-15% of a beat
      const t = Math.round(onBeatTarget + jitter);
      const isOnBeat = Math.abs(jitter) <= 0.15 * beatMs;
      events.push({ chord: null, confident: true, t, onBeat: isOnBeat });
      if (isOnBeat) onBeat++; else offBeat++;
    }
  }
  const mutedHits = events.length;
  const ratePerMin = durationMin > 0 ? mutedHits / durationMin : 0;
  const score = totalBeats > 0 ? onBeat / totalBeats : 0;

  return {
    drill: DRILL,
    params: { ...params, tempoPerMin },
    events,
    metrics: { mutedHits, onBeat, offBeat, beatMs },
    ratePerMin,
    score,
    passed: score >= 0.8,
    summary: `${mutedHits} muted hits @ ${tempoPerMin}/min — ${onBeat} on-beat, ${offBeat} off.`,
  };
}
