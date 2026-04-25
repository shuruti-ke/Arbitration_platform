'use strict';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const configuredLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const minimumLevel = LEVELS[configuredLevel] || LEVELS.info;

function redact(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
      .replace(/(password|token|secret|key)=([^&\s]+)/gi, '$1=[REDACTED]');
  }
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (/password|token|secret|key|authorization|cookie/i.test(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redact(item);
      }
    }
    return out;
  }
  return value;
}

function write(level, message, meta = {}) {
  if ((LEVELS[level] || LEVELS.info) < minimumLevel) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(meta)
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

module.exports = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};
