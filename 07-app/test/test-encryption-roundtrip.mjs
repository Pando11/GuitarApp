#!/usr/bin/env node
// test-encryption-roundtrip.mjs — Full encryption/decryption roundtrip verification
// Usage: node test/test-encryption-roundtrip.mjs
// This test verifies Layer 3 crypto with real PracticeStore data (no PocketBase required)

import {
  generateRecoveryPhrase,
  deriveKey,
  encryptBlob,
  decryptBlob,
  pushMemory,
  pullMemory,
  randomSalt,
  PB_CONFIG,
} from '../core/pocketbaseSync.js';

import { PracticeStore } from '../core/practiceStore.js';

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

console.log('\n========================================');
console.log('GuitarApp Encryption Round-Trip Test');
console.log('========================================\n');

// Test 1: Recovery Phrase Generation
console.log('TEST 1: Recovery Phrase Generation');
const phrase = generateRecoveryPhrase(5);
const words = phrase.trim().split(/\s+/);
console.log(`  Generated: "${phrase}"`);
check('Recovery phrase has 4-6 words', words.length >= 4 && words.length <= 6, `Got ${words.length} words`);
check('All words are non-empty', words.every(w => w.length > 0), 'Some words are empty');

// Test 2: PracticeStore creation and encryption
console.log('\nTEST 2: PracticeStore Encryption');
const store = new PracticeStore();
const sessionId = store.startSession('L01');
store.logAttempt(sessionId, { chordName: 'Em', verdict: 'pass', centsOff: 0 });
store.logAttempt(sessionId, { chordName: 'D', verdict: 'pass', centsOff: -5 });
store.logAttempt(sessionId, { chordName: 'G', verdict: 'fail', centsOff: 50 });
store.finalizeSession(sessionId, { completed: true, durationSec: 600 });

const storeJson = JSON.stringify(store.toJSON());
console.log(`  Original JSON size: ${storeJson.length} bytes`);

const salt = randomSalt();
const key = await deriveKey(phrase, salt);
const { iv, ciphertext } = await encryptBlob(storeJson, key);

console.log(`  Ciphertext size: ${ciphertext.length} bytes`);
console.log(`  IV (base64 len): ${iv.length} chars`);
console.log(`  Salt (base64 len): ${Buffer.from(salt).toString('base64').length} chars`);

check('Ciphertext is non-empty', ciphertext.length > 0);
check('IV is non-empty base64', typeof iv === 'string' && iv.length > 0);
check('Ciphertext larger than hint-size (base64 expansion)', ciphertext.length > storeJson.length * 0.8);
check('No plaintext leaked in ciphertext', !ciphertext.includes('Em') && !ciphertext.includes('D') && !ciphertext.includes('pass'));

// Test 3: Decryption and verification
console.log('\nTEST 3: Decryption and Verification');
const decrypted = await decryptBlob({ iv, ciphertext }, key);
const decryptedStore = JSON.parse(decrypted);

console.log(`  Decrypted JSON size: ${decrypted.length} bytes`);
console.log(`  Sessions in decrypted: ${decryptedStore.sessions.length}`);
console.log(`  Attempts in session 0: ${decryptedStore.sessions[0]?.attempts.length}`);

check('Decrypted JSON matches original', decrypted === storeJson);
check('Sessions array preserved', decryptedStore.sessions.length === 1);
check('First attempt correct (Em)', decryptedStore.sessions[0].attempts[0].chordName === 'Em');
check('Second attempt correct (D)', decryptedStore.sessions[0].attempts[1].chordName === 'D');
check('Third attempt correct (G)', decryptedStore.sessions[0].attempts[2].chordName === 'G');
check('Verdicts preserved',
  decryptedStore.sessions[0].attempts[0].verdict === 'pass' &&
  decryptedStore.sessions[0].attempts[2].verdict === 'fail'
);
check('Duration preserved', decryptedStore.sessions[0].durationSec === 600);
check('Session completed flag preserved', decryptedStore.sessions[0].completed === true);

// Test 4: Wrong passphrase authentication failure
console.log('\nTEST 4: Authentication (Wrong Passphrase Rejection)');
let authThrew = false;
let authError = '';
try {
  const wrongKey = await deriveKey('wrong-recovery-phrase-totally-different', salt);
  await decryptBlob({ iv, ciphertext }, wrongKey);
  authThrew = false;
} catch (e) {
  authThrew = true;
  authError = e.message;
}
check('Wrong passphrase throws on decrypt', authThrew, authError || 'No error thrown');
check('Error mentions authentication/tag', authError.includes('tag') || authError.includes('auth') || authError.toLowerCase().includes('decrypt'));

// Test 5: Crypto configuration verification
console.log('\nTEST 5: Crypto Configuration Verification');
console.log(`  PBKDF2 Iterations: ${PB_CONFIG.PBKDF2_ITERATIONS}`);
console.log(`  PBKDF2 Hash: ${PB_CONFIG.PBKDF2_HASH}`);
console.log(`  Salt Bytes: ${PB_CONFIG.SALT_BYTES}`);
console.log(`  IV Bytes: ${PB_CONFIG.IV_BYTES}`);

check('PBKDF2 iterations >= 120000 (OWASP 2024)', PB_CONFIG.PBKDF2_ITERATIONS >= 120000);
check('PBKDF2 iterations actually high (current: 150k)', PB_CONFIG.PBKDF2_ITERATIONS >= 150000);
check('PBKDF2 hash is SHA-256', PB_CONFIG.PBKDF2_HASH === 'SHA-256');
check('Salt is 16 bytes (128 bits)', PB_CONFIG.SALT_BYTES === 16);
check('IV is 12 bytes (96 bits, AES-GCM standard)', PB_CONFIG.IV_BYTES === 12);

// Test 6: pushMemory and pullMemory offline roundtrip
console.log('\nTEST 6: pushMemory/pullMemory Offline Roundtrip');
const store2 = new PracticeStore();
store2.startSession('L02');
store2.logAttempt('s1', { chordName: 'A', verdict: 'unsure' });
store2.recordMessage({ channel: 'sms', body: 'Keep practicing!' });

const record = await pushMemory('student-001', store2.toJSON(), phrase);
console.log(`  Pushed record student_id: ${record.student_id}`);
console.log(`  Record has ciphertext: ${!!record.ciphertext}`);
console.log(`  Record has iv: ${!!record.iv}`);
console.log(`  Record has salt: ${!!record.salt}`);

check('pushMemory returns student_id', record.student_id === 'student-001');
check('pushMemory returns ciphertext', !!record.ciphertext && typeof record.ciphertext === 'string');
check('pushMemory returns iv', !!record.iv && typeof record.iv === 'string');
check('pushMemory returns salt', !!record.salt && typeof record.salt === 'string');
check('pushMemory stamps updated_at', typeof record.updated_at === 'string' && record.updated_at.length > 0);

const pulled = await pullMemory(record, phrase);
const pulledStore = new PracticeStore(pulled);
check('pullMemory roundtrips blob via push record', JSON.stringify(pulled) === JSON.stringify(store2.toJSON()));
check('Pulled store has session', pulledStore.sessions.length === 1);
check('Pulled store has message', pulledStore.messageLog.length === 1);

// Test 7: pullMemory wrong passphrase rejection
console.log('\nTEST 7: pullMemory Wrong Passphrase Rejection');
let pullThrew = false;
let pullError = '';
try {
  await pullMemory(record, 'completely-wrong-recovery-phrase');
  pullThrew = false;
} catch (e) {
  pullThrew = true;
  pullError = e.message;
}
check('pullMemory with wrong phrase throws', pullThrew, pullError || 'No error thrown');

// Test 8: Multiple sessions and complex data
console.log('\nTEST 8: Complex Data Structure (Multiple Sessions)');
const complexStore = new PracticeStore();
for (let i = 0; i < 3; i++) {
  const sid = complexStore.startSession(`L${i + 1}`);
  for (let j = 0; j < 5; j++) {
    complexStore.logAttempt(sid, {
      chordName: ['Em', 'D', 'G', 'A', 'E'][j],
      verdict: ['pass', 'fail', 'unsure'][j % 3]
    });
  }
  complexStore.finalizeSession(sid, { completed: i < 2, durationSec: (i + 1) * 600 });
}
complexStore.recordMessage({ channel: 'sms', body: 'Keep going!' });
complexStore.recordMessage({ channel: 'email', body: 'Weekly report' });
complexStore.studentRequested('Barre', Date.now());

const complexJson = JSON.stringify(complexStore.toJSON());
const complexSalt = randomSalt();
const complexKey = await deriveKey(phrase, complexSalt);
const complexEnc = await encryptBlob(complexJson, complexKey);
const complexDec = await decryptBlob(complexEnc, complexKey);
const complexDecrypted = JSON.parse(complexDec);

check('Complex store: sessions count', complexDecrypted.sessions.length === 3);
check('Complex store: total attempts', complexDecrypted.sessions.reduce((sum, s) => sum + s.attempts.length, 0) === 15);
check('Complex store: message log', complexDecrypted.messageLog.length === 2);
check('Complex store: help requests', complexDecrypted.helpRequests.length === 1);

// Test 9: Data consistency across multiple encrypt/decrypt cycles
console.log('\nTEST 9: Multi-Cycle Consistency');
let consistentData = JSON.stringify(store.toJSON());
for (let cycle = 0; cycle < 3; cycle++) {
  const cycleSalt = randomSalt();
  const cycleKey = await deriveKey(phrase, cycleSalt);
  const cycleEnc = await encryptBlob(consistentData, cycleKey);
  const cycleDec = await decryptBlob(cycleEnc, cycleKey);
  check(`Cycle ${cycle + 1}: data survives roundtrip`, cycleDec === consistentData);
}

// Test 10: Skill map calculation after decryption
console.log('\nTEST 10: SkillMap Calculation Post-Decryption');
const skillStore = new PracticeStore();
const skillSession = skillStore.startSession('L01');
skillStore.logAttempt(skillSession, { chordName: 'Em', verdict: 'pass' });
skillStore.logAttempt(skillSession, { chordName: 'Em', verdict: 'pass' });
skillStore.logAttempt(skillSession, { chordName: 'D', verdict: 'fail' });
skillStore.logAttempt(skillSession, { chordName: 'D', verdict: 'fail' });
skillStore.finalizeSession(skillSession, { completed: true });

const skillJson = JSON.stringify(skillStore.toJSON());
const skillSalt = randomSalt();
const skillKey = await deriveKey(phrase, skillSalt);
const skillEnc = await encryptBlob(skillJson, skillKey);
const skillDec = await decryptBlob(skillEnc, skillKey);
const skillDecrypted = new PracticeStore(JSON.parse(skillDec));

const skillMap = skillDecrypted.getSkillMap();
console.log(`  Skill map after decryption: ${JSON.stringify(skillMap)}`);
check('SkillMap Em state is clean', skillMap.Em?.state === 'clean');
check('SkillMap D state is struggling', skillMap.D?.state === 'struggling');
check('SkillMap Em clean count = 2', skillMap.Em?.clean === 2);
check('SkillMap D fail count = 2', skillMap.D?.fail === 2);

// Summary
console.log('\n========================================');
console.log(`RESULT: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed === 0) {
  console.log('✓✓✓ ALL ENCRYPTION TESTS PASSED ✓✓✓');
  console.log('GuitarApp is ready for cross-device sync\n');
  process.exit(0);
} else {
  console.log('✗✗✗ SOME TESTS FAILED ✗✗✗');
  console.log('Review the failures above before deploying\n');
  process.exit(1);
}
