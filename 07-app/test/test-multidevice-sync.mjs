#!/usr/bin/env node
// test-multidevice-sync.mjs — End-to-end multi-device sync test
// Usage: node test/test-multidevice-sync.mjs
//
// Prerequisites:
//   1. PocketBase running: cd ~/pocketbase-dev && ./pocketbase serve
//   2. Admin account created at http://127.0.0.1:8090/_/
//   3. Collections created: student_memory and settings
//   4. Set ADMIN_EMAIL, ADMIN_PASSWORD, POCKETBASE_URL below

import {
  generateRecoveryPhrase,
  pushMemory,
  pullMemory,
} from '../core/pocketbaseSync.js';

import { PracticeStore } from '../core/practiceStore.js';

// Configuration
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@guitarapp.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminTestPass123!';

let passed = 0;
let failed = 0;

function check(name, cond, details = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ PASS  ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL  ${name}`);
    if (details) console.error(`         ${details}`);
  }
}

async function getAdminToken() {
  try {
    const res = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) {
      throw new Error(`Auth failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.token) {
      throw new Error('No token in response');
    }
    return data.token;
  } catch (e) {
    throw new Error(`Failed to get admin token: ${e.message}\n\nMake sure:\n1. PocketBase is running (http://127.0.0.1:8090)\n2. Admin account exists\n3. Collections are created`);
  }
}

async function verifyCollections(adminToken) {
  const res = await fetch(`${POCKETBASE_URL}/api/collections`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch collections: ${res.status}`);

  const data = await res.json();
  const collections = data.items.map(c => c.name);

  const hasStudentMemory = collections.includes('student_memory');
  const hasSettings = collections.includes('settings');

  if (!hasStudentMemory || !hasSettings) {
    throw new Error(`Missing collections:\n  student_memory: ${hasStudentMemory}\n  settings: ${hasSettings}`);
  }

  return collections;
}

async function testMultiDeviceSync() {
  console.log('\n========================================');
  console.log('Multi-Device Sync Test (PocketBase Live)');
  console.log('========================================\n');

  console.log('SETUP: Connecting to PocketBase...');
  console.log(`  URL: ${POCKETBASE_URL}`);
  console.log(`  Admin: ${ADMIN_EMAIL}`);

  let adminToken;
  try {
    adminToken = await getAdminToken();
    console.log('  ✓ Admin authentication successful');
  } catch (e) {
    console.error(`  ✗ FATAL: ${e.message}`);
    process.exit(1);
  }

  console.log('\nVERIFY: Collections exist...');
  let collections;
  try {
    collections = await verifyCollections(adminToken);
    console.log(`  ✓ Collections found: ${collections.filter(c => !c.startsWith('_')).join(', ')}`);
  } catch (e) {
    console.error(`  ✗ FATAL: ${e.message}`);
    process.exit(1);
  }

  const studentId = 'test-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  const phrase = generateRecoveryPhrase();

  console.log('\n========================================');
  console.log('TEST 1: Device A - Create Practice Session');
  console.log('========================================');

  const storeA = new PracticeStore();
  const sessionA1 = storeA.startSession('L01');
  storeA.logAttempt(sessionA1, { chordName: 'Em', verdict: 'pass', centsOff: 0 });
  storeA.logAttempt(sessionA1, { chordName: 'D', verdict: 'pass', centsOff: -5 });
  storeA.logAttempt(sessionA1, { chordName: 'G', verdict: 'fail', centsOff: 50 });
  storeA.finalizeSession(sessionA1, { completed: true, durationSec: 900 });
  storeA.recordMessage({ channel: 'sms', body: 'Great progress!' });

  console.log(`  Student ID: ${studentId}`);
  console.log(`  Recovery phrase: "${phrase}"`);
  console.log(`  Sessions: ${storeA.sessions.length}`);
  console.log(`  Attempts: ${storeA.sessions[0].attempts.length}`);
  console.log(`  Practice time: ${storeA.practiceMinutesTotal()} minutes`);
  console.log(`  Messages: ${storeA.messageLog.length}`);

  console.log('\n========================================');
  console.log('TEST 2: Device A - Push to PocketBase');
  console.log('========================================');

  let recordId;
  try {
    const record = await pushMemory(
      studentId,
      storeA.toJSON(),
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    recordId = record.id;
    console.log(`  Record ID: ${recordId}`);
    console.log(`  Ciphertext length: ${record.ciphertext.length} bytes`);
    console.log(`  Updated at: ${record.updated_at}`);

    check('Push successful', !!recordId);
    check('Has ciphertext', !!record.ciphertext);
    check('Has IV', !!record.iv);
    check('Has salt', !!record.salt);
    check('Has timestamp', !!record.updated_at);
  } catch (e) {
    console.error(`  ✗ PUSH FAILED: ${e.message}`);
    failed++;
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TEST 3: Device B - Pull from PocketBase');
  console.log('========================================');

  let storeB;
  try {
    const pulledData = await pullMemory(
      studentId,
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    storeB = new PracticeStore(pulledData);

    console.log(`  Sessions: ${storeB.sessions.length}`);
    console.log(`  Attempts: ${storeB.sessions[0]?.attempts.length || 0}`);
    console.log(`  Practice time: ${storeB.practiceMinutesTotal()} minutes`);
    console.log(`  Messages: ${storeB.messageLog.length}`);

    const skillMap = storeB.getSkillMap();
    console.log(`  Skill map: ${JSON.stringify(skillMap)}`);

    check('Pull successful', !!storeB);
    check('Sessions count matches', storeB.sessions.length === 1);
    check('Attempts preserved', storeB.sessions[0].attempts.length === 3);
    check('Practice time preserved', storeB.practiceMinutesTotal() === 15);
    check('Messages preserved', storeB.messageLog.length === 1);
    check('Skill map has Em', !!skillMap.Em);
    check('Em state is clean', skillMap.Em?.state === 'clean');
    check('D state is clean', skillMap.D?.state === 'clean');
    check('G state is struggling', skillMap.G?.state === 'struggling');
  } catch (e) {
    console.error(`  ✗ PULL FAILED: ${e.message}`);
    failed++;
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TEST 4: Device B - Continue Practice');
  console.log('========================================');

  const sessionB2 = storeB.startSession('L02');
  storeB.logAttempt(sessionB2, { chordName: 'A', verdict: 'pass', centsOff: 0 });
  storeB.logAttempt(sessionB2, { chordName: 'Am', verdict: 'unsure', centsOff: 30 });
  storeB.finalizeSession(sessionB2, { completed: true, durationSec: 600 });
  storeB.recordMessage({ channel: 'email', body: 'Weekly progress report' });

  console.log(`  Added session for L02`);
  console.log(`  New attempts: 2`);
  console.log(`  Total practice time: ${storeB.practiceMinutesTotal()} minutes (was 15)`);
  console.log(`  Total messages: ${storeB.messageLog.length} (was 1)`);

  check('Device B session added', storeB.sessions.length === 2);
  check('Device B new attempts logged', storeB.sessions[1].attempts.length === 2);

  console.log('\n========================================');
  console.log('TEST 5: Device B - Push Updated Data');
  console.log('========================================');

  try {
    const record2 = await pushMemory(
      studentId,
      storeB.toJSON(),
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    console.log(`  Record updated: ${record2.id}`);
    console.log(`  Updated at: ${record2.updated_at}`);

    check('Update successful', record2.id === recordId);
    check('Timestamp advanced', new Date(record2.updated_at) > new Date(storeA.sessions[0].ts * 1000));
  } catch (e) {
    console.error(`  ✗ UPDATE FAILED: ${e.message}`);
    failed++;
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TEST 6: Device A - Pull Updated Data');
  console.log('========================================');

  try {
    const pulledData2 = await pullMemory(
      studentId,
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    const storeA2 = new PracticeStore(pulledData2);

    console.log(`  Sessions: ${storeA2.sessions.length} (was ${storeA.sessions.length})`);
    console.log(`  Practice time: ${storeA2.practiceMinutesTotal()} minutes (was ${storeA.practiceMinutesTotal()})`);
    console.log(`  Messages: ${storeA2.messageLog.length} (was ${storeA.messageLog.length})`);

    const skillMap2 = storeA2.getSkillMap();
    console.log(`  Skill map now includes A: ${!!skillMap2.A}`);

    check('Device A sees updated data', storeA2.sessions.length === 2);
    check('Practice time updated', storeA2.practiceMinutesTotal() === 25);
    check('Messages updated', storeA2.messageLog.length === 2);
    check('Skill map includes A', !!skillMap2.A);
  } catch (e) {
    console.error(`  ✗ PULL FAILED: ${e.message}`);
    failed++;
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TEST 7: Wrong Passphrase Rejection');
  console.log('========================================');

  let wrongPullThrew = false;
  try {
    await pullMemory(
      studentId,
      'completely-wrong-recovery-phrase',
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
  } catch (e) {
    wrongPullThrew = true;
    console.log(`  Exception (expected): ${e.message.substring(0, 80)}...`);
  }

  check('Wrong passphrase rejected', wrongPullThrew);

  console.log('\n========================================');
  console.log('TEST 8: Offline Fallback');
  console.log('========================================');

  try {
    // This test uses offline mode (live: false)
    const record3 = await pushMemory(
      studentId + '-offline',
      storeA2.toJSON(),
      phrase,
      {
        // Note: no live: true, so no network required
        baseUrl: POCKETBASE_URL,
      }
    );

    console.log(`  Offline push created record shape: ${!!record3.ciphertext}`);

    const pulled3 = await pullMemory(record3, phrase);
    const storeA3 = new PracticeStore(pulled3);

    console.log(`  Offline pull roundtrip successful`);
    console.log(`  Decrypted sessions: ${storeA3.sessions.length}`);

    check('Offline push works', !!record3.ciphertext);
    check('Offline pull roundtrip works', storeA3.sessions.length > 0);
  } catch (e) {
    console.error(`  ✗ OFFLINE TEST FAILED: ${e.message}`);
    failed++;
  }

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Student ID: ${studentId}`);
  console.log(`Recovery Phrase: "${phrase}"`);
  console.log(`\nYou can manually inspect the record at:`);
  console.log(`${POCKETBASE_URL}/_/admin/collections/student_memory/records/${recordId}`);

  if (failed === 0) {
    console.log('\n✓✓✓ ALL SYNC TESTS PASSED ✓✓✓');
    console.log('Cross-device sync is working correctly\n');
    process.exit(0);
  } else {
    console.log('\n✗✗✗ SOME SYNC TESTS FAILED ✗✗✗');
    console.log('Review the failures above\n');
    process.exit(1);
  }
}

// Run the test
testMultiDeviceSync().catch(e => {
  console.error('\n✗✗✗ TEST CRASHED ✗✗✗');
  console.error(e.message);
  console.error('\nDebugging tips:');
  console.error('1. Check PocketBase is running: http://127.0.0.1:8090/api/health');
  console.error('2. Check admin credentials are correct');
  console.error('3. Check collections exist: http://127.0.0.1:8090/_/admin/collections');
  console.error('4. Check browser console for crypto errors');
  process.exit(1);
});
