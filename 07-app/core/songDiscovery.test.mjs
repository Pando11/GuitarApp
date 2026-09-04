// songDiscovery.test.mjs — node self-test (prints PASS, exits 0).
import { discoverSongs, SONG_CATALOG } from './songDiscovery.js';
import assert from 'node:assert';

const validIds = new Set(SONG_CATALOG.map((s) => s.id));
const pdMap = Object.fromEntries(SONG_CATALOG.map((s) => [s.id, !!s.public_domain]));

// Fake taught-chord set.
const taught = ['Em', 'Ceasy', 'G', 'D'];
const res = discoverSongs({ taughtChords: taught, lane: 'both' });
assert.ok(res.disclaimer, 'catalog disclaimer always attached');

for (const song of res.matches) {
  // subset of SP01-SP11
  assert.ok(validIds.has(song.id), 'returned song ' + song.id + ' must be in the 11-song catalog');
  // why cites a real chord
  assert.ok(/[A-G]/.test(song.why), 'why must cite a real chord: ' + song.why);
  // PD flag mirrors progressions.json
  assert.equal(song.public_domain, pdMap[song.id], 'PD flag must mirror catalog for ' + song.id);
  // no artist names
  assert.ok(!/Cranberries|Chili|Skynyrd|AC\/DC|Berry|Metallica|Pink Floyd|Zeppelin/i.test(JSON.stringify(song)),
    'no artist names in match');
}

// play-today: all chords taught
const pt = discoverSongs({ taughtChords: taught, lane: 'play-today' });
assert.ok(pt.playToday.length > 0);
for (const s of pt.playToday) {
  for (const c of s.chords) assert.ok(taught.includes(c), 'play-today song ' + s.id + ' must use only taught chords');
}

// next-step: exactly one missing
const ns = discoverSongs({ taughtChords: taught, lane: 'next-step' });
for (const s of ns.nextStep) {
  const missing = s.chords.filter((c) => !taught.includes(c));
  assert.equal(missing.length, 1, 'next-step song ' + s.id + ' must be exactly one chord beyond');
}

// PD flags: SP06 and SP11 are the only public-domain entries
assert.equal(pdMap.SP06, true, 'SP06 public domain');
assert.equal(pdMap.SP11, true, 'SP11 public domain');
assert.equal(pdMap.SP01, false, 'SP01 not public domain');

console.log('songDiscovery PASS — playToday=' + pt.playToday.length +
  ', nextStep=' + ns.nextStep.length + ', total=' + res.matches.length);
process.exit(0);
