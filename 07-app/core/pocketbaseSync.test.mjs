// pocketbaseSync.test.mjs — offline crypto roundtrip (Node v22 Web Crypto).
//
// Run: node 07-app/core/pocketbaseSync.test.mjs
//
// Verifies Layer 3 (ADR-0005) client crypto with NO network and NO PocketBase
// server. The live PB server round-trip is BLOCKED (no `pocketbase` binary on
// this machine) — only the Web Crypto handshake is exercised here.

import {
  generateRecoveryPhrase,
  deriveKey,
  encryptBlob,
  decryptBlob,
  pushMemory,
  pullMemory,
  randomSalt,
} from './pocketbaseSync.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== pocketbaseSync Layer-3 crypto roundtrip (offline) ===');

const sampleBlob = {
  layer1: {
    sessions: [
      { id: 's1', lessonId: 'L03', durationSec: 600, completed: true },
    ],
    helpRequests: [{ chordName: 'Em', ts: 1, followedUp: false }],
  },
  layer2: {
    storyFlags: { metSage: true, world: 'emerald-hollow' },
    recallAnchor: 'first-campfire',
  },
};
const plaintext = JSON.stringify(sampleBlob);

// 1. Recovery phrase is 4-6 words.
const phrase = generateRecoveryPhrase(5);
const wordCount = phrase.trim().split(/\s+/).length;
console.log('  recovery phrase:', phrase);
check('recovery phrase has 4-6 words', wordCount >= 4 && wordCount <= 6);

// 2. deriveKey -> encrypt -> decrypt roundtrip equals original.
const salt = randomSalt();
const key = await deriveKey(phrase, salt);
const enc = await encryptBlob(plaintext, key);
check('ciphertext is non-empty base64', typeof enc.ciphertext === 'string' && enc.ciphertext.length > 0);
check('iv is non-empty base64', typeof enc.iv === 'string' && enc.iv.length > 0);

const dec = await decryptBlob(enc, key);
check('decrypt(encrypt(x)) === x', dec === plaintext);
check('decrypted JSON parses back to original blob', JSON.stringify(JSON.parse(dec)) === JSON.stringify(sampleBlob));
check('ciphertext !== plaintext', enc.ciphertext !== plaintext && !enc.ciphertext.includes('emerald-hollow'));

// 3. Wrong passphrase fails to decrypt (AES-GCM auth tag throws).
let threw = false;
try {
  const badKey = await deriveKey('totally-wrong-passphrase', salt);
  await decryptBlob(enc, badKey);
} catch (e) {
  threw = true;
}
check('bad passphrase throws on decrypt', threw);

// 4. pushMemory -> pullMemory full shape (no network; server BLOCKED).
const record = await pushMemory('student-001', sampleBlob, phrase);
check('pushMemory returns student_id', record.student_id === 'student-001');
check('pushMemory returns ciphertext+iv+salt', !!record.ciphertext && !!record.iv && !!record.salt);
check('pushMemory stamps updated_at', typeof record.updated_at === 'string' && record.updated_at.length > 0);

const pulled = await pullMemory(record, phrase);
check('pullMemory roundtrips blob via push record', JSON.stringify(pulled) === JSON.stringify(sampleBlob));

let pullThrew = false;
try {
  await pullMemory(record, 'wrong-phrase');
} catch (e) {
  pullThrew = true;
}
check('pullMemory with wrong phrase throws', pullThrew);

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) { console.log('OVERALL: PASS'); process.exit(0); }
else { console.log('OVERALL: FAIL'); process.exit(1); }
