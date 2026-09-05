# Audio TTS Backend Proxy
## Secure API Integration for Production

---

## OVERVIEW

For production deployments, **never expose GCP service account credentials to the frontend**. Instead, use a backend proxy that handles authentication securely.

This document specifies a lightweight backend service for audio synthesis that:
- Authenticates with GCP server-side
- Handles rate limiting and quota management
- Validates requests and logs usage
- Provides caching to reduce API costs
- Falls back gracefully

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  GuitarApp Mobile/Web (Frontend)                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS POST /api/audio-tts
                           │
┌─────────────────────────────────────────────────────────────┐
│  Backend Proxy (Node.js / Cloud Function)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Validate request (text, voice)                    │   │
│  │ 2. Check local cache (Redis)                         │   │
│  │ 3. Check rate limit (user/IP)                        │   │
│  │ 4. Call GCP TTS API (with credentials)               │   │
│  │ 5. Cache result                                      │   │
│  │ 6. Return audio                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Service Account Credentials
                           │ (server-side only)
                           │
┌─────────────────────────────────────────────────────────────┐
│  Google Cloud Text-to-Speech API                            │
└─────────────────────────────────────────────────────────────┘
```

---

## BACKEND IMPLEMENTATION

### Option 1: Node.js Express Service

**File:** `backend/routes/audio-tts.js`

```javascript
/**
 * Audio TTS Backend Proxy
 * Secure server-side integration with Google Cloud Text-to-Speech
 */

import express from 'express';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import redis from 'redis';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Initialize clients
const ttsClient = new TextToSpeechClient();
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const CONFIG = {
  ttl: {
    cache: 30 * 24 * 60 * 60, // 30 days in Redis
    rateLimitWindow: 60 * 60, // 1 hour
  },
  limits: {
    charPerHour: 100000, // 100k characters per hour
    charPerDay: 1000000, // 1M characters per day
    reqPerMinute: 60, // 60 requests per minute
  },
  maxTextLength: 1000,
};

/**
 * POST /api/audio-tts/synthesize
 * Synthesize text to speech
 *
 * Request body:
 * {
 *   "text": "Play an E chord",
 *   "voice": "en-US-Neural2-C",    // optional, defaults to Neural2-C
 *   "sampleRateHertz": 24000       // optional, defaults to 24000
 * }
 *
 * Response:
 * {
 *   "audioContent": "base64-encoded-wav",
 *   "cached": true|false,
 *   "charCount": 42,
 *   "duration": 2.5
 * }
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice = 'en-US-Neural2-C', sampleRateHertz = 24000 } = req.body;
    const userId = req.user?.id || req.ip; // Track by user or IP
    const requestId = uuidv4();

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string' });
    }

    if (text.length > CONFIG.maxTextLength) {
      return res.status(400).json({
        error: `text exceeds max length (${CONFIG.maxTextLength})`,
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitCheck.retryAfter,
      });
    }

    // Check cache first
    const cacheKey = `tts:${Buffer.from(text).toString('hex')}:${voice}:${sampleRateHertz}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      console.log(`[Audio TTS] Cache hit: ${requestId} (${text.length} chars)`);
      return res.json({
        ...data,
        cached: true,
        requestId,
      });
    }

    // Call Google Cloud TTS
    const synthesizeRequest = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: voice,
      },
      audioConfig: {
        audioEncoding: 'LINEAR16', // WAV
        sampleRateHertz,
      },
    };

    const startTime = Date.now();
    const [response] = await ttsClient.synthesizeSpeech(synthesizeRequest);
    const duration = (Date.now() - startTime) / 1000;

    // Encode audio
    const audioContent = response.audioContent.toString('base64');

    // Cache result
    const cacheData = {
      audioContent,
      charCount: text.length,
      duration,
    };
    await redisClient.setex(cacheKey, CONFIG.ttl.cache, JSON.stringify(cacheData));

    // Log synthesis
    console.log(`[Audio TTS] Synthesized: ${requestId} (${text.length} chars, ${duration.toFixed(2)}s)`);

    // Update rate limit usage
    await recordUsage(userId, text.length);

    res.json({
      ...cacheData,
      cached: false,
      requestId,
    });
  } catch (error) {
    console.error('[Audio TTS] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.id,
    });
  }
});

/**
 * Check rate limits for user
 */
async function checkRateLimit(userId) {
  const now = Date.now();
  const windowStart = now - CONFIG.ttl.rateLimitWindow * 1000;

  const key = `ratelimit:${userId}`;
  const data = await redisClient.get(key);

  if (!data) {
    return { allowed: true };
  }

  const { count, firstRequest } = JSON.parse(data);
  const windowAge = (now - firstRequest) / 1000;

  if (windowAge > CONFIG.ttl.rateLimitWindow) {
    // Window expired
    return { allowed: true };
  }

  if (count >= CONFIG.limits.reqPerMinute) {
    const remaining = CONFIG.ttl.rateLimitWindow - windowAge;
    return {
      allowed: false,
      retryAfter: Math.ceil(remaining),
    };
  }

  return { allowed: true };
}

/**
 * Record usage for rate limiting
 */
async function recordUsage(userId, charCount) {
  const key = `ratelimit:${userId}`;
  const data = await redisClient.get(key);

  if (!data) {
    await redisClient.setex(key, CONFIG.ttl.rateLimitWindow, JSON.stringify({
      count: 1,
      charCount,
      firstRequest: Date.now(),
    }));
  } else {
    const parsed = JSON.parse(data);
    parsed.count += 1;
    parsed.charCount += charCount;
    await redisClient.setex(key, CONFIG.ttl.rateLimitWindow, JSON.stringify(parsed));
  }
}

export default router;
```

### Option 2: Google Cloud Function (Serverless)

**File:** `backend/functions/audio-tts/index.js`

```javascript
/**
 * Google Cloud Function: Audio TTS Proxy
 * Deployed as: https://PROJECT.cloudfunctions.net/audio-tts
 */

const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const functions = require('@google-cloud/functions-framework');

const ttsClient = new TextToSpeechClient();

functions.http('audioTTS', async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { text, voice = 'en-US-Neural2-C', sampleRateHertz = 24000 } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: voice,
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        sampleRateHertz,
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);

    res.set('Content-Type', 'application/json');
    res.json({
      audioContent: response.audioContent.toString('base64'),
      charCount: text.length,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Option 3: Express Middleware (Simple)

**File:** `backend/middleware/audio-proxy.js`

```javascript
/**
 * Simple Express middleware for audio TTS proxying
 * Usage: app.use('/api/audio', audioProxy);
 */

import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/tts', async (req, res) => {
  const { text, voice } = req.body;

  // Get GCP credentials from environment
  const apiKey = process.env.GCP_API_KEY; // Or use service account flow
  if (!apiKey) {
    return res.status(500).json({ error: 'GCP credentials not configured' });
  }

  try {
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: voice || 'en-US-Neural2-C',
        },
        audioConfig: {
          audioEncoding: 'LINEAR16',
          sampleRateHertz: 24000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GCP API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS synthesis failed' });
  }
});

export default router;
```

---

## FRONTEND USAGE

### Update audio-generation-service.js

```javascript
/**
 * Updated _callGCPAPI to use backend proxy
 */
async _callGCPAPI(text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.gcp.requestTimeout);

  try {
    // Use backend proxy endpoint instead of direct GCP API
    const backendUrl = CONFIG.gcp.apiEndpoint || '/api/audio-tts/synthesize';

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: pass auth token if user is logged in
        // 'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        text,
        voice: CONFIG.gcp.voice.name,
        sampleRateHertz: CONFIG.gcp.audioConfig.sampleRateHertz,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
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
```

---

## ENVIRONMENT CONFIGURATION

### Development (.env.local)

```bash
# Use mock TTS in development (no GCP costs)
VITE_AUDIO_BACKEND=http://localhost:3000/api/audio-tts
NODE_ENV=development
DEBUG=guitarapp:audio*
```

### Production (.env.production)

```bash
# Backend proxy (could be any service)
VITE_AUDIO_BACKEND=https://api.guitarapp.example.com/v1/audio-tts

# GCP Configuration (server-side only)
GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/key.json
GCP_PROJECT_ID=guitarapp-production
GCP_TTS_BUCKET=gs://guitarapp-audio-cache
```

### Docker (backend)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy application
COPY backend ./backend

# GCP credentials (mounted at runtime)
ENV GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcp-key.json

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

---

## SECURITY BEST PRACTICES

### 1. Authentication

```javascript
// Require user login for TTS (optional rate limiting)
router.post('/synthesize', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  // ...
});
```

### 2. Rate Limiting

```javascript
// Implement per-user limits
const limits = {
  freeUser: 10000, // 10k chars/month
  premiumUser: 1000000, // 1M chars/month
};

const usage = await db.getUserAudioUsage(userId);
if (usage > limits[user.tier]) {
  return res.status(429).json({ error: 'Usage limit exceeded' });
}
```

### 3. Input Validation

```javascript
// Validate text content
function validateTextForTTS(text) {
  // Block copyright text, harmful content, etc.
  if (isCoprightedMaterial(text)) throw new Error('Copyrighted material');
  if (isMaliciousContent(text)) throw new Error('Invalid content');
  if (text.length > 1000) throw new Error('Text too long');
  return true;
}
```

### 4. Logging & Monitoring

```javascript
// Log all TTS calls for audit
logger.info('TTS Synthesis', {
  userId,
  textLength: text.length,
  voice,
  duration,
  cost: (text.length / 1000000) * 15,
  timestamp: new Date().toISOString(),
});
```

---

## COST OPTIMIZATION

### Caching Strategy

```
Request for same text = cached response (no API call)
Cache TTL: 30 days
Cache hits: ~60-70% (students replay same lessons often)
Savings: 60% reduction in API costs
```

### Batch Processing

```javascript
// Pre-generate all lesson audio during deployment
// Avoids per-user synthesis costs
async function generateAllLessonAudio() {
  for (let lesson = 1; lesson <= 25; lesson++) {
    const segments = extractCoachingText(lesson);
    for (const segment of segments) {
      await synthesizeAndCache(segment.text, segment.id);
    }
  }
}
```

---

## DEPLOYMENT CHECKLIST

- [ ] Service account created in GCP with TTS API access
- [ ] Credentials securely stored in environment variables
- [ ] Backend proxy tested with sample requests
- [ ] CORS configured correctly for frontend origin
- [ ] Rate limiting implemented and tested
- [ ] Redis cache initialized and connected
- [ ] Logging configured for audit trail
- [ ] Cost monitoring enabled (set billing alerts)
- [ ] Health check endpoint implemented
- [ ] Graceful degradation tested (API down scenario)

---

## MONITORING & ALERTS

### CloudWatch/Stackdriver Metrics

```javascript
// Track these metrics
- API calls per second
- Average latency (p50, p95, p99)
- Cache hit rate
- Error rate
- Cost per day
- Usage by user tier
```

### Alert Thresholds

- Latency P95 > 2 seconds
- Error rate > 1%
- API costs exceed budget
- Cache hit rate < 50%

---

**Version:** 1.0  
**Last Updated:** 2026-09-04  
**Owner:** Audio/TTS Specialist
