// stylisticExplorer.test.mjs — node self-test (prints PASS, exits 0).
import { exploreStyle, STYLE_LIBRARY } from './stylisticExplorer.js';
import assert from 'node:assert';

const out = exploreStyle('G - D - Em - C');
assert.ok(out.styleCategory, 'styleCategory present');
assert.ok(['folk', 'blues', 'punk', 'ballad'].includes(out.styleCategory), 'category is a style category, not an artist');
assert.ok(/^1 & 2 & 3 & 4 &$/.test(out.countsPerBar), 'valid counts-per-bar string');
assert.ok(out.pattern && out.arrows && out.rhythmFeel, 'pattern/arrows/rhythmFeel present');
assert.ok(Array.isArray(out.bar) && out.bar.length === 4, 'bar normalised to 4 chords');

// No artist-name leakage anywhere in the output.
const BANNED_ARTISTS = ['Cranberries', 'Chili', 'Skynyrd', 'AC/DC', 'Berry', 'Metallica',
  'Pink Floyd', 'Zeppelin', 'Newton', 'Traditional'];
const dump = JSON.stringify(out).toLowerCase();
for (const a of BANNED_ARTISTS) {
  assert.ok(!dump.includes(a.toLowerCase()), 'no artist name leakage: ' + a);
}

// explicit style override works
const folk = exploreStyle('G - D - Em - C', { styleCategory: 'folk' });
assert.equal(folk.styleCategory, 'folk');

// invalid explicit style falls back to a real library category
const fb = exploreStyle('Em - C', { styleCategory: 'nonexistent' });
assert.ok(STYLE_LIBRARY[fb.styleCategory], 'fallback yields a real library category');

// single-chord input still yields a valid counts string
const single = exploreStyle('Am');
assert.ok(/^1 & 2 & 3 & 4 &$/.test(single.countsPerBar));

console.log('stylisticExplorer PASS — category=' + out.styleCategory + ', counts=' + out.countsPerBar);
process.exit(0);
