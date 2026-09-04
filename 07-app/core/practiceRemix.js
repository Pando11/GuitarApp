// practiceRemix.js — V2-FEATURES / A4.5
// Re-sequences an adaptive practice plan into ONE of several framings.
//
// PORTED LOGIC (from 06-prototypes/practice-engine/practice-remix-q5-prototype.html):
//   - The one weak pair G<->D, fluency 0.25, ~15 clean changes/min.
//   - THREE framings: Tempo challenge / Play-along groove / Calm slow.
//   - Diagnostic line 30/min (score 0.5); goal 60/min (score 1.0).
//   - fluency-store scoring: score = clamp(ratePerMin / 60, 0, 1).
//
// Rule 5 / Rule 9 safe: the sequencer uses ENGAGEMENT DATA ONLY (counts +
// timings). NO personality or mood inference. Every number is a stored value.

export const FRAMING_IDS = ['tempo', 'groove', 'calm'];

export function fluencyScore(ratePerMin) {
  const r = Number(ratePerMin);
  if (!Number.isFinite(r)) return 0;
  return Math.max(0, Math.min(1, r / 60));
}

// Build the three framings from the (real) plan data. No engagement used here.
export function buildFramings(plan = {}) {
  const weakPair = plan.weakPair || 'G↔D';
  const ratePerMin = plan.ratePerMin != null ? plan.ratePerMin : 15;
  const fluency = plan.fluency != null ? plan.fluency : fluencyScore(ratePerMin);
  const diagnostic = plan.diagnostic != null ? plan.diagnostic : 30;
  const goal = plan.goal != null ? plan.goal : 60;

  return [
    {
      id: 'tempo',
      name: 'Tempo challenge',
      // Metronome ladder re-uses the engine's Tempo-Scaled Loop.
      sequence: [ratePerMin, ratePerMin + 3, ratePerMin + 6, ratePerMin + 9, diagnostic],
      unit: 'BPM-on-the-change, one clean ' + weakPair + ' per click',
      note: 'Step the click up one notch each time a clean change lands on the beat for a full bar. Line to beat: ' + diagnostic + '/min (diagnostic, not a wall).',
      weakPair, ratePerMin, fluency, diagnostic, goal,
    },
    {
      id: 'groove',
      name: 'Play-along groove',
      // Loop framing re-uses the engine's Weak-Pair Review loop.
      sequence: [weakPair + ' (1 bar)', weakPair + ' (1 bar)', weakPair + ' (1 bar)', weakPair + ' (1 bar)'],
      unit: 'steady 4/4, one bar each, at ' + ratePerMin + '/min',
      note: 'Same pair inside a four-bar loop. Hold each chord a full bar and let it ring. This is the framing that maps onto a real song shape you already have every chord for.',
      weakPair, ratePerMin, fluency, diagnostic, goal,
    },
    {
      id: 'calm',
      name: 'Calm slow',
      // Slowed loop — same pair, lower tempo, no click pressure.
      sequence: ['8 slow counts on ' + weakPair.split('↔')[0], '8 slow counts on ' + weakPair.split('↔')[1]],
      unit: '~' + ratePerMin + '/min, no click pressure',
      note: 'No clock. Eight slow counts per chord, full ring. Records the pair; does not score against the line.',
      weakPair, ratePerMin, fluency, diagnostic, goal,
    },
  ];
}

// Select ONE framing using ENGAGEMENT DATA ONLY (counts + timings).
export function selectFraming(framings, engagement = {}) {
  const e = engagement || {};
  const recentClean = Number.isFinite(+e.recentCleanChanges) ? +e.recentCleanChanges : 0;
  const sessionMs = Number.isFinite(+e.lastSessionMs) ? +e.lastSessionMs : 0;
  const byId = (id) => framings.find((f) => f.id === id);
  // Data-only rules: a short recent session -> calm (less pressure);
  // high recent clean-change volume -> tempo (push); otherwise groove.
  if (sessionMs > 0 && sessionMs < 60000) return byId('calm');
  if (recentClean >= 30) return byId('tempo');
  return byId('groove');
}

export function remixPlan(plan = {}, engagement = {}) {
  const framings = buildFramings(plan);
  const selected = selectFraming(framings, engagement);
  return {
    framings, // all THREE framings
    selected, // the ONE chosen by engagement data
    selectedId: selected ? selected.id : null,
    weakPair: framings[0] ? framings[0].weakPair : null,
    ratePerMin: framings[0] ? framings[0].ratePerMin : null,
    fluency: framings[0] ? framings[0].fluency : null,
    diagnostic: framings[0] ? framings[0].diagnostic : null,
    goal: framings[0] ? framings[0].goal : null,
  };
}

export default remixPlan;
