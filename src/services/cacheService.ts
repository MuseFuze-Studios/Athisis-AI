export class ResponseCache {
  private max: number;
  private cache: Map<string, string>;

  constructor(max = 50) {
    this.max = max;
    this.cache = new Map();
  }

  async get(key: string): Promise<string | null> {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key)!;
    // Refresh key to mark as recently used
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.max) {
      const oldestKey = this.cache.keys().next().value as string;
      this.cache.delete(oldestKey);
    }
  }
}
