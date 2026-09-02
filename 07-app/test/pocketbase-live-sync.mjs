// pocketbase-live-sync.mjs — real PocketBase roundtrip gate.
//
// Requires a running PocketBase server plus superuser credentials:
//   PB_BASE_URL=http://127.0.0.1:8091
//   PB_ADMIN_EMAIL=...
//   PB_ADMIN_PASS=...
//
// What it proves:
//   * authenticates to a real PocketBase instance
//   * creates `student_memory` collection if missing
//   * pushMemory(..., {live:true}) creates and then updates a real record
//   * pullMemory(..., {live:true}) fetches + decrypts the live record

import { PracticeStore } from '../core/practiceStore.js';
import { buildStudentMemoryEnvelope, restorePracticeStore } from '../core/studentMemorySync.js';
import { pushMemory, pullMemory } from '../core/pocketbaseSync.js';

const BASE_URL = process.env.PB_BASE_URL || 'http://127.0.0.1:8091';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const ADMIN_PASS = process.env.PB_ADMIN_PASS;
const COLLECTION = process.env.PB_COLLECTION || 'student_memory';

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('Missing PB_ADMIN_EMAIL or PB_ADMIN_PASS');
  process.exit(1);
}

let passed = 0;
let failed = 0;
function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log('  PASS  ' + name);
  } else {
    failed++;
    console.error('  FAIL  ' + name + (extra ? ' :: ' + extra : ''));
  }
}

async function request(path, init = {}) {
  const res = await fetch(BASE_URL + path, init);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function authSuperuser() {
  const res = await request('/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  if (!res.ok) {
    throw new Error('Superuser auth failed: ' + JSON.stringify(res.data));
  }
  return res.data.token;
}

async function ensureCollection(token) {
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const probe = await request('/api/collections/' + COLLECTION, { headers });
  if (probe.ok) return { created: false, collection: probe.data };
  if (probe.status !== 404) {
    throw new Error('Collection probe failed: ' + JSON.stringify(probe.data));
  }
  const create = await request('/api/collections', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: COLLECTION,
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'student_id', type: 'text', required: true, unique: true },
        { name: 'ciphertext', type: 'text', required: true },
        { name: 'iv', type: 'text', required: true },
        { name: 'salt', type: 'text', required: true },
        { name: 'updated_at', type: 'text', required: false },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_student_memory_student_id ON student_memory (student_id)'],
    }),
  });
  if (!create.ok) {
    throw new Error('Collection create failed: ' + JSON.stringify(create.data));
  }
  return { created: true, collection: create.data };
}

function makeStore(extraAttempts = 0) {
  const store = new PracticeStore({ currentTeacherId: 'T1' });
  const id = store.startSession('L12-new-chord-am-big-four', Date.now() - 120000);
  store.logAttempt(id, { chordName: 'Em', verdict: 'pass', ts: 1 });
  store.logAttempt(id, { chordName: 'easyC', verdict: 'fail', ts: 2 });
  store.logAttempt(id, { chordName: 'easyC', verdict: 'pass', ts: 3 });
  for (let i = 0; i < extraAttempts; i++) {
    store.logAttempt(id, { chordName: 'easyC', verdict: 'pass', ts: 4 + i });
  }
  store.recordPracticeTempo(id, 84);
  store.finalizeSession(id, { completed: true, durationSec: 720 + extraAttempts * 60 });
  store.studentRequested('easyC', 5);
  return store;
}

console.log('\n=== live PocketBase sync roundtrip ===');
console.log('  base url: ' + BASE_URL);
console.log('  collection: ' + COLLECTION);

const token = await authSuperuser();
check('superuser auth token acquired', typeof token === 'string' && token.length > 20, String(token).slice(0, 16));

const ensured = await ensureCollection(token);
check('student_memory collection reachable', !!ensured.collection, JSON.stringify(ensured));
console.log('  collection created now: ' + String(ensured.created));

const studentId = 'student-wave2-live';
const passphrase = 'amber fern river sage tide';
const envelopeA = buildStudentMemoryEnvelope(makeStore(0), { studentId, savedAt: '2026-09-02T12:00:00.000Z' });
const saved1 = await pushMemory(studentId, envelopeA, passphrase, { live: true, authToken: token, baseUrl: BASE_URL, collection: COLLECTION });
check('first live push returns record id', typeof saved1.id === 'string' && saved1.id.length > 0, JSON.stringify(saved1));
check('first live push stores student id', saved1.student_id === studentId, JSON.stringify(saved1));
check('first live push stores ciphertext only', typeof saved1.ciphertext === 'string' && !saved1.ciphertext.includes('emerald-hollow'), saved1.ciphertext.slice(0, 64));

const pulled1 = await pullMemory(studentId, passphrase, { live: true, authToken: token, baseUrl: BASE_URL, collection: COLLECTION });
const restored1 = restorePracticeStore(pulled1);
check('first live pull roundtrips student id', pulled1.studentId === studentId, JSON.stringify(pulled1));
check('first live pull restores completed lesson count', restored1.completedLessonCount() === 1, String(restored1.completedLessonCount()));
check('first live pull restores practice minutes', restored1.practiceMinutesTotal() === 12, String(restored1.practiceMinutesTotal()));

const envelopeB = buildStudentMemoryEnvelope(makeStore(2), { studentId, savedAt: '2026-09-02T12:05:00.000Z' });
const saved2 = await pushMemory(studentId, envelopeB, passphrase, { live: true, authToken: token, baseUrl: BASE_URL, collection: COLLECTION });
check('second live push reuses the same record id', saved2.id === saved1.id, JSON.stringify({ first: saved1.id, second: saved2.id }));

const pulled2 = await pullMemory(studentId, passphrase, { live: true, authToken: token, baseUrl: BASE_URL, collection: COLLECTION });
const restored2 = restorePracticeStore(pulled2);
check('second live pull reflects updated practice minutes', restored2.practiceMinutesTotal() === 14, String(restored2.practiceMinutesTotal()));
check('second live pull keeps teacher id', pulled2.teacherId === 'T1', JSON.stringify(pulled2));
check('second live pull keeps story helpPending', pulled2.layer2.helpPending === 1, JSON.stringify(pulled2.layer2));

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
