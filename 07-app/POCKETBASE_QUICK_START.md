# GuitarApp PocketBase Cross-Device Sync — Quick Start

**For full details, see**: `POCKETBASE_CROSS_DEVICE_SYNC_GUIDE.md` (in scratchpad)

## 60-Second Setup

```bash
# 1. Download PocketBase (≈50 MB)
mkdir -p ~/pocketbase-dev
# Download from: https://github.com/pocketbase/pocketbase/releases/download/v0.22.12/pocketbase_0.22.12_windows_amd64.zip
# Extract to ~/pocketbase-dev

# 2. Start server
cd ~/pocketbase-dev
./pocketbase serve

# Expected: "PocketBase server is running at http://127.0.0.1:8090"

# 3. Create admin (in browser)
# Go to: http://127.0.0.1:8090/_/
# Email: admin@guitarapp.local
# Password: AdminTestPass123!

# 4. Create collections
# Go to: http://127.0.0.1:8090/_/admin/collections
# Click "+New collection"
# Create "student_memory" and "settings" (see guide for fields)
```

## Quick Tests (3 minutes)

```bash
cd C:\Users\Hendrickson\Desktop\GuitarApp\07-app

# Test 1: Offline crypto (no PocketBase needed)
node core/pocketbaseSync.test.mjs
# Expected: "13 passed, 0 failed"

# Test 2: Full encryption roundtrip
node test/test-encryption-roundtrip.mjs
# Expected: "ALL ENCRYPTION TESTS PASSED"

# Test 3: Multi-device sync (requires PocketBase running)
node test/test-multidevice-sync.mjs
# Expected: "ALL SYNC TESTS PASSED"

# Test 4: Conflict resolution
node test/test-conflict-resolution.mjs
# Expected: "Conflict resolution test PASSED"
```

## Data Model

### Layer 1: Practice Data (PracticeStore)
```javascript
{
  sessions: [
    {
      id: "s1",
      lessonId: "L01",
      durationSec: 600,
      completed: true,
      attempts: [
        { chordName: "Em", verdict: "pass", centsOff: 0, ts: 1234567890 }
      ]
    }
  ],
  lessonCompletion: { "L01": { completed: true, lastTs: 1234567890 } },
  mute: { messages: false, sms: false, email: false },
  messageLog: [],
  helpRequests: [],
  _nextId: 2,
  currentTeacherId: "T1"
}
```

### Layer 2: Story Memory
```javascript
{
  storyFlags: { metSage: true, world: "emerald-hollow" },
  recallAnchor: "first-campfire"
}
```

### Layer 3: Encryption (AES-256-GCM)
- **Input**: Layer 1 + Layer 2 (JSON blob)
- **Key derivation**: PBKDF2(passphrase, salt, 150,000 iterations, SHA-256)
- **Encryption**: AES-256-GCM(key, plaintext, IV)
- **Output**: `{ ciphertext, iv, salt }` (all base64)

### PocketBase Schema

**Collection**: `student_memory`
```
- id (auto-generated, text)
- student_id (unique, text) ← User identifier
- ciphertext (text) ← Encrypted blob (base64)
- iv (text) ← Initialization vector (base64)
- salt (text) ← PBKDF2 salt (base64)
- updated_at (text) ← ISO timestamp
```

**Collection**: `settings`
```
- id (auto-generated, text)
- key (unique, text) ← Feature flag name
- value (text) ← Feature flag value
```

## Crypto Configuration (DO NOT CHANGE)

| Parameter | Value | OWASP Requirement |
|-----------|-------|------------------|
| PBKDF2 Iterations | 150,000 | ≥ 120,000 (2024) |
| Hash Function | SHA-256 | Cryptographic |
| Salt Length | 16 bytes (128 bits) | ≥ 128 bits |
| IV Length | 12 bytes (96 bits) | Per-message (AES-GCM) |
| Algorithm | AES-256-GCM | AEAD (authenticated) |
| Key Size | 256 bits | Non-extractable |

## Usage: Web App Integration

```javascript
// Import
import { generateRecoveryPhrase, pushMemory, pullMemory } from './core/pocketbaseSync.js';
import { PracticeStore } from './core/practiceStore.js';

// 1. Generate recovery phrase (user writes down)
const phrase = generateRecoveryPhrase(); // "amber birch cedar delta ember"

// 2. Save practice data to PocketBase (live mode)
const store = new PracticeStore(/* from localStorage */);
const record = await pushMemory(
  'student-id-xyz',
  store.toJSON(),
  phrase,
  {
    baseUrl: 'https://sync.guitarapp.com', // Production: HTTPS
    live: true,
    authToken: 'user-auth-token',
  }
);

// 3. Load practice data from PocketBase (live mode)
const data = await pullMemory(
  'student-id-xyz',
  phrase, // User enters phrase
  {
    baseUrl: 'https://sync.guitarapp.com',
    live: true,
    authToken: 'user-auth-token',
  }
);
const store = new PracticeStore(data);

// 4. Offline mode (no network)
const record = await pushMemory('student-id', store.toJSON(), phrase);
// No live/authToken → returns encrypted record (doesn't upload)
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Web Crypto unavailable" | Use Node v15+ or modern browser |
| "401 Unauthorized" | Check admin token or credentials |
| "No PocketBase record found" | Create initial record first |
| "AES-GCM auth tag failed" | Wrong passphrase (try different phrase) |
| "Slow key derivation" (>1s) | Normal on mobile; use Web Workers for smooth UX |
| "Service worker interfering" | DevTools → Application → Clear cache storage |

## Security Checklist

```
BEFORE PRODUCTION:
[ ] PBKDF2 iterations ≥ 120,000
[ ] Using AES-256-GCM (not AES-CBC or raw CTR)
[ ] IV never reused (new IV per encryption)
[ ] Salt stored with ciphertext
[ ] Recovery phrases NOT stored on device
[ ] Passphrase required for each sync (not cached)
[ ] HTTPS required (live mode only)
[ ] No API keys in client code
[ ] Users warned to treat recovery phrase like password
```

## Files to Know

```
C:\Users\Hendrickson\Desktop\GuitarApp\07-app\

core/
  pocketbaseSchema.json          ← Schema definition
  pocketbaseSync.js              ← Encryption/sync implementation
  pocketbaseSync.test.mjs        ← Offline tests (13 tests)
  practiceStore.js               ← Practice data model

test/
  test-encryption-roundtrip.mjs  ← Full roundtrip verification (10 tests)
  test-multidevice-sync.mjs      ← Cross-device sync (8 tests)
  test-conflict-resolution.mjs   ← Last-write-wins behavior (4 tests)

POCKETBASE_QUICK_START.md        ← This file
POCKETBASE_CROSS_DEVICE_SYNC_GUIDE.md ← Full guide (in scratchpad)
```

## API Examples

### cURL: Authenticate
```bash
curl -X POST http://127.0.0.1:8090/api/admins/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@guitarapp.local","password":"AdminTestPass123!"}'

# Response:
# {"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...","admin":{...}}
```

### cURL: Create Record
```bash
curl -X POST http://127.0.0.1:8090/api/collections/student_memory/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "student_id": "abc123",
    "ciphertext": "abcd1234...",
    "iv": "xyz789...",
    "salt": "salt123...",
    "updated_at": "2026-09-04T12:00:00Z"
  }'
```

### cURL: List Records
```bash
curl http://127.0.0.1:8090/api/collections/student_memory/records \
  -H "Authorization: Bearer <TOKEN>"
```

### cURL: Filter by student_id
```bash
curl "http://127.0.0.1:8090/api/collections/student_memory/records?filter=student_id%3D%22abc123%22" \
  -H "Authorization: Bearer <TOKEN>"
```

## Performance Tips

- **Key derivation**: ~50ms on desktop, ~200ms on mobile (intentional)
- **Encryption**: <5ms for typical data
- **Network**: ~500ms for PocketBase sync
- **Caching**: Don't cache recovery phrases; derive key each sync
- **Web Workers**: Use for smooth UX on slow devices

## Common Questions

**Q: What if user forgets recovery phrase?**
A: Phrase is lost; data cannot be recovered (no backdoor). Recommend offline backup.

**Q: Can we verify the phrase is correct?**
A: Not until decryption attempt (try phrase → throws if wrong).

**Q: What if PocketBase goes down?**
A: Offline mode still works (no sync until server is back).

**Q: Can we change the passphrase?**
A: Decrypt with old phrase → re-encrypt with new phrase → push to server.

**Q: How do we handle conflicts?**
A: Current: last-write-wins. Alternatives: merge, CRDT, versioning (see guide).

**Q: Is HTTPS required?**
A: For live sync in production, YES. For testing (localhost), HTTP is fine.

---

**Version**: 1.0  
**Last Updated**: 2026-09-04  
**PocketBase**: v0.22.12+  
**Security Standard**: OWASP 2024
