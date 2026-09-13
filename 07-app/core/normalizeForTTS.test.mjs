// normalizeForTTS.test.mjs — node self-test (prints PASS, exits 0).
import { normalizeForTTS, normalizeChordSymbols, stripAIIsms } from './normalizeForTTS.js';
import assert from 'node:assert';

// -- normalizeChordSymbols: whole-word chord tokens only ----------------------

{
  assert.equal(normalizeChordSymbols('Em'), 'E minor');
  assert.equal(normalizeChordSymbols('C'), 'C');
  assert.equal(normalizeChordSymbols('G'), 'G');
  assert.equal(normalizeChordSymbols('Am'), 'A minor');
  assert.equal(normalizeChordSymbols('D7'), 'D seven');
  assert.equal(normalizeChordSymbols('F#m'), 'F sharp minor');
  assert.equal(normalizeChordSymbols('Bbmaj7'), 'B flat major seven');
  assert.equal(normalizeChordSymbols('Gsus4'), 'G sus four');
}

{
  // in a sentence, surrounded by prose
  const out = normalizeChordSymbols('Try switching from Em to Am, then resolve to D7.');
  assert.equal(out, 'Try switching from E minor to A minor, then resolve to D seven.');
}

{
  // chord-shaped substrings inside other words must not be touched
  assert.equal(normalizeChordSymbols('Amazing work on that G chord!'), 'Amazing work on that G chord!');
  assert.equal(normalizeChordSymbols('Bad habits are hard to break.'), 'Bad habits are hard to break.');
  assert.equal(normalizeChordSymbols('Dim the lights.'), 'Dim the lights.'); // "Dim" not "dim" quality alone: capital D + "im" isn't a recognized token shape... see below
}

// -- stripAIIsms: literal phrase removal, not general rewriting --------------

{
  assert.equal(
    stripAIIsms('Furthermore, you should try again.'),
    'you should try again.',
  );
  assert.equal(
    stripAIIsms('It is important to note that timing matters.'),
    'timing matters.',
  );
  assert.equal(
    stripAIIsms('Simply strum down on beat one.'),
    'strum down on beat one.',
  );
  // untouched when absent
  assert.equal(stripAIIsms('Nice work today.'), 'Nice work today.');
}

// -- normalizeForTTS: combined pass -------------------------------------------

{
  const out = normalizeForTTS('Furthermore, simply switch from Em to Am and you are done.');
  // "Furthermore, " is stripped verbatim; the bare word "simply" (lowercase,
  // mid-sentence) is untouched by design — only the exact phrases listed are
  // stripped, this is not a general style rewrite.
  assert.equal(out, 'simply switch from E minor to A minor and you are done.');
}

{
  assert.equal(normalizeForTTS(''), '');
  assert.equal(normalizeForTTS(null), null);
  assert.equal(normalizeForTTS(undefined), undefined);
}

{
  // whitespace left behind by a stripped phrase is collapsed, not doubled
  const out = normalizeForTTS('It is important to note that   D7 resolves to G.');
  assert.equal(out, 'D seven resolves to G.');
}

console.log('PASS normalizeForTTS.test.mjs');
