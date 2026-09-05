/**
 * GuitarApp Audio Service Configuration
 * Centralized settings for TTS, caching, and fallback strategies
 *
 * Usage:
 *   import CONFIG from './audio-config.js';
 */

const CONFIG = {
  // =========================================================================
  // Google Cloud Text-to-Speech Settings
  // =========================================================================
  gcp: {
    enabled: true,
    // Production: Use backend proxy at /api/audio-tts
    // Development: Direct GCP API (requires CORS setup or proxy)
    apiEndpoint: process.env.VITE_AUDIO_BACKEND
      ? `${process.env.VITE_AUDIO_BACKEND}/synthesize`
      : 'https://texttospeech.googleapis.com/v1/text:synthesize',

    // Service account credentials (handled via backend in production)
    // Frontend never sees credentials directly

    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-C', // Professional, warm instructor
      // Alternatives: en-US-Neural2-A (male), en-US-Neural2-E (calm)
    },

    audioConfig: {
      audioEncoding: 'LINEAR16', // WAV format for broad compatibility
      sampleRateHertz: 24000, // High quality (16kHz on mobile if needed)
      speakingRate: 0.95, // 5% slower for guitar instruction
      pitch: 0.0, // Natural pitch
      volumeGainDb: 0.0, // Normal volume
    },

    // Request timeout
    requestTimeout: 10000, // 10 seconds

    // Retry strategy
    retry: {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 2000,
      backoffMultiplier: 2,
    },
  },

  // =========================================================================
  // Cache Strategy (IndexedDB)
  // =========================================================================
  cache: {
    db: {
      name: 'guitarapp-audio',
      version: 2, // Increment on schema changes (forces upgrade)
      stores: {
        lessons: {
          keyPath: 'id', // e.g., 'l01-00-intro'
          indexes: ['lessonNum', 'timestamp', 'source'],
        },
        metadata: {
          keyPath: 'key',
          indexes: ['type', 'timestamp'],
        },
      },
    },

    // Storage limits (per-category)
    limits: {
      lessons: 64 * 1024 * 1024, // 64 MB for lesson audio
      temporary: 16 * 1024 * 1024, // 16 MB for on-demand
      singleFile: 2 * 1024 * 1024, // 2 MB max per file
    },

    // Time-to-live (expiration) strategy
    ttl: {
      lessons: 30 * 24 * 60 * 60 * 1000, // 30 days
      temporary: 7 * 24 * 60 * 60 * 1000, // 7 days
      metadata: 90 * 24 * 60 * 60 * 1000, // 90 days
    },

    // Files to precache on service worker install
    // (first lesson essentials only to minimize initial cache size)
    precacheAfterInstall: [
      'l01-00-intro.wav',
      'l01-01-ex1_intro.wav',
      'l01-01-ex1.wav',
      'l01-02-ex2_intro.wav',
      'l01-02-ex2.wav',
    ],

    // Cleanup strategy
    cleanup: {
      pruneIntervalMs: 24 * 60 * 60 * 1000, // Daily
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  },

  // =========================================================================
  // Performance Targets
  // =========================================================================
  performance: {
    // Primary load time target (p95)
    targetLoadTime: 500, // milliseconds (sub-500ms)

    // Cached load time target (p95)
    precachedLoadTime: 100, // milliseconds

    // Max buffer time before playback warning
    maxBufferTime: 2000, // milliseconds

    // Performance monitoring enabled
    enableMetrics: true,
  },

  // =========================================================================
  // Fallback Strategy (When API Fails)
  // =========================================================================
  fallback: {
    // Use Web Speech API as fallback (browser-native synthesis)
    useWebAudioSynthesis: true,

    // Web Speech parameters
    fallbackVoiceRate: 1.0,
    fallbackVoicePitch: 1.0,

    // Path to fallback audio (silence, 5 seconds)
    fallbackAudioPath: '/audio/fallback-audio.wav',

    // Max time for Web Speech synthesis
    maxSynthesisTime: 5000, // milliseconds

    // Fallback cache time
    fallbackCacheTtl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // =========================================================================
  // Mobile Optimization
  // =========================================================================
  mobile: {
    // Detect mobile and apply optimizations
    enableAdaptiveBitrate: true,

    // For slower connections (3G, etc), use lower sample rate
    // Will be set dynamically based on navigator.connection
    sampleRateHertzMobile: 16000, // 16kHz for mobile (vs 24kHz desktop)

    // Precache only essential audio on mobile to save storage
    precacheMinimal: true,

    // Prefetch next 2 lessons only (not all)
    prefetchStrategy: 'next-two',

    // Network connection detection
    detectConnectionType: true,
    adaptToSlowConnection: true,
  },

  // =========================================================================
  // Monitoring & Analytics
  // =========================================================================
  monitoring: {
    // Track performance metrics
    trackMetrics: true,

    // Endpoint for sending metrics (optional backend)
    metricsEndpoint: '/api/audio-metrics',

    // Send error reports to backend
    errorReporting: true,

    // Enable detailed console logging in dev mode
    enablePerformanceLogging: process.env.NODE_ENV !== 'production',

    // Sample rate for metric collection (0.0 to 1.0)
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Metrics to track
    metrics: [
      'audio-load-cached',
      'audio-load-network',
      'audio-generation-fresh',
      'audio-generation-failed',
      'audio-decode',
      'audio-play',
      'cache-hit-rate',
      'fallback-usage',
    ],
  },

  // =========================================================================
  // Feature Flags
  // =========================================================================
  features: {
    // Enable GCP TTS (can be disabled for offline mode)
    enableGCPTTS: true,

    // Enable Web Speech fallback
    enableWebSpeechFallback: true,

    // Enable caching to IndexedDB
    enableCaching: true,

    // Enable service worker audio caching
    enableServiceWorkerCache: true,

    // Enable prefetching of next lessons
    enablePrefetch: true,

    // Enable metrics collection
    enableMetrics: true,
  },

  // =========================================================================
  // Text Normalization (for TTS)
  // =========================================================================
  textNormalization: {
    // Expand chord symbols for spoken text
    // e.g., "Em" → "E minor"
    expandChords: true,

    // Remove markdown formatting
    stripMarkdown: true,

    // Collapse multiple spaces
    collapseWhitespace: true,

    // Remove special characters (keep basic punctuation)
    sanitize: true,

    // Max text length per synthesis (safety limit)
    maxTextLength: 1000, // characters
  },
};

/**
 * Detect mobile device and apply mobile-specific config
 */
function applyMobileOptimizations() {
  if (!CONFIG.mobile.enableAdaptiveBitrate) return CONFIG;

  const isMobile = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
  const isSlowConnection =
    navigator.connection?.effectiveType === '3g' ||
    navigator.connection?.effectiveType === '4g';

  if (isMobile && isSlowConnection) {
    CONFIG.gcp.audioConfig.sampleRateHertz = CONFIG.mobile.sampleRateHertzMobile;
    CONFIG.cache.precacheAfterInstall =
      CONFIG.cache.precacheAfterInstall.slice(0, 3); // Only 3 files
  }

  return CONFIG;
}

/**
 * Get current configuration with mobile adaptations
 */
export function getConfig() {
  applyMobileOptimizations();
  return CONFIG;
}

export default CONFIG;
