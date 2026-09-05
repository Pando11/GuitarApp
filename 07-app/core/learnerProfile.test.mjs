// learnerProfile.test.mjs — T0.4 learner-profile self-test.
//
// Run: node 07-app/core/learnerProfile.test.mjs
//
// Plain node --test-free harness, matching sageCoach.test.mjs's style.

import { getProfile, setProfile, isComplete, PROFILE_SCHEMA, _resetProfile } from './learnerProfile.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== learnerProfile self-test ===');

// Start clean.
_resetProfile();

// ---------------------------------------------------------------------------
// Schema sanity.
// ---------------------------------------------------------------------------
check('PROFILE_SCHEMA has ageBand options', Array.isArray(PROFILE_SCHEMA.ageBand) && PROFILE_SCHEMA.ageBand.includes('under-13'));
check('PROFILE_SCHEMA has experience options', Array.isArray(PROFILE_SCHEMA.experience) && PROFILE_SCHEMA.experience.includes('never-held-one'));
check('PROFILE_SCHEMA has goal options', Array.isArray(PROFILE_SCHEMA.goal) && PROFILE_SCHEMA.goal.includes('play-a-song'));
check('PROFILE_SCHEMA has minutesPerDay options', Array.isArray(PROFILE_SCHEMA.minutesPerDay) && PROFILE_SCHEMA.minutesPerDay.includes(15));

// ---------------------------------------------------------------------------
// Empty profile starts incomplete.
// ---------------------------------------------------------------------------
check('fresh profile is empty object', Object.keys(getProfile()).length === 0);
check('fresh profile is NOT complete', isComplete() === false);

// ---------------------------------------------------------------------------
// Partial set — still incomplete.
// ---------------------------------------------------------------------------
setProfile({ ageBand: '18-34' });
check('after 1 field, profile still NOT complete', isComplete() === false);
check('partial set persisted the field', getProfile().ageBand === '18-34');

// ---------------------------------------------------------------------------
// Round-trip: fill every field, read it back, confirm completeness.
// ---------------------------------------------------------------------------
setProfile({ experience: 'returning-player' });
setProfile({ goal: 'play-a-song' });
setProfile({ minutesPerDay: 15 });

const full = getProfile();
check('round-trip: ageBand persisted', full.ageBand === '18-34');
check('round-trip: experience persisted', full.experience === 'returning-player');
check('round-trip: goal persisted', full.goal === 'play-a-song');
check('round-trip: minutesPerDay persisted', full.minutesPerDay === 15);
check('profile is COMPLETE once all four fields set', isComplete() === true);

// ---------------------------------------------------------------------------
// COPPA flag value is a recognized, storable age band (not consent handling).
// ---------------------------------------------------------------------------
setProfile({ ageBand: 'under-13' });
check('under-13 age band is accepted and stored', getProfile().ageBand === 'under-13');
// Re-set to a non-flag value for later checks' independence.
setProfile({ ageBand: '18-34' });

// ---------------------------------------------------------------------------
// Rejected invalid values must throw and must NOT corrupt the stored profile.
// ---------------------------------------------------------------------------
let threwInvalidAge = false;
try {
  setProfile({ ageBand: 'not-a-real-band' });
} catch {
  threwInvalidAge = true;
}
check('invalid age band is rejected (throws)', threwInvalidAge);
check('profile unchanged after rejected invalid age band', getProfile().ageBand === '18-34');

let threwUnknownField = false;
try {
  setProfile({ favoriteColor: 'blue' });
} catch {
  threwUnknownField = true;
}
check('unknown field is rejected (throws)', threwUnknownField);

let threwInvalidMinutes = false;
try {
  setProfile({ minutesPerDay: 999 });
} catch {
  threwInvalidMinutes = true;
}
check('invalid minutesPerDay is rejected (throws)', threwInvalidMinutes);

// ---------------------------------------------------------------------------
// Skippable: a fresh profile can be queried without throwing at all.
// ---------------------------------------------------------------------------
_resetProfile();
let noThrowOnEmptyRead = true;
try { getProfile(); isComplete(); } catch { noThrowOnEmptyRead = false; }
check('reading an empty/skipped profile never throws', noThrowOnEmptyRead);

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) { console.log('OVERALL: PASS'); process.exit(0); }
else { console.log('OVERALL: FAIL'); process.exit(1); }
