// rateLimiter.js — in-memory, per-anonId. A stuck client must not be able to
// bill the owner: this is enforced before any model call is ever made.

const SWEEP_MULTIPLIER = 2;

/**
 * @param {object} [opts]
 * @param {number} [opts.windowMs=60000]
 * @param {number} [opts.max=10]
 * @param {() => number} [opts.now=Date.now] - injected clock for deterministic tests
 * @returns {{allow: (anonId: string) => boolean, stop: () => void}}
 */
export function createRateLimiter({ windowMs = 60_000, max = 10, now = Date.now } = {}) {
  const buckets = new Map(); // anonId -> {count, windowStart}

  function allow(anonId) {
    const t = now();
    const bucket = buckets.get(anonId);

    if (!bucket || t - bucket.windowStart > windowMs) {
      buckets.set(anonId, { count: 1, windowStart: t });
      return true;
    }

    if (bucket.count < max) {
      bucket.count += 1;
      return true;
    }

    return false;
  }

  function sweep() {
    const t = now();
    for (const [anonId, bucket] of buckets) {
      if (t - bucket.windowStart > windowMs * SWEEP_MULTIPLIER) {
        buckets.delete(anonId);
      }
    }
  }

  let timer = null;
  if (typeof setInterval === 'function') {
    timer = setInterval(sweep, windowMs);
    if (timer && typeof timer.unref === 'function') timer.unref();
  }

  function stop() {
    if (timer) clearInterval(timer);
  }

  return { allow, stop, _sweep: sweep, _buckets: buckets };
}
