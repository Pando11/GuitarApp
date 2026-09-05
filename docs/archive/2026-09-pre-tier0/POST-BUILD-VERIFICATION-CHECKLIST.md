# Post-Build Verification Checklist (Phase 6 & 7)

**Purpose**: Comprehensive verification that the app works correctly after each build  
**When**: After every Phase 6 & 7 feature completion  
**Owner**: QA Engineer + Team Leads  
**Duration**: 2-4 hours per release  

---

## Quick Check (5 min emergency verification)

Run this if you need a quick "is it broken?" check:

```bash
#!/bin/bash
# quick-verify.sh

echo "🎸 Quick Verification Check..."
echo ""

# 1. Tests pass
echo "1. Running tests..."
npm run test:all > /tmp/test-output.txt 2>&1
if grep -q "RESULTS: 46.*passed" /tmp/test-output.txt; then
  echo "✅ Tests: PASS"
else
  echo "❌ Tests: FAIL"
  cat /tmp/test-output.txt | tail -5
fi

# 2. App starts
echo "2. Starting app server..."
timeout 5 npx http-server 07-app -p 8899 > /dev/null 2>&1 &
sleep 2
if curl -s http://localhost:8899 | grep -q "GuitarApp"; then
  echo "✅ App: Loads"
else
  echo "❌ App: Fails to load"
fi
killall http-server 2>/dev/null

# 3. Audio files exist
echo "3. Checking audio files..."
audio_count=$(find 07-app/audio -name "*.wav" | wc -l)
if [ $audio_count -ge 140 ]; then
  echo "✅ Audio: $audio_count files found"
else
  echo "❌ Audio: Only $audio_count files (expected 140+)"
fi

echo ""
echo "Quick check complete."
```

---

## Full Verification Suite

### Phase 1: Code & Tests (30 min)

#### 1.1: All Tests Pass
```bash
# Run full test suite
npm run test:all

# Expected output:
# ✓ APP SMOKE: 28 passed, 0 failed
# ✓ RESULTS: 18 passed, 1 failed (audio detection, non-blocking)
# ✓ Total: 46+ passed

# If any fail, identify which test and run it in isolation:
npm run test:app-smoke  # Smoke tests only
npm run test:playwright # Browser tests only
```

**Checklist**:
- [ ] App smoke tests: 28/28 pass
- [ ] Playwright tests: 18/19 pass (audio test optional)
- [ ] No new test failures introduced
- [ ] All test output reviewed

#### 1.2: No Console Errors
```bash
# Start app and capture console
cd 07-app
npx http-server -p 8080 &

# Open browser DevTools Console → check for errors
# Expected: 0 errors, 0 warnings (or only minor ones)
# Common safe warnings: deprecation notices, third-party ads

# Test in multiple browsers:
# - Chrome (Chromium)
# - Safari (if available)
# - Firefox
```

**Checklist**:
- [ ] Chrome: No errors in console
- [ ] Firefox: No errors in console
- [ ] Safari: No errors in console
- [ ] Mobile browser: No errors

#### 1.3: No Linting Errors
```bash
# If eslint configured:
npm run lint

# Expected: 0 errors, warnings OK

# If not configured, do manual code review:
grep -r "console\.log\|debugger\|TODO REMOVE" 07-app/core/
# Expected: No output (no debug code)
```

**Checklist**:
- [ ] Linting passes (if configured)
- [ ] No debug console.log statements
- [ ] No hardcoded API keys in code
- [ ] No TODOs for removal

#### 1.4: Git History Clean
```bash
# No secrets accidentally committed
git log --oneline | head -5

# Check for common patterns
git diff HEAD~1 | grep -i "password\|api.key\|secret\|token" || echo "✅ No secrets"

# Expected: No sensitive data in recent commits
```

**Checklist**:
- [ ] No secrets in git history
- [ ] Commit messages are descriptive
- [ ] No merge conflicts in code
- [ ] Branch clean (no stray commits)

---

### Phase 2: Functionality Testing (30 min)

#### 2.1: Core Features Work
```bash
# Start the app
cd 07-app
npx http-server -p 8080

# Test in browser:
```

**Manual Tests**:
- [ ] Home page loads (25 lesson cards visible)
- [ ] First 5 lessons unlocked, rest locked
- [ ] Click "Begin Lesson 1" → lesson opens
- [ ] Sage panel visible with coaching copy
- [ ] Click "Back to the path" → return to home
- [ ] Performance rail shows on home
- [ ] Click Lesson 5 → performance tracking mounts
- [ ] Click practice buttons → loops record
- [ ] Refresh page → loops still saved
- [ ] All 25 lessons accessible (eventually)

**Expected Behavior**:
- Smooth transitions
- No janky animations
- Data persists
- Lesson content readable

#### 2.2: New Phase 6/7 Features Work
```bash
# If audio added (Phase 6):
```

**Audio Testing**:
- [ ] Lesson 1 loads and audio starts playing
- [ ] Audio plays without crackling/distortion
- [ ] Audio syncs with text (voice matches content)
- [ ] Audio volume is audible (not too quiet)
- [ ] All 150 audio files exist
- [ ] No 404 errors in DevTools Network tab

```bash
# If adaptive pacing added (Phase 7):
```

**Adaptive Pacing Testing** (if implemented):
- [ ] Lesson pacing changes after completion
- [ ] Feedback shows "Too fast?" or "Too slow?" option
- [ ] Next lesson's speed reflects feedback
- [ ] Pacing preference persists

```bash
# If AI chat added (Phase 7):
```

**Chat Testing** (if implemented):
- [ ] Chat button visible and clickable
- [ ] Chat opens in modal/panel
- [ ] Can type message
- [ ] AI responds within 3 seconds
- [ ] Chat history shows
- [ ] Chat closes properly

**Checklist**:
- [ ] All new features functionally correct
- [ ] No UI overlaps or layout issues
- [ ] Loading states show while processing
- [ ] Error messages clear and actionable
- [ ] Mobile layout adapts correctly

#### 2.3: Navigation & State Management
```bash
# Test user journey
```

**Journey Test**:
- [ ] Start app → Home page
- [ ] Click Lesson 1 → Open
- [ ] Do practice → Data saves
- [ ] Back to home → Lesson data persists
- [ ] Open Lesson 1 again → Saved data loads
- [ ] Complete Lesson 1 → Can open Lesson 2
- [ ] Refresh page anywhere → State preserved
- [ ] Open DevTools → Network tab shows no 404 errors

**Checklist**:
- [ ] State persists (localStorage)
- [ ] Navigation responsive (clicks register)
- [ ] No infinite loops or freezes
- [ ] Undo/back works properly
- [ ] Deep links work (if URL-based navigation)

---

### Phase 3: Performance Testing (20 min)

#### 3.1: Load Time
```bash
# Measure Time to Interactive (TTI)
# Using Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to Performance tab
# 3. Record page load
# 4. Check "Time to Interactive" metric

# Expected: < 2 seconds on 4G throttling
```

**Test on Different Networks**:
- [ ] Desktop (No throttle): < 1 second
- [ ] Desktop (4G throttle): < 2 seconds
- [ ] Mobile (4G throttle): < 2 seconds
- [ ] Mobile (LTE): < 1.5 seconds

#### 3.2: Interaction Performance
```bash
# Measure interaction responsiveness
# Using Chrome DevTools Performance Profiler:
```

**Interactions to Test**:
- [ ] Click lesson card → Opens in < 100ms
- [ ] Click practice button → Registers immediately
- [ ] Scroll lesson content → 60fps (no jank)
- [ ] Navigate back → < 100ms
- [ ] Load audio → Plays within < 500ms
- [ ] Open chat (if applicable) → < 300ms

**Expected**: No dropped frames (60fps maintained)

#### 3.3: Memory Usage
```bash
# Check memory during normal use
# DevTools → Memory tab → Heap Snapshot
```

**Baseline Measurements**:
- [ ] Initial load: < 20MB
- [ ] After 5 lessons: < 40MB
- [ ] After 1 hour of use: < 60MB
- [ ] No memory leaks (heap size stable)

**Test for leaks**:
- [ ] Open/close lesson 10 times
- [ ] Memory should not continuously grow
- [ ] Take heap snapshot → verify no detached DOM nodes

#### 3.4: Mobile Performance
```bash
# Test on real mobile device (iOS/Android)
# Or use Chrome emulation:
# 1. DevTools → Device Toolbar
# 2. Select "Mobile" preset
# 3. Run same performance tests
```

**Checklist**:
- [ ] App responsive at 375px width (phone)
- [ ] No horizontal scroll
- [ ] Touch targets >= 44x44px
- [ ] No layout shift on interaction
- [ ] Performance acceptable on 4G

---

### Phase 4: Browser Compatibility (15 min)

#### 4.1: Desktop Browsers
```bash
# Test on each browser
```

**Chrome/Chromium**:
- [ ] All features work
- [ ] Performance good
- [ ] No console errors

**Firefox**:
- [ ] All features work
- [ ] CSS renders correctly
- [ ] No compatibility errors

**Safari (macOS)**:
- [ ] All features work
- [ ] Audio plays
- [ ] Touch/click works

**Edge** (if applicable):
- [ ] Features work
- [ ] Layout correct

#### 4.2: Mobile Browsers
```bash
# On iOS and Android devices
```

**iOS Safari**:
- [ ] App loads
- [ ] Audio works
- [ ] Responsive layout
- [ ] Can save progress
- [ ] PWA install works (Add to Home Screen)

**Android Chrome**:
- [ ] App loads
- [ ] Audio works
- [ ] Responsive layout
- [ ] Can save progress
- [ ] PWA install works

**Checklist**:
- [ ] Chrome (desktop): ✓
- [ ] Firefox: ✓
- [ ] Safari (macOS): ✓
- [ ] Safari (iOS): ✓
- [ ] Chrome (Android): ✓
- [ ] Edge: ✓

---

### Phase 5: Security & Privacy (15 min)

#### 5.1: No Sensitive Data Exposed
```bash
# Check for common mistakes
grep -r "password\|apiKey\|secret\|token" 07-app/core/*.js | grep -v "// " || echo "✅ Safe"

# Check localStorage
# DevTools → Application → Local Storage
# Expected: No passwords, no raw API keys
```

**Checklist**:
- [ ] No API keys in source code
- [ ] No passwords in localStorage
- [ ] No PII (personal data) in logs
- [ ] localStorage uses encryption (if needed)

#### 5.2: HTTPS & Security Headers
```bash
# If deployed (not localhost):
curl -I https://your-domain.com | grep -E "Strict-Transport|X-Content|CSP"

# Expected headers:
# Strict-Transport-Security: max-age=31536000
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
```

**Checklist** (if deployed):
- [ ] HTTPS enforced
- [ ] HSTS header set
- [ ] X-Content-Type-Options set
- [ ] Content-Security-Policy set
- [ ] X-Frame-Options set

#### 5.3: Input Validation
```bash
# Test XSS protection (chat input if applicable)
```

**Test Cases**:
- [ ] Type `<script>alert('xss')</script>` in chat
- [ ] Expected: Script doesn't execute, text escaped
- [ ] Type `<img src=x onerror=alert('xss')>`
- [ ] Expected: Safely escaped, no popup

**Checklist**:
- [ ] All user inputs escaped/sanitized
- [ ] No eval() or innerHTML on user data
- [ ] DOMPurify or similar used (if applicable)
- [ ] Chat logs don't execute code

#### 5.4: Privacy Compliance
```bash
# Check if telemetry/analytics ask for consent
# Open DevTools Console
```

**Test Cases**:
- [ ] Analytics: Consent banner appears (or opt-in required)
- [ ] Can opt-out of tracking
- [ ] Telemetry doesn't log sensitive data
- [ ] GDPR/CCPA compliance documented

**Checklist**:
- [ ] Consent mechanism working
- [ ] Opt-out available
- [ ] No sensitive data in analytics
- [ ] Privacy policy accessible
- [ ] Data retention policy documented

---

### Phase 6: Accessibility (15 min)

#### 6.1: Keyboard Navigation
```bash
# Test without mouse
# Press Tab through all interactive elements
```

**Expected**:
- [ ] Tab order logical (left to right, top to bottom)
- [ ] Visible focus indicator on every focusable element
- [ ] Can click buttons with Enter/Space
- [ ] Can operate chat (if applicable) with keyboard
- [ ] No keyboard traps (can't tab out of modals without closing)

**Test Cases**:
- [ ] Tab to "Begin Lesson 1" → press Enter → lesson opens
- [ ] Tab to "Back to home" → press Enter → go back
- [ ] Tab through lesson → all practicum interactions accessible
- [ ] ESC closes modals (if applicable)

#### 6.2: Screen Reader
```bash
# Test with screen reader (use free tools)
# Windows: Narrator (built-in, press Win + Enter)
# macOS: VoiceOver (CMD + F5)
# Linux: Orca
```

**Test Cases**:
- [ ] Page title announced
- [ ] Headings announced properly (H1, H2, etc.)
- [ ] Buttons announced as buttons with labels
- [ ] Images have alt text (or are decorative)
- [ ] Form fields have labels
- [ ] Error messages announced

#### 6.3: Color Contrast
```bash
# Use WebAIM Color Contrast Checker
# Or Chrome DevTools: Right-click element → Inspect → contrast ratio shown
```

**Expected**:
- [ ] Text on background: 4.5:1 ratio (normal), 3:1 (large)
- [ ] UI components: 3:1 ratio
- [ ] No color alone conveys info (use icons + color)

**Checklist**:
- [ ] All text meets WCAG AA (4.5:1)
- [ ] Buttons clearly distinguish from background
- [ ] Error states visible without color alone
- [ ] Charts/graphs have patterns + color

#### 6.4: Responsive Design
```bash
# Test at multiple viewport sizes
# DevTools → Device Toolbar
```

**Viewport Sizes**:
- [ ] 320px (iPhone SE) - All content readable, no horizontal scroll
- [ ] 375px (iPhone 12/13) - Optimal mobile experience
- [ ] 768px (iPad) - Tablet layout
- [ ] 1024px+ (Desktop) - Full desktop experience

**Checklist**:
- [ ] Text readable at all sizes
- [ ] Buttons/taps large enough (44x44px min)
- [ ] No content hidden at mobile
- [ ] Layout adapts gracefully
- [ ] Landscape & portrait both work

---

### Phase 7: Data Persistence (10 min)

#### 7.1: localStorage Persistence
```bash
# Test data saves across page reloads
```

**Test Case 1: Lesson Progress**:
1. Start app → click Lesson 1
2. Do some practice
3. Refresh page (F5)
4. Expected: Progress still shows, loops counted

**Test Case 2: localStorage Survival**
1. Open DevTools → Application → Local Storage
2. Note the values
3. Refresh page
4. Expected: Same values still there

**Test Case 3: Corruption Recovery**
1. DevTools Console: `localStorage.clear()`
2. Refresh page
3. Expected: App doesn't crash, starts fresh
4. Do practice again
5. Expected: localStorage repopulates

#### 7.2: Multiple Device Sync (Phase 7 only)
```bash
# If PocketBase sync implemented
```

**Test Case**:
1. On Device A: Complete Lesson 1
2. On Device B: Progress should sync (depends on sync interval)
3. Expected: Both devices show same progress after 30-60s

**Checklist**:
- [ ] Data saves locally
- [ ] Data survives refresh
- [ ] Data survives app close/reopen
- [ ] Data syncs across devices (if applicable)
- [ ] Conflict resolution works (if editing on 2 devices)

---

### Phase 8: Analytics & Monitoring (10 min)

#### 8.1: Events Logged
```bash
# Check if telemetry is working
# DevTools → Network tab
```

**Look for**:
- [ ] `POST` requests to `/api/events` or analytics endpoint
- [ ] Request body contains event data (lesson_opened, practice_loop, etc.)
- [ ] Events fire at correct moments
- [ ] No duplicate events
- [ ] Events don't contain sensitive data

**Test Cases**:
1. Open app → check for `app_start` event
2. Open lesson → check for `lesson_opened` event
3. Complete practice → check for `lesson_completed` event
4. Refresh page → check events still fire

#### 8.2: Errors Logged
```bash
# If error tracking set up (Sentry, Rollbar, etc.)
```

**Test Cases**:
1. Trigger error: Open DevTools Console
2. `throw new Error('test error')`
3. Check error tracking dashboard
4. Expected: Error appears in dashboard with stack trace

**Checklist** (if configured):
- [ ] Error tracking active
- [ ] Unhandled errors auto-reported
- [ ] Stack traces useful for debugging
- [ ] User identification (if applicable)
- [ ] Error rate monitoring

---

### Phase 9: Deployment Verification (20 min)

#### 9.1: Staging Environment
```bash
# If deployed to staging
```

**Verification**:
- [ ] App accessible at staging URL
- [ ] HTTPS working
- [ ] All tests passing
- [ ] Performance metrics acceptable
- [ ] No external API calls failing (check Network tab)
- [ ] Monitoring dashboard showing data

#### 9.2: Production Readiness
```bash
# Final checklist before going live
```

**Pre-Deployment**:
- [ ] Main branch is clean (no uncommitted changes)
- [ ] All tests passing
- [ ] Staging verified for 24-48 hours
- [ ] No known issues
- [ ] Deployment runbook reviewed
- [ ] Rollback procedure ready
- [ ] Team trained on deployment
- [ ] Notifications/alerts configured

**Post-Deployment**:
- [ ] Health checks passing
- [ ] App responding to requests
- [ ] Performance metrics normal
- [ ] Error rate at baseline
- [ ] User traffic flowing
- [ ] Monitoring dashboard active
- [ ] Team on standby for 2 hours

#### 9.3: Gradual Rollout (Feature Flags)
```bash
# If using feature flags for Phase 7 features
```

**Rollout Schedule**:
- [ ] Day 1: 10% of users
- [ ] Day 2: 25% of users
- [ ] Day 3: 50% of users
- [ ] Day 4: 100% of users

**At each step**:
- [ ] Monitor error rate (should stay < 0.5%)
- [ ] Monitor performance (TTI, FID should stay same)
- [ ] Monitor adoption (are users using new feature?)
- [ ] Check user feedback (social, support tickets)
- [ ] Ready to roll back if issues

**Checklist**:
- [ ] Feature flags deployed
- [ ] Monitoring configured per feature
- [ ] Alert thresholds set
- [ ] Rollback tested
- [ ] Communication plan (notify users of new feature)

---

## Verification Report Template

```markdown
# Build Verification Report — [Date] [Release Name]

## Quick Summary
- [ ] All tests pass? **Yes / No**
- [ ] Performance acceptable? **Yes / No**
- [ ] No critical bugs? **Yes / No**
- [ ] Ready to deploy? **Yes / No / Conditional**

## Detailed Results

### Code & Tests
- Tests: 46/47 passing (expected)
- Linting: ✓ Pass / ⚠ Warnings / ❌ Fail
- Git history: ✓ Clean / ⚠ Needs review / ❌ Issues found
- Console errors: 0 (expected: 0-2 warnings OK)

### Functionality
- Core features: ✓ All working
- New Phase 6 features: ✓ All working
- New Phase 7 features: ✓ All working / ⏳ In progress / ❌ Issues

### Performance
- TTI (desktop 4G): 1.8s (target: < 2s) ✓
- TTI (mobile 4G): 1.9s (target: < 2s) ✓
- Memory leak: ✓ None detected
- 60fps interactions: ✓ Yes / ⚠ Some jank / ❌ Major issues

### Browsers
- Chrome: ✓ Pass
- Firefox: ✓ Pass
- Safari: ✓ Pass / ⚠ Minor issues / ❌ Fail
- Mobile (iOS): ✓ Pass
- Mobile (Android): ✓ Pass

### Security & Privacy
- Sensitive data exposed: ✓ None / ⚠ Review needed / ❌ Issues found
- XSS protection: ✓ Working
- HTTPS (if deployed): ✓ Working
- Analytics consent: ✓ Yes

### Accessibility
- Keyboard navigation: ✓ Pass / ⚠ Minor issues / ❌ Fail
- Screen reader: ✓ Pass / ⚠ Minor issues / ❌ Fail
- Color contrast: ✓ Pass (all >= 4.5:1)
- Responsive: ✓ Pass (320px, 375px, 768px, 1024px)

### Data Persistence
- localStorage: ✓ Working
- Cross-refresh: ✓ Data survives
- Recovery: ✓ Graceful (no crashes)
- Cross-device sync (Phase 7): N/A / ⏳ Testing / ✓ Working

### Analytics & Monitoring
- Events logging: ✓ Yes
- Error tracking: ✓ Yes
- Dashboard: ✓ Accessible
- Alerts: ✓ Configured

### Deployment
- Staging verified: ✓ Yes / ⏳ In progress / N/A
- Deployment runbook: ✓ Ready
- Rollback plan: ✓ Ready
- Team trained: ✓ Yes
- Go/No-go decision: **GO** / **HOLD** / **ROLLBACK**

## Issues Found
| Severity | Issue | Fix Status | Owner |
|----------|-------|-----------|-------|
| Critical | [if any] | [Fixed/Blocking] | [Name] |
| High | [if any] | [Fixed/Blocking] | [Name] |
| Medium | [if any] | [Fixed/Deferred] | [Name] |
| Low | [if any] | [Fixed/Deferred] | [Name] |

## Signed Off
- QA Lead: _________________ Date: _______
- Product Lead: _________________ Date: _______
- DevOps Lead: _________________ Date: _______

## Notes
[Any additional context for next deployment]
```

---

## Automation (CI/CD Integration)

### Automated Checks (Runs on every commit)
```yaml
# .github/workflows/verify.yml (if using GitHub Actions)
name: Verify Build
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:all
      - run: npm run lint (if configured)
      - name: Performance Check
        run: node scripts/perf-check.mjs
      - name: Security Check
        run: npm audit
      - name: Accessibility Check
        run: npm run audit:a11y (if available)
```

### Automated Deployment (After verification passes)
```yaml
# Only deploys if all checks pass
  deploy:
    needs: verify
    if: success()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run build
      - run: deploy-to-production.sh
      - name: Smoke Test Live
        run: curl -f https://guitar-app.com | grep -q GuitarApp
```

---

## Quick Reference: Common Issues & Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "Audio elements found 0" test fails | Test issue (not app issue) | Update test to check fetch calls instead of DOM |
| App slow on mobile | Asset size large | Minify CSS/JS, lazy-load non-critical modules |
| Memory leak after 1 hour | Event listeners not removed | Remove listeners in component cleanup |
| localStorage data lost | Quota exceeded or cleared | Check quota, implement compression if needed |
| Cross-device sync fails | PocketBase not running | Ensure backend is accessible, check network |
| Screen reader doesn't read chat (Phase 7) | aria-live not set | Add `role="log" aria-live="polite"` to chat area |

---

## Approval Sign-Off

This checklist must be **completed and signed off** before any production deployment.

**For Phase 6**: Full verification needed (all sections)  
**For Phase 7 incremental features**: Verification per workstream (can be phased)  
**For hotfixes**: Quick check + affected area verification

---

*This checklist is the last gate before users see your work. Take it seriously. 🚀*
