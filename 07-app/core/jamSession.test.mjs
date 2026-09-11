// jamSession.test.mjs — V2-JAM self-test: PART A (on-device grading/facts)
// plus PART B (the real generateResponse() fetch call to the coach
// service's /jam-session/generate route, mocked here — no real network
// calls in this test).
//
// Run:  node 07-app/core/jamSession.test.mjs
//
// PART A (on-device grading + facts emit) MUST PASS with exit 0.
// PART B (generative response) is UNBLOCKED (TIER-1B Wave 3): generateResponse()
// now makes a real fetch call in production. Here it is exercised against a
// mocked fetchImpl (options.fetchImpl) covering: a real success payload/response
// round trip, a network error, a non-200 status, and a malformed 200 body —
// each of the failure cases must throw a typed error, never a silent fake
// success.

import { gradeStudentPhrase, emitFacts, generateResponse, defaultJamSessionUrl } from './jamSession.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}`);
  }
}
function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

console.log('\n=== jamSession PART A (on-device) self-test ===');

// --- Case 1: perfect phrase -> accuracy 1.0 -------------------------------
const KNOWN = ['C', 'G', 'Em'];
const g1 = gradeStudentPhrase(['C', 'G', 'Em'], KNOWN);
console.log('  perfect grade:', JSON.stringify(g1));
check('perfect: matched all 3 known chords', g1.matched.length === 3);
check('perfect: missed none', g1.missed.length === 0);
check('perfect: accuracy === 1.0', approx(g1.accuracy, 1.0));

// --- Case 2: one wrong chord -> missed [Am], accuracy 2/3 -----------------
const g2 = gradeStudentPhrase(['C', 'G', 'Am'], KNOWN);
console.log('  wrong-chord grade:', JSON.stringify(g2));
check('wrong: matched 2 chords', g2.matched.length === 2);
check('wrong: missed === ["Am"]', g2.missed.length === 1 && g2.missed[0] === 'Am');
check('wrong: accuracy === 2/3', approx(g2.accuracy, 2 / 3));

// --- Case 3: emitFacts returns ONLY the fact object (no audio) ------------
const f = emitFacts(g2);
console.log('  emitFacts:', JSON.stringify(f));
const keys = Object.keys(f).sort();
check(
  'emitFacts keys exactly [accuracy, chordsMatched, chordsMissed]',
  JSON.stringify(keys) === JSON.stringify(['accuracy', 'chordsMatched', 'chordsMissed']),
);
check(
  'emitFacts.accuracy is a number in [0, 1]',
  typeof f.accuracy === 'number' && f.accuracy >= 0 && f.accuracy <= 1,
);
check('emitFacts has NO audio / audioUrl / blob field', !('audio' in f) && !('audioUrl' in f) && !('blob' in f));
check('emitFacts.chordsMissed === ["Am"]', f.chordsMissed.length === 1 && f.chordsMissed[0] === 'Am');
check('emitFacts.chordsMatched === ["C","G"]', f.chordsMatched.length === 2 && f.chordsMatched[0] === 'C' && f.chordsMatched[1] === 'G');

// --- Case 4: normalization sanity (case + minor alias) --------------------
const g3 = gradeStudentPhrase(['c', 'g', 'eM'], KNOWN);
check('normalization: lowercase+alias matches', g3.matched.length === 3 && g3.missed.length === 0);

// --- Case 5: empty known set is safe (no divide-by-zero) ------------------
const g4 = gradeStudentPhrase(['C'], []);
check('empty known: accuracy 0, no crash', g4.accuracy === 0 && Array.isArray(g4.matched));

// === PART B: generateResponse() — real fetch envelope, mocked network ======
console.log('\n=== jamSession PART B (generateResponse — mocked fetch) ===');

// defaultJamSessionUrl(): derives the /jam-session/generate route the same
// way chatEngine.js's defaultCoachUrl() derives /coach — from
// globalThis.GUITARAPP_COACH_URL when set, else the local loopback fallback.
check(
  'defaultJamSessionUrl(): loopback fallback when GUITARAPP_COACH_URL is unset',
  defaultJamSessionUrl() === 'http://127.0.0.1:8787/jam-session/generate',
);
globalThis.GUITARAPP_COACH_URL = 'https://coach.example.com/coach';
check(
  'defaultJamSessionUrl(): derives sibling route from a configured GUITARAPP_COACH_URL',
  defaultJamSessionUrl() === 'https://coach.example.com/jam-session/generate',
);
delete globalThis.GUITARAPP_COACH_URL;

// --- Success path: a real payload is sent, a real {audioUrl} comes back ---
{
  let sentUrl = null;
  let sentInit = null;
  const fetchImpl = async (url, init) => {
    sentUrl = url;
    sentInit = init;
    return {
      ok: true,
      status: 200,
      json: async () => ({ audioUrl: 'https://v3b.fal.media/files/b/example/response.wav' }),
    };
  };
  const result = await generateResponse(f, { fetchImpl });
  check('success: resolves with a real audioUrl string', typeof result.audioUrl === 'string' && result.audioUrl.length > 0);
  check('success: audioUrl matches the mocked server response', result.audioUrl === 'https://v3b.fal.media/files/b/example/response.wav');
  check('success: POSTed to the default jam-session URL', sentUrl === 'http://127.0.0.1:8787/jam-session/generate');
  check('success: request method is POST', !!sentInit && sentInit.method === 'POST');
  check('success: request body is the real emitFacts() payload, not invented data', (() => {
    if (!sentInit || typeof sentInit.body !== 'string') return false;
    const body = JSON.parse(sentInit.body);
    return JSON.stringify(body.chordsMatched) === JSON.stringify(f.chordsMatched)
      && JSON.stringify(body.chordsMissed) === JSON.stringify(f.chordsMissed)
      && body.accuracy === f.accuracy;
  })());
  check('success: no audio/blob field ever sent to the network', (() => {
    if (!sentInit || typeof sentInit.body !== 'string') return false;
    const body = JSON.parse(sentInit.body);
    return !('audio' in body) && !('audioUrl' in body) && !('blob' in body);
  })());
}

// --- Failure: network error (fetch itself throws) -------------------------
{
  const fetchImpl = async () => { throw new Error('getaddrinfo ENOTFOUND coach.example.com'); };
  let err = null;
  try { await generateResponse(f, { fetchImpl }); } catch (e) { err = e; }
  check('network error: generateResponse throws', err !== null);
  check('network error: typed as GEN_NETWORK_ERROR', !!err && err.code === 'GEN_NETWORK_ERROR');
}

// --- Failure: non-200 response (e.g. 503 musicgen_not_configured) ---------
{
  const fetchImpl = async () => ({
    ok: false,
    status: 503,
    text: async () => JSON.stringify({ error: 'musicgen_not_configured' }),
  });
  let err = null;
  try { await generateResponse(f, { fetchImpl }); } catch (e) { err = e; }
  check('non-200: generateResponse throws', err !== null);
  check('non-200: typed as GEN_SERVER_ERROR', !!err && err.code === 'GEN_SERVER_ERROR');
  check('non-200: carries the real HTTP status', !!err && err.status === 503);
}

// --- Failure: non-200, a 502 musicgen_upstream_failed ----------------------
{
  const fetchImpl = async () => ({
    ok: false,
    status: 502,
    text: async () => JSON.stringify({ error: 'musicgen_upstream_failed' }),
  });
  let err = null;
  try { await generateResponse(f, { fetchImpl }); } catch (e) { err = e; }
  check('502 upstream failure: generateResponse throws', err !== null);
  check('502 upstream failure: typed as GEN_SERVER_ERROR', !!err && err.code === 'GEN_SERVER_ERROR');
}

// --- Failure: malformed response — 200 but body isn't valid JSON ----------
{
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new SyntaxError('Unexpected token in JSON'); },
  });
  let err = null;
  try { await generateResponse(f, { fetchImpl }); } catch (e) { err = e; }
  check('malformed JSON: generateResponse throws', err !== null);
  check('malformed JSON: typed as GEN_MALFORMED_RESPONSE', !!err && err.code === 'GEN_MALFORMED_RESPONSE');
}

// --- Failure: malformed response — 200, valid JSON, but no audioUrl -------
{
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ notAudioUrl: 'nope' }),
  });
  let err = null;
  try { await generateResponse(f, { fetchImpl }); } catch (e) { err = e; }
  check('missing audioUrl: generateResponse throws', err !== null);
  check('missing audioUrl: typed as GEN_MALFORMED_RESPONSE', !!err && err.code === 'GEN_MALFORMED_RESPONSE');
  check('missing audioUrl: never silently returns a fake/empty audioUrl', !(err && 'audioUrl' in err));
}

// --- Failure: malformed response — 200, audioUrl present but empty string -
{
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ audioUrl: '' }),
  });
  let err = null;
  try { await generateResponse(f, { fetchImpl }); } catch (e) { err = e; }
  check('empty audioUrl: generateResponse throws rather than returning ""', err !== null && err.code === 'GEN_MALFORMED_RESPONSE');
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('OVERALL: PASS');
  process.exit(0);
} else {
  console.log('OVERALL: FAIL');
  process.exit(1);
}
