# Phase 6 Implementation Handoff
## Complete Architecture Verification & Multi-Agent Deployment Guide

**Document Date:** 2026-09-04  
**Current Status:** Phase 5 Complete (95%), Phase 6 Planning Complete, Ready for Implementation  
**Next Step:** Spawn 5 specialized sub-agents to build Phase 6 features  
**Estimated Timeline:** 4 weeks (Weeks 1-4 of Phase 6)

---

## EXECUTIVE SUMMARY

Phase 5 is **95% complete** with 25 lessons, 201 audio files, 46/47 tests passing. A workflow audit + 5-agent planning session identified the exact work needed for Phase 6 production.

**Critical Finding:** Some modules are partially built (audioCache.js, audio-config.js exist). The implementation plan must build on existing code, not duplicate it.

**This handoff directs the next agent to:**
1. ✅ Verify existing work with the codebase
2. 🔨 Spawn 5 sub-agents to build missing pieces
3. ✔️ Require each sub-agent to verify their work before submitting
4. 📋 Provide a master checklist to track completion

---

## PART 1: CURRENT STATE (VERIFIED)

### What's Already Built ✅

#### Audio/TTS Infrastructure (60% complete)
- **audioCache.js** — Full IndexedDB cache layer with TTL expiration, hash verification, cleanup
- **audio-config.js** — Complete GCP TTS configuration, mobile optimization, performance targets, fallback strategy
- **validateLesson()** — Lesson data validation in lesson-runner.js
- **Service Worker** — Already configured for cache-first strategy

**Status:** Cache layer and configuration complete. Missing the runtime service that actually calls the APIs.

#### Analytics (20% complete)
- **trackContentEvent()** — Marketing attribution tracking (content views, installs, subscriptions)
- **PocketBase transmission** — Ready to send events to backend
- **localStorage persistence** — Performance state tracking works

**Status:** Foundation exists. Missing learning event tracking, error tracking, A/B testing framework.

#### Error Handling (0% complete)
- **Individual try-catch blocks** — 215 occurrences scattered across codebase
- **validateLesson()** — Basic data validation

**Status:** No centralized error handling. Missing retry logic, circuit breaker, error boundaries.

#### Deployment (0% complete)
- **Current:** Running on desktop with PocketBase (local only)
- **Needed:** Blue-green architecture, canary deployment, monitoring

---

## PART 2: THE GAPS — What Needs to Be Built

### Workstream 1: Audio/TTS Runtime Service (5 days)
**Responsible Agent:** Audio/TTS Specialist

**What's missing:**
- [ ] `audioGenerationService.js` — Service that calls GCP TTS API with fallback
- [ ] `audioPlayer.js` — Web Audio API playback engine
- [ ] Integration hooks in lesson-runner.js to call audio player
- [ ] Performance metrics collection module
- [ ] Offline audio fallback strategy
- [ ] Mobile network detection and adaptive bitrate

**Key Files to Create:**
```
07-app/core/
├── audioGenerationService.js (NEW)
├── audioPlayer.js (NEW)
├── audioMetrics.js (NEW)
├── audioFallback.js (NEW)
07-app/
├── service-worker.js (ENHANCE - add audio caching)
├── audio-manifest.json (NEW)
scripts/
├── audio-generation-service.mjs (NEW - production TTS service)
```

**Success Criteria:**
- [ ] audioGenerationService.js calls GCP API with 3-attempt retry + exponential backoff
- [ ] audioPlayer.js plays audio from cache within 100ms (cached) or 500ms (network)
- [ ] Fallback audio plays when API unavailable
- [ ] All 25 lessons pre-cached with checksums
- [ ] Performance metrics (P50/P95/P99 load times) recorded
- [ ] Mobile network detection working (3G uses 16kHz audio, 4G uses 24kHz)
- [ ] Tests passing: `npm run test:audio` (new test suite)

**Verification Checklist for Audio Agent:**
```javascript
// Must verify:
1. audioCache can store/retrieve > 2MB audio file
2. audioGenerationService calls real GCP API (or mock in dev)
3. Retry logic: fails 2x, succeeds 3x → returns audio
4. Fallback activates when API times out
5. Performance: cached <100ms, network <500ms P95
6. Mobile detection: navigator.connection.effectiveType triggers 16kHz
7. All lessons load from cache in lesson-runner integration
8. No memory leaks (test 100 plays in sequence)
```

---

### Workstream 2: Error Handling & Resilience (6 days)
**Responsible Agent:** Error Handling Specialist

**What's missing:**
- [ ] `RetryManager.js` — Exponential backoff with jitter, circuit breaker pattern
- [ ] `FeatureBoundary.js` — Error wrapper for major features (Lesson, Chat, Practice, Tuner, Sync)
- [ ] `ErrorLogger.js` — Centralized error collection with localStorage circular buffer
- [ ] `AlertManager.js` — Threshold-based alerting (critical error count, error rate)
- [ ] `errorMessages.js` — 30+ user-facing error message templates
- [ ] Global error handler integration
- [ ] Error event tracking (integrates with analytics)

**Key Files to Create:**
```
07-app/core/
├── RetryManager.js (NEW)
├── CircuitBreaker.js (NEW)
├── FeatureBoundary.js (NEW)
├── ErrorLogger.js (NEW)
├── AlertManager.js (NEW)
├── errorMessages.js (NEW)
├── errorHandling.js (NEW - init/setup)
07-app/
├── index.html (ENHANCE - add global error handler)
```

**Success Criteria:**
- [ ] RetryManager: exponential backoff 100ms → 200ms → 400ms → 800ms (capped 30s)
- [ ] CircuitBreaker: opens after 5 failures, resets after 60s timeout
- [ ] FeatureBoundary wraps: Lesson, Chat, Practice, Tuner, Sync
- [ ] Error messages: all 30+ templates defined and tested
- [ ] ErrorLogger: 100-error circular buffer, batches to backend every 30s
- [ ] AlertManager: fires alert when 3+ critical errors or 10+ errors in 5 min
- [ ] Integration: lesson-runner.js catches errors → FeatureBoundary → recovery

**Verification Checklist for Error Agent:**
```javascript
// Must verify:
1. RetryManager retries failed operation, succeeds on 3rd attempt
2. CircuitBreaker opens after 5 failures, rejects immediately
3. FeatureBoundary catches error, shows fallback UI, provides recovery options
4. Error message for NetworkError includes "Check connection" suggestion
5. ErrorLogger batches 10 errors and POSTs to /api/errors
6. AlertManager fires alert when error_rate > 5%
7. Global error handler catches unhandled errors (window.onerror)
8. Integration test: lesson fails → boundary catches → retry succeeds → lesson plays
9. No error handler creates infinite loops (test with cascading errors)
10. Circuit breaker recovery works (fail → open → wait → half_open → succeed → closed)
```

---

### Workstream 3: Learning Analytics & A/B Testing (5 days)
**Responsible Agent:** Analytics Specialist

**What's missing:**
- [ ] Event taxonomy integration (extend trackContentEvent to learning events)
- [ ] `eventTracker.js` — Unified event tracking with batching (Tier 1: immediate, Tier 2/3: batch)
- [ ] Learning event instrumentation in:
  - [ ] lesson-runner.js (lesson_started, lesson_completed)
  - [ ] listening-engine.js (chord_attempted, chord_detected)
  - [ ] practiceRemix.js (practice_session_started/completed)
  - [ ] band-engine.js (performance_level_unlocked/completed)
- [ ] `ExperimentManager.js` — Variant allocation (deterministic hash % 100)
- [ ] Server-side event aggregation endpoints (PocketBase)
- [ ] Retention cohort tracking (D1/D7/D30)
- [ ] Error event tracking integration with ErrorLogger

**Key Files to Create:**
```
07-app/core/
├── eventTracker.js (NEW)
├── ExperimentManager.js (NEW)
07-app/
├── experiments.json (NEW - experiment registry)
scripts/
├── analytics-setup.sql (NEW - PocketBase collections)
├── analytics-aggregation.mjs (NEW - daily aggregation job)
```

**Success Criteria:**
- [ ] 25+ learning events instrumented and firing correctly
- [ ] Event batching: Tier 1 sends immediately, Tier 2/3 batch every 5 min
- [ ] Event schema: timestamp, user_id (hashed), session_id, properties, experiment_id
- [ ] Experiment allocation: consistent per user (same user always gets same variant)
- [ ] Server endpoints: POST /api/events, GET /api/experiments/registry
- [ ] Retention cohort: calculate D1/D7/D30 per signup_week
- [ ] Error events: ErrorLogger sends errors as events to same endpoint
- [ ] Dashboard: Redash queries for funnel, retention, A/B test results

**Verification Checklist for Analytics Agent:**
```javascript
// Must verify:
1. lesson_started event fires when user enters lesson-runner
2. chord_mastered event fires when chord confidence > 0.8
3. Event batching: 10 Tier-2 events batch within 5 min (not immediately)
4. User ID hashed with SHA-256 (not sending raw PocketBase ID)
5. Experiment allocation: same user gets same variant across sessions
6. Experiment context added to all events (variant, test_name, allocation_date)
7. Retention cohort calculates correctly: signup_week 2026-08-25 → D1/D7/D30 counts
8. Error events: exceptions logged → ErrorLogger → sent as events
9. Server endpoints return 200 and store events correctly
10. No PII in event properties (no emails, phones, device IDs)
11. Sample rate respected (10% in prod, 100% in dev)
```

---

### Workstream 4: Deployment Pipeline & Infrastructure (4 days)
**Responsible Agent:** DevOps Specialist

**What's missing:**
- [ ] Docker configuration (Node.js + Vite app)
- [ ] docker-compose.yml (BLUE/GREEN services + Nginx load balancer)
- [ ] Blue-green deployment scripts (deploy.sh, rollback.sh)
- [ ] Canary deployment automation (traffic shifting 5% → 10% → 15% → 100%)
- [ ] Health check endpoints
- [ ] Monitoring setup (Prometheus metrics export)
- [ ] Logging configuration (structured JSON with Winston)
- [ ] Backup/restore procedures
- [ ] Incident response playbooks (app won't start, high error rate, DB connection issues)

**Key Files to Create:**
```
├── Dockerfile (NEW)
├── docker-compose.yml (NEW)
├── .dockerignore (NEW)
├── nginx.conf (NEW)
scripts/
├── deploy.sh (NEW)
├── rollback.sh (NEW)
├── health-check.sh (NEW)
├── backup.sh (NEW)
├── restore.sh (NEW)
docs/
├── DEPLOYMENT.md (NEW)
├── INCIDENT-PLAYBOOK.md (NEW)
├── MONITORING.md (NEW)
```

**Success Criteria:**
- [ ] Docker builds successfully: `docker build -t guitarapp:v1 .`
- [ ] docker-compose up starts BLUE on 3000, GREEN on 3001, Nginx on 80/443
- [ ] Blue-green cutover: load balancer can switch traffic with single command
- [ ] Canary rollout: deploy.sh with --canary flag shifts traffic in steps
- [ ] Health check: /health endpoint returns JSON with status
- [ ] Rollback: rollback.sh reverts to previous version in <30 seconds
- [ ] Monitoring: prometheus metrics available at /metrics
- [ ] Logging: all requests logged as JSON with request_id for tracing
- [ ] Backup: automated daily backup, restore.sh recovers full state

**Verification Checklist for DevOps Agent:**
```bash
# Must verify:
1. docker build -t guitarapp . completes without errors
2. docker-compose up starts all services, curl localhost/health returns 200
3. deploy.sh creates GREEN, runs smoke tests, shifts 5% traffic
4. traffic increase: 5% for 5min, 10% for 5min, 15% for 5min, then 100%
5. rollback.sh reverts to BLUE, GREEN stops, traffic back to 100% BLUE
6. health check detects: service down, high error rate, DB unavailable
7. canary monitoring: error rate <1%, latency P95 <2s, no crashes
8. logs include: request_id, method, path, status, latency, error_code
9. backup runs daily, restore.sh brings back full app+DB state
10. incident playbook exists for: app won't start, 50% errors, DB corruption
11. rollback time <30 seconds (measure deployment to full revert)
```

---

### Workstream 5: Performance Optimization (4 days)
**Responsible Agent:** Performance Specialist

**What's missing:**
- [ ] Code-splitting strategy (lazy-load by route: Lesson, Chat, Practice, etc.)
- [ ] Bundle analysis and tree-shaking configuration
- [ ] Critical rendering path optimization
- [ ] Mobile network detection + adaptive strategies
- [ ] Service worker precache strategy
- [ ] Performance monitoring integration with metrics collection
- [ ] Lighthouse CI configuration
- [ ] Performance budget enforcement (sub-2s load time)

**Key Files to Create/Enhance:**
```
07-app/
├── vite.config.js (ENHANCE - code-splitting, tree-shake, minify)
├── service-worker.js (ENHANCE - precache strategy, cache versions)
scripts/
├── bundle-analysis.mjs (NEW)
├── lighthouse-ci.config.json (NEW)
.github/
├── workflows/performance.yml (NEW - CI check)
```

**Success Criteria:**
- [ ] Bundle size: <500KB main + <100KB per route chunk
- [ ] Load time: P95 <2s on desktop (WiFi), <3s on mobile (4G)
- [ ] Code-splitting: 8 route-based chunks (Lesson, Chat, Practice, Tuner, etc.)
- [ ] Tree-shaking: unused modules removed from production build
- [ ] Precache: first lesson audio + critical assets load before app boots
- [ ] Mobile detection: adapt to 3G/4G/WiFi (reduce bitrate, defer prefetch)
- [ ] Metrics: track bundle size, load time, time-to-interactive per build
- [ ] Lighthouse: score >90 on Performance

**Verification Checklist for Performance Agent:**
```bash
# Must verify:
1. npm run build produces bundle <500KB (main + vendor)
2. Route chunks exist: lesson.js, chat.js, practice.js, tuner.js, etc.
3. Load time P95 <2s (desktop), <3s (mobile 4G)
4. Time-to-interactive <3s
5. Unused CSS/JS removed (check for dead code with esbuild analysis)
6. Service worker precaches first lesson audio
7. Adaptive bitrate: mobile 3G uses 16kHz audio, 4G uses 24kHz
8. Performance monitoring records metrics (load time by route)
9. Lighthouse CI passes with score >90
10. No performance regression from Phase 5 (baseline: sub-2s on desktop)
11. Mobile: battery impact <5% for 1 hour session
```

---

## PART 3: IMPLEMENTATION ROADMAP

### Critical Path (Must do in order):
1. **Workstream 1 (Audio/TTS)** — days 1-5
   - Blocks: lesson playback testing, audio delivery to users
   - Depends on: audioCache.js ✅, audio-config.js ✅

2. **Workstream 2 (Error Handling)** — days 1-6 (parallel)
   - Independent of audio/TTS
   - Blocks: production reliability

3. **Workstream 3 (Analytics)** — days 2-7 (parallel after Workstream 2 starts)
   - Depends on: Error Handling (for error event tracking)
   - Blocks: A/B testing, retention analysis

4. **Workstream 4 (Deployment)** — days 1-5 (parallel)
   - Independent, can start immediately
   - Blocks: production rollout

5. **Workstream 5 (Performance)** — days 3-7 (parallel)
   - Depends on: Audio/TTS (to measure full load time)
   - Blocks: sub-2s performance target validation

### Week 1 Timeline:
- **Day 1 (Mon):** Spawn all 5 agents, start Workstreams 1, 2, 4
- **Day 2 (Tue):** Workstream 3 starts (Analytics)
- **Day 3 (Wed):** Workstream 5 starts (Performance)
- **Day 5 (Fri):** Merge audio/TTS + Deployment
- **Day 6+ (Week 2):** Integrate analytics + error handling + performance

---

## PART 4: HOW TO SPAWN SUB-AGENTS

### Agent Definition Template

Each sub-agent needs:
1. **Clear scope** — exactly what they build
2. **What exists** — which files are already done
3. **What's missing** — exactly what to create
4. **Success criteria** — how to know it works
5. **Verification checklist** — required tests before submitting

### Example Spawn Command (for next Claude):

```javascript
// For the Audio/TTS Agent:
await agent(
  `You are the Audio/TTS Implementation Agent for Phase 6.
   
   CONTEXT:
   - Phase 5 is 95% complete (25 lessons, 201 audio files, 46/47 tests)
   - audioCache.js ✅ exists (full IndexedDB cache)
   - audio-config.js ✅ exists (GCP config)
   - Need to build: audioGenerationService.js, audioPlayer.js, audioMetrics.js
   
   TASK:
   1. Build audioGenerationService.js that:
      - Calls GCP TTS API with 3-attempt retry + exponential backoff
      - Falls back to Web Audio if API unavailable
      - Records performance metrics (load time, synthesis time)
   
   2. Build audioPlayer.js that:
      - Uses Web Audio API to play audio buffers
      - Supports volume control, seeking, pause/resume
      - Integrates with lesson-runner.js
   
   3. Integrate into lesson-runner.js:
      - Add hooks to play coaching audio at key moments
      - Handle audio errors gracefully (silent fallback)
   
   VERIFICATION REQUIRED:
   - Test: audioCache stores/retrieves 2MB audio file
   - Test: audioGenerationService retries on failure, succeeds on 3rd attempt
   - Test: audioPlayer plays cached audio <100ms, network <500ms P95
   - Test: fallback activates when API times out
   - Test: all 25 lessons load from cache
   - No memory leaks (100 plays in sequence)
   
   BEFORE SUBMITTING:
   - Run: npm run test:audio (must pass)
   - Verify: audioCache hit rate >85% within session
   - Performance: P95 load time <500ms on 4G network
   
   Build code now and verify all tests pass before responding.`,
  { 
    label: 'audio-tts:implementation',
    schema: {
      type: 'object',
      properties: {
        files_created: { type: 'array', items: { type: 'string' } },
        test_results: { type: 'string' },
        verification_status: { type: 'string', enum: ['PASSED', 'FAILED'] },
        performance_metrics: { type: 'object' },
        notes: { type: 'string' }
      }
    }
  }
)
```

---

## PART 5: VERIFICATION REQUIREMENTS

### Every Sub-Agent Must:

1. **Write Tests Before Code**
   - Unit tests for each module
   - Integration tests for cross-module interaction
   - E2E tests for full feature flows
   - Must achieve 80%+ code coverage

2. **Run Tests and Report Results**
   - Show test output (passing/failing)
   - Provide code coverage report
   - Document any flaky tests

3. **Verify Against Codebase**
   - Ensure code integrates with existing modules
   - Check for naming conflicts
   - Validate against lesson-runner.js and band-engine.js patterns
   - No duplicate functionality

4. **Performance Verification**
   - Measure actual load times (not theoretical)
   - Compare against targets
   - Document any misses with reasons

5. **Manual Testing**
   - Test on real device (not just desktop)
   - Test on slow network (throttle to 4G)
   - Test offline scenarios
   - Test error scenarios (API down, permission denied)

### Success Definition for Each Workstream:

**Audio/TTS:** 
```
✅ npm run test:audio passes with 80%+ coverage
✅ P95 audio load time <500ms (network) / <100ms (cached)
✅ Fallback audio plays when API unavailable
✅ All 25 lessons pre-cached with checksums verified
✅ No console errors in Playwright test run
```

**Error Handling:**
```
✅ npm run test:error-handling passes with 90%+ coverage
✅ Retry logic: max 3 attempts, exponential backoff verified
✅ Circuit breaker: opens/closes/half-opens correctly
✅ 30+ error messages tested with correct routing (modal/toast/inline)
✅ Integration test: lesson fails → catches error → retries → succeeds
```

**Analytics:**
```
✅ npm run test:analytics passes with 85%+ coverage
✅ All 25+ learning events firing at correct times
✅ Event batching: Tier 1 sends <100ms, Tier 2/3 batch <5min
✅ User ID hashing verified (no PII in payloads)
✅ Experiment allocation deterministic (same user = same variant)
✅ Retention cohort queries return correct counts
```

**Deployment:**
```
✅ Docker builds: docker build -t guitarapp . (no errors)
✅ docker-compose up starts all services, health check passes
✅ Blue-green cutover: load balancer switches cleanly <30s
✅ Canary rollout: traffic shift 5% → 10% → 15% → 100% works
✅ Rollback: revert to previous version in <30 seconds
✅ Monitoring: error rate and latency dashboards functional
```

**Performance:**
```
✅ Bundle size <500KB main + <100KB per route chunk
✅ Load time P95 <2s (desktop WiFi), <3s (mobile 4G)
✅ Time-to-interactive <3s
✅ Code-splitting: 8+ route chunks created
✅ Lighthouse score >90
✅ Tree-shaking removes unused code (verified with esbuild analysis)
```

---

## PART 6: MASTER CHECKLIST

Track completion across all 5 workstreams:

### Workstream 1: Audio/TTS (Days 1-5)
- [ ] audioGenerationService.js created + tested
- [ ] audioPlayer.js created + tested
- [ ] audioMetrics.js created + tested
- [ ] lesson-runner.js integrated with audio hooks
- [ ] service-worker.js audio caching configured
- [ ] All 25 lessons pre-cached
- [ ] Performance targets verified (P95 <500ms)
- [ ] Tests passing (npm run test:audio)
- [ ] No memory leaks (100-play test)
- [ ] Code review + merged to main

### Workstream 2: Error Handling (Days 1-6)
- [ ] RetryManager.js created + tested
- [ ] CircuitBreaker.js created + tested
- [ ] FeatureBoundary.js created + tested (Lesson, Chat, Practice, Tuner, Sync)
- [ ] ErrorLogger.js created + tested
- [ ] AlertManager.js created + tested
- [ ] errorMessages.js created (30+ templates)
- [ ] Global error handler integrated
- [ ] Integration tests passing
- [ ] Tests passing (npm run test:error-handling)
- [ ] Code review + merged to main

### Workstream 3: Analytics (Days 2-7)
- [ ] eventTracker.js created + tested
- [ ] ExperimentManager.js created + tested
- [ ] lesson-runner.js instrumented (lesson_started, lesson_completed)
- [ ] listening-engine.js instrumented (chord_attempted, chord_detected)
- [ ] practiceRemix.js instrumented (practice_session_started/completed)
- [ ] band-engine.js instrumented (performance_level_unlocked/completed)
- [ ] Error event tracking integrated with ErrorLogger
- [ ] Server-side event aggregation endpoints created (PocketBase)
- [ ] Retention cohort tracking working
- [ ] Tests passing (npm run test:analytics)
- [ ] No PII in event payloads (verified)
- [ ] Code review + merged to main

### Workstream 4: Deployment (Days 1-5)
- [ ] Dockerfile created (Node.js 20-alpine)
- [ ] docker-compose.yml created (BLUE/GREEN + Nginx)
- [ ] deploy.sh script created + tested
- [ ] rollback.sh script created + tested
- [ ] Health check endpoint (/health) created
- [ ] Blue-green cutover working (<30s)
- [ ] Canary deployment working (5% → 10% → 15% → 100%)
- [ ] Monitoring setup (Prometheus metrics)
- [ ] Logging configuration (Winston JSON)
- [ ] Incident playbooks created (5+ scenarios)
- [ ] Manual deployment test successful
- [ ] Code review + merged to main

### Workstream 5: Performance (Days 3-7)
- [ ] vite.config.js enhanced (code-splitting, tree-shake)
- [ ] Route-based chunks created (8+ chunks)
- [ ] Bundle size <500KB verified
- [ ] Load time P95 <2s (desktop), <3s (mobile)
- [ ] Time-to-interactive <3s verified
- [ ] Lighthouse CI configured
- [ ] Lighthouse score >90 verified
- [ ] Service worker precache strategy working
- [ ] Mobile network adaptation working (3G vs 4G bitrate)
- [ ] Performance regression tests configured
- [ ] Tests passing (npm run test:performance)
- [ ] Code review + merged to main

### Integration & System Testing (After all 5 workstreams)
- [ ] All 5 workstreams merged to main
- [ ] Full regression tests passing (npm run test:all)
- [ ] E2E tests passing (Playwright)
- [ ] Manual testing on mobile device
- [ ] Manual testing on slow network (4G throttled)
- [ ] Manual testing offline scenarios
- [ ] Audio generation working (TTS → cache → playback)
- [ ] Error recovery working (network error → retry → success)
- [ ] Analytics events flowing correctly
- [ ] Deployment pipeline working end-to-end
- [ ] Performance targets met (sub-2s load, <100MB memory)

### Pre-Production Gates (Before shipping)
- [ ] Security review: no PII leaks, XSS vulnerabilities patched
- [ ] Privacy compliance: GDPR/CCPA checklists complete
- [ ] Accessibility: WCAG 2.1 AA compliance verified
- [ ] Documentation: runbooks, playbooks, monitoring guides complete
- [ ] Stakeholder sign-off: Tech Lead, Product, Ops, Legal
- [ ] Backup/restore tested (can recover full state)
- [ ] Incident response team briefed
- [ ] Monitoring alerts configured and tested

---

## PART 7: NEXT AGENT INSTRUCTIONS

**To the next agent spawning these sub-agents:**

1. **Read this entire document** to understand the current state
2. **Spawn exactly 5 sub-agents** (Audio, Error Handling, Analytics, Deployment, Performance)
3. **Give each agent:**
   - Their workstream description (from PART 2 above)
   - The verification checklist (specific to their workstream)
   - Success criteria
   - Files to create (exact paths)
   - Tests that must pass

4. **After each agent completes:**
   - Review their test output
   - Verify they didn't introduce regressions
   - Check code quality (no dead code, clean structure)
   - Ensure they integrated with existing codebase correctly

5. **Merge & Track:**
   - Use the master checklist (PART 6) to track progress
   - Don't merge incomplete workstreams
   - Each workstream must pass all verification before merge

6. **Document Blockers:**
   - If a sub-agent hits a blocker (missing dependency, conflicting code)
   - Escalate immediately
   - Don't let them work around it silently

---

## APPENDIX: Key Files Reference

### Files That Already Exist ✅
```
07-app/core/
├── audioCache.js ✅ (full IndexedDB cache implementation)
├── audio-config.js ✅ (complete GCP config, mobile optimization)
├── lesson-runner.js ✅ (has validateLesson, needs audio hooks)
├── content-attribution.js ✅ (has trackContentEvent, needs learning events)
├── teacher.js ✅ (avatar/voice coach)
├── listening-engine.js ✅ (needs chord event instrumentation)
├── practiceRemix.js ✅ (needs practice event instrumentation)
├── band-engine.js ✅ (needs performance level instrumentation)

07-app/
├── service-worker.js ✅ (needs audio cache-first strategy)
├── index.html ✅ (needs global error handler)
```

### Files That Need to Be Created ❌
```
07-app/core/
├── audioGenerationService.js (Audio agent)
├── audioPlayer.js (Audio agent)
├── audioMetrics.js (Audio agent)
├── audioFallback.js (Audio agent)
├── RetryManager.js (Error agent)
├── CircuitBreaker.js (Error agent)
├── FeatureBoundary.js (Error agent)
├── ErrorLogger.js (Error agent)
├── AlertManager.js (Error agent)
├── errorMessages.js (Error agent)
├── errorHandling.js (Error agent)
├── eventTracker.js (Analytics agent)
├── ExperimentManager.js (Analytics agent)

07-app/
├── audio-manifest.json (Audio agent)
├── experiments.json (Analytics agent)

scripts/
├── audio-generation-service.mjs (Audio agent)
├── analytics-setup.sql (Analytics agent)
├── analytics-aggregation.mjs (Analytics agent)
├── deploy.sh (Deployment agent)
├── rollback.sh (Deployment agent)
├── backup.sh (Deployment agent)
├── restore.sh (Deployment agent)

Root:
├── Dockerfile (Deployment agent)
├── docker-compose.yml (Deployment agent)
├── .dockerignore (Deployment agent)
├── nginx.conf (Deployment agent)

Tests:
├── 07-app/test/audio-cache.test.mjs (Audio agent)
├── 07-app/test/audioGenerationService.test.mjs (Audio agent)
├── 07-app/test/errorHandling.test.mjs (Error agent)
├── 07-app/test/analytics.test.mjs (Analytics agent)
├── 07-app/test/deployment.test.mjs (Deployment agent)
├── 07-app/test/performance.test.mjs (Performance agent)
```

---

## SUMMARY

**Current State:** Phase 5 = 95% complete, Phase 6 planning = 100% complete

**What To Do:** Spawn 5 sub-agents to implement Phase 6 features (4 weeks total)

**Critical Success Factors:**
1. Each agent must verify their work with tests before submitting
2. No agent proceeds without approval from the previous agent (if dependent)
3. Performance targets are non-negotiable (sub-2s load time)
4. All error handling must be production-grade (99%+ recovery rate)
5. Analytics must have zero PII leaks (verified in code review)

**If This Handoff is Used by Next Claude:**
- Load the 5 workstream descriptions from PART 2
- Spawn 5 agents in parallel with the verification checklists
- Use PART 6 master checklist to track progress
- Don't merge until all verification gates pass

**Estimated Completion:** 4 weeks (Week 1-4 of Phase 6)

---

**End of Handoff Document**
