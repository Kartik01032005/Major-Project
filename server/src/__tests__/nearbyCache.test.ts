import {
  NearbyMemoryCache,
  generateNearbyCacheKey,
  roundCoordinate,
  nearbyFacilityCache,
} from "../services/nearbyCache.js";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";

describe("Nearby Facilities In-Memory Cache Unit Tests", () => {
  let cache: NearbyMemoryCache;

  beforeEach(() => {
    cache = new NearbyMemoryCache({ ttlMs: 1000, maxEntries: 3, precision: 4 });
  });

  afterEach(() => {
    cache.clear();
  });

  describe("Cache Key Generation and Normalization", () => {
    it("generates normalized cache key with expected format", () => {
      const key = generateNearbyCacheKey(12.9716, 77.5946, 5);
      expect(key).toBe("nearby:12.9716:77.5946:5");
    });

    it("normalizes small GPS jitter to the same cache key", () => {
      const key1 = generateNearbyCacheKey(12.97160002, 77.59460004, 5);
      const key2 = generateNearbyCacheKey(12.97160008, 77.59460001, 5);
      expect(key1).toBe(key2);
      expect(key1).toBe("nearby:12.9716:77.5946:5");
    });

    it("creates different cache keys for different locations", () => {
      const keyBangalore = generateNearbyCacheKey(12.9716, 77.5946, 5);
      const keyHubli = generateNearbyCacheKey(15.3647, 75.124, 5);
      expect(keyBangalore).not.toBe(keyHubli);
    });

    it("creates different cache keys for different radius values", () => {
      const key5km = generateNearbyCacheKey(12.9716, 77.5946, 5);
      const key10km = generateNearbyCacheKey(12.9716, 77.5946, 10);
      expect(key5km).not.toBe(key10km);
    });

    it("rounds coordinates accurately", () => {
      expect(roundCoordinate(12.971682, 4)).toBe(12.9717);
      expect(roundCoordinate(77.594611, 4)).toBe(77.5946);
    });
  });

  describe("Cache MISS, HIT, and Matching Content", () => {
    const sampleFacilities = [
      {
        id: "osm-n-1001",
        name: "City Care Hospital",
        address: "MG Road, Bengaluru",
        district: "Bengaluru Urban",
        state: "Karnataka",
        phone: "+91 80 1234 5678",
        open: true,
        position: { lat: 12.9716, lng: 77.5946 },
        distanceKm: 1.2,
        distance: "1.2 km",
        type: "hospital" as const,
        source: "osm" as const,
      },
    ];

    it("returns null on first request (cache MISS)", () => {
      const key = "nearby:12.9716:77.5946:5";
      expect(cache.get(key)).toBeNull();
      expect(cache.has(key)).toBe(false);
    });

    it("stores and returns data on second identical request (cache HIT)", () => {
      const key = "nearby:12.9716:77.5946:5";
      expect(cache.get(key)).toBeNull();

      const stored = cache.set(key, sampleFacilities);
      expect(stored).toBe(true);

      const hit = cache.get(key);
      expect(hit).not.toBeNull();
      expect(hit).toEqual(sampleFacilities);
      expect(cache.has(key)).toBe(true);
    });

    it("cached response exactly matches the original result", () => {
      const key = "nearby:12.9716:77.5946:5";
      cache.set(key, sampleFacilities);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(sampleFacilities);
      expect(retrieved?.[0].name).toBe("City Care Hospital");
      expect(retrieved?.[0].id).toBe("osm-n-1001");
    });
  });

  describe("Cache Invalidation & Expiration", () => {
    it("expires entries after the TTL duration", async () => {
      const shortTtlCache = new NearbyMemoryCache({ ttlMs: 50, maxEntries: 10 });
      const key = "nearby:12.9716:77.5946:5";
      const sample = [{ id: "h1", name: "Hospital One" }];

      shortTtlCache.set(key, sample);
      expect(shortTtlCache.get(key)).toEqual(sample);

      // Wait past TTL
      await new Promise((resolve) => setTimeout(resolve, 80));

      expect(shortTtlCache.get(key)).toBeNull();
      expect(shortTtlCache.has(key)).toBe(false);
    });

    it("removes expired entries on cleanupExpired()", async () => {
      const shortTtlCache = new NearbyMemoryCache({ ttlMs: 40, maxEntries: 10 });
      shortTtlCache.set("key-1", [{ id: "1" }]);
      shortTtlCache.set("key-2", [{ id: "2" }]);

      expect(shortTtlCache.size()).toBe(2);

      await new Promise((resolve) => setTimeout(resolve, 60));

      const evicted = shortTtlCache.cleanupExpired();
      expect(evicted).toBe(2);
      expect(shortTtlCache.size()).toBe(0);
    });

    it("does NOT cache failed or empty facility results", () => {
      const keyEmpty = "nearby:0.0:0.0:5";
      const storedEmpty = cache.set(keyEmpty, []);
      expect(storedEmpty).toBe(false);
      expect(cache.get(keyEmpty)).toBeNull();

      const keyNull = "nearby:0.0:0.0:10";
      const storedNull = cache.set(keyNull, null as any);
      expect(storedNull).toBe(false);
      expect(cache.get(keyNull)).toBeNull();
    });
  });

  describe("Memory Safety & LRU Eviction", () => {
    it("respects maximum cache size by evicting oldest/least-recently-used entry", () => {
      const limitedCache = new NearbyMemoryCache({ ttlMs: 10000, maxEntries: 3 });

      limitedCache.set("loc-1", [{ id: "h1" }]);
      limitedCache.set("loc-2", [{ id: "h2" }]);
      limitedCache.set("loc-3", [{ id: "h3" }]);

      expect(limitedCache.size()).toBe(3);

      // Access loc-1 and loc-2 to make loc-3 the oldest
      limitedCache.get("loc-1");
      limitedCache.get("loc-2");

      // Adding 4th item should evict loc-3
      limitedCache.set("loc-4", [{ id: "h4" }]);

      expect(limitedCache.size()).toBe(3);
      expect(limitedCache.has("loc-1")).toBe(true);
      expect(limitedCache.has("loc-2")).toBe(true);
      expect(limitedCache.has("loc-4")).toBe(true);
      expect(limitedCache.has("loc-3")).toBe(false);
    });

    it("purges expired entries before evicting active ones when capacity is reached", async () => {
      const mixedCache = new NearbyMemoryCache({ ttlMs: 10000, maxEntries: 2 });

      // Add one entry with tiny TTL
      mixedCache.set("expired-soon", [{ id: "old" }], 30);
      mixedCache.set("active-item", [{ id: "active" }]);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Adding another entry should clean up expired-soon, preserving active-item
      mixedCache.set("new-item", [{ id: "new" }]);

      expect(mixedCache.size()).toBe(2);
      expect(mixedCache.has("expired-soon")).toBe(false);
      expect(mixedCache.has("active-item")).toBe(true);
      expect(mixedCache.has("new-item")).toBe(true);
    });
  });

  describe("Concurrent Request Deduplication (Single-Flight Coalescing)", () => {
    it("deduplicates concurrent requests so the fetcher is only called once", async () => {
      let fetchCallCount = 0;
      const key = "nearby:12.9716:77.5946:5";

      const mockFetcher = async () => {
        fetchCallCount++;
        await new Promise((res) => setTimeout(res, 50));
        return [{ id: "hospital-async", name: "Async Care" }];
      };

      // Launch 4 concurrent requests for the same key
      const [res1, res2, res3, res4] = await Promise.all([
        cache.getOrFetch(key, mockFetcher),
        cache.getOrFetch(key, mockFetcher),
        cache.getOrFetch(key, mockFetcher),
        cache.getOrFetch(key, mockFetcher),
      ]);

      // All 4 should receive the exact same data
      expect(res1.data).toEqual([{ id: "hospital-async", name: "Async Care" }]);
      expect(res2.data).toEqual(res1.data);
      expect(res3.data).toEqual(res1.data);
      expect(res4.data).toEqual(res1.data);

      // Only ONE upstream fetch must have been dispatched
      expect(fetchCallCount).toBe(1);

      // Subsequent call is a direct cache hit
      const res5 = await cache.getOrFetch(key, mockFetcher);
      expect(res5.isHit).toBe(true);
      expect(fetchCallCount).toBe(1);
    });

    it("does not cache when upstream fetcher throws an error", async () => {
      const key = "nearby:error-test:5";
      const failingFetcher = async () => {
        throw new Error("Overpass timeout error");
      };

      await expect(cache.getOrFetch(key, failingFetcher)).rejects.toThrow("Overpass timeout error");
      expect(cache.get(key)).toBeNull();
      expect(cache.has(key)).toBe(false);
    });
  });
});

describe("Nearby Facilities API Integration & Header Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bloodlink");
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("returns 400 when lat or lng query parameters are missing", async () => {
    const res = await request(app).get("/api/nearby");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("handles nearby facility request with X-Cache response header", async () => {
    // Clear global cache before test
    nearbyFacilityCache.clear();

    // Use Bengaluru coordinates
    const res1 = await request(app)
      .get("/api/nearby")
      .query({ lat: 12.9716, lng: 77.5946, radius: 5 });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.headers["x-cache"]).toBeDefined();
    // First request should be MISS
    expect(res1.headers["x-cache"]).toBe("MISS");

    // Second request with identical coordinates and radius should be HIT
    const res2 = await request(app)
      .get("/api/nearby")
      .query({ lat: 12.9716, lng: 77.5946, radius: 5 });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.headers["x-cache"]).toBe("HIT");

    // Clean up
    nearbyFacilityCache.clear();
  });
});
