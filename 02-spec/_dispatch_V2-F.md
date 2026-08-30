REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp
LEGAL FLOOR (never violate): Rule 5 — prose only, cites stored numbers / real data, never invents musical opinion/praise. Rule 9 — commercial-clean + free ONLY (no Suno/ElevenLabs/etc). Rule 2 — no camera/hand tracking. Rule 8 — chord correctness 0 errors/0 warnings.

YOUR FILE OWNERSHIP (write ONLY these NEW files): 07-app/core/practiceRemix.js, 07-app/core/stylisticExplorer.js, 07-app/core/songDiscovery.js, 07-app/core/celebration.js. Do NOT edit app.js, teacher.js, practiceStore.js, sageCoach.js, storyMemory.js, entitlementStore.js, or any other agent's file. Read them only.

CONTEXT: Three prototype HTML files exist in 06-prototypes/ to PORT from (do NOT copy HTML; port the LOGIC into clean ES modules):
- 06-prototypes/practice-engine/practice-remix-q5-prototype.html  -> practiceRemix.js
- 06-prototypes/song-styles-q5-prototype.html                     -> stylisticExplorer.js
- 06-prototypes/song-discovery-q5-prototype.html                  -> songDiscovery.js
The 11-song catalog lives at 07-app/content/song-progressions/progressions.json (SP01-SP11, each has honest_claim + public_domain flags). SP06 + SP11 are public domain.

BUILD (4 modules, each Rule-5-safe, each with a node self-test .test.mjs that prints PASS and exits 0):

1. practiceRemix.js (A4.5): function remixPlan(plan, engagement) -> re-sequences an adaptive practice plan into ONE of several framings. Port the prototype's G<->D weak-spot, fluency 0.25, 15/min, THREE framings (Tempo challenge / Play-along groove / Calm slow). Sequencer uses ENGAGEMENT DATA ONLY (counts/timings) — NO personality/mood inference. Self-test feeds a fake plan + fake engagement, asserts 3 framings produced and output references only real inputs.

2. stylisticExplorer.js (A4.3): function exploreStyle(chordOrProgression) -> {pattern, rhythmFeel, countsPerBar, styleCategory} for ONE bar with counts. Style expressed as CATEGORY only (e.g. 'folk', 'ballad') — NO artist names (AMENDMENT-14). Self-test asserts no artist-name leakage and a valid counts string.

3. songDiscovery.js (A4.1): function discoverSongs({taughtChords, lane}) -> two-lane match on the 11-song catalog: lane 'play-today' (matches taught chords) and lane 'next-step' (one chord beyond). Each match includes a 'why' string that cites the actual chord overlap (Rule 5). ALWAYS attach the catalog disclaimer + the public_domain flag per song. Self-test feeds a fake taught-chord set, asserts returned songs are a subset of SP01-SP11, each has a 'why' citing a real chord, and PD flag mirrors progressions.json.

4. celebration.js (A4.4): function buildCelebration(numbers) -> a celebration object/text from STORED NUMBERS ONLY (Rule 5): e.g. streaks, chords-cleaned counts, days-practiced. NO invented praise. Two-layer privacy note (local-first). Self-test feeds fake numbers, asserts output contains real numbers and NO banned praise words ('great','natural','talented','gifted','prodigy','star').

REPORT (verifiable handles): 4 module paths + 4 test paths + the actual node stdout of all 4 tests (all PASS) + one-line description of each module's export signature.
