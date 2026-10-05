/**
 * In-Memory Caching Service for Nearby Hospitals & Blood Banks
 *
 * Caches public OpenStreetMap / Overpass query results with:
 * - Normalized coordinate and radius cache keys
 * - Configurable TTL (default 5 minutes / 300000ms)
 * - Memory safety with LRU eviction and maximum entry caps
 * - Request deduplication (single-flight / in-flight request coalescing)
 * - Zero external dependencies (no Redis)
 */

export interface NearbyCacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
  lastAccessedSeq: number;
  accessCount: number;
}

export interface NearbyCacheStats {
  size: number;
  maxEntries: number;
  ttlMs: number;
  hits: number;
  misses: number;
  inFlightRequests: number;
}

/**
 * Normalizes a coordinate to a consistent precision to avoid GPS drift missing cache.
 * E.g. with precision 4: 12.97162934 -> 12.9716 (~11m resolution).
 */
export function roundCoordinate(val: number, precision = 4): number {
  return parseFloat(val.toFixed(precision));
}

/**
 * Generates a normalized cache key for nearby search parameters.
 * Format: nearby:<rounded-latitude>:<rounded-longitude>:<radius>
 * Example: nearby:12.9716:77.5946:5
 */
export function generateNearbyCacheKey(
  lat: number,
  lng: number,
  radiusKm: number,
  precision = 4
): string {
  const normLat = roundCoordinate(lat, precision);
  const normLng = roundCoordinate(lng, precision);
  const normRadius = Math.round(radiusKm * 10) / 10;
  return `nearby:${normLat}:${normLng}:${normRadius}`;
}

export class NearbyMemoryCache<T = any> {
  private store = new Map<string, NearbyCacheEntry<T>>();
  private inFlight = new Map<string, Promise<T>>();
  private ttlMs: number;
  private maxEntries: number;
  private precision: number;

  private accessSeq = 0;
  private hits = 0;
  private misses = 0;

  constructor(options?: { ttlMs?: number; maxEntries?: number; precision?: number }) {
    this.ttlMs =
      options?.ttlMs ??
      (process.env.NEARBY_CACHE_TTL_MS
        ? parseInt(process.env.NEARBY_CACHE_TTL_MS, 10)
        : 300000); // 5 minutes default

    this.maxEntries =
      options?.maxEntries ??
      (process.env.MAX_NEARBY_CACHE_ENTRIES
        ? parseInt(process.env.MAX_NEARBY_CACHE_ENTRIES, 10)
        : 100); // 100 entries default

    this.precision =
      options?.precision ??
      (process.env.NEARBY_CACHE_PRECISION
        ? parseInt(process.env.NEARBY_CACHE_PRECISION, 10)
        : 4);
  }

  /**
   * Retrieves an item from the cache if present and unexpired.
   */
  public get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    entry.lastAccessedAt = Date.now();
    entry.lastAccessedSeq = ++this.accessSeq;
    entry.accessCount++;
    this.hits++;
    return entry.data;
  }

  /**
   * Stores a value in the cache with the configured TTL and LRU eviction.
   * Empty arrays or invalid items will not be cached to avoid poisoning the cache with temporary outages.
   */
  public set(key: string, data: T, customTtlMs?: number): boolean {
    if (!data) return false;
    if (Array.isArray(data) && data.length === 0) return false;

    // Enforce capacity: first purge expired entries
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.cleanupExpired();

      // If still at or over capacity, evict the least recently accessed (LRU) entry
      if (this.store.size >= this.maxEntries) {
        let oldestKey: string | null = null;
        let oldestSeq = Infinity;

        for (const [k, v] of this.store.entries()) {
          if (v.lastAccessedSeq < oldestSeq) {
            oldestSeq = v.lastAccessedSeq;
            oldestKey = k;
          }
        }

        if (oldestKey) {
          this.store.delete(oldestKey);
        }
      }
    }

    const now = Date.now();
    const ttl = customTtlMs ?? this.ttlMs;

    this.store.set(key, {
      data,
      createdAt: now,
      expiresAt: now + ttl,
      lastAccessedAt: now,
      lastAccessedSeq: ++this.accessSeq,
      accessCount: 1,
    });

    return true;
  }

  /**
   * Checks whether a valid, non-expired key exists in cache.
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Deletes a specific cache key.
   */
  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears all stored entries and in-flight promises.
   */
  public clear(): void {
    this.store.clear();
    this.inFlight.clear();
    this.accessSeq = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Returns the count of valid unexpired entries.
   */
  public size(): number {
    this.cleanupExpired();
    return this.store.size;
  }

  /**
   * Removes all expired entries from memory.
   * Returns the number of evicted items.
   */
  public cleanupExpired(): number {
    const now = Date.now();
    let evicted = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
        evicted++;
      }
    }
    return evicted;
  }

  /**
   * Retrieves an item from cache, or executes the fetcher function.
   * Deduplicates concurrent in-flight requests for the same key so only ONE
   * upstream request executes when multiple clients request at the same time.
   */
  public async getOrFetch(
    key: string,
    fetchFn: () => Promise<T>,
    customTtlMs?: number
  ): Promise<{ data: T; isHit: boolean }> {
    // 1. Cache hit check
    const cachedData = this.get(key);
    if (cachedData !== null) {
      return { data: cachedData, isHit: true };
    }

    // 2. Check if a request for this exact key is already in flight
    const pending = this.inFlight.get(key);
    if (pending) {
      const data = await pending;
      return { data, isHit: true };
    }

    // 3. Initiate single-flight fetch and register in flight
    const fetchPromise = (async () => {
      try {
        const result = await fetchFn();
        if (result && (!Array.isArray(result) || result.length > 0)) {
          this.set(key, result, customTtlMs);
        }
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);

    try {
      const result = await fetchPromise;
      return { data: result, isHit: false };
    } catch (err) {
      // Failed upstream requests are never cached
      throw err;
    }
  }

  /**
   * Returns cache runtime metrics for monitoring and diagnostics.
   */
  public getStats(): NearbyCacheStats {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      hits: this.hits,
      misses: this.misses,
      inFlightRequests: this.inFlight.size,
    };
  }

  public getTTL(): number {
    return this.ttlMs;
  }

  public getMaxEntries(): number {
    return this.maxEntries;
  }

  public getPrecision(): number {
    return this.precision;
  }
}

// Global singleton instance for the Nearby Hospitals / Blood Banks search
export const nearbyFacilityCache = new NearbyMemoryCache();
