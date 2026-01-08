/**
 * Cache em memória com TTL simples (process-local)
 * Convertido do Python para Node.js
 */

class TTLCache {
  constructor() {
    this._data = new Map();
    this._lock = false; // Simplificado - em produção usar mutex real
  }

  _acquireLock() {
    while (this._lock) {
      // Spin lock simples (em produção usar mutex real)
      continue;
    }
    this._lock = true;
  }

  _releaseLock() {
    this._lock = false;
  }

  get(key) {
    const now = Date.now() / 1000; // Segundos desde epoch
    this._acquireLock();
    try {
      const entry = this._data.get(key);
      if (!entry) {
        return null;
      }
      if (entry.expiresAt <= now) {
        this._data.delete(key);
        return null;
      }
      return entry.value;
    } finally {
      this._releaseLock();
    }
  }

  set(key, value, ttlSeconds) {
    const expiresAt = Date.now() / 1000 + ttlSeconds;
    this._acquireLock();
    try {
      this._data.set(key, { value, expiresAt });
    } finally {
      this._releaseLock();
    }
  }

  getOrSet(key, ttlSeconds, factory) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    const value = factory();
    this.set(key, value, ttlSeconds);
    return value;
  }

  clear() {
    this._acquireLock();
    try {
      this._data.clear();
    } finally {
      this._releaseLock();
    }
  }
}

// Singleton global
const globalCache = new TTLCache();

export default globalCache;
export { TTLCache };
