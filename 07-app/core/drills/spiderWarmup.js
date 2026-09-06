// spiderWarmup.js — §5.2 drill #7: Spider warm-up.
// PORTED 1:1 from 06-prototypes/practice-engine/drills/spider-warmup.mjs,
// do not change behavior, fidelity.mjs diffs it.
//
// Walk the fingers up/down the fretboard one string at a time (the classic
// "spider" dexterity exercise). Pure sequence generator — no audio.
//
// runDrill(params) -> engine-compatible envelope (no strum events).
export const DRILL = 'spider';

export function buildSequence(params = {}) {
  const {
    startFret = 1,
    frets = 4,
    strings = [6, 5, 4, 3, 2, 1],
    pattern = 'updown', // 'up' | 'down' | 'updown'
    reps = 1,
  } = params;

  const fingerOrder = [1, 2, 3, 4]; // index, middle, ring, pinky
  const seq = [];
  const steps = [];

  for (let r = 0; r < reps; r++) {
    const ladder = [];
    for (let f = 0; f < frets; f++) ladder.push(startFret + f);
    if (pattern === 'down') ladder.reverse();
    if (pattern === 'updown') { for (let f = frets - 2; f >= 1; f--) ladder.push(startFret + f); }
    for (const baseFret of ladder) {
      strings.forEach((str, i) => {
        const finger = fingerOrder[i % 4];
        const fret = baseFret + (i % 4);
        seq.push({ finger, string: str, fret });
      });
    }
  }
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1], b = seq[i];
    steps.push({ from: a, to: b, moved: a.string !== b.string || a.fret !== b.fret });
  }
  return { sequence: seq, steps, totalSteps: steps.length, movements: steps.filter((s) => s.moved).length };
}

export function runDrill(params = {}) {
  const built = buildSequence(params);
  const score = built.movements > 0 ? 1 : 0;
  return {
    drill: DRILL,
    params: { ...params },
    events: [],
    metrics: { sequence: built.sequence, totalSteps: built.totalSteps, movements: built.movements },
    ratePerMin: null,
    score,
    passed: score === 1,
    summary: `Spider ${params.pattern || 'updown'}: ${built.movements} finger movements across ${params.strings ? params.strings.length : 6} strings.`,
  };
}
