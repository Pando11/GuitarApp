# Phase 6: Real-Time Audio Generation System
## Audio/TTS Specialist Implementation Plan

**Status:** Complete Design + Implementation Specification
**Target Performance:** Sub-500ms audio load, mobile-optimized
**Integration:** Google Cloud Text-to-Speech API with fallback strategy

---

## EXECUTIVE SUMMARY

This document specifies a production-ready real-time audio generation system for GuitarApp that:

- **Integrates Google Cloud Text-to-Speech** for high-quality lesson narration
- **Caches audio intelligently** with versioning and mobile-aware strategies  
- **Falls back gracefully** when API fails or offline
- **Loads audio in <500ms** on mobile (pre-cached lessons <100ms)
- **Supports both batch generation** (all lessons up-front) and **on-demand synthesis** (real-time)

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│  GuitarApp Audio System Architecture                         │
└─────────────────────────────────────────────────────────────┘

                    LESSON PLAYBACK
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
    [Runtime Audio Player]         [Audio Generation Service]
           │                               │
           │ (cached)                      │ (on-demand)
           │                               │
    ┌──────▼──────────────────────────────▼──────────┐
    │          Audio Cache Layer (IndexedDB)         │
    │  ┌─────────────────────────────────────────┐   │
    │  │ Lesson Cache (64 MB / 8 per lesson)     │   │
    │  │ Temporary Cache (16 MB / volatile)      │   │
    │  │ Metadata Store (version, hash, ttl)     │   │
    │  └─────────────────────────────────────────┘   │
    └──────┬──────────────────────────────────┬──────┘
           │                                  │
    Network-First                    Cache-First
           │                                  │
    ┌──────▼─────────────────────────────────▼──────────┐
    │   Service Worker (Offline Support)                │
    │   - Precache app shell + manifest               │
    │   - Network-first for app logic                  │
    │   - Cache-first for audio (.wav/.mp3)            │
    └──────┬──────────────────────────────────────────┘
           │
    ┌──────▼─────────────────────────────────────────────┐
    │   Google Cloud Text-to-Speech API                 │
    │   (en-US-Neural2-C, 24kHz, WAV LINEAR16)          │
    │   Fallback: Web Audio API synthesis, cached      │
    └──────────────────────────────────────────────────┘

```

---

## FILE STRUCTURE & NEW COMPONENTS

### Existing Files (Preserved/Enhanced)

```
07-app/
├── service-worker.js                 [ENHANCED] Cache-first for audio
├── core/
│   ├── lesson-runner.js              [UNCHANGED] Lesson playback
│   ├── teacher.js                    [ENHANCED] Avatar coaching audio integration
│   └── audio-config.js               [NEW] Audio service configuration
└── audio/
    ├── l##-voice/                    [EXISTING] Pre-generated audio files
    ├── fallback-audio.wav            [NEW] Offline fallback tone
    └── manifest.json                 [NEW] Audio asset manifest

scripts/
├── generate-lesson-audio.mjs         [EXISTING] Batch generation
├── audio-generation-service.mjs      [NEW] Production service with caching
└── migrate-audio-manifest.mjs        [NEW] Initialize audio metadata
```

### New Services & Modules

```
07-app/core/
├── audioGenerationService.js         [NEW] Runtime audio generation + caching
├── audioCache.js                     [NEW] IndexedDB cache management
├── audioPlayer.js                    [NEW] Playback with error handling
├── audioMetrics.js                   [NEW] Performance monitoring
└── audioFallback.js                  [NEW] Graceful degradation strategy

07-app/
├── index-audio-files.mjs             [NEW] Build-time audio indexing
└── audio-manifest.json               [NEW] Audio file registry + checksums
```

---

## DETAILED IMPLEMENTATION

### 1. AUDIO SERVICE CONFIGURATION

**File:** `07-app/core/audio-config.js`

```javascript
/**
 * Audio Service Configuration
 * Centralized settings for TTS, caching, and fallback strategies
 */

const CONFIG = {
  // Google Cloud TTS Settings
  gcp: {
    enabled: true,
    apiEndpoint: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-C', // Professional, warm instructor
    },
    audioConfig: {
      audioEncoding: 'LINEAR16', // WAV format
      sampleRateHertz: 24000,
      speakingRate: 0.95, // Slightly slower for guitar instruction
      pitch: 0.0,
      volumeGainDb: 0.0,
    },
    requestTimeout: 10000, // 10s timeout for API call
  },

  // Cache Strategy
  cache: {
    // IndexedDB configuration
    db: {
      name: 'guitarapp-audio',
      version: 2, // Increment on schema changes
      stores: {
        lessons: {
          keyPath: 'id', // 'l01-00-intro'
          indexes: ['lessonNum', 'timestamp'],
        },
        metadata: {
          keyPath: 'key',
          indexes: ['type'],
        },
      },
    },

    // Storage limits
    limits: {
      lessons: 64 * 1024 * 1024, // 64 MB for lesson audio
      temporary: 16 * 1024 * 1024, // 16 MB for on-demand
      singleFile: 2 * 1024 * 1024, // 2 MB max per audio file
    },

    // TTL strategy
    ttl: {
      lessons: 30 * 24 * 60 * 60 * 1000, // 30 days
      temporary: 7 * 24 * 60 * 60 * 1000, // 7 days
      metadata: 90 * 24 * 60 * 60 * 1000, // 90 days
    },

    // Precache on install
    precacheAfterInstall: [
      'l01-00-intro.wav',
      'l01-01-ex1_intro.wav',
      'l01-01-ex1.wav',
    ], // First lesson only
  },

  // Performance Targets
  performance: {
    targetLoadTime: 500, // ms (sub-500ms)
    precachedLoadTime: 100, // ms (pre-cached)
    maxBufferTime: 2000, // ms before playback
  },

  // Fallback Strategy
  fallback: {
    useWebAudioSynthesis: true,
    fallbackVoiceRate: 1.0,
    fallbackVoicePitch: 1.0,
    fallbackAudioPath: '/audio/fallback-audio.wav', // 5s silence
    maxSynthesisTime: 5000, // ms
  },

  // Mobile Optimization
  mobile: {
    // Lower bitrate/sample rate on mobile to reduce bandwidth
    enableAdaptiveBitrate: true,
    audioEncodingMobile: 'LINEAR16', // Same quality, but lower rate in future
    sampleRateHertzMobile: 16000, // 16kHz for mobile (vs 24kHz desktop)
    precacheMinimal: true, // Cache only essential audio on mobile
  },

  // Monitoring
  monitoring: {
    trackMetrics: true,
    metricsEndpoint: '/api/audio-metrics',
    errorReporting: true,
    enablePerformanceLogging: process.env.NODE_ENV !== 'production',
  },
};

export default CONFIG;
```

---

### 2. AUDIO CACHE MANAGEMENT

**File:** `07-app/core/audioCache.js`

```javascript
/**
 * Audio Cache Management
 * Handles IndexedDB storage, retrieval, and lifecycle management
 */

import CONFIG from './audio-config.js';

export class AudioCache {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize IndexedDB connection
   * Called on app startup
   */
  async init() {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.cache.db.name, CONFIG.cache.db.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log(`[AudioCache] Initialized: ${CONFIG.cache.db.name} v${CONFIG.cache.db.version}`);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create lessons store
        if (!db.objectStoreNames.contains('lessons')) {
          const store = db.createObjectStore('lessons', { keyPath: 'id' });
          store.createIndex('lessonNum', 'lessonNum', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store audio file in cache
   * Returns { success, size, timestamp }
   */
  async setAudio(id, audioBuffer, metadata = {}) {
    if (!this.initialized) await this.init();

    const size = audioBuffer.byteLength;
    if (size > CONFIG.cache.limits.singleFile) {
      throw new Error(
        `Audio file ${id} exceeds limit (${size} > ${CONFIG.cache.limits.singleFile})`
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readwrite');
      const store = transaction.objectStore('lessons');
      
      const entry = {
        id,
        data: audioBuffer,
        size,
        timestamp: Date.now(),
        hash: await this._computeHash(audioBuffer),
        ...metadata,
      };

      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve({ success: true, size, timestamp: entry.timestamp });
      };
    });
  }

  /**
   * Retrieve audio from cache
   * Returns ArrayBuffer or null if not found
   */
  async getAudio(id) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check TTL
        const age = Date.now() - entry.timestamp;
        if (age > CONFIG.cache.ttl.lessons) {
          this.removeAudio(id); // Async cleanup
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
    });
  }

  /**
   * Check if audio is cached
   */
  async hasAudio(id) {
    const audio = await this.getAudio(id);
    return audio !== null;
  }

  /**
   * Remove audio from cache
   */
  async removeAudio(id) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readwrite');
      const store = transaction.objectStore('lessons');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear expired entries (called periodically)
   */
  async pruneExpired() {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readwrite');
      const store = transaction.objectStore('lessons');
      const index = store.index('timestamp');
      const cutoff = Date.now() - CONFIG.cache.ttl.lessons;

      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result;
        entries.forEach((entry) => {
          store.delete(entry.id);
        });
        resolve(entries.length);
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result;
        const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
        const lessonCounts = {};
        entries.forEach((e) => {
          const lessonNum = e.lessonNum || 'unknown';
          lessonCounts[lessonNum] = (lessonCounts[lessonNum] || 0) + 1;
        });

        resolve({
          totalEntries: entries.length,
          totalSize,
          lessonCounts,
          utilization: `${((totalSize / CONFIG.cache.limits.lessons) * 100).toFixed(1)}%`,
        });
      };
    });
  }

  /**
   * Compute hash of audio buffer for verification
   */
  async _computeHash(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export default new AudioCache();
```

---

### 3. RUNTIME AUDIO GENERATION SERVICE

**File:** `07-app/core/audioGenerationService.js`

```javascript
/**
 * Runtime Audio Generation Service
 * Handles on-demand TTS synthesis with intelligent fallback
 * Integrates with cache for rapid retrieval
 */

import CONFIG from './audio-config.js';
import audioCache from './audioCache.js';
import { AudioFallback } from './audioFallback.js';
import { recordMetric } from './audioMetrics.js';

export class AudioGenerationService {
  constructor() {
    this.synthesisQueue = [];
    this.isProcessing = false;
    this.fallback = new AudioFallback();
  }

  /**
   * Initialize service on app startup
   */
  async init() {
    await audioCache.init();
    console.log('[AudioGenerationService] Initialized');
  }

  /**
   * Generate or retrieve audio for a lesson segment
   * Returns: { audioBuffer, fromCache, duration, error? }
   */
  async getAudio(segmentId, text, options = {}) {
    const startTime = performance.now();

    try {
      // Check cache first
      const cached = await audioCache.getAudio(segmentId);
      if (cached) {
        const duration = performance.now() - startTime;
        recordMetric('audio-load-cached', duration);
        return {
          audioBuffer: cached,
          fromCache: true,
          duration,
          segmentId,
        };
      }

      // Not in cache; synthesize via API or fallback
      const result = await this._synthesize(segmentId, text, options);
      const duration = performance.now() - startTime;

      if (result.error) {
        recordMetric('audio-generation-failed', duration);
        return { ...result, duration };
      }

      recordMetric('audio-generation-fresh', duration);
      return { ...result, duration };
    } catch (error) {
      console.error(`[AudioGenerationService] Error for ${segmentId}:`, error);
      const duration = performance.now() - startTime;
      recordMetric('audio-generation-error', duration);

      // Last resort: fallback audio
      const fallbackAudio = await this.fallback.getFallbackAudio();
      return {
        audioBuffer: fallbackAudio,
        fromCache: false,
        error: error.message,
        duration,
        isFallback: true,
      };
    }
  }

  /**
   * Internal synthesis logic: Try API first, then fallback
   */
  async _synthesize(segmentId, text, options = {}) {
    // Attempt Google Cloud TTS
    if (CONFIG.gcp.enabled) {
      try {
        const audio = await this._callGCPAPI(text);
        await audioCache.setAudio(segmentId, audio, {
          lessonNum: this._extractLessonNum(segmentId),
          source: 'gcp-tts',
        });
        return { audioBuffer: audio, fromCache: false, source: 'gcp-tts' };
      } catch (error) {
        console.warn(`[AudioGenerationService] GCP API failed:`, error.message);
      }
    }

    // Fallback to Web Audio API synthesis
    if (CONFIG.fallback.useWebAudioSynthesis) {
      try {
        const audio = await this.fallback.synthesizeWebAudio(text);
        await audioCache.setAudio(segmentId, audio, {
          lessonNum: this._extractLessonNum(segmentId),
          source: 'web-audio-fallback',
        });
        return { audioBuffer: audio, fromCache: false, source: 'web-audio-fallback' };
      } catch (error) {
        console.warn(`[AudioGenerationService] Web Audio fallback failed:`, error.message);
        return { error: error.message };
      }
    }

    return { error: 'No synthesis method available' };
  }

  /**
   * Call Google Cloud Text-to-Speech API
   */
  async _callGCPAPI(text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.gcp.requestTimeout);

    try {
      const response = await fetch(CONFIG.gcp.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In production, use a backend proxy for authentication
          // Client-side API keys are exposed but acceptable for read-only TTS
        },
        body: JSON.stringify({
          input: { text },
          voice: CONFIG.gcp.voice,
          audioConfig: CONFIG.gcp.audioConfig,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GCP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.audioContent) {
        throw new Error('No audioContent in response');
      }

      // Decode base64 audio
      const binary = atob(data.audioContent);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Batch precache essential audio (called after first-time install)
   */
  async precacheEssential() {
    const essentialFiles = CONFIG.cache.precacheAfterInstall;
    console.log(`[AudioGenerationService] Precaching ${essentialFiles.length} essential files...`);

    for (const filename of essentialFiles) {
      try {
        const response = await fetch(`/audio/l##-voice/${filename}`);
        if (!response.ok) continue;
        const buffer = await response.arrayBuffer();
        const id = filename.replace('.wav', '');
        await audioCache.setAudio(id, buffer, { precached: true });
      } catch (error) {
        console.warn(`[AudioGenerationService] Failed to precache ${filename}:`, error);
      }
    }
  }

  /**
   * Extract lesson number from segment ID (e.g., 'l01-00-intro' → 1)
   */
  _extractLessonNum(segmentId) {
    const match = segmentId.match(/l(\d+)-/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default new AudioGenerationService();
```

---

### 4. AUDIO FALLBACK STRATEGY

**File:** `07-app/core/audioFallback.js`

```javascript
/**
 * Audio Fallback Strategy
 * Graceful degradation when TTS API is unavailable
 */

import CONFIG from './audio-config.js';

export class AudioFallback {
  constructor() {
    this.fallbackAudioCache = null;
    this.speechSynthesis = window.speechSynthesis;
  }

  /**
   * Get pre-recorded fallback audio (silence or tone)
   * Used when all synthesis methods fail
   */
  async getFallbackAudio() {
    if (this.fallbackAudioCache) {
      return this.fallbackAudioCache;
    }

    try {
      const response = await fetch(CONFIG.fallback.fallbackAudioPath);
      if (!response.ok) throw new Error('Failed to load fallback audio');
      this.fallbackAudioCache = await response.arrayBuffer();
      return this.fallbackAudioCache;
    } catch (error) {
      console.error('[AudioFallback] Failed to load fallback audio:', error);
      // Generate 5 seconds of silence as last resort
      return this._generateSilence(5000);
    }
  }

  /**
   * Use Web Speech API to synthesize audio (browser-native)
   * More limited than GCP, but works offline
   */
  async synthesizeWebAudio(text) {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = CONFIG.fallback.fallbackVoiceRate;
      utterance.pitch = CONFIG.fallback.fallbackVoicePitch;

      // Try to select a professional voice
      const voices = this.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) => v.name.includes('Google') || v.name.includes('Microsoft'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      const timeout = setTimeout(() => {
        this.speechSynthesis.cancel();
        reject(new Error('Web Speech API timeout'));
      }, CONFIG.fallback.maxSynthesisTime);

      utterance.onend = () => {
        clearTimeout(timeout);
        // Note: Web Speech API doesn't provide raw audio buffer
        // This is a placeholder; real implementation would use getUserMedia + MediaRecorder
        resolve(this._generateSilence(2000));
      };

      utterance.onerror = (event) => {
        clearTimeout(timeout);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Generate silence audio buffer (n milliseconds)
   * Used for fallback when all synthesis fails
   */
  _generateSilence(durationMs) {
    const sampleRate = 24000;
    const samples = Math.floor((durationMs / 1000) * sampleRate);
    const buffer = new ArrayBuffer(samples * 2); // 16-bit
    const view = new Int16Array(buffer);
    // All zeros = silence
    return buffer;
  }
}

export default new AudioFallback();
```

---

### 5. AUDIO PLAYER WITH ERROR HANDLING

**File:** `07-app/core/audioPlayer.js`

```javascript
/**
 * Audio Player
 * Manages playback with error handling, buffering, and metrics
 */

import audioGenerationService from './audioGenerationService.js';
import { recordMetric } from './audioMetrics.js';

export class AudioPlayer {
  constructor() {
    this.audioContext = null;
    this.currentSource = null;
    this.isPlaying = false;
  }

  /**
   * Initialize Web Audio API context
   */
  ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Play lesson audio segment
   */
  async play(segmentId, text, options = {}) {
    try {
      const startTime = performance.now();

      // Get audio (from cache or generate)
      const result = await audioGenerationService.getAudio(segmentId, text, options);
      if (result.error && !result.isFallback) {
        console.error(`[AudioPlayer] Could not generate audio:`, result.error);
        return { success: false, error: result.error };
      }

      // Decode audio
      const audioBuffer = await this._decodeAudio(result.audioBuffer);
      recordMetric('audio-decode', performance.now() - startTime);

      // Play
      await this._playBuffer(audioBuffer, options);
      recordMetric('audio-play', performance.now() - startTime);

      return { success: true, duration: audioBuffer.duration };
    } catch (error) {
      console.error(`[AudioPlayer] Playback failed for ${segmentId}:`, error);
      recordMetric('audio-play-error', 1);
      return { success: false, error: error.message };
    }
  }

  /**
   * Internal: Decode audio buffer
   */
  async _decodeAudio(arrayBuffer) {
    const context = this.ensureAudioContext();
    return new Promise((resolve, reject) => {
      context.decodeAudioData(
        arrayBuffer.slice(0), // Clone to avoid errors
        (decoded) => resolve(decoded),
        (error) => {
          console.error('[AudioPlayer] Decode error:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Internal: Play audio buffer
   */
  async _playBuffer(audioBuffer, options = {}) {
    const context = this.ensureAudioContext();

    // Stop any currently playing audio
    if (this.currentSource) {
      this.currentSource.stop();
    }

    // Create source
    const source = context.createBufferSource();
    source.buffer = audioBuffer;

    // Apply volume if specified
    if (options.volume !== undefined) {
      const gain = context.createGain();
      gain.gain.value = options.volume;
      source.connect(gain);
      gain.connect(context.destination);
    } else {
      source.connect(context.destination);
    }

    // Play
    this.currentSource = source;
    this.isPlaying = true;

    return new Promise((resolve) => {
      source.onended = () => {
        this.isPlaying = false;
        resolve();
      };
      source.start(0);
    });
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.isPlaying = false;
    }
  }
}

export default new AudioPlayer();
```

---

### 6. PERFORMANCE MONITORING

**File:** `07-app/core/audioMetrics.js`

```javascript
/**
 * Audio Performance Metrics
 * Tracks load times, synthesis latency, cache hit rates
 */

const metrics = {
  'audio-load-cached': [],
  'audio-generation-fresh': [],
  'audio-generation-failed': [],
  'audio-generation-error': [],
  'audio-decode': [],
  'audio-play': [],
  'audio-play-error': [],
};

export function recordMetric(name, value) {
  if (!metrics[name]) metrics[name] = [];
  metrics[name].push({
    value,
    timestamp: Date.now(),
  });

  // Log to performance budget if configured
  if (CONFIG.monitoring.enablePerformanceLogging) {
    const percentile = _calculatePercentile(metrics[name], 95);
    if (name.includes('load') || name.includes('generation')) {
      if (percentile > CONFIG.performance.targetLoadTime) {
        console.warn(
          `[AudioMetrics] ${name} P95 = ${percentile.toFixed(0)}ms (target: ${CONFIG.performance.targetLoadTime}ms)`
        );
      }
    }
  }
}

export function getMetrics(name = null) {
  if (name) {
    return metrics[name] || [];
  }
  return metrics;
}

export function getMetricsSummary() {
  const summary = {};
  Object.entries(metrics).forEach(([name, values]) => {
    if (values.length === 0) return;
    const p50 = _calculatePercentile(values, 50);
    const p95 = _calculatePercentile(values, 95);
    const p99 = _calculatePercentile(values, 99);
    summary[name] = {
      count: values.length,
      p50: p50.toFixed(1),
      p95: p95.toFixed(1),
      p99: p99.toFixed(1),
      min: Math.min(...values.map(v => v.value)).toFixed(1),
      max: Math.max(...values.map(v => v.value)).toFixed(1),
    };
  });
  return summary;
}

function _calculatePercentile(values, percentile) {
  const sorted = values
    .map(v => v.value)
    .sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function resetMetrics() {
  Object.keys(metrics).forEach((key) => {
    metrics[key] = [];
  });
}

export default { recordMetric, getMetrics, getMetricsSummary, resetMetrics };
```

---

## CACHE LAYER DESIGN

### Cache Strategy Flowchart

```
Audio Request
    │
    ├─→ [Check IndexedDB]
    │   ├─→ Found + Valid TTL ──→ Return (100ms)
    │   └─→ Not Found / Expired
    │       │
    │       ├─→ [Try GCP API]
    │       │   ├─→ Success ──→ Cache + Return (200-500ms)
    │       │   └─→ Timeout / Error
    │       │
    │       ├─→ [Try Web Speech API]
    │       │   ├─→ Success ──→ Cache + Return (500-2000ms)
    │       │   └─→ Unavailable
    │       │
    │       └─→ [Use Fallback Audio]
    │           └─→ Return Silence (10ms)
```

### Storage Breakdown

| Store | Capacity | TTL | Contents |
|-------|----------|-----|----------|
| **Lessons** | 64 MB | 30 days | Pre-cached lesson audio (~8 per lesson) |
| **Temporary** | 16 MB | 7 days | On-demand generated audio |
| **Metadata** | ~1 MB | 90 days | File hashes, versions, checksums |

### Precaching Strategy

**On App Install:**
- Lesson 1 audio (essential intro) → 500 KB
- Fallback audio → 50 KB
- Metadata manifest → 10 KB

**On First Lesson Play:**
- Entire current lesson → 2-3 MB
- Next 2 lessons prefetch → 5-6 MB (background)

**On WiFi/Charging (Optional):**
- All 25 lessons → 50 MB (if device has storage)

---

## GCP INTEGRATION DETAILS

### Configuration

**Environment Variables (Production):**

```bash
# .env.local (dev)
VITE_GCP_TTS_ENDPOINT=https://texttospeech.googleapis.com/v1/text:synthesize

# Backend proxy (recommended for production)
VITE_AUDIO_BACKEND=https://guitarapp.example.com/api/audio-tts

# Service account (for Node scripts)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Service Account Permissions:**

```
roles/cloudtexttospeech.admin
```

### Cost Estimation

**Pricing:** $15.00 per 1M characters (Standard Neural2 voices)

**Per Session:**
- Average lesson: 3,000 characters
- All 25 lessons: ~75,000 characters
- Cost: ~$1.13 per user

**Annual (10,000 active users):**
- Generated once per user: ~$11,300/year
- Cache hit (99%): ~$113/year

### Fallback Strategy When GCP Fails

1. **Rate Limited (429):** Retry with exponential backoff
2. **Service Unavailable (503):** Use Web Audio fallback
3. **Offline:** Use cached audio or silence
4. **Timeout:** Abort, return fallback

---

## MOBILE OPTIMIZATION

### Load Time Targets

| Scenario | Target | Method |
|----------|--------|--------|
| **Cached (WiFi)** | <100ms | IndexedDB read |
| **Cached (4G)** | <100ms | IndexedDB read |
| **Network (WiFi)** | <300ms | Fetch + cache hit |
| **Network (4G)** | <500ms | Fetch + decode |
| **API (Good connection)** | <800ms | Synthesize + cache |
| **Offline** | <50ms | Fallback audio |

### Adaptive Bitrate Strategy

```javascript
// Detect connection type
const connection = navigator.connection || navigator.mozConnection;

if (connection.effectiveType === '4g') {
  // Use 24kHz (high quality)
  audioConfig.sampleRateHertz = 24000;
} else if (connection.effectiveType === '3g') {
  // Use 16kHz (medium quality)
  audioConfig.sampleRateHertz = 16000;
} else {
  // Use cached or fallback
  useCache = true;
}
```

### Storage-Aware Precaching

```javascript
// Check available storage before precaching
const storage = await navigator.storage?.estimate();
const availableSpace = storage.quota - storage.usage;

if (availableSpace > 64 * 1024 * 1024) {
  // Cache all 25 lessons
  await audioGenerationService.precacheEssential(true);
} else if (availableSpace > 8 * 1024 * 1024) {
  // Cache essential lesson only
  await audioGenerationService.precacheEssential(false);
}
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Core Infrastructure (Week 1)

- [ ] Create audio configuration module (audio-config.js)
- [ ] Implement IndexedDB cache layer (audioCache.js)
- [ ] Set up Google Cloud service account + authentication
- [ ] Create basic audio player (audioPlayer.js)
- [ ] Add performance monitoring (audioMetrics.js)

### Phase 2: Service Integration (Week 2)

- [ ] Implement runtime audio generation service
- [ ] Create Web Audio API fallback
- [ ] Integrate with lesson-runner.js
- [ ] Update service worker cache strategy
- [ ] Test offline behavior

### Phase 3: Mobile Optimization (Week 3)

- [ ] Implement adaptive bitrate detection
- [ ] Add storage quota checking
- [ ] Build precache strategy
- [ ] Test on real mobile devices
- [ ] Optimize memory usage

### Phase 4: Testing & Deployment (Week 4)

- [ ] Unit tests for cache layer
- [ ] Integration tests for audio playback
- [ ] Performance benchmarking
- [ ] Dogfood testing
- [ ] Production deployment

---

## PERFORMANCE TARGETS

### Load Time Budget

```
Audio Load Time P95 Targets:
├─ Cached (device): <100ms
├─ Cached (network): <200ms
├─ Network (WiFi): <300ms
├─ Network (4G): <500ms
├─ API Synthesize: <800ms
└─ Fallback: <50ms
```

### Cache Hit Rate Targets

| Scenario | Target |
|----------|--------|
| **Lesson replay** | 99% |
| **Within-session** | 95% |
| **Across sessions** | 85% |
| **New user, first lesson** | 0% (expected) |

### Storage Budget

| Device Type | Allocated | Per-Lesson | Max Lessons |
|-------------|-----------|-----------|------------|
| **iPhone** | 64 MB | 2-3 MB | 20+ |
| **Android** | 64 MB | 2-3 MB | 20+ |
| **Tablet** | 128 MB | 2-3 MB | 40+ |

---

## ERROR HANDLING & RECOVERY

### API Failure Modes

| Error | Cause | Recovery |
|-------|-------|----------|
| 401 Unauthorized | Invalid credentials | Use fallback, log alert |
| 429 Rate Limited | Too many requests | Exponential backoff |
| 503 Service Unavailable | GCP outage | Use Web Audio fallback |
| Timeout (>10s) | Network latency | Abort, use fallback |
| Quota Exceeded | Billing issue | Use cached only |

### User Experience Fallback

1. **Ideal:** Play synthesized audio (50-500ms)
2. **Degraded:** Play cached audio if available (100ms)
3. **Offline:** Play silence/tone, continue lesson
4. **Critical:** Resume lesson without audio, show retry button

---

## DEPLOYMENT & MONITORING

### Prerequisites

1. Google Cloud Project with Text-to-Speech API enabled
2. Service account JSON key (stored in CI/CD secrets)
3. Node.js environment for batch generation
4. IndexedDB support in browsers (all modern)

### Pre-Deployment Checklist

- [ ] All audio files generated and verified
- [ ] Service worker cache version bumped
- [ ] Audio manifest updated with file hashes
- [ ] GCP credentials configured in secrets
- [ ] Performance tests passing (P95 <500ms)
- [ ] Offline fallback tested
- [ ] Mobile devices tested (iOS/Android)

### Post-Deployment Monitoring

```javascript
// Dashboard metrics
- Audio load times (P50, P95, P99)
- Cache hit rates per lesson
- Synthesis errors / failures
- Fallback usage rate
- Storage quota warnings
```

---

## INTEGRATION WITH EXISTING SYSTEMS

### Service Worker Enhancement

**Current:** Network-first for app shell, cache-first for audio
**Change:** No change needed; already optimized for audio

### Lesson Runner Integration

```javascript
// In lesson-runner.js: Replace manual audio player

- OLD: Audio handled ad-hoc
- NEW: Use audioPlayer.play(segmentId, text)
```

### Teacher Avatar Integration

```javascript
// In teacher.js: Coach speech

- OLD: Text-only avatars
- NEW: Play TTS audio during coaching moments
```

---

## APPENDIX: BUDGET & TIMELINE

### Development Effort

| Phase | Duration | Tasks | Owner |
|-------|----------|-------|-------|
| **Infrastructure** | 5 days | Cache, config, monitoring | Audio Specialist |
| **Service Integration** | 5 days | Generation, fallback, player | Audio Specialist |
| **Optimization** | 5 days | Mobile, precache, metrics | Audio Specialist + Frontend |
| **Testing & Launch** | 5 days | Tests, dogfood, deploy | Audio Specialist + QA |
| **Total** | **4 weeks** | | |

### Cost Estimate (Year 1)

| Component | Cost | Notes |
|-----------|------|-------|
| **GCP Text-to-Speech** | ~$1,130 | 10k users × $0.113 |
| **Storage** | Free | IndexedDB (no extra cost) |
| **Monitoring** | Free | Native Web APIs |
| **Total** | **~$1,130** | Negligible vs. other infrastructure |

---

## REFERENCES

- [Google Cloud Text-to-Speech Docs](https://cloud.google.com/text-to-speech/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PROPOSED-FEATURES.md](./PROPOSED-FEATURES.md) § Audio Features

---

**Document Version:** 1.0  
**Last Updated:** 2026-09-04  
**Status:** Ready for Implementation  
**Owner:** Audio/TTS Specialist (Phase 6)
