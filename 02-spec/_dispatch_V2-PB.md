REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp
LEGAL FLOOR (never violate): Rule 5 — stored numbers only. Rule 9 — commercial-clean + free ONLY (PocketBase is MIT — approved). Rule 2 — no camera. Rule 8 — chord correctness.

YOUR FILE OWNERSHIP (write ONLY these): CREATE NEW FILE 07-app/core/pocketbaseSync.js, CREATE NEW FILE 07-app/core/pocketbaseSync.test.mjs, CREATE NEW FILE 07-app/core/pocketbaseSchema.json, EDIT 07-app/core/entitlementStore.js (currently 76 lines — build it out). Do NOT edit other agents' files.

CONTEXT:
- PocketBase binary is NOT on this machine and no server can run here -> the PB SERVER is BLOCKED. BUT the client-side crypto handshake (Layer 3, ADR-0005) is pure Web Crypto and IS testable in node v22 (globalThis.crypto.webcrypto available). So you DELIVER the client code + schema, and VERIFY the crypto roundtrip OFFLINE. The actual server round-trip is flagged BLOCKED.
- Layer 1 (practiceStore) + Layer 2 (storyMemory, being built in parallel) are the blobs to encrypt.
- Recovery phrase: 4-6 words set at 2nd-device add (ADR-0001).

BUILD:
1. pocketbaseSchema.json: a PocketBase collection "student_memory" schema with fields: id (text/auto), student_id (text, required, unique), ciphertext (text, required), iv (text, required), updated_at (text). Plus a "settings" collection for entitlement if useful. Valid JSON.

2. pocketbaseSync.js (Layer 3 client + crypto):
   - deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> via PBKDF2 (SHA-256, >=100k iters).
   - encryptBlob(plaintext: string, key): Promise<{iv: base64, ciphertext: base64}> using AES-GCM 256.
   - decryptBlob({iv, ciphertext}, key): Promise<string>.
   - generateRecoveryPhrase(): string  -> 4-6 words (use a small built-in word list constant; pick deterministically from crypto random).
   - pushMemory(studentId, blob, passphrase): builds the encrypted record object (ciphertext+iv) ready to POST to PB (do NOT actually POST — server blocked; return the record object + a comment showing the fetch() call that would run if server were up).
   - pullMemory(studentId, passphrase): returns the decrypt-ready shape (commented fetch). 
   - All functions guarded; export them.

3. entitlementStore.js (A2.4 stub): Currently a 76-line stub. Build it out to: track entitlement state, expose isEntitled(featureId): boolean, a local-storage-backed flip for testing (setEntitled(true/false)), and a clear note that real RevenueCat/PocketBase payments are NOT wired (stub only). Keep it dependency-free.

4. pocketbaseSync.test.mjs (node, Web Crypto via globalThis.crypto): roundtrip test:
   - generate phrase, derive key, encrypt a sample JSON blob {layer1:{...}, layer2:{...}}, decrypt, assert decrypt===original. assert ciphertext !== plaintext. assert bad passphrase fails to decrypt (throws). Print PASS, exit 0.

REPORT (verifiable handles): paths of all 4 files + actual node stdout of pocketbaseSync.test.mjs (PASS) + explicit BLOCKED statement for the live PB server round-trip (binary/server absent) + note that entitlementStore is a local stub (no real payments).
