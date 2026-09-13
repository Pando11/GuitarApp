// studentNotes.test.mjs — covers addNote, getRecentNotes, getNotesForChord,
// and that note text is stored/returned verbatim (never numbered/diagnosed).
import assert from 'node:assert/strict';
import test from 'node:test';
import { StudentNotesStore } from './studentNotes.js';

test('addNote stores text verbatim, dated, optionally tagged by chord', () => {
  const store = new StudentNotesStore();
  const note = store.addNote({ text: 'my fingers hurt', chord: 'Em', timestamp: 1000 });
  assert.equal(note.text, 'my fingers hurt');
  assert.equal(note.chord, 'Em');
  assert.equal(note.timestamp, 1000);
});

test('chord tag is optional', () => {
  const store = new StudentNotesStore();
  const note = store.addNote({ text: 'I only have ten minutes today', timestamp: 2000 });
  assert.equal(note.chord, null);
});

test('addNote rejects empty/missing text', () => {
  const store = new StudentNotesStore();
  assert.throws(() => store.addNote({ text: '' }));
  assert.throws(() => store.addNote({}));
});

test('getRecentNotes returns most-recent-first, respects limit', () => {
  const store = new StudentNotesStore();
  store.addNote({ text: 'note 1', timestamp: 1 });
  store.addNote({ text: 'note 2', timestamp: 2 });
  store.addNote({ text: 'note 3', timestamp: 3 });
  const recent = store.getRecentNotes(2);
  assert.equal(recent.length, 2);
  assert.equal(recent[0].text, 'note 3');
  assert.equal(recent[1].text, 'note 2');
});

test('getNotesForChord filters by canonical chord, text preserved as-is', () => {
  const store = new StudentNotesStore();
  store.addNote({ text: 'this one hurts my thumb', chord: 'easyC', timestamp: 1 });
  store.addNote({ text: 'unrelated note', chord: 'G', timestamp: 2 });
  const forC = store.getNotesForChord('C'); // easyC and C canonicalize together
  assert.equal(forC.length, 1);
  assert.equal(forC[0].text, 'this one hurts my thumb');
});

test('toJSON/fromJSON round-trips notes unchanged', () => {
  const store = new StudentNotesStore();
  store.addNote({ text: 'my fingers hurt', chord: 'Em', timestamp: 1000 });
  const restored = StudentNotesStore.fromJSON(store.toJSON());
  assert.deepEqual(restored.getRecentNotes(10), store.getRecentNotes(10));
});
