# Phase 6: Production Readiness Handoff

**Status**: Ready to start (after Phase 5 user testing complete)  
**Duration**: 1-2 weeks  
**Owner**: [Next agent/developer team]  
**Priority**: Blocking release  

---

## Overview

Phase 6 transforms GuitarApp from a tested prototype into a production-ready product. This includes:
- ✅ Real teacher voice audio (TTS generation)
- ✅ Performance optimization for mobile
- ✅ Error handling & crash recovery
- ✅ Analytics & telemetry
- ✅ Deployment infrastructure
- ✅ Documentation & onboarding

**Output**: Live app accessible to general users with full lesson experience.

---

## Critical Path: The 5 Workstreams

### Workstream 1: Real Audio Generation (2-3 hours)
**Owner**: Audio engineer / TTS specialist  
**Blocker for**: Public launch (can't ship silent audio)

#### Step 1.1: Set Up Google Cloud TTS
See `PHASE-5-AUDIO-HANDOFF.md` for detailed setup.

```bash
# Quick reference
export GOOGLE_CLOUD_TTS_API_KEY="your-key"
# Verify: npm install -g @google-cloud/text-to-speech
```

#### Step 1.2: Run Audio Generation
Use the script from the audio handoff:

```bash
node generate-audio-tts.mjs
# Generates 150 WAV files with real teacher voice
# Time: ~10-15 minutes (rate-limited to 2 req/sec)
```

#### Step 1.3: QA Audio
```bash
# Check all files exist and have content
find 07-app/audio -name "*.wav" -exec ls -lh {} \; | wc -l
# Expected: ~150 files, each >10KB (real audio, not silent)

# Test on app
cd 07-app
npx http-server -p 8080
# Open http://localhost:8080
# Play Lesson 1 → should hear teacher voice
```

#### Step 1.4: Run Tests
```bash
npm run test:all
# Expected: 46/47 passing (audio doesn't change test logic)
```

**Success Criteria**:
- ✅ 150+ WAV files with real voice
- ✅ Audio plays when lesson loads
- ✅ No "404" errors in console
- ✅ All tests pass
- ✅ Voice is clear, encouraging, natural tempo

---

### Workstream 2: Performance Optimization (3-4 hours)

**Owner**: Performance engineer / mobile specialist  
**Goal**: Sub-2s initial load, smooth 60fps interactions

#### Step 2.1: Baseline Measurements
```bash
# Measure current performance
npm run test:lighthouse  # (if available, or use Chrome DevTools)

# Key metrics to track:
# - Time to Interactive (TTI): < 2 seconds
# - Largest Contentful Paint (LCP): < 1.5s
# - First Input Delay (FID): < 100ms
# - Cumulative Layout Shift (CLS): < 0.1
```

#### Step 2.2: Code Splitting
```javascript
// 07-app/core/app.js - lazy load non-critical modules
// Example: Sage coach panel loads only when lesson opens
import('./sageCoach.js').then(module => {
  // Mount panel after main content ready
});
```

#### Step 2.3: Asset Optimization
```bash
# Minimize audio file sizes (they're already small, but double-check)
# Check CSS/JS bundles for dead code
# Use tree-shaking in build process

# TODO: Consider minifying 07-app/app.js if not already done
```

#### Step 2.4: Caching Strategy
```javascript
// Improve service worker caching
// 07-app/core/backupButtons.js handles offline
// Ensure:
// - Lesson content cached on first load
// - Audio cached on demand
// - stale-while-revalidate for non-critical assets
```

#### Step 2.5: Mobile-Specific Optimizations
```css
/* 07-app/index.html <style> */
/* Already good, but verify: */
- Viewport meta tag present ✓
- Touch-friendly button sizes (min 44x44px) ✓
- No layout shift on font load ✓
- Images optimized for mobile ✓
```

**Success Criteria**:
- ✅ TTI < 2 seconds on 4G
- ✅ Smooth scroll/tap (60fps)
- ✅ 60+ Lighthouse score
- ✅ Works offline (service worker)

---

### Workstream 3: Error Handling & Crash Recovery (2-3 hours)

**Owner**: QA / reliability engineer  
**Goal**: Graceful degradation, recover user progress

#### Step 3.1: Error Boundaries
```javascript
// 07-app/core/lesson-runner.js
// Add try/catch around lesson loading
try {
  lessonRunner.openLesson(index);
} catch (error) {
  console.error('Lesson load failed:', error);
  showErrorUI('This lesson had a problem. Try again.');
  logToTelemetry('lesson_load_error', { error, lessonIndex: index });
}
```

#### Step 3.2: localStorage Recovery
```javascript
// If student data is corrupted, offer to start fresh
const savedData = localStorage.getItem('guitarapp.wave1.pathb');
if (savedData) {
  try {
    JSON.parse(savedData);
  } catch (e) {
    console.error('Corrupted localStorage');
    localStorage.removeItem('guitarapp.wave1.pathb');
    showWarning('Progress data was corrupted. Starting fresh.');
  }
}
```

#### Step 3.3: Audio Loading Fallback
```javascript
// If audio fails to load, continue without it (don't block lesson)
const audio = new Audio(audioPath);
audio.addEventListener('error', () => {
  console.warn('Audio failed to load:', audioPath);
  // Lesson continues without sound
  continueLesson();
});
audio.addEventListener('canplay', () => {
  audio.play();
});
```

#### Step 3.4: Network Error Handling
```javascript
// PocketBase sync failures (Phase 7+) should log but not crash
const syncResult = await pocketbaseSync.upload();
if (!syncResult.ok) {
  console.warn('Sync failed, will retry later');
  scheduleRetry();
  // App continues to work offline
}
```

#### Step 3.5: Test Error Scenarios
```bash
# Test error recovery
# 1. Disconnect internet → lesson should still work
# 2. Delete localStorage mid-lesson → recover gracefully
# 3. Corrupt audio file → skip and continue
# 4. Missing lesson JSON → show friendly error
```

**Success Criteria**:
- ✅ No white-screen crashes
- ✅ Student progress never lost
- ✅ Audio optional (app works without)
- ✅ Network errors don't break app
- ✅ Error logs appear in telemetry

---

### Workstream 4: Analytics & Telemetry (2-3 hours)

**Owner**: Analytics / product engineer  
**Goal**: Understand usage, identify issues

#### Step 4.1: Basic Event Tracking
```javascript
// 07-app/core/app.js - Add at startup
function logEvent(eventName, data = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    sessionId: getOrCreateSessionId(),
    userId: getUserId(), // or anonymous
    eventName,
    data,
  };
  
  // Queue for submission (batch, don't spam)
  telemetryQueue.push(event);
  if (telemetryQueue.length >= 10) {
    flushTelemetry();
  }
}

// Track key events
logEvent('app_start', { userAgent: navigator.userAgent });
logEvent('lesson_opened', { lessonNumber: 1, duration: 'first_time' });
logEvent('lesson_completed', { lessonNumber: 1, timeSpent: 480 });
logEvent('performance_loop_recorded', { lessonNumber: 5, loops: 1 });
logEvent('error_occurred', { errorType: 'audio_load_failed', lessonNumber: 2 });
```

#### Step 4.2: Telemetry Submission
```javascript
// Option A: Send to your own backend (if deploying to server)
async function flushTelemetry() {
  const batch = telemetryQueue.splice(0, 10);
  try {
    await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({ events: batch }),
    });
  } catch (e) {
    console.warn('Telemetry failed, will retry');
  }
}

// Option B: Use PostHog (free tier, 1M events/month)
// Already used in the codebase (see tools/voice-cache/generate.py reference)
// Enable in production config
```

#### Step 4.3: Key Metrics to Track
```javascript
// Learning metrics
- Lesson completion rate per lesson
- Time spent per lesson
- Performance loop mastery rate
- Drop-off point (where students stop)

// Technical metrics
- Crash rate / error frequency
- Audio load failures
- Network errors during sync
- Performance (TTI, FID)

// Engagement
- Daily active users
- Session length
- Return rate (day 1, day 7, day 30)
- Churn signals
```

#### Step 4.4: Privacy Compliance
```javascript
// Ensure GDPR/CCPA compliance
// ✓ Get user consent before tracking
// ✓ Allow opt-out from analytics
// ✓ Don't track audio content (only metadata)
// ✓ Anonymize user IDs or use session-only
// ✓ Document data retention (e.g., 90 days)

const consentGiven = localStorage.getItem('analytics_consent');
if (consentGiven === 'true') {
  enableTelemetry();
} else {
  showConsentBanner();
}
```

**Success Criteria**:
- ✅ Events logged for key user actions
- ✅ Telemetry batched & sent reliably
- ✅ Dashboard shows core metrics
- ✅ Privacy/consent working
- ✅ No sensitive data in logs

---

### Workstream 5: Deployment & Documentation (2-4 hours)

**Owner**: DevOps / documentation specialist  
**Goal**: Easy deployment, clear runbook

#### Step 5.1: Deployment Checklist
```markdown
# Pre-Launch Checklist

## Code Quality
- [ ] All 47 tests passing
- [ ] No console errors/warnings on production
- [ ] Linting passes (eslint if configured)
- [ ] No hardcoded API keys in code
- [ ] No sensitive data in git history

## Performance
- [ ] Lighthouse score 60+
- [ ] TTI < 2s on 4G
- [ ] All 150 audio files present and valid
- [ ] CSS/JS minified

## Security
- [ ] HTTPS enforced
- [ ] CSP headers set
- [ ] No XSS vulnerabilities
- [ ] Auth tokens secure (if applicable)
- [ ] Encryption keys rotated

## Monitoring
- [ ] Error logging configured
- [ ] Analytics connected
- [ ] Uptime monitoring enabled
- [ ] Alert thresholds set

## Documentation
- [ ] README updated with launch date
- [ ] User guide published
- [ ] Deployment runbook in place
- [ ] Architecture diagram available
```

#### Step 5.2: Deployment Options

**Option A: Static Hosting (Recommended for v1)**
```bash
# Deploy to Vercel, Netlify, or GitHub Pages
npm run build  # (if build process exists)

# Push to Vercel
vercel --prod

# Or use this simple deployment:
cd 07-app
npx http-server -c-1 -g -p 8080 -o
# (with proper HTTPS, domain, and CDN in front)
```

**Option B: Your Own Server**
```bash
# If you have a server at example.com
scp -r 07-app/* user@example.com:/var/www/guitarapp/
# Configure nginx to serve / redirect to index.html
# Set up SSL/TLS (Let's Encrypt)
```

**Option C: Progressive Web App (PWA)**
```javascript
// Already configured (manifest.webmanifest exists)
// Verify:
// ✓ manifest.json accessible
// ✓ service worker registered
// ✓ installable on mobile (Add to Home Screen)
// ✓ Works offline
```

#### Step 5.3: Documentation
Create/update these files:

1. **README.md** — Public-facing intro
   - What is GuitarApp?
   - Getting started (link to app)
   - System requirements
   - Contact/support info

2. **DEPLOYMENT.md** — Runbook for future deployments
   - Prerequisites
   - Step-by-step deployment
   - Rollback procedure
   - Monitoring checks

3. **USER_GUIDE.md** — Help for users
   - How to start a lesson
   - Understanding performance tracking
   - Troubleshooting audio
   - Contact support

4. **ARCHITECTURE.md** — For future developers
   - Tech stack overview
   - File structure
   - How lessons are loaded
   - How audio works
   - How sync works (Phase 7)

#### Step 5.4: Domain & DNS
```bash
# Set up a domain (if launching publicly)
# Example: guitar-learn.com

# DNS records:
# A record: example.com → server-ip-address
# CNAME: www → example.com (if using)
# MX records: if email needed

# SSL/TLS certificate
# Use Let's Encrypt (free): certbot certonly --webroot -d example.com
```

#### Step 5.5: Monitoring & Alerts
```javascript
// Set up error tracking (e.g., Sentry, Rollbar)
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://your-key@sentry.io/project",
  environment: "production",
  tracesSampleRate: 0.1,
});

// Any uncaught errors auto-reported
window.addEventListener('error', (event) => {
  Sentry.captureException(event.error);
});
```

**Success Criteria**:
- ✅ App accessible at public URL
- ✅ HTTPS working
- ✅ All 25 lessons accessible
- ✅ Audio plays without errors
- ✅ Error tracking active
- ✅ Documentation complete

---

## Phase 6 Timeline

```
Week 1:
  Mon-Tue: Audio generation + QA (Workstream 1)
  Wed:     Performance optimization (Workstream 2)
  Thu:     Error handling (Workstream 3)

Week 2:
  Mon:     Analytics setup (Workstream 4)
  Tue-Wed: Deployment prep (Workstream 5)
  Thu:     Final testing & launch
  Fri:     Post-launch monitoring
```

---

## Handoff to Phase 7

Once Phase 6 completes:
- ✅ App is live with real audio
- ✅ Performance & reliability proven
- ✅ Usage data flowing in via analytics
- ✅ Error tracking working

**Phase 7 starts**: Advanced features based on real user data
- AI-personalized practice plans
- Real-time audio feedback
- Adaptive pacing
- Music generation / play-alongs
- (See `PHASE-7-SUBAGENT-ORCHESTRATION.md`)

---

## Success Criteria for Phase 6

| Metric | Target | Verified |
|--------|--------|----------|
| Audio quality | Natural, clear, encouraging | ✓ Manual listen-test |
| Performance TTI | < 2 seconds (4G) | ✓ Lighthouse |
| Lesson load | < 1 second after click | ✓ DevTools timing |
| Error rate | < 0.5% (per 1000 sessions) | ✓ Telemetry dashboard |
| Crash rate | 0% (no white-screen crashes) | ✓ Error tracking |
| Test pass rate | 46/47 (audio doesn't change tests) | ✓ npm run test:all |
| Documentation | 4 files complete (README, DEPLOYMENT, USER_GUIDE, ARCHITECTURE) | ✓ Listed in repo root |
| Monitoring | Errors logged, alerts configured | ✓ Sentry/PostHog active |

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Audio API rate limits exceeded | Pre-cache API responses, batch requests at 2/sec |
| Performance regression after optimization | A/B test changes, measure before/after |
| Telemetry data privacy breach | GDPR-compliant consent, data encryption, 90-day retention |
| Deployment outage | Blue-green deploy, health checks, rollback ready |
| Lesson content typos reached production | QA check lesson JSONs before launch |

---

## Files to Create/Update

| File | Action | Purpose |
|------|--------|---------|
| `generate-audio-tts.mjs` | Execute | Generate 150 real audio files |
| `07-app/core/errorBoundary.js` | Create | Error handling wrapper |
| `07-app/core/telemetry.js` | Create | Analytics/event tracking |
| `07-app/core/performance.js` | Create | Perf optimization utilities |
| `DEPLOYMENT.md` | Create | Runbook for future deploys |
| `USER_GUIDE.md` | Create | Help for users |
| `ARCHITECTURE.md` | Create | Tech docs for developers |
| `README.md` | Update | Add launch date, link to guide |

---

## Transition to Phase 7

When Phase 6 is complete, see `PHASE-7-SUBAGENT-ORCHESTRATION.md` for how to:
- Parallelize Phase 7 features across multiple subagents
- Coordinate AI coaching, adaptive pacing, and music generation
- Plan resource allocation for GPU-based features

---

*Ready to ship! 🚀*
