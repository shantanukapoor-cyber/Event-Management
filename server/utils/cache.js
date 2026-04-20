/**
 * Simple in-memory TTL cache.
 * Used to cache Gemini explain responses and crowd state computations.
 */

/**
 * @typedef {Object} CacheEntry
 * @property {*} value      - The cached value.
 * @property {number} expiresAt - Timestamp (ms) when this entry expires.
 */

export class TTLCache {
  /**
   * @param {number} defaultTtlMs - Default time-to-live in milliseconds.
   * @param {number} maxSize      - Maximum number of entries.
   */
  constructor(defaultTtlMs = 60_000, maxSize = 200) {
    /** @type {Map<string, CacheEntry>} */
    this._store = new Map();
    this._defaultTtlMs = defaultTtlMs;
    this._maxSize = maxSize;
  }

  /**
   * Gets a cached value, or undefined if missing/expired.
   * @param {string} key
   * @returns {*|undefined}
   */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Sets a value in the cache.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlMs] - Override default TTL for this entry.
   */
  set(key, value, ttlMs) {
    // Evict oldest entries if at capacity
    if (this._store.size >= this._maxSize) {
      const oldestKey = this._store.keys().next().value;
      this._store.delete(oldestKey);
    }

    this._store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this._defaultTtlMs),
    });
  }

  /**
   * Checks if a key exists and is not expired.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /** Clears all entries. */
  clear() {
    this._store.clear();
  }

  /** Returns the current number of (possibly expired) entries. */
  get size() {
    return this._store.size;
  }
}
