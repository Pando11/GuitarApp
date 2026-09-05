/**
 * Audio Cache Layer
 * Manages IndexedDB storage for audio files with intelligent lifecycle management
 *
 * Features:
 * - Persistent storage for lesson audio
 * - TTL-based expiration
 * - Storage quota management
 * - Hash verification for integrity
 * - Async cleanup of expired entries
 */

import CONFIG from './audio-config.js';

export class AudioCache {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize IndexedDB connection
   * Creates object stores if needed, handles version upgrades
   */
  async init() {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const dbName = CONFIG.cache.db.name;
      const dbVersion = CONFIG.cache.db.version;

      const request = indexedDB.open(dbName, dbVersion);

      request.onerror = () => {
        const error = request.error;
        console.error(`[AudioCache] Failed to open IndexedDB: ${error.message}`);
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log(`[AudioCache] Initialized: ${dbName} v${dbVersion}`);
        resolve();
      };

      // Handle database version upgrade
      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create lessons store if not exists
        if (!db.objectStoreNames.contains('lessons')) {
          const store = db.createObjectStore('lessons', { keyPath: 'id' });
          store.createIndex('lessonNum', 'lessonNum', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('source', 'source', { unique: false });
          console.log('[AudioCache] Created lessons object store');
        }

        // Create metadata store if not exists
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
          console.log('[AudioCache] Created metadata object store');
        }
      };
    });
  }

  /**
   * Store audio file in IndexedDB
   * Handles size checks and hash computation
   * Returns: { success, size, timestamp, hash }
   */
  async setAudio(id, audioBuffer, metadata = {}) {
    if (!this.initialized) await this.init();

    const size = audioBuffer.byteLength;

    // Validate size
    if (size > CONFIG.cache.limits.singleFile) {
      throw new Error(
        `Audio file ${id} exceeds size limit (${this._formatBytes(size)} > ${this._formatBytes(CONFIG.cache.limits.singleFile)})`
      );
    }

    try {
      const hash = await this._computeHash(audioBuffer);

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['lessons'], 'readwrite');
        const store = transaction.objectStore('lessons');

        const entry = {
          id,
          data: audioBuffer,
          size,
          timestamp: Date.now(),
          hash,
          ...metadata,
        };

        const request = store.put(entry);

        request.onerror = () => {
          console.error(`[AudioCache] Failed to store ${id}:`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log(`[AudioCache] Stored ${id} (${this._formatBytes(size)})`);
          resolve({ success: true, size, timestamp: entry.timestamp, hash });
        };
      });
    } catch (error) {
      console.error(`[AudioCache] Error storing ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve audio from cache
   * Checks TTL and returns null if expired
   * Returns: ArrayBuffer or null
   */
  async getAudio(id) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.get(id);

      request.onerror = () => {
        console.error(`[AudioCache] Failed to retrieve ${id}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const entry = request.result;

        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired based on TTL
        const age = Date.now() - entry.timestamp;
        const ttl = CONFIG.cache.ttl.lessons;

        if (age > ttl) {
          console.log(`[AudioCache] ${id} expired (age: ${this._formatMs(age)})`);
          // Async cleanup, don't block
          this.removeAudio(id).catch((err) => console.warn('Cleanup error:', err));
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
    });
  }

  /**
   * Check if audio exists and is valid
   * Returns: boolean
   */
  async hasAudio(id) {
    const audio = await this.getAudio(id);
    return audio !== null;
  }

  /**
   * Get metadata about cached audio
   * Returns: { id, size, timestamp, hash, source, ... } or null
   */
  async getAudioMetadata(id) {
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

        // Exclude the actual audio data from metadata response
        const { data, ...metadata } = entry;
        resolve(metadata);
      };
    });
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
      request.onsuccess = () => {
        console.log(`[AudioCache] Removed ${id}`);
        resolve();
      };
    });
  }

  /**
   * Clear all audio for a lesson
   */
  async clearLesson(lessonNum) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readwrite');
      const store = transaction.objectStore('lessons');
      const index = store.index('lessonNum');
      const range = IDBKeyRange.only(lessonNum);
      const request = index.openCursor(range);

      let count = 0;
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          count++;
          cursor.continue();
        } else {
          console.log(`[AudioCache] Cleared ${count} files for lesson ${lessonNum}`);
          resolve(count);
        }
      };
    });
  }

  /**
   * Clear entire cache (nuclear option)
   */
  async clearAll() {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons', 'metadata'], 'readwrite');

      const lessonsRequest = transaction.objectStore('lessons').clear();
      const metadataRequest = transaction.objectStore('metadata').clear();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        console.log('[AudioCache] Cleared all cached audio');
        resolve();
      };
    });
  }

  /**
   * Remove expired entries (TTL cleanup)
   * Called periodically by service (e.g., daily)
   */
  async pruneExpired() {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['lessons'], 'readwrite');
      const store = transaction.objectStore('lessons');
      const index = store.index('timestamp');

      // Find entries older than TTL
      const cutoff = Date.now() - CONFIG.cache.ttl.lessons;
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      let count = 0;
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          count++;
          cursor.continue();
        } else {
          if (count > 0) {
            console.log(`[AudioCache] Pruned ${count} expired entries`);
          }
          resolve(count);
        }
      };
    });
  }

  /**
   * Get cache statistics
   * Returns: { totalEntries, totalSize, lessonCounts, utilization }
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
        const totalSize = entries.reduce((sum, e) => sum + (e.size || 0), 0);
        const lessonCounts = {};

        entries.forEach((e) => {
          const lessonNum = e.lessonNum || 'unknown';
          lessonCounts[lessonNum] = (lessonCounts[lessonNum] || 0) + 1;
        });

        const utilization = (
          (totalSize / CONFIG.cache.limits.lessons) *
          100
        ).toFixed(1);

        resolve({
          totalEntries: entries.length,
          totalSize,
          totalSizeFormatted: this._formatBytes(totalSize),
          lessonCounts,
          utilization: `${utilization}%`,
          quotaLimit: this._formatBytes(CONFIG.cache.limits.lessons),
        });
      };
    });
  }

  /**
   * Verify audio integrity (hash check)
   * Returns: { valid, expectedHash, computedHash }
   */
  async verifyAudio(id, expectedHash) {
    const audio = await this.getAudio(id);
    if (!audio) {
      return { valid: false, error: 'Audio not found' };
    }

    const computedHash = await this._computeHash(audio);
    const valid = computedHash === expectedHash;

    return { valid, expectedHash, computedHash };
  }

  /**
   * Compute SHA-256 hash of audio buffer
   * Used for integrity verification
   */
  async _computeHash(buffer) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('[AudioCache] Hash computation failed:', error);
      return null;
    }
  }

  /**
   * Format bytes to human-readable size
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format milliseconds to human-readable duration
   */
  _formatMs(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Export singleton instance
export default new AudioCache();
