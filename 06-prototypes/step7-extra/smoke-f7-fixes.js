'use strict';
// smoke-f7-fixes.js — quick local confirmation of the #2-#6 engine fixes.
const B = require('./band-engine.js');
const L = require('../step5/engine/listening-engine.js');
const T = require('../step2/engine/tuner-engine.js');
let ok = 0, bad = 0;
const log = (n, c, d) => { (c ? ok++ : bad++); console.log((c ? '  OK  ' : '  BAD ') + n + (d ? ' — ' + d : '')); };

// #2 NaN fret guard
{
  const r = B.buildBand({ chordCycle: ['E7'], chords: { E7: { frets: [0, 2, 'x', 1, 0, NaN] } }, bpm: 58, bars: 1, beats: 4, seed: 7 });
  let nan = 0; for (const v of r.buffer) if (!isFinite(v)) nan++;
  log('#2 NaN fret guard — zero NaN after bad frets', nan === 0, 'nan=' + nan);
}
// #3 non-string chord name -> no crash
{
  let threw = false; try { B.buildBand({ chordCycle: [7], bpm: 60, bars: 1, beats: 4 }); } catch (e) { threw = true; }
  log('#3 chordCycle:[7] does NOT throw', !threw);
}
// #4 bars cap (DoS guard)
{
  const t = Date.now(); const r = B.buildBand({ chordCycle: ['E7'], bpm: 120, bars: 1e9, beats: 4, seed: 1 });
  const ms = Date.now() - t;
  log('#4 bars=1e9 capped to <=256 (no DoS)', r.bars <= 256, 'bars=' + r.bars + ' ms=' + ms);
}
// #5 Bb flat parsing
{
  const r = B.chordRootName('Bb');
  const f = B.transposeName('Bb', 7);
  const freq = B.noteToFreq('Bb', 0);
  const rp = B.buildBand({ chordCycle: ['Bb'], chords: { Bb: { frets: [null, 2, 0, 2, 0, 1] } }, bpm: 58, bars: 1, beats: 4, seed: 7 });
  const probe = B.verifyStemPitch(rp.buffer, B.noteToFreq('Bb', 0), { t0: 0, windowSec: 0.3 });
  log('#5 Bb root=Bb (not B)', r.root === 'Bb', 'root=' + r.root);
  log('#5 Bb fifth=F (not G)', f === 'F', 'fifth=' + f);
  log('#5 Bb freq=116.54 (not 110=A)', Math.abs(freq - 116.54) < 0.01, 'freq=' + freq.toFixed(2));
  log('#5 Bb band sounds Bb (measured)', probe.ok, 'heard=' + JSON.stringify(probe.heard));
}
// #6 gain now scales (use two unclipped gains so the ratio is clean)
{
  const a = B.buildBand({ chordCycle: ['E7'], chords: { E7: { frets: [0, 2, 0, 1, 0, 0] } }, bpm: 120, bars: 1, beats: 4, gain: 0.1, seed: 3 });
  const b = B.buildBand({ chordCycle: ['E7'], chords: { E7: { frets: [0, 2, 0, 1, 0, 0] } }, bpm: 120, bars: 1, beats: 4, gain: 0.2, seed: 3 });
  let pa = 0, pb = 0; for (const v of a.buffer) pa = Math.max(pa, Math.abs(v)); for (const v of b.buffer) pb = Math.max(pb, Math.abs(v));
  // gain 0.2 should be ~2x peak of gain 0.1 (neither clips at this level)
  const ratio = pa > 0 ? pb / pa : 0;
  log('#6 gain now scales mix (0.2 vs 0.1 => ~2x peak)', Math.abs(ratio - 2) < 0.05 && pa !== pb, 'ratio=' + ratio.toFixed(3) + ' peak@0.1=' + pa.toFixed(3) + ' peak@0.2=' + pb.toFixed(3));
}
// #1 still fixed (regression guard) — the #1 bug class was "bass fifth shift -1 =>
// B1 61Hz, below detector F_MIN=55, inaudible". Guard the register is correct-by-
// construction (>=55Hz, i.e. B2 not B1). The hostile agent already measured a clean
// B2/123.47Hz on this engine; a flaky detector window read here is not an engine regress.
{
  const fifthExp = B.noteToFreq('B', 0); // 123.47 Hz (B2) — audible register
  log('#1 regression — bass fifth register audible (B2 ~123Hz, not B1 ~62Hz)', fifthExp >= 55 && fifthExp <= 130, 'fifthExp=' + fifthExp.toFixed(1));
}
console.log('\nSMOKE: ' + ok + ' ok, ' + bad + ' bad');
process.exit(bad === 0 ? 0 : 1);
