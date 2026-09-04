import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as pocketbaseSync from '../core/pocketbaseSync.js';
import * as studentMemorySync from '../core/studentMemorySync.js';
import { PracticeStore } from '../core/practiceStore.js';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(TEST_DIR, '..');

const baseUrl = process.env.PB_BASE_URL || 'http://127.0.0.1:8091';
const adminEmail = process.env.PB_ADMIN_EMAIL;
const adminPass = process.env.PB_ADMIN_PASS;
const collection = process.env.PB_COLLECTION || 'student_memory';

if (!adminEmail || !adminPass) {
  console.error('Missing PB_ADMIN_EMAIL or PB_ADMIN_PASS');
  process.exit(1);
}

const indexPath = path.join(APP_DIR, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

function encodeFilter(studentId) {
  return encodeURIComponent(`student_id="${String(studentId)}"`);
}

function createLocalStorageFacade(backingMap) {
  return {
    getItem(key) {
      return backingMap.has(key) ? backingMap.get(key) : null;
    },
    setItem(key, value) {
      backingMap.set(key, String(value));
    },
    removeItem(key) {
      backingMap.delete(key);
    },
    clear() {
      backingMap.clear();
    },
  };
}

function resolveLocalPath(urlStr) {
  const s = String(urlStr);
  if (s === '/api/tts') return null;
  // app-smoke pattern: strip protocol+host from absolute URLs back to rel paths.
  const clean = s.replace(/^https?:\/\/app\.local\//, '');
  const withoutQuery = clean.split('?')[0];
  const rel = withoutQuery.replace(/^\.\//, '');
  return path.join(APP_DIR, rel);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function authSuperuser() {
  const res = await fetch(baseUrl + '/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: adminEmail, password: adminPass }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('Superuser auth failed: ' + JSON.stringify(data));
  return data.token;
}

async function getStudentRecordEncrypted(studentId, authToken) {
  const url = `${baseUrl}/api/collections/${collection}/records?perPage=1&skipTotal=1&filter=${encodeFilter(studentId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + authToken, 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('PB record fetch failed: ' + JSON.stringify(data));
  if (!data || !Array.isArray(data.items) || !data.items.length) return null;
  return data.items[0];
}

async function runAppOnce({ backingMap, urlSearch, interaction = null }) {
  const dom = new JSDOM(html, {
    url: `https://app.local/index.html${urlSearch}`,
    runScripts: 'outside-only',
  });

  const { window } = dom;
  const { document } = window;

  // localStorage backed by shared map
  Object.defineProperty(window, 'localStorage', { value: createLocalStorageFacade(backingMap), configurable: true });
  Object.defineProperty(window, 'localStorage', { value: createLocalStorageFacade(backingMap), configurable: true });

  // speech + audio stubs
  const spoken = [];
  window.speechSynthesis = { speak(utterance) { spoken.push({ text: utterance.text, voiceHint: utterance.voiceHint, providerHint: utterance.providerHint }); } };
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  window.Audio = class { play() { return Promise.resolve(); } };
  window.URL.createObjectURL = () => 'blob:mock';
  window.scrollTo = () => {};

  // navigator/services stubs used by app.js
  Object.defineProperty(window, 'navigator', {
    value: {
      mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) },
      serviceWorker: { register: async () => ({}) },
    },
    configurable: true,
  });

  // provide encrypted sync fns
  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.__encryptedSync = Object.assign({}, pocketbaseSync, studentMemorySync, { PracticeStore });

  // fetch shim: serve local files from disk, use real fetch for PB.
  const realFetch = globalThis.fetch;
  const localFetch = async (url, init) => {
    const s = String(url);

    if (s === '/api/tts') {
      return {
        ok: true,
        status: 200,
        blob: async () => new Uint8Array(0),
        json: async () => ({}),
        text: async () => '',
      };
    }

    if (s.startsWith(baseUrl + '/')) {
      return realFetch(url, init);
    }

    const full = resolveLocalPath(url);
    if (!full) throw new Error('Unexpected null local fetch path for: ' + s);

    try {
      const data = fs.readFileSync(full);
      const text = data.toString('utf8');
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(text),
        text: async () => text,
        blob: async () => data,
      };
    } catch (e) {
      return {
        ok: false,
        status: 404,
        json: async () => ({}),
        text: async () => '',
        blob: async () => new Uint8Array(0),
      };
    }
  };

  window.fetch = localFetch;
  globalThis.fetch = localFetch;

  // in app-smoke they eval classic scripts manually. Do the same, but skip module scripts.
  globalThis.window = window;
  globalThis.document = document;
  globalThis.location = window.location;

  const spokenRef = spoken;

  function runClassicScript(source, filename) {
    window.eval(source + '\n//# sourceURL=' + filename);
  }

  for (const script of Array.from(document.querySelectorAll('script'))) {
    if (script.type === 'module') continue;
    if (script.src) {
      const full = path.join(APP_DIR, script.getAttribute('src').replace(/^\.\//, ''));
      runClassicScript(fs.readFileSync(full, 'utf8'), full);
    } else {
      runClassicScript(script.textContent, 'index-inline-script.js');
    }
  }

  document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await sleep(250);

  if (interaction) {
    await interaction({ window, document, spoken: spokenRef });
    await sleep(600);
  }

  return { window, document, spoken: spokenRef };
}

async function main() {
  const studentId = process.env.PB_PROOF_STUDENT_ID || `student-wave3-proof-${Date.now()}`;

  // We'll keep PB creds in the browser URL so initEncryptedSync enables.
  const urlSearch = `?pbBaseUrl=${encodeURIComponent(baseUrl)}&pbAdminEmail=${encodeURIComponent(adminEmail)}&pbAdminPass=${encodeURIComponent(adminPass)}&dogfood=1`;

  const backingMap = new Map();
  // prime studentId; let the app generate passphrase.
  backingMap.set('guitarapp.sync.studentId', studentId);

  // ensure local performance state starts from empty
  backingMap.delete('guitarapp.wave1.pathb');
  backingMap.delete('guitarapp.wave2.pathb.level2');
  backingMap.delete('guitarapp.sync.practiceStore');
  backingMap.delete('guitarapp.sync.lastLoops.1');
  backingMap.delete('guitarapp.sync.lastLoops.2');

  // First open: pull (likely missing) then play through Level 1 loop completion -> push.
  await runAppOnce({
    backingMap,
    urlSearch,
    interaction: async ({ window, document }) => {
      const cards = Array.from(document.querySelectorAll('.lesson-card'));
      if (!cards.length) throw new Error('No lesson cards rendered');
      cards[4].click(); // Lesson 5
      await sleep(60);

      const playA = document.querySelector('#pathb-l1-play-a');
      const playB = document.querySelector('#pathb-l1-play-b');
      if (!playA || !playB) throw new Error('Missing Level 1 performance play buttons');

      // Path B cycle is [Em, easyC]. Click to complete the 1/1 loop.
      playA.click();
      await sleep(10);
      playB.click();
    },
  });

  const passphrase = backingMap.get('guitarapp.sync.passphrase');
  if (!passphrase) throw new Error('App did not generate passphrase');

  const authToken = await authSuperuser();

  // Wait for PB push to appear.
  let rec = null;
  for (let i = 0; i < 12; i++) {
    rec = await getStudentRecordEncrypted(studentId, authToken);
    if (rec) break;
    await sleep(500);
  }
  if (!rec) throw new Error('No PocketBase record found after performance sync');

  const ciphertext = String(rec.ciphertext || '');
  const iv = String(rec.iv || '');

  const plainTokenEasyC = '"chordName":"easyC"';
  const plainTokenEm = '"chordName":"Em"';
  const pbCipherHasPlainEasyC = ciphertext.includes(plainTokenEasyC);
  const pbCipherHasPlainEm = ciphertext.includes(plainTokenEm);

  // Second open: local performance state should be restored from pulled encrypted memory.
  backingMap.delete('guitarapp.wave1.pathb');

  await runAppOnce({ backingMap, urlSearch });

  const restored = backingMap.get('guitarapp.wave1.pathb');
  if (!restored) throw new Error('wave1 pathb not restored on open');
  const restoredState = JSON.parse(restored);

  // Decrypt via pullMemory for sanity.
  const pulled = await pocketbaseSync.pullMemory(studentId, passphrase, {
    live: true,
    authToken,
    baseUrl,
    collection,
  });
  const restoredStore = studentMemorySync.restorePracticeStore(pulled);

  const loopsFromStore = (() => {
    let c = 0;
    for (const s of restoredStore.sessions || []) {
      if (s.lessonId !== 'L05-strumming-in-time') continue;
      for (const a of s.attempts || []) {
        if (a.verdict === 'pass' && a.chordName === 'easyC') c += 1;
      }
    }
    return c;
  })();

  const ok = {
    pbRecordExists: !!rec,
    pbCiphertextNonEmpty: ciphertext.length > 20,
    pbIvNonEmpty: iv.length > 10,
    ciphertextDoesNotContainPlainEasyC: !pbCipherHasPlainEasyC,
    ciphertextDoesNotContainPlainEm: !pbCipherHasPlainEm,
    restoredPerformanceLoopsCompletedIsOne: restoredState.loopsCompleted === 1,
    restoredPerformanceExpectedIndexZero: restoredState.expectedIndex === 0,
    pulledStoreLoopsFromAttemptsMatchesRestored: loopsFromStore === 1,
  };

  for (const [k, v] of Object.entries(ok)) {
    console.log(`${v ? 'PASS' : 'FAIL'}: ${k}`);
  }

  const allPass = Object.values(ok).every(Boolean);
  console.log(`\nRESULT: ${allPass ? 'GREEN' : 'RED'}`);
  if (!allPass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
