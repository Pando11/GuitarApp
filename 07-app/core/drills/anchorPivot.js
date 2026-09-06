// anchorPivot.js — §5.2 drill #6: Anchor / Pivot.
// PORTED 1:1 from 06-prototypes/practice-engine/drills/anchor-pivot.mjs,
// do not change behavior, fidelity.mjs diffs it.
//
// Highlights the SHARED finger (anchor) that stays put through a chord change,
// so the student pivots around it instead of lifting everything. Pure
// arithmetic over chord fingering maps — no audio.
//
// fingering shape: { '6':{fret,finger}, '5':{...}, ... }  (string keys '6'..'1')
// runDrill(params) -> engine-compatible envelope (no strum events; it's a
// pedagogy computation).
export const DRILL = 'anchor';

export function findAnchor(chordA, chordB) {
  const fa = (chordA && chordA.fingering) || {};
  const fb = (chordB && chordB.fingering) || {};
  const shared = [];
  // Iterate strings in guitar order (low E = 6 -> high e = 1) so the reported
  // anchor is deterministic and pedagogically sensible (lowest string first).
  const strKeys = Object.keys(fa).sort((a, b) => Number(b) - Number(a));
  for (const str of strKeys) {
    const a = fa[str], b = fb[str];
    if (a && b && a.fret != null && b.fret != null && a.fret === b.fret && a.finger === b.finger) {
      shared.push({ string: str, fret: a.fret, finger: a.finger });
    }
  }
  // A finger used on the SAME fret across DIFFERENT strings is a pivot finger.
  const byFinger = {};
  for (const chord of [fa, fb]) {
    for (const str of Object.keys(chord)) {
      const c = chord[str];
      if (c && c.fret != null && c.finger != null) {
        (byFinger[c.finger] = byFinger[c.finger] || new Set()).add(c.fret);
      }
    }
  }
  const pivotFingers = Object.keys(byFinger)
    .filter((f) => byFinger[f].size >= 2)
    .map((f) => Number(f));
  return { anchor: shared, pivotFingers };
}

export function runDrill(params = {}) {
  const { chordA, chordB } = params;
  if (!chordA || !chordB) {
    return {
      drill: DRILL,
      params,
      events: [],
      metrics: { anchor: [], pivotFingers: [] },
      ratePerMin: null, score: null, passed: null,
      summary: 'No chords supplied.',
    };
  }
  const { anchor, pivotFingers } = findAnchor(chordA, chordB);
  const score = anchor.length > 0 || pivotFingers.length > 0 ? 1 : 0;
  return {
    drill: DRILL,
    params: { chordA: chordA.name, chordB: chordB.name },
    events: [],
    metrics: { anchor, pivotFingers, anchorFinger: anchor[0] ? anchor[0].finger : null },
    ratePerMin: null,
    score,
    passed: score === 1,
    summary: anchor.length
      ? `Anchor: finger ${anchor[0].finger} stays on string ${anchor[0].string} at fret ${anchor[0].fret}. Pivot around it.`
      : `No shared finger — full lift change (pivot fingers: ${pivotFingers.join(',') || 'none'}).`,
  };
}
