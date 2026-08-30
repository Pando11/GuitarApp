// pocketbaseSync.js — Layer 3 (ADR-0005) client crypto + PocketBase sync shape.
//
// LEGAL FLOOR (AGENTS.md): free-only stack. PocketBase is MIT (AMENDMENT-16),
// so this is commercial-clean. No network calls are made here — the actual
// PocketBase SERVER round-trip is BLOCKED on this machine (no `pocketbase`
// binary / no server can run). Only the pure Web Crypto handshake is delivered
// and verified offline.
//
// What this module DOES (offline, dependency-free):
//   * deriveKey        — PBKDF2(SHA-256, >=100k iters) -> AES-256-GCM CryptoKey
//   * encryptBlob      — AES-GCM 256 encrypt, returns {iv, ciphertext} (base64)
//   * decryptBlob      — AES-GCM 256 decrypt
//   * generateRecoveryPhrase — 4-6 random words (ADR-0001, 2nd-device add)
//   * pushMemory / pullMemory — build the record object ready to POST/GET to
//     PocketBase. The fetch() that WOULD run is shown in a comment; no call is
//     made (server BLOCKED).
//
// Runs in both Node v22 (globalThis.crypto.webcrypto) and the browser.

// --- tunables ---------------------------------------------------------------
const PBKDF2_ITERATIONS = 150000; // >= 100k per recipe
const PBKDF2_HASH = 'SHA-256';
const SALT_BYTES = 16;
const IV_BYTES = 12;

// Small built-in word list for the recovery phrase (ADR-0001).
const RECOVERY_WORDS = [
  'amber', 'birch', 'cedar', 'delta', 'ember', 'fern',
  'grove', 'harbor', 'iris', 'jade', 'kelp', 'larch',
  'maple', 'north', 'olive', 'pine', 'quartz', 'river',
  'sage', 'tide', 'upland', 'vale', 'willow', 'zephyr',
];

// --- environment ------------------------------------------------------------
function getCrypto() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('Web Crypto (globalThis.crypto.subtle) is unavailable in this runtime.');
  }
  return c;
}

// --- base64 (works in node AND browser without Buffer) ----------------------
function bytesToB64(bytes) {
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return Buffer.from(bytes).toString('base64'); // node fallback
}

function b64ToBytes(b64) {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64')); // node fallback
}

export function randomSalt() {
  return getCrypto().getRandomValues(new Uint8Array(SALT_BYTES));
}

// --- crypto primitives ------------------------------------------------------
// deriveKey(passphrase, salt) -> CryptoKey (AES-256-GCM)
// `salt` may be a Uint8Array or a base64 string.
export async function deriveKey(passphrase, salt) {
  const wc = getCrypto();
  const saltBytes = salt instanceof Uint8Array ? salt : b64ToBytes(salt);
  const baseKey = await wc.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return wc.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// encryptBlob(plaintext, key) -> { iv: base64, ciphertext: base64 }
export async function encryptBlob(plaintext, key) {
  const wc = getCrypto();
  const iv = wc.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const ct = await wc.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { iv: bytesToB64(iv), ciphertext: bytesToB64(new Uint8Array(ct)) };
}

// decryptBlob({ iv, ciphertext }, key) -> string
export async function decryptBlob({ iv, ciphertext }, key) {
  const wc = getCrypto();
  const pt = await wc.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(iv) },
    key,
    b64ToBytes(ciphertext)
  );
  return new TextDecoder().decode(pt);
}

// --- recovery phrase (ADR-0001) --------------------------------------------
// generateRecoveryPhrase(count=5) -> space-joined 4-6 word string.
export function generateRecoveryPhrase(count = 5) {
  const n = Math.min(Math.max(count | 0, 4), 6);
  const wc = getCrypto();
  const out = [];
  const buf = new Uint32Array(1);
  for (let i = 0; i < n; i++) {
    wc.getRandomValues(buf);
    out.push(RECOVERY_WORDS[buf[0] % RECOVERY_WORDS.length]);
  }
  return out.join(' ');
}

// --- PocketBase sync shape (server BLOCKED) ---------------------------------
// pushMemory builds the encrypted record object ready to POST to PocketBase.
// No fetch() is executed — the SERVER round-trip is BLOCKED (no PB binary).
export async function pushMemory(
  studentId,
  blob,
  passphrase,
  { salt, baseUrl = 'http://127.0.0.1:8090', collection = 'student_memory' } = {}
) {
  const realSalt = salt instanceof Uint8Array ? salt : (salt ? b64ToBytes(salt) : randomSalt());
  const key = await deriveKey(passphrase, realSalt);
  const plaintext = typeof blob === 'string' ? blob : JSON.stringify(blob);
  const { iv, ciphertext } = await encryptBlob(plaintext, key);

  const record = {
    student_id: studentId,
    ciphertext,
    iv,
    salt: bytesToB64(realSalt),
    updated_at: new Date().toISOString(),
  };

  // --- SERVER-BLOCKED: would run if a PocketBase server were up -------------
  // const res = await fetch(`${baseUrl}/api/collections/${collection}/records`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(record),
  // });
  // if (!res.ok) throw new Error(`PB push failed: ${res.status}`);
  // return await res.json();
  return record; // shape ready to POST
}

// pullMemory decrypts a stored record using the passphrase.
// Accepts the stored record object directly (no GET). The GET that WOULD run
// if the server were up is shown below. Server round-trip is BLOCKED.
export async function pullMemory(
  record,
  passphrase,
  { baseUrl = 'http://127.0.0.1:8090', collection = 'student_memory' } = {}
) {
  // --- SERVER-BLOCKED: would run if a PocketBase server were up -------------
  // const res = await fetch(
  //   `${baseUrl}/api/collections/${collection}/records?filter=student_id="${record.student_id}"`
  // );
  // if (!res.ok) throw new Error(`PB pull failed: ${res.status}`);
  // const data = await res.json();
  // const rec = data.items && data.items[0];
  const rec = record; // decrypt-ready shape supplied directly

  const saltBytes = b64ToBytes(rec.salt);
  const key = await deriveKey(passphrase, saltBytes);
  const plaintext = await decryptBlob({ iv: rec.iv, ciphertext: rec.ciphertext }, key);
  try {
    return JSON.parse(plaintext);
  } catch {
    return plaintext;
  }
}

export const PB_CONFIG = { PBKDF2_ITERATIONS, PBKDF2_HASH, SALT_BYTES, IV_BYTES };
