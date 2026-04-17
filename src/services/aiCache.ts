/**
 * AI Response Cache — LRU in-memory cache with TTL + FNV-1a hash for long keys.
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 100;

/** Fast non-cryptographic hash for compact cache keys. */
function fnv32(str: string): string {
  let hash = 0x811c9dc5;
  const len = Math.min(str.length, 10000);
  for (let i = 0; i < len; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

class AICache {
  private cache = new Map<string, CacheEntry>();

  /** Generate a deterministic key. Long payloads are hashed via FNV-1a. */
  key(parts: Record<string, unknown>): string {
    const raw = JSON.stringify(parts);
    if (raw.length > 500) return fnv32(raw);
    return raw;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    if (this.cache.size >= MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  clear(): void { this.cache.clear(); }
}

export const aiCache = new AICache();

const inflight = new Map<string, Promise<unknown>>();

export async function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
