// listener-sim.mjs — deterministic stand-in for the real constrained listener.
// The REAL boundary (mic -> CREPE class autocorrelation -> match vs known pair)
// is hardware. For verifiable unit/integration tests we simulate it: given a
// target pair {A,B}, a per-chord "skill" 0..1, and a duration, it emits a
// strum event stream where:
//   - the student actually alternates A/B at a steady cadence
//   - skill controls how often the listener is CONFIDENT the chord rang true
//   - low skill => unclean strums, which the counter must ignore
// This exercises countChanges WITHOUT a mic, making 30/60 reproducible.

function rngFromSeed(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// cadencePerMin: how many strums per minute (e.g. 70 => ~1.17/s).
export function simulateStrumStream({
  A = 'A',
  B = 'B',
  skillA = 1.0,
  skillB = 1.0,
  cadencePerMin = 70,
  durationMin = 1.0,
  seed = 1,
}) {
  const rand = rngFromSeed(seed);
  const events = [];
  const intervalMs = 60000 / cadencePerMin;
  const total = Math.max(1, Math.floor(cadencePerMin * durationMin));
  let t = 0;
  for (let i = 0; i < total; i++) {
    const chord = i % 2 === 0 ? A : B;
    const skill = chord === A ? skillA : skillB;
    // confident only with probability ~ skill; otherwise unclean (null)
    const confident = rand() < skill;
    events.push({ chord: confident ? chord : null, confident, t });
    t += intervalMs;
  }
  return events;
}
