// studentMemorySync.js — Wave 2 bridge for ADR-0001 encrypted cross-device sync.
//
// Keeps Wave 1 local-first behavior intact while giving the app one place to:
//   1) serialize the live PracticeStore,
//   2) derive Rule-5-safe story memory,
//   3) save a local envelope, and
//   4) build/read an encrypted PocketBase-ready record.
//
// No network happens here. pushMemory/pullMemory already return a POST/GET-ready
// record shape without contacting a server.

import { PracticeStore } from './practiceStore.js';
import { getStoryMemory } from './storyMemory.js';
import { pushMemory, pullMemory } from './pocketbaseSync.js';

export const LOCAL_MEMORY_KEY = 'guitarapp.student-memory.local';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildStudentMemoryEnvelope(store, meta = {}) {
  const practiceStore = store instanceof PracticeStore ? store : PracticeStore.fromJSON(store || {});
  return {
    version: 1,
    studentId: meta.studentId || 'local-student',
    teacherId: meta.teacherId || practiceStore.getTeacher(),
    worldId: meta.worldId || 'emerald-hollow',
    syncMode: 'session-end-push-app-open-pull',
    savedAt: meta.savedAt || new Date().toISOString(),
    layer1: clone(practiceStore.toJSON()),
    layer2: getStoryMemory(practiceStore),
  };
}

export function saveLocalEnvelope(storage, envelope, key = LOCAL_MEMORY_KEY) {
  const target = storage || globalThis.localStorage;
  if (!target || typeof target.setItem !== 'function') {
    throw new Error('saveLocalEnvelope: storage.setItem is required');
  }
  const payload = typeof envelope === 'string' ? envelope : JSON.stringify(envelope);
  target.setItem(key, payload);
  return key;
}

export function loadLocalEnvelope(storage, key = LOCAL_MEMORY_KEY) {
  const target = storage || globalThis.localStorage;
  if (!target || typeof target.getItem !== 'function') {
    throw new Error('loadLocalEnvelope: storage.getItem is required');
  }
  const raw = target.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function restorePracticeStore(envelope) {
  if (!envelope || typeof envelope !== 'object' || !envelope.layer1) {
    throw new Error('restorePracticeStore: envelope.layer1 missing');
  }
  return PracticeStore.fromJSON(envelope.layer1);
}

export async function encryptEnvelopeForSync(store, passphrase, meta = {}) {
  const envelope = buildStudentMemoryEnvelope(store, meta);
  const record = await pushMemory(envelope.studentId, envelope, passphrase, meta);
  return { envelope, record };
}

export async function decryptSyncedRecord(record, passphrase) {
  const envelope = await pullMemory(record, passphrase);
  return {
    envelope,
    store: restorePracticeStore(envelope),
    story: envelope.layer2,
  };
}

export async function syncRoundTrip(store, passphrase, meta = {}, storage = null) {
  const { envelope, record } = await encryptEnvelopeForSync(store, passphrase, meta);
  if (storage) saveLocalEnvelope(storage, envelope);
  const restored = await decryptSyncedRecord(record, passphrase);
  return { envelope, record, restored };
}

export default {
  LOCAL_MEMORY_KEY,
  buildStudentMemoryEnvelope,
  saveLocalEnvelope,
  loadLocalEnvelope,
  restorePracticeStore,
  encryptEnvelopeForSync,
  decryptSyncedRecord,
  syncRoundTrip,
};
