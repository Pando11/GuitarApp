#!/usr/bin/env node
// test-conflict-resolution.mjs — Conflict resolution (last-write-wins) test
// Usage: node test/test-conflict-resolution.mjs
//
// Simulates scenario where both devices modify data offline,
// then sync to PocketBase (demonstrating last-write-wins behavior)

import {
  generateRecoveryPhrase,
  pushMemory,
  pullMemory,
} from '../core/pocketbaseSync.js';

import { PracticeStore } from '../core/practiceStore.js';

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
  const res = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function testConflictResolution() {
  console.log('\n========================================');
  console.log('Conflict Resolution Test (Last-Write-Wins)');
  console.log('========================================\n');

  console.log('SETUP: Connecting to PocketBase...');
  let adminToken;
  try {
    adminToken = await getAdminToken();
    console.log('  ✓ Admin authentication successful');
  } catch (e) {
    console.error(`  ✗ FATAL: ${e.message}`);
    process.exit(1);
  }

  const studentId = 'conflict-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  const phrase = generateRecoveryPhrase();

  console.log('\n========================================');
  console.log('SETUP: Push Initial State (Base)');
  console.log('========================================');

  const baseStore = new PracticeStore();
  baseStore.startSession('L01');
  console.log(`  Initial state: 1 session (L01)`);

  try {
    await pushMemory(
      studentId,
      baseStore.toJSON(),
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    console.log(`  ✓ Base state pushed to PocketBase`);
  } catch (e) {
    console.error(`  ✗ FATAL: Push failed: ${e.message}`);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('SCENARIO: Both Devices Offline');
  console.log('========================================');

  // Device A pulls and modifies
  console.log('\n  Device A: Pull initial state');
  let storeA;
  try {
    const dataA = await pullMemory(
      studentId,
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    storeA = new PracticeStore(dataA);
  } catch (e) {
    console.error(`  ✗ Device A pull failed: ${e.message}`);
    process.exit(1);
  }

  console.log(`    Pulled: ${storeA.sessions.length} session(s)`);
  console.log('    [Device A goes OFFLINE]');
  console.log('    Device A adds session L02');
  storeA.startSession('L02');
  console.log(`    Device A now has: ${storeA.sessions.length} sessions`);

  // Device B pulls and modifies differently
  console.log('\n  Device B: Pull initial state (same as A initially)');
  let storeB;
  try {
    const dataB = await pullMemory(
      studentId,
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    storeB = new PracticeStore(dataB);
  } catch (e) {
    console.error(`  ✗ Device B pull failed: ${e.message}`);
    process.exit(1);
  }

  console.log(`    Pulled: ${storeB.sessions.length} session(s)`);
  console.log('    [Device B goes OFFLINE]');
  console.log('    Device B adds session L03 (DIFFERENT from A)');
  storeB.startSession('L03');
  console.log(`    Device B now has: ${storeB.sessions.length} sessions`);

  check('Both devices diverged', storeA.sessions[1].lessonId !== storeB.sessions[1].lessonId);

  console.log('\n========================================');
  console.log('CONFLICT: Devices Come Online & Sync');
  console.log('========================================');

  console.log('\n  T1: Device A syncs first (pushes L02)');
  try {
    const recordA = await pushMemory(
      studentId,
      storeA.toJSON(),
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    console.log(`    ✓ Device A pushed (record updated at ${recordA.updated_at})`);
  } catch (e) {
    console.error(`    ✗ Device A push failed: ${e.message}`);
    failed++;
  }

  console.log('\n  T2: Device B syncs (pushes L03, overwrites Device A)');
  try {
    const recordB = await pushMemory(
      studentId,
      storeB.toJSON(),
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    console.log(`    ✓ Device B pushed (record updated at ${recordB.updated_at})`);
  } catch (e) {
    console.error(`    ✗ Device B push failed: ${e.message}`);
    failed++;
  }

  console.log('\n========================================');
  console.log('RESULT: Last-Write-Wins Behavior');
  console.log('========================================');

  console.log('\n  Both devices pull final state (should see Device B\'s changes)');

  let finalA, finalB;
  try {
    finalA = await pullMemory(
      studentId,
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
    finalB = await pullMemory(
      studentId,
      phrase,
      {
        baseUrl: POCKETBASE_URL,
        live: true,
        authToken: adminToken,
      }
    );
  } catch (e) {
    console.error(`  ✗ FATAL: Final pull failed: ${e.message}`);
    process.exit(1);
  }

  const finalStoreA = new PracticeStore(finalA);
  const finalStoreB = new PracticeStore(finalB);

  console.log(`\n  Device A (pulled): ${finalStoreA.sessions.length} sessions`);
  console.log(`    Sessions: ${finalStoreA.sessions.map(s => s.lessonId).join(', ')}`);

  console.log(`\n  Device B (pulled): ${finalStoreB.sessions.length} sessions`);
  console.log(`    Sessions: ${finalStoreB.sessions.map(s => s.lessonId).join(', ')}`);

  // Check results
  const hasL01A = finalStoreA.sessions.some(s => s.lessonId === 'L01');
  const hasL02A = finalStoreA.sessions.some(s => s.lessonId === 'L02');
  const hasL03A = finalStoreA.sessions.some(s => s.lessonId === 'L03');

  const hasL01B = finalStoreB.sessions.some(s => s.lessonId === 'L01');
  const hasL02B = finalStoreB.sessions.some(s => s.lessonId === 'L02');
  const hasL03B = finalStoreB.sessions.some(s => s.lessonId === 'L03');

  console.log('\n  Analysis:');
  console.log(`    Device A has L01: ${hasL01A} (expected: true)`);
  console.log(`    Device A has L02: ${hasL02A} (expected: false, lost to Device B)`);
  console.log(`    Device A has L03: ${hasL03A} (expected: true, from Device B's write)`);

  console.log(`    Device B has L01: ${hasL01B} (expected: true)`);
  console.log(`    Device B has L02: ${hasL02B} (expected: false, lost to Device B's own write)`);
  console.log(`    Device B has L03: ${hasL03B} (expected: true)`);

  check('Last-write-wins: Device A sees Device B\'s changes', hasL03A && !hasL02A);
  check('Last-write-wins: Device B sees own changes', hasL03B && !hasL02B);
  check('Consistent state: Both see same data', finalStoreA.sessions.length === finalStoreB.sessions.length);
  check('Data loss acknowledged: L02 overwritten by L03', !hasL02A && !hasL02B);

  console.log('\n========================================');
  console.log('KEY FINDINGS');
  console.log('========================================');
  console.log(`
  1. Last-Write-Wins Confirmed:
     - Device B's push (time T2) overwrote Device A's push (time T1)
     - This is the current conflict resolution strategy

  2. Data Loss Scenario:
     - Offline changes on Device A (L02) were lost
     - This is EXPECTED with last-write-wins
     - Use if: Occasional sync and conflict is rare
     - Consider alternatives if: Frequent conflicts

  3. To Prevent Data Loss:
     - Implement explicit merge (combine sessions from both devices)
     - Use CRDT (Conflict-free Replicated Data Type)
     - Use versioning (timestamps, version vectors)
     - Require explicit user confirmation on conflict

  4. Current Implementation:
     - Simple, fast, minimal server logic
     - Suitable for sequential/single-user access patterns
  `);

  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n✓ Conflict resolution test PASSED');
    console.log('Last-write-wins behavior confirmed\n');
    process.exit(0);
  } else {
    console.log('\n✗ Some checks failed\n');
    process.exit(1);
  }
}

testConflictResolution().catch(e => {
  console.error('\n✗✗✗ TEST CRASHED ✗✗✗');
  console.error(e.message);
  process.exit(1);
});
