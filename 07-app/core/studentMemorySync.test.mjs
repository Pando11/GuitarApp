// studentMemorySync.test.mjs — Wave 2 encrypted cross-device sync bridge test.

import {
  LOCAL_MEMORY_KEY,
  buildStudentMemoryEnvelope,
  saveLocalEnvelope,
  loadLocalEnvelope,
  restorePracticeStore,
  syncRoundTrip,
} from './studentMemorySync.js';
import { PracticeStore } from './practiceStore.js';

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

const memory = {};
const storage = {
  getItem(key) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; },
  setItem(key, value) { memory[key] = String(value); },
};

const store = new PracticeStore({ currentTeacherId: 'T1' });
const sessionId = store.startSession('L05-strumming-in-time', Date.now() - 60000);
store.logAttempt(sessionId, { chordName: 'Em', verdict: 'pass', ts: 1 });
store.logAttempt(sessionId, { chordName: 'easyC', verdict: 'fail', ts: 2 });
store.logAttempt(sessionId, { chordName: 'easyC', verdict: 'fail', ts: 3 });
store.logAttempt(sessionId, { chordName: 'easyC', verdict: 'pass', ts: 4 });
store.recordPracticeTempo(sessionId, 84);
store.finalizeSession(sessionId, { completed: true, durationSec: 720 });
store.studentRequested('easyC', 5);

console.log('\n=== studentMemorySync bridge roundtrip ===');

const envelope = buildStudentMemoryEnvelope(store, { studentId: 'student-wave2', savedAt: '2026-09-02T12:00:00.000Z' });
check('envelope student id set', envelope.studentId === 'student-wave2', JSON.stringify(envelope));
check('envelope world locked to Emerald Hollow', envelope.worldId === 'emerald-hollow', JSON.stringify(envelope));
check('story memory carries a nemesis chord', envelope.layer2.nemesis === 'C', JSON.stringify(envelope.layer2));
check('story memory cites help pending', envelope.layer2.helpPending === 1, JSON.stringify(envelope.layer2));

saveLocalEnvelope(storage, envelope);
const loaded = loadLocalEnvelope(storage);
check('local envelope saved under stable key', storage.getItem(LOCAL_MEMORY_KEY) !== null, storage.getItem(LOCAL_MEMORY_KEY) || 'missing');
check('local envelope reload matches saved envelope', JSON.stringify(loaded) === JSON.stringify(envelope));

const restoredStore = restorePracticeStore(loaded);
check('restored store keeps completed lessons', restoredStore.completedLessonCount() === 1, JSON.stringify(restoredStore.toJSON()));
check('restored store keeps chord canon state', JSON.stringify(restoredStore.getStruggledChords()) === JSON.stringify(['C']), JSON.stringify(restoredStore.getStruggledChords()));

const { record, restored } = await syncRoundTrip(store, 'amber fern river sage tide', { studentId: 'student-wave2', savedAt: '2026-09-02T12:00:00.000Z' }, storage);
check('encrypted record contains ciphertext', typeof record.ciphertext === 'string' && record.ciphertext.length > 20, JSON.stringify(record));
check('encrypted record hides plaintext', !record.ciphertext.includes('emerald-hollow') && !record.ciphertext.includes('easyC'), record.ciphertext.slice(0, 48));
check('decrypted roundtrip keeps same student id', restored.envelope.studentId === 'student-wave2', JSON.stringify(restored.envelope));
check('decrypted roundtrip keeps teacher id', restored.envelope.teacherId === 'T1', JSON.stringify(restored.envelope));
check('decrypted roundtrip keeps practice minutes', restored.store.practiceMinutesTotal() === 12, String(restored.store.practiceMinutesTotal()));
check('decrypted roundtrip keeps story nemesis', restored.story.nemesis === 'C', JSON.stringify(restored.story));

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
