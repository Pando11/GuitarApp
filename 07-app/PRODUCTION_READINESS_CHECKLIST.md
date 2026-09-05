# GuitarApp PocketBase Cross-Device Sync — Production Readiness Checklist

**Date**: 2026-09-04  
**Version**: 1.0  
**Checked By**: ________________  
**Date Checked**: ________________

---

## Phase 1: Crypto Security Verification

### PBKDF2 Configuration
- [ ] Iteration count = 150,000 (verify in `core/pocketbaseSync.js` line 13)
  ```bash
  grep "PBKDF2_ITERATIONS = " core/pocketbaseSync.js
  # Expected: const PBKDF2_ITERATIONS = 150000;
  ```
- [ ] Hash algorithm = SHA-256 (verify line 14)
  ```bash
  grep "PBKDF2_HASH = " core/pocketbaseSync.js
  # Expected: const PBKDF2_HASH = 'SHA-256';
  ```
- [ ] Iterations meets OWASP 2024 minimum (120,000)
- [ ] No hardcoded passphrases in code

### AES-256-GCM Configuration
- [ ] Algorithm confirmed as AES-256-GCM (not AES-CBC, AES-CTR)
  ```bash
  grep -n "AES-GCM" core/pocketbaseSync.js
  # Should see multiple references to 'AES-GCM'
  ```
- [ ] 256-bit key derivation confirmed
  ```bash
  grep -n "length: 256" core/pocketbaseSync.js
  ```
- [ ] IV size = 12 bytes (96 bits) for AES-GCM
- [ ] New IV generated per encryption (not reused)
  ```bash
  grep -c "getRandomValues(new Uint8Array(IV_BYTES))" core/pocketbaseSync.js
  # Should see at least 1 occurrence in encryptBlob()
  ```

### Key Derivation Security
- [ ] Base key non-extractable flag confirmed
- [ ] Derived key non-extractable flag confirmed
- [ ] Key usage limited to ['encrypt', 'decrypt']
- [ ] No key material leaked in console logs

### Nonce/IV Management
- [ ] IV stored with ciphertext (required for decryption)
- [ ] IV never reused across different encryptions with same key
- [ ] IV generated via `crypto.getRandomValues()`
- [ ] IV size matches algorithm requirement (96 bits for AES-GCM)

### Recovery Phrase Security
- [ ] Entropy: 24-word dictionary with 5-word default = 22.9 bits entropy
- [ ] Generated via `crypto.getRandomValues()` (not Math.random())
- [ ] Phrase NEVER stored on device (user-generated only)
- [ ] Recovery phrase treated as password-equivalent in documentation
- [ ] Users warned to back up phrase offline

---

## Phase 2: Data Model Verification

### PocketBase Schema
- [ ] Collection `student_memory` exists
  - [ ] Field: `id` (text, required, auto-generated)
  - [ ] Field: `student_id` (text, required, unique)
  - [ ] Field: `ciphertext` (text, required)
  - [ ] Field: `iv` (text, required)
  - [ ] Field: `salt` (text, required)
  - [ ] Field: `updated_at` (text, optional)
- [ ] Collection `settings` exists
  - [ ] Field: `id` (text, required, auto-generated)
  - [ ] Field: `key` (text, required, unique)
  - [ ] Field: `value` (text, optional)
- [ ] Schema file matches PocketBase config: `core/pocketbaseSchema.json`

### Data Mapping
- [ ] Layer 1 (PracticeStore) maps correctly:
  - [ ] sessions array preserved
  - [ ] lessonCompletion object preserved
  - [ ] mute flags preserved
  - [ ] messageLog array preserved
  - [ ] helpRequests array preserved
  - [ ] _nextId counter preserved
- [ ] Layer 2 (StoryMemory) maps correctly:
  - [ ] storyFlags object preserved
  - [ ] recallAnchor string preserved
- [ ] Both layers encrypted together in single ciphertext

### Base64 Encoding
- [ ] Ciphertext base64-encoded before storage
- [ ] IV base64-encoded before storage
- [ ] Salt base64-encoded before storage
- [ ] All three fields decode back to bytes correctly

---

## Phase 3: Encryption Round-Trip Testing

### Offline Crypto Tests
```bash
node core/pocketbaseSync.test.mjs
```
- [ ] All 13 tests pass
  - [ ] Recovery phrase generation (4-6 words)
  - [ ] Ciphertext non-empty
  - [ ] IV non-empty
  - [ ] Decrypt(Encrypt(x)) == x
  - [ ] JSON roundtrip
  - [ ] No plaintext leak
  - [ ] Wrong passphrase throws
  - [ ] pushMemory structure
  - [ ] pullMemory roundtrip
  - [ ] Wrong pullMemory phrase throws
- [ ] Test runs in < 5 seconds
- [ ] No console errors or warnings

### Full Encryption Roundtrip Test
```bash
node test/test-encryption-roundtrip.mjs
```
- [ ] All 10 tests pass
  - [ ] Recovery phrase generation
  - [ ] PracticeStore encryption
  - [ ] Decryption verification
  - [ ] Authentication (wrong passphrase)
  - [ ] Crypto configuration verification
  - [ ] pushMemory/pullMemory roundtrip
  - [ ] pullMemory rejection
  - [ ] Complex data structures
  - [ ] Multi-cycle consistency
  - [ ] SkillMap calculation
- [ ] Test output: "ALL ENCRYPTION TESTS PASSED"
- [ ] Test runs in < 10 seconds

### Encryption Performance
- [ ] Key derivation: < 1 second on target devices
  - [ ] Desktop: ~50-100ms (acceptable)
  - [ ] Mobile: ~200-500ms (acceptable)
  - [ ] No perceived UI lag during sync
- [ ] Encryption: < 5ms for typical data
- [ ] Decryption: < 5ms for typical data

---

## Phase 4: Cross-Device Sync Verification

### Multi-Device Sync Test
**Prerequisite**: PocketBase running at http://127.0.0.1:8090

```bash
node test/test-multidevice-sync.mjs
```
- [ ] Admin token obtained successfully
- [ ] Collections verified
- [ ] Test 1: Device A creates session ✓
- [ ] Test 2: Device A pushes to PocketBase ✓
- [ ] Test 3: Device B pulls from PocketBase ✓
- [ ] Test 4: Device B continues practice ✓
- [ ] Test 5: Device B pushes updated data ✓
- [ ] Test 6: Device A pulls updated data ✓
- [ ] Test 7: Wrong passphrase rejected ✓
- [ ] Test 8: Offline fallback works ✓
- [ ] All 8 test groups pass
- [ ] Output: "ALL SYNC TESTS PASSED"

### Conflict Resolution Test
```bash
node test/test-conflict-resolution.mjs
```
- [ ] Base state pushed
- [ ] Device A modifies offline (adds L02)
- [ ] Device B modifies offline (adds L03)
- [ ] Device A syncs at T1
- [ ] Device B syncs at T2 (overwrites A)
- [ ] Last-write-wins confirmed
  - [ ] Device A sees Device B's changes
  - [ ] Device B sees own changes
  - [ ] Consistent final state
- [ ] Data loss acknowledged and documented
- [ ] Output: "Conflict resolution test PASSED"

---

## Phase 5: Security Audit

### Transport Security
- [ ] Offline mode (default): No HTTPS required ✓
- [ ] Live mode: Require HTTPS in production
  ```javascript
  if (live && !baseUrl.startsWith('https://')) {
    throw new Error('Live PocketBase sync requires HTTPS');
  }
  ```
- [ ] No HTTP to HTTPS redirect issues
- [ ] Certificate validation enabled

### Authentication
- [ ] Auth token never in query string
- [ ] Auth token in Authorization header (Bearer scheme)
- [ ] Token expiration handled
- [ ] Token refresh mechanism (if applicable)
- [ ] No tokens logged to console

### Data at Rest
- [ ] Ciphertext unreadable without key
- [ ] IV stored but non-secret
- [ ] Salt stored but non-secret
- [ ] No plaintext in database
- [ ] No encryption keys in database

### API Security
- [ ] Collection rules set appropriately
  - [ ] Development: All rules empty (for testing) ⚠
  - [ ] Production: Proper auth rules configured
- [ ] Admin/user separation enforced
- [ ] Rate limiting considered (PocketBase admin only)
- [ ] CORS configured correctly

### Code Review
- [ ] No hardcoded secrets in source
- [ ] No API keys in version control
- [ ] Error messages don't leak sensitive info
- [ ] No timing attacks on passphrase comparison
- [ ] Crypto library usage matches documentation

---

## Phase 6: Production Configuration

### PocketBase Setup
- [ ] PocketBase v0.22.12 or later deployed
- [ ] Admin account created (strong password)
- [ ] Collections created with correct schema
- [ ] Access rules configured:
  - [ ] Development: Permissive (for testing)
  - [ ] Production: User-authenticated
- [ ] HTTPS configured and enforced
- [ ] Database backups enabled
- [ ] Monitoring/alerting configured

### Environment Variables
```bash
# .env or deployment config
POCKETBASE_URL=https://sync.guitarapp.com
POCKETBASE_ADMIN_EMAIL=admin@guitarapp.local
# DO NOT include ADMIN_PASSWORD in env (use secure key management)
```
- [ ] POCKETBASE_URL set to production domain
- [ ] HTTPS enforced in app code
- [ ] No secrets in client-side code
- [ ] Environment-specific configs separated

### Monitoring & Logging
- [ ] Sync success/failure logged
- [ ] Error messages captured (not sensitive data)
- [ ] Performance metrics tracked (key derivation time)
- [ ] User warnings logged (wrong passphrase, network errors)
- [ ] Audit log for admin changes

---

## Phase 7: User Experience & Accessibility

### Passphrase Handling
- [ ] Recovery phrase displayed clearly
- [ ] Copy-to-clipboard button provided
- [ ] Print option for offline backup
- [ ] Instructions for safe storage
- [ ] Warning: "Never share this phrase"
- [ ] QR code option (encodes phrase) - optional

### Sync UX
- [ ] Sync status visible (pending, syncing, success, failed)
- [ ] Error messages user-friendly (no tech jargon)
- [ ] Offline mode transparent (automatic fallback)
- [ ] Retry mechanism for failed syncs
- [ ] User can trigger manual sync
- [ ] Sync doesn't block UI (background/async)

### Recovery & Support
- [ ] User can reset/clear local data if needed
- [ ] Recovery instructions provided
- [ ] Support contact info displayed
- [ ] FAQ for common issues
- [ ] Known limitations documented

---

## Phase 8: Documentation

### Developer Documentation
- [ ] `POCKETBASE_CROSS_DEVICE_SYNC_GUIDE.md` complete ✓
- [ ] API documentation for pushMemory/pullMemory ✓
- [ ] Data model documented ✓
- [ ] Crypto config documented ✓
- [ ] Troubleshooting guide included ✓
- [ ] Quick start guide included ✓

### User Documentation
- [ ] How to enable cross-device sync (user guide)
- [ ] How to use recovery phrase
- [ ] How to sync to another device
- [ ] What happens if passphrase is lost
- [ ] Offline access documentation
- [ ] FAQ for common scenarios

### Operations Documentation
- [ ] PocketBase deployment guide
- [ ] Admin account setup
- [ ] Backup procedures
- [ ] Recovery procedures
- [ ] Monitoring setup
- [ ] Security best practices

---

## Phase 9: Integration Testing

### Browser Compatibility
- [ ] Chrome v90+ ✓ (Web Crypto available)
- [ ] Firefox v78+ ✓ (Web Crypto available)
- [ ] Safari v14.1+ ✓ (Web Crypto available)
- [ ] Edge v90+ ✓ (Web Crypto available)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)
- [ ] PWA offline mode tested

### Device Testing
- [ ] Desktop (Windows/macOS/Linux)
- [ ] Tablet (iPad/Android tablet)
- [ ] Phone (iPhone/Android phone)
- [ ] Network conditions:
  - [ ] Wifi fast
  - [ ] Wifi slow (3G throttle)
  - [ ] Offline → Online transition
  - [ ] Online → Offline transition

### Data Integrity
- [ ] Large data sets (1000+ practice sessions)
- [ ] Long sessions (> 2 hour sync time)
- [ ] Concurrent syncs from multiple tabs/windows
- [ ] Service worker cache doesn't interfere
- [ ] LocalStorage quota exceeded handling

---

## Phase 10: Security Review & Pen Testing

### Internal Review
- [ ] Code review by 2+ developers
- [ ] Crypto implementation reviewed by security expert
- [ ] No known vulnerabilities in dependencies
- [ ] Dependencies up-to-date (npm audit clean)
- [ ] OWASP Top 10 checklist completed

### External Review (Optional)
- [ ] Security audit scheduled: ________________
- [ ] Pen testing scheduled: ________________
- [ ] Results: ________________
- [ ] Issues resolved: ________________

### Compliance
- [ ] GDPR compliant (encryption at rest)
- [ ] CCPA compliant (data minimization)
- [ ] HIPAA compliant (if applicable)
- [ ] PCI DSS N/A (no payment data encrypted)

---

## Phase 11: Final Verification Checklist

### Pre-Launch Testing
```bash
# Run all tests in sequence
cd C:\Users\Hendrickson\Desktop\GuitarApp\07-app

echo "=== COMPREHENSIVE PRE-LAUNCH TEST ==="

echo "Test 1: Offline crypto (no server required)"
node core/pocketbaseSync.test.mjs
[ $? -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL"

echo ""
echo "Test 2: Full encryption roundtrip"
node test/test-encryption-roundtrip.mjs
[ $? -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL"

echo ""
echo "Test 3: Multi-device sync (requires PocketBase)"
node test/test-multidevice-sync.mjs
[ $? -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL"

echo ""
echo "Test 4: Conflict resolution"
node test/test-conflict-resolution.mjs
[ $? -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL"

echo ""
echo "=== END TEST SUITE ==="
```

- [ ] Test 1: Offline crypto ✓
- [ ] Test 2: Encryption roundtrip ✓
- [ ] Test 3: Multi-device sync ✓
- [ ] Test 4: Conflict resolution ✓
- [ ] All tests passed
- [ ] No errors or warnings
- [ ] Performance acceptable

### Deployment Checklist
- [ ] Staging environment deployed and tested
- [ ] Production environment prepared
- [ ] Database backups verified
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] On-call schedule established
- [ ] Support team trained

---

## Sign-Off

### Development Team
- [ ] Implementation complete: __________ Date: __________
- [ ] Code review passed: __________ Date: __________
- [ ] All tests passing: __________ Date: __________

### QA/Testing Team
- [ ] Security audit complete: __________ Date: __________
- [ ] Integration testing complete: __________ Date: __________
- [ ] UAT approved: __________ Date: __________

### Security Team
- [ ] Security review complete: __________ Date: __________
- [ ] Crypto configuration approved: __________ Date: __________
- [ ] Data handling approved: __________ Date: __________

### Product/Management
- [ ] Feature approved: __________ Date: __________
- [ ] Documentation complete: __________ Date: __________
- [ ] Go/No-Go decision: [ ] GO [ ] NO-GO Date: __________

---

## Launch Notes

**Date Launched**: ________________  
**Environment**: [ ] Dev [ ] Staging [ ] Production  
**Known Limitations**:
- Last-write-wins conflict resolution (data loss possible with concurrent syncs)
- Passphrase cannot be recovered if lost
- HTTPS required for production

**Follow-Up Tasks**:
1. ________________ (Due: ________)
2. ________________ (Due: ________)
3. ________________ (Due: ________)

**Post-Launch Monitoring**:
- [ ] Monitor sync success rate (target: > 99%)
- [ ] Monitor error logs (alert on: authentication failures, crypto errors)
- [ ] Monitor performance (key derivation time, network latency)
- [ ] Collect user feedback on sync experience
- [ ] Review and implement improvements

---

**Document Version**: 1.0  
**Last Updated**: 2026-09-04  
**Valid For**: GuitarApp 07-app with PocketBase v0.22.12+
