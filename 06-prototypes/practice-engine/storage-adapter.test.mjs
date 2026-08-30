// storage-adapter.test.mjs — round-trip persistence of the fluency store.
// Run: node --test 06-prototypes/practice-engine/storage-adapter.test.mjs
//
// This is ADDITIVE: it does not edit the engine math or practice-ui.html.
// It verifies that a store serialized via toJSON() survives a save()/load()
// cycle through the storage adapter, with fluency and sample counts intact.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createFluencyStore } from './fluency-store.mjs';
import { pairKey } from './pair-key.mjs';
import { createStorageAdapter, createMemoryBackend } from './storage-adapter.mjs';

test('save -> load restores fluency and sample counts', () => {
  const store = createFluencyStore({ knownPairs: [['Em', 'C'], ['Em', 'G']] });
  store.record(['Em', 'C'], { ratePerMin: 60 }); // high score -> high fluency
  store.record(['Em', 'G'], { ratePerMin: 30 }); // low score  -> low fluency
  // Derive serialized keys from pairKey (order-independent canonical form).
  const kCE = pairKey('Em', 'C');
  const kEG = pairKey('Em', 'G');
  const json = store.toJSON();

  const adapter = createStorageAdapter({ backend: createMemoryBackend() });
  adapter.save(json);

  const loaded = adapter.load();
  assert.ok(loaded, 'adapter.load() returned null');
  assert.equal(typeof loaded[kCE], 'object', 'C::Em entry missing');
  assert.equal(loaded[kCE].samples, 1, 'sample count not preserved');
  assert.ok(loaded[kCE].fluency > 0.9, 'high-rate fluency did not survive');
  assert.ok(loaded[kEG].fluency < loaded[kCE].fluency, 'fluency ordering not preserved');

  // Hydrate a fresh store and confirm the engine sees the restored data.
  const store2 = createFluencyStore();
  store2.load(loaded);
  const snap = store2.snapshot();
  assert.equal(snap.length, 2, 'restored pair count wrong');
  assert.equal(snap.find((r) => r.pair === kCE).samples, 1);
  assert.equal(snap.find((r) => r.pair === kEG).samples, 1);
  assert.ok(snap.find((r) => r.pair === kCE).fluency > 0.9);
});

test('load returns null when nothing has been saved', () => {
  const adapter = createStorageAdapter({ backend: createMemoryBackend() });
  assert.equal(adapter.load(), null);
});

test('in-memory fallback works with no injected backend (Node)', () => {
  // No backend passed -> detectBackend() finds no localStorage in Node -> memory.
  const adapter = createStorageAdapter();
  const json = { 'A::B': { fluency: 0.5, lastPracticed: 123, samples: 2 } };
  adapter.save(json);
  assert.deepEqual(adapter.load(), json);
});

test('corrupt payload load returns null (graceful)', () => {
  const backend = createMemoryBackend();
  backend.set('guitarapp:fluency-store:v1', 'not-json{');
  const adapter = createStorageAdapter({ backend });
  assert.equal(adapter.load(), null);
});

test('survives a multi-sample drill history + lastPracticed timestamp', () => {
  const store = createFluencyStore({ knownPairs: [['Em', 'C']] });
  store.record(['Em', 'C'], { ratePerMin: 20 }, 1000);
  store.record(['Em', 'C'], { ratePerMin: 40 }, 2000);
  store.record(['Em', 'C'], { ratePerMin: 60 }, 3000); // EMA climbs toward 1.0
  const json = store.toJSON();

  const adapter = createStorageAdapter({ backend: createMemoryBackend() });
  adapter.save(json);
  const loaded = adapter.load();

  assert.equal(loaded['C::Em'].samples, 3);
  assert.equal(loaded['C::Em'].lastPracticed, 3000);
  assert.ok(loaded['C::Em'].fluency > 0.5, 'EMA trend not preserved across samples');

  const store2 = createFluencyStore();
  store2.load(loaded);
  assert.equal(store2.snapshot()[0].samples, 3);
});
