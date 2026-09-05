// logger.js — the only place log lines get written. Redacts the API key and
// never logs a full envelope (which carries the learner profile). Callers
// pass small, already-safe summaries; this module also defensively strips
// known-sensitive keys if a caller accidentally passes an object that has
// them, as a second line of defense.

const SENSITIVE_KEYS = new Set(['apiKey', 'api_key', 'ANTHROPIC_API_KEY', 'authorization', 'learnerProfile']);

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(k)) {
        out[k] = '[redacted]';
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

function write(level, message, meta) {
  const safeMeta = meta === undefined ? undefined : redact(meta);
  const line = { level, message, ...(safeMeta !== undefined ? { meta: safeMeta } : {}) };
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(line));
}

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

export default logger;
