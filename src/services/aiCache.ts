/**
 * AI Response Cache — LRU in-memory cache with TTL for AI responses.
 * Prevents duplicate API calls for identical requests within a session.
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 100;

class AICache {
  private cache = new Map<string, CacheEntry>();

  /** Generate a deterministic key from request params */
  key(parts: Record<string, unknown>): string {
    return JSON.stringify(parts);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (LRU refresh)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    // Evict oldest if at capacity
    if (this.cache.size >= MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const aiCache = new AICache();

/**
 * In-flight request deduplication.
 * If an identical request is already in progress, returns the same promise.
 */
const inflight = new Map<string, Promise<unknown>>();

export async function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
