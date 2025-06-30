import { logger } from '../utils/logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired and removed: ${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return item.data;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, item);
    logger.debug(`Cache set: ${key} (TTL: ${item.ttl}ms)`);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean expired items
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cache cleanup: removed ${cleaned} expired items`);
    }
  }

  /**
   * Get or set cached value with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await factory();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error(`Error in cache factory for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
    
    logger.info(`Cache cleanup started with ${intervalMs}ms interval`);
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Start automatic cleanup every minute
cacheService.startCleanup();

export default cacheService;