// songDiscovery.js — V2-FEATURES / A4.1
// discoverSongs({taughtChords, lane}) -> two-lane match on the 11-song catalog.
//   lane 'play-today': every song chord is already taught.
//   lane 'next-step' : exactly ONE chord beyond what is taught.
// Each match carries a 'why' citing the actual chord overlap (Rule 5),
// the public_domain flag, and the catalog disclaimer is always attached.
//
// Source data mirrors 07-app/content/song-progressions/progressions.json
// (SP01-SP11). Song TITLES + chord progressions only — NO riffs / melodies /
// lyrics / tabs, and NO artist names (Rule 5 / AMENDMENT-12/14).

export const CATALOG_DISCLAIMER =
  'Catalog: chord progressions and song titles only. No riffs, melodies, lyrics, ' +
  'or tabs are reproduced. Listed works are referenced by their public progression; ' +
  'this is functional harmony, not a transcription.';

export const SONG_CATALOG = [
  { id: 'SP01', title: 'Zombie', chords: ['Em', 'Ceasy', 'G', 'D'], public_domain: false },
  { id: 'SP02', title: 'Californication', chords: ['Am', 'Feasy', 'Ceasy', 'G'], public_domain: false },
  { id: 'SP03', title: 'Sweet Home Alabama', chords: ['D', 'Ceasy', 'G'], public_domain: false },
  { id: 'SP04', title: 'Highway to Hell', chords: ['A', 'D', 'G'], public_domain: false },
  { id: 'SP05', title: 'Johnny B. Goode', chords: ['A', 'D', 'E', 'A7'], public_domain: false },
  { id: 'SP06', title: 'The House of the Rising Sun', chords: ['Am', 'Ceasy', 'D', 'Feasy', 'E'], public_domain: true },
  { id: 'SP07', title: 'Nothing Else Matters', chords: ['Em', 'D', 'Ceasy'], public_domain: false },
  { id: 'SP08', title: 'Back In Black', chords: ['E', 'D', 'A'], public_domain: false },
  { id: 'SP09', title: 'Wish You Were Here', chords: ['Em', 'G', 'A7', 'Ceasy', 'D'], public_domain: false },
  { id: 'SP10', title: 'Stairway to Heaven', chords: ['Am', 'Ceasy', 'D', 'Feasy', 'G'], public_domain: false },
  { id: 'SP11', title: 'Amazing Grace', chords: ['G', 'C', 'D'], public_domain: true },
];

export function taughtSet(taughtChords = []) {
  return new Set(taughtChords.map((c) => String(c).trim()));
}

function matchWhy(song, taught, lane) {
  const have = song.chords.filter((c) => taught.has(c));
  const missing = song.chords.filter((c) => !taught.has(c));
  if (lane === 'play-today') {
    return 'You already have every chord in this loop (' + song.chords.join(', ') + ').';
  }
  // next-step: exactly one beyond
  return 'One chord beyond — you have ' + (have.join(', ') || 'none') +
    '; you would add ' + missing.join(', ') + '.';
}

export function discoverSongs({ taughtChords = [], lane = 'both' } = {}) {
  const taught = taughtSet(taughtChords);

  const playToday = SONG_CATALOG
    .filter((s) => s.chords.every((c) => taught.has(c)))
    .map((s) => ({
      id: s.id, title: s.title, chords: s.chords, public_domain: !!s.public_domain,
      lane: 'play-today',
      why: matchWhy(s, taught, 'play-today'),
    }));

  const nextStep = SONG_CATALOG
    .filter((s) => s.chords.some((c) => !taught.has(c)))
    .filter((s) => s.chords.filter((c) => !taught.has(c)).length === 1)
    .map((s) => ({
      id: s.id, title: s.title, chords: s.chords, public_domain: !!s.public_domain,
      lane: 'next-step',
      why: matchWhy(s, taught, 'next-step'),
    }));

  const result = {
    disclaimer: CATALOG_DISCLAIMER,
    playToday,
    nextStep,
    lane: lane || 'both',
  };
  if (lane === 'play-today') result.matches = playToday;
  else if (lane === 'next-step') result.matches = nextStep;
  else result.matches = [...playToday, ...nextStep];
  return result;
}

export default discoverSongs;
