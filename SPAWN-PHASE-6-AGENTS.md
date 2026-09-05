# Phase 6 Agent Spawning Guide
## How to Deploy 5 Specialized Sub-Agents for Parallel Implementation

**Use this guide when ready to start Phase 6 implementation work.**

---

## Quick Start (TL;DR)

1. Read `PHASE-6-IMPLEMENTATION-HANDOFF.md` (5 min overview)
2. Run the Workflow below to spawn 5 agents in parallel
3. Each agent builds their workstream + verifies tests pass
4. Track progress with the master checklist
5. Merge when all 5 are complete

---

## Workflow: Spawn 5 Phase 6 Implementation Agents

**Copy this into Claude Code to execute:**

```javascript
// Phase 6 Implementation Workflow
// Spawns 5 specialized agents to build in parallel
// Each agent must verify their work before submitting

export const meta = {
  name: 'phase-6-implementation',
  description: 'Spawn 5 specialized agents to implement Phase 6 (Audio/TTS, Error Handling, Analytics, Deployment, Performance)',
  phases: [
    { title: 'Audio/TTS', detail: 'Build runtime audio generation service (5 days)' },
    { title: 'Error Handling', detail: 'Build retry logic + error boundaries (6 days)' },
    { title: 'Analytics', detail: 'Build event tracking + A/B testing (5 days)' },
    { title: 'Deployment', detail: 'Build Docker + blue-green pipeline (4 days)' },
    { title: 'Performance', detail: 'Build code-splitting + monitoring (4 days)' },
  ],
}

// All 5 agents work in parallel
const results = await parallel([
  
  // AGENT 1: Audio/TTS Implementation
  () => agent(
    `You are the Audio/TTS Implementation Agent.
    
CONTEXT:
- Phase 5 is 95% complete (25 lessons, 201 audio files)
- audioCache.js ✅ exists (full IndexedDB implementation)
- audio-config.js ✅ exists (GCP config, mobile optimization)
- MISSING: runtime service + playback engine

YOUR TASK:
Build these files (in order):

1. 07-app/core/audioGenerationService.js
   - Call GCP TTS API with fallback
   - Implement retry logic (3 attempts, exponential backoff 100ms → 200ms → 400ms)
   - Fall back to Web Audio API if API fails
   - Cache results in audioCache
   - Record performance metrics (load time, synthesis time)

2. 07-app/core/audioPlayer.js
   - Use Web Audio API to play audio buffers
   - Support: play, pause, resume, seek, volume control
   - Integrate with lesson-runner.js for coaching moments
   - Handle errors gracefully (play silence if error)

3. 07-app/core/audioMetrics.js
   - Track load times (cached vs network)
   - Calculate P50/P95/P99 percentiles
   - Report cache hit rate
   - Send metrics to /api/audio-metrics

4. 07-app/core/audioFallback.js
   - Web Speech API synthesis (browser-native)
   - Pre-recorded silence fallback (5 seconds)
   - Detect when API unavailable and activate fallback

5. ENHANCE: 07-app/core/lesson-runner.js
   - Import audioPlayer
   - Add hooks to play audio at key moments
   - Handle audio errors (continue lesson without audio)

6. ENHANCE: 07-app/service-worker.js
   - Add cache-first strategy for .wav and .mp3 files
   - Update cache version to bust old audio

7. CREATE: 07-app/audio-manifest.json
   - List all 25 lessons with audio file hashes
   - Include checksums for integrity verification

8. CREATE: 07-app/test/audio-cache.test.mjs (if not exists)
   - Test: store 2MB audio, retrieve within 100ms
   - Test: TTL expiration works
   - Test: hash verification detects corruption

VERIFICATION REQUIRED (MUST PASS BEFORE SUBMITTING):
- [ ] npm run test:audio passes with 80%+ coverage
- [ ] P95 audio load time <500ms (network) / <100ms (cached)
- [ ] Fallback audio plays when API unavailable
- [ ] No memory leaks (test 100 consecutive plays)
- [ ] Performance metrics recorded correctly
- [ ] All 25 lessons preloaded with checksums
- [ ] Mobile network detection working (3G → 16kHz, 4G → 24kHz)
- [ ] Integration test: lesson-runner calls audioPlayer, audio plays

FILES TO CREATE:
✓ audioGenerationService.js
✓ audioPlayer.js
✓ audioMetrics.js
✓ audioFallback.js
✓ audio-manifest.json
✓ ENHANCE lesson-runner.js
✓ ENHANCE service-worker.js

TESTS REQUIRED:
✓ Test audioCache store/retrieve performance
✓ Test audioGenerationService retry logic (fail 2x, succeed 3x)
✓ Test audioPlayer playback (cached & network)
✓ Test fallback activation
✓ Test integration with lesson-runner
✓ Test metrics collection and percentile calculation

Before responding, build all 5 files with complete implementations, write tests, run tests, verify all checkmarks above, then respond with:
{
  "status": "COMPLETE" or "FAILED",
  "files_created": ["list of files"],
  "tests_passing": true/false,
  "test_output": "summary of test results",
  "verification_status": "all checks passed or list of failures",
  "performance_metrics": { "p95_cached_ms": X, "p95_network_ms": Y },
  "blocker": "if failed, what's blocking?" 
}`,
    { 
      label: 'audio-tts:implementation',
      phase: 'Audio/TTS',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['COMPLETE', 'FAILED'] },
          files_created: { type: 'array', items: { type: 'string' } },
          tests_passing: { type: 'boolean' },
          test_output: { type: 'string' },
          verification_status: { type: 'string' },
          performance_metrics: { type: 'object' },
          blocker: { type: 'string' }
        },
        required: ['status', 'files_created', 'tests_passing']
      }
    }
  ),

  // AGENT 2: Error Handling Implementation
  () => agent(
    `You are the Error Handling & Resilience Implementation Agent.

CONTEXT:
- 215 error/catch statements scattered across codebase
- No centralized error handling, retry logic, or circuit breaker
- Phase 5 audit identified 7 error handling gaps

YOUR TASK:
Build these modules (in order):

1. 07-app/core/RetryManager.js
   - Implement exponential backoff: 100ms → 200ms → 400ms → 800ms (capped 30s)
   - Add jitter (10% random variation to prevent thundering herd)
   - Support configurable shouldRetry(error) predicate
   - Track statistics: totalAttempts, totalSuccesses, totalFailures
   - Export default instance for reuse

2. 07-app/core/CircuitBreaker.js
   - Three states: CLOSED (pass through), OPEN (fail fast), HALF_OPEN (test recovery)
   - Open after failureThreshold (default 5) consecutive failures
   - Wait timeout (default 60s) before HALF_OPEN
   - Return to CLOSED on successThreshold successes in HALF_OPEN
   - Emit onStateChange events

3. 07-app/core/FeatureBoundary.js
   - Wrap major features: Lesson, Chat, Practice, Tuner, Sync
   - Catch errors, update state, trigger recovery
   - getRecoveryOptions(error) returns: [Retry, Offline Mode, Check Connection, Request Permission]
   - getFallbackContent(error) returns UI for each error type
   - Integrate circuit breaker for repeated failures
   - Notified via observer pattern (subscribe to state changes)

4. 07-app/core/ErrorLogger.js
   - Collect errors in 100-error circular buffer (localStorage)
   - Include metadata: timestamp, sessionId, userAgent, URL, severity, code
   - Batch errors and POST to /api/errors every 30s
   - Re-queue errors if transmission fails
   - Calculate error statistics (by code, by severity)

5. 07-app/core/AlertManager.js
   - Monitor error streams for alert conditions
   - Alert triggers: 3+ critical errors, 10+ errors in 5 min, error_rate > 5%
   - De-duplicate alerts (60s minimum interval between same alert type)
   - Expose onAlert(handler) subscription
   - Emit CustomEvent 'guitarapp:error' for app listeners

6. 07-app/core/errorMessages.js
   - Export 30+ message templates:
     * NETWORK_ERROR, TIMEOUT_ERROR, OFFLINE, RATE_LIMITED
     * API_UNAVAILABLE, API_ERROR_GENERIC, LESSON_LOADING_FAILED
     * AUTHENTICATION_FAILED, PERMISSION_DENIED
     * VALIDATION_ERROR, DATA_CORRUPTED, LESSON_NOT_FOUND
     * TTS_UNAVAILABLE, AUDIO_PLAYBACK_ERROR, SPEAKER_NOT_AVAILABLE
     * CHAT_UNAVAILABLE, PRACTICE_SESSION_ENDED
     * CRITICAL_ERROR (+ others in audit findings)
   - Each message: title, description, suggestions, severity
   - Support context interpolation (lessonId, featureName, retryAfter)
   - Include user-facing messages (not technical jargon)

7. 07-app/core/errorHandling.js
   - Initialize: ErrorLogger, AlertManager, CircuitBreaker instances
   - Set up global error handler: window.onerror → error logger
   - Set up unhandled rejection handler
   - Export singleton instances for app

8. ENHANCE: 07-app/index.html
   - Add global error handler before app boots
   - Initialize errorHandling module

9. ENHANCE: 07-app/core/lesson-runner.js
   - Wrap lesson execution in FeatureBoundary
   - Catch errors, show recovery options, retry on success

VERIFICATION REQUIRED (MUST PASS BEFORE SUBMITTING):
- [ ] npm run test:error-handling passes with 90%+ coverage
- [ ] RetryManager: exponential backoff 100→200→400→800ms verified
- [ ] CircuitBreaker: opens/closes/half-opens correctly
- [ ] FeatureBoundary catches error, shows fallback, provides recovery
- [ ] ErrorLogger batches 10 errors and POSTs to /api/errors
- [ ] AlertManager fires alert when error_rate > 5%
- [ ] All 30+ error messages tested with correct routing
- [ ] Global error handler catches unhandled errors
- [ ] Integration test: lesson fails → boundary catches → retry succeeds → lesson plays
- [ ] No error handler creates infinite loops
- [ ] Circuit breaker recovery works: fail→open→wait→half_open→succeed→closed

FILES TO CREATE:
✓ RetryManager.js
✓ CircuitBreaker.js
✓ FeatureBoundary.js
✓ ErrorLogger.js
✓ AlertManager.js
✓ errorMessages.js
✓ errorHandling.js
✓ ENHANCE lesson-runner.js
✓ ENHANCE index.html

Before responding, build all 7 files with complete implementations, write 90%+ coverage tests, run tests, verify all checks, then respond with:
{
  "status": "COMPLETE" or "FAILED",
  "files_created": ["list"],
  "tests_passing": true/false,
  "test_output": "summary",
  "test_coverage": "X%",
  "verification_status": "all passed or failures",
  "blocker": "if failed, what's blocking?"
}`,
    { 
      label: 'error-handling:implementation',
      phase: 'Error Handling',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['COMPLETE', 'FAILED'] },
          files_created: { type: 'array', items: { type: 'string' } },
          tests_passing: { type: 'boolean' },
          test_coverage: { type: 'string' },
          verification_status: { type: 'string' },
          blocker: { type: 'string' }
        }
      }
    }
  ),

  // AGENT 3: Analytics Implementation
  () => agent(
    `You are the Analytics & A/B Testing Implementation Agent.

CONTEXT:
- trackContentEvent() exists (marketing attribution only)
- Missing: learning event tracking, error tracking, A/B testing, server aggregation
- Need to track: 25+ learning events + experiments

YOUR TASK:
Build these modules (in order):

1. 07-app/core/eventTracker.js
   - Unified event tracking with 3-tier batching:
     * Tier 1: Critical events (send immediately)
     * Tier 2: High-priority (batch every 5 min)
     * Tier 3: Standard (batch within session)
   - Event schema: timestamp, user_id (hashed), session_id, properties, experiment_id
   - Hash user IDs with SHA-256 (never send raw PocketBase ID)
   - Add user_properties context: cohort, lifetime_days, platform
   - POST batched events to /api/events every 5 min
   - Retry on failure (same retry logic as audio/error modules)

2. 07-app/core/ExperimentManager.js
   - Load experiment registry from /api/experiments/registry
   - Deterministic variant allocation: hash(user_id) % 100 → bucket → variant
   - Cache allocation in studentMemorySync (cross-device consistency)
   - Tag all events with experiment_properties (variant, test_name, allocation_date)
   - Support audience filtering (min/max lessons, platform, cohort)

3. INSTRUMENT: 07-app/core/lesson-runner.js
   - Fire events: lesson_started, lesson_completed, chord_attempted
   - Attach context: lessonId, lessonNumber, performance_score
   - Tier: lesson_started → Tier 2, lesson_completed → Tier 1

4. INSTRUMENT: 07-app/core/listening-engine.js
   - Fire events: chord_attempted, chord_detected, detection_accuracy
   - Include: chordName, confidence, attemptNumber
   - Tier: Tier 3 (standard batching)

5. INSTRUMENT: 07-app/core/practiceRemix.js
   - Fire events: practice_session_started, practice_session_completed
   - Include: sessionDuration, drills_passed, drills_failed
   - Tier: Tier 2 (batch every 5 min)

6. INSTRUMENT: 07-app/core/band-engine.js
   - Fire events: performance_level_unlocked, performance_level_completed
   - Include: levelNumber, score, timeToComplete
   - Tier: Tier 1 (send immediately)

7. INTEGRATE: Analytics + Error Handling
   - ErrorLogger POST errors as events (to same /api/events endpoint)
   - Event type: 'error_occurred' with error_code, severity, context
   - Treated as Tier 2 events (batch every 5 min)

8. CREATE: 07-app/experiments.json
   - Experiment registry (for client-side allocation)
   - Format: { id, name, allocation_pct, audience, primary_metric, sample_size }
   - 5 default experiments (from audit recommendations)

9. CREATE: scripts/analytics-setup.sql
   - PocketBase collection schema for events
   - Collections: events, experiments, users, retention_cohorts
   - Indexes on: timestamp, user_id, event_type, experiment_id

10. CREATE: scripts/analytics-aggregation.mjs
    - Daily aggregation job (scheduled cron)
    - Calculate: DAU, retention cohorts (D1/D7/D30), funnel stages
    - Aggregate metrics per event_type, per experiment variant

VERIFICATION REQUIRED (MUST PASS BEFORE SUBMITTING):
- [ ] npm run test:analytics passes with 85%+ coverage
- [ ] All 25+ learning events firing at correct times
- [ ] Event batching: Tier 1 sends <100ms, Tier 2/3 batch <5min
- [ ] User ID hashing verified (no PII in payloads)
- [ ] No emails, phones, device IDs in event properties
- [ ] Experiment allocation deterministic (same user = same variant)
- [ ] Experiment context added to all events
- [ ] Retention cohort queries return correct D1/D7/D30 counts
- [ ] Error events flowing correctly to analytics endpoint
- [ ] Sample rate respected (10% in prod, 100% in dev)

FILES TO CREATE:
✓ eventTracker.js
✓ ExperimentManager.js
✓ experiments.json
✓ analytics-setup.sql
✓ analytics-aggregation.mjs
✓ INSTRUMENT lesson-runner.js
✓ INSTRUMENT listening-engine.js
✓ INSTRUMENT practiceRemix.js
✓ INSTRUMENT band-engine.js
✓ INTEGRATE error tracking

Before responding, build all modules, write tests, run tests, verify PII checks, then respond with:
{
  "status": "COMPLETE" or "FAILED",
  "files_created": ["list"],
  "events_instrumented": X,
  "tests_passing": true/false,
  "pii_audit": "clean" or "found issues",
  "verification_status": "all passed or failures",
  "blocker": "if failed, what's blocking?"
}`,
    { 
      label: 'analytics:implementation',
      phase: 'Analytics',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['COMPLETE', 'FAILED'] },
          files_created: { type: 'array' },
          events_instrumented: { type: 'number' },
          tests_passing: { type: 'boolean' },
          pii_audit: { type: 'string' },
          verification_status: { type: 'string' }
        }
      }
    }
  ),

  // AGENT 4: Deployment Implementation
  () => agent(
    `You are the DevOps & Deployment Implementation Agent.

CONTEXT:
- App currently runs on desktop with local PocketBase
- Need: Docker, blue-green architecture, canary deployment, monitoring

YOUR TASK:
Build deployment infrastructure:

1. Dockerfile
   - Base: Node.js 20-alpine
   - Multi-stage: build (npm install, npm run build) + runtime
   - Runtime: run as non-root nodejs user, port 3000
   - Health check: /health endpoint
   - Production-ready (no dev dependencies)

2. docker-compose.yml
   - BLUE service: guitarapp-blue on port 3000
   - GREEN service: guitarapp-green on port 3001
   - Nginx load balancer on port 80/443 (route to BLUE initially)
   - Persistent volumes for database, logs
   - Health checks for each service

3. nginx.conf
   - Upstream blocks for BLUE/GREEN
   - Load balancer can switch between them
   - Add request_id header for tracing
   - Gzip compression for text assets

4. scripts/deploy.sh
   - Build GREEN environment (clone BLUE, install deps, replicate DB)
   - Run smoke tests (API, audio, database, service worker)
   - Get approvals (tech/product/ops leads)
   - Canary phase: shift traffic 5% → 10% → 15% (5 min each)
   - Full switch to GREEN if metrics good
   - Rollback to BLUE on error

5. scripts/rollback.sh
   - Revert to previous version (switch traffic back to BLUE)
   - Stop GREEN environment
   - Restore database snapshot if needed
   - Complete in <30 seconds

6. scripts/health-check.sh
   - Check service running (curl /health)
   - Check database connected
   - Check error rate <1%
   - Check latency P95 <2s
   - Alert on-call if any check fails

7. scripts/backup.sh
   - Backup database (PocketBase SQLite + WAL files)
   - Backup audio assets
   - Backup application state
   - Store in timestamped directory

8. scripts/restore.sh
   - Restore from backup date
   - Verify database consistency
   - Restart services

9. docs/DEPLOYMENT.md
   - Step-by-step blue-green deployment process
   - Canary rollout procedure
   - Rollback steps
   - Troubleshooting guide

10. docs/INCIDENT-PLAYBOOK.md
    - SEV1: Service down → immediate paging (15 min SLA)
    - SEV2: Degraded (10-50% users) → 30 min SLA
    - Specific playbooks:
      * App won't start (check logs, database connection, config)
      * High error rate (>5% errors → trigger rollback)
      * Database connection errors (check PocketBase, replicas)
      * Memory leak (check heap, restart services)
      * High latency (check CPU, network, database query perf)

VERIFICATION REQUIRED (MUST PASS BEFORE SUBMITTING):
- [ ] docker build -t guitarapp:v1 . completes without errors
- [ ] docker-compose up starts all services correctly
- [ ] Health check (/health endpoint) returns 200 OK
- [ ] Blue-green cutover: load balancer switches cleanly <30s
- [ ] Canary rollout: traffic shift 5%→10%→15%→100% works
- [ ] Rollback: revert to BLUE in <30s
- [ ] Monitoring: error rate and latency dashboards functional
- [ ] Logs: all requests logged as JSON with request_id
- [ ] Backup/restore: can recover full app+DB state
- [ ] Incident playbooks cover 5+ failure scenarios

FILES TO CREATE:
✓ Dockerfile
✓ docker-compose.yml
✓ nginx.conf
✓ .dockerignore
✓ scripts/deploy.sh
✓ scripts/rollback.sh
✓ scripts/health-check.sh
✓ scripts/backup.sh
✓ scripts/restore.sh
✓ docs/DEPLOYMENT.md
✓ docs/INCIDENT-PLAYBOOK.md
✓ docs/MONITORING.md

Before responding, build all infrastructure, test deployment manually, verify cutover <30s, then respond with:
{
  "status": "COMPLETE" or "FAILED",
  "files_created": ["list"],
  "docker_build": "success",
  "deployment_tested": true/false,
  "cutover_time_ms": X,
  "rollback_time_ms": Y,
  "verification_status": "all passed or failures",
  "blocker": "if failed, what's blocking?"
}`,
    { 
      label: 'deployment:implementation',
      phase: 'Deployment',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['COMPLETE', 'FAILED'] },
          files_created: { type: 'array' },
          docker_build: { type: 'string' },
          deployment_tested: { type: 'boolean' },
          cutover_time_ms: { type: 'number' },
          rollback_time_ms: { type: 'number' },
          verification_status: { type: 'string' }
        }
      }
    }
  ),

  // AGENT 5: Performance Implementation
  () => agent(
    `You are the Performance Optimization Implementation Agent.

CONTEXT:
- Current load time: <2s desktop, needs <3s on mobile 4G
- Need: code-splitting, tree-shaking, Lighthouse >90 score
- Target: sub-500KB main bundle + <100KB per route chunk

YOUR TASK:
Optimize performance:

1. ENHANCE: vite.config.js
   - Code-splitting by route: separate chunks for Lesson, Chat, Practice, Tuner, etc.
   - Tree-shaking: enable unused code elimination
   - Minification: enable esbuild minify
   - CSS minification and purging
   - Asset optimization (image compression)
   - Report bundle size by chunk

2. ENHANCE: 07-app/service-worker.js
   - Precache strategy: first lesson audio + critical assets
   - Update cache version to bust old files
   - Stale-while-revalidate for app shell
   - Cache-first for audio files (.wav, .mp3)
   - Network-first for API endpoints

3. scripts/bundle-analysis.mjs
   - Build and analyze bundle
   - Report: total size, chunk sizes, unused code
   - Identify optimization opportunities
   - Compare against targets: <500KB main, <100KB chunks

4. .github/workflows/performance.yml (CI)
   - Build on every PR
   - Run Lighthouse CI
   - Report performance score
   - Fail if bundle >500KB or Lighthouse <90

5. CREATE: performance targets file
   - Load time: P95 <2s desktop, <3s mobile 4G
   - Time-to-interactive: <3s
   - First contentful paint: <1s
   - Largest contentful paint: <2s
   - Cumulative layout shift: <0.1
   - Interaction to next paint: <200ms

VERIFICATION REQUIRED (MUST PASS BEFORE SUBMITTING):
- [ ] Bundle size <500KB main (minified, gzipped)
- [ ] Route chunks <100KB each
- [ ] Load time P95 <2s (desktop WiFi), <3s (mobile 4G)
- [ ] Time-to-interactive <3s
- [ ] Lighthouse score >90
- [ ] Code-splitting: 8+ route-based chunks
- [ ] Tree-shaking removes unused code (verified)
- [ ] Service worker precaches essential files
- [ ] Mobile network adaptation working (3G vs 4G)
- [ ] No performance regression from Phase 5

FILES TO CREATE:
✓ ENHANCE vite.config.js
✓ ENHANCE service-worker.js
✓ scripts/bundle-analysis.mjs
✓ .github/workflows/performance.yml
✓ Performance targets documentation

Before responding, build all optimizations, measure actual load times, run Lighthouse, verify targets, then respond with:
{
  "status": "COMPLETE" or "FAILED",
  "bundle_size_kb": X,
  "load_time_p95_ms": Y,
  "lighthouse_score": Z,
  "chunks_created": N,
  "tests_passing": true/false,
  "verification_status": "all passed or failures",
  "blocker": "if failed, what's blocking?"
}`,
    { 
      label: 'performance:implementation',
      phase: 'Performance',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['COMPLETE', 'FAILED'] },
          bundle_size_kb: { type: 'number' },
          load_time_p95_ms: { type: 'number' },
          lighthouse_score: { type: 'number' },
          chunks_created: { type: 'number' },
          tests_passing: { type: 'boolean' },
          verification_status: { type: 'string' }
        }
      }
    }
  ),
])

// All 5 agents complete
log('All 5 Phase 6 workstreams implemented and verified')
return {
  completed: results.filter(Boolean).length,
  failed: results.filter(r => !r || r.status === 'FAILED').length,
  audio_tts: results[0],
  error_handling: results[1],
  analytics: results[2],
  deployment: results[3],
  performance: results[4],
}
```

---

## How to Use This Workflow

1. **Copy the script above** (the entire `export const meta = ...` block)
2. **In Claude Code terminal**, paste into your session
3. **Call Workflow:**
   ```
   Workflow({ script: "<paste the script>" })
   ```
4. **Watch progress:** Use `/workflows` command to see live status
5. **All 5 agents start in parallel** and run independently
6. **Each agent produces:** files created, test results, verification status
7. **Merge when all are COMPLETE**

---

## After Workflow Completes

### Check Results
- Review each agent's output
- Verify status = "COMPLETE" (not "FAILED")
- Check test_passing = true for each
- Review any blockers

### If All 5 Complete:
```bash
# Create final commit
git add -A
git commit -m "Phase 6: Audio/TTS, Error Handling, Analytics, Deployment, Performance

- Audio/TTS: Runtime service + playback + metrics
- Error Handling: Retry logic + circuit breaker + error boundaries
- Analytics: Event tracking + A/B testing + retention cohorts
- Deployment: Blue-green + canary + monitoring + incident playbooks
- Performance: Code-splitting + bundle optimization + Lighthouse >90

All workstreams implemented, tested (80%+ coverage), and verified.
"

# Run full test suite
npm run test:all

# Push to main (if tests pass)
git push origin main
```

### If Any Agent Failed:
1. Read the "blocker" message from that agent
2. Diagnose the issue
3. Spawn just that one agent again to retry
4. Don't proceed to merge until all 5 are COMPLETE

---

## Master Checklist During Workflow

Track progress as agents report:

**During Execution:**
- [ ] Audio/TTS agent running...
- [ ] Error Handling agent running...
- [ ] Analytics agent running...
- [ ] Deployment agent running...
- [ ] Performance agent running...

**After All Complete:**
- [ ] All 5 agents status = "COMPLETE"
- [ ] All tests passing (80%+ coverage each)
- [ ] No blockers reported
- [ ] Code merged to main
- [ ] Full test suite passing (npm run test:all)
- [ ] Performance targets verified (sub-2s, Lighthouse >90)
- [ ] Ready for production deployment

---

## Troubleshooting

**If workflow hangs:** It's running. Use `/workflows` to check status.

**If an agent times out:** Rerun just that agent individually (not the full workflow).

**If tests fail:** Agent will report "status": "FAILED" with blocker message. Review error and retry.

**If all 5 complete but tests failing:** Likely integration issue. Spawn a 6th "Integration Verification" agent to test cross-module interactions.

---

## Summary

**This workflow spawns 5 agents in parallel to build Phase 6 in 4 weeks.**

Each agent:
1. ✅ Builds their assigned workstream
2. ✅ Writes comprehensive tests
3. ✅ Verifies all tests pass
4. ✅ Reports status + metrics
5. ✅ Submits code ready for merge

**Expected outcome:** All 5 workstreams complete, tested, and merged by end of Week 4.

**Next step after merge:** Run production deployment checklist (PHASE-6-IMPLEMENTATION-HANDOFF.md, PART 6).
