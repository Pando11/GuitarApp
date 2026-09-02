// pocketbaseSync.js — Layer 3 client crypto + PocketBase sync transport.
//
// LEGAL FLOOR (AGENTS.md): free-only stack. PocketBase is MIT (AMENDMENT-16),
// so this stays commercial-clean.
//
// Transport modes:
//   * OFFLINE (default): build/read the encrypted record shape only.
//   * LIVE: real HTTP push/pull against a PocketBase server when `live: true`
//     and a superuser token are supplied.
//
// Runs in both Node and the browser.

const PBKDF2_ITERATIONS = 150000;
const PBKDF2_HASH = 'SHA-256';
const SALT_BYTES = 16;
const IV_BYTES = 12;

const RECOVERY_WORDS = [
  'amber', 'birch', 'cedar', 'delta', 'ember', 'fern',
  'grove', 'harbor', 'iris', 'jade', 'kelp', 'larch',
  'maple', 'north', 'olive', 'pine', 'quartz', 'river',
  'sage', 'tide', 'upland', 'vale', 'willow', 'zephyr',
];

function getCrypto() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('Web Crypto (globalThis.crypto.subtle) is unavailable in this runtime.');
  }
  return c;
}

function bytesToB64(bytes) {
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return Buffer.from(bytes).toString('base64');
}

function b64ToBytes(b64) {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function encodeFilter(studentId) {
  return encodeURIComponent(`student_id="${String(studentId)}"`);
}

function makeHeaders(authToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
  return headers;
}

function resolveFetch(fetchImpl) {
  const f = fetchImpl || globalThis.fetch;
  if (typeof f !== 'function') {
    throw new Error('Fetch is required for live PocketBase sync.');
  }
  return f;
}

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`PocketBase request failed (${res.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function fetchExistingRecord(studentId, options) {
  const fetchImpl = resolveFetch(options.fetchImpl);
  const baseUrl = options.baseUrl || 'http://127.0.0.1:8090';
  const collection = options.collection || 'student_memory';
  const url = `${baseUrl}/api/collections/${collection}/records?perPage=1&skipTotal=1&filter=${encodeFilter(studentId)}`;
  const res = await fetchImpl(url, { method: 'GET', headers: makeHeaders(options.authToken) });
  const data = await parseResponse(res);
  return data && Array.isArray(data.items) && data.items.length ? data.items[0] : null;
}

export function randomSalt() {
  return getCrypto().getRandomValues(new Uint8Array(SALT_BYTES));
}

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

export async function encryptBlob(plaintext, key) {
  const wc = getCrypto();
  const iv = wc.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const ct = await wc.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { iv: bytesToB64(iv), ciphertext: bytesToB64(new Uint8Array(ct)) };
}

export async function decryptBlob({ iv, ciphertext }, key) {
  const wc = getCrypto();
  const pt = await wc.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(iv) },
    key,
    b64ToBytes(ciphertext)
  );
  return new TextDecoder().decode(pt);
}

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

export async function pushMemory(
  studentId,
  blob,
  passphrase,
  { salt, baseUrl = 'http://127.0.0.1:8090', collection = 'student_memory', live = false, authToken = null, fetchImpl = null } = {}
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

  if (!live) {
    return record;
  }

  if (!authToken) {
    throw new Error('pushMemory live mode requires authToken.');
  }

  const fetcher = resolveFetch(fetchImpl);
  const existing = await fetchExistingRecord(studentId, { baseUrl, collection, authToken, fetchImpl: fetcher });
  if (existing && existing.id) {
    const res = await fetcher(`${baseUrl}/api/collections/${collection}/records/${existing.id}`, {
      method: 'PATCH',
      headers: makeHeaders(authToken),
      body: JSON.stringify(record),
    });
    return parseResponse(res);
  }

  const res = await fetcher(`${baseUrl}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: makeHeaders(authToken),
    body: JSON.stringify(record),
  });
  return parseResponse(res);
}

export async function pullMemory(
  recordOrStudentId,
  passphrase,
  { baseUrl = 'http://127.0.0.1:8090', collection = 'student_memory', live = false, authToken = null, fetchImpl = null } = {}
) {
  let rec = recordOrStudentId;
  if (live) {
    if (!authToken) {
      throw new Error('pullMemory live mode requires authToken.');
    }
    const studentId = typeof recordOrStudentId === 'string'
      ? recordOrStudentId
      : recordOrStudentId && recordOrStudentId.student_id;
    if (!studentId) {
      throw new Error('pullMemory live mode needs a studentId string or a record with student_id.');
    }
    rec = await fetchExistingRecord(studentId, { baseUrl, collection, authToken, fetchImpl });
    if (!rec) {
      throw new Error(`No PocketBase record found for student_id=${studentId}`);
    }
  }

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
