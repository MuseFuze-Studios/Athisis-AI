import initSqlJs, { Database } from 'sql.js';
import LRU from 'lru-cache';

export class ResponseCache {
  private dbPromise: Promise<Database>;
  private lru: LRU<string, string>;

  constructor(size = 50) {
    this.dbPromise = initSqlJs().then(SQL => {
      const db = new SQL.Database();
      db.run('CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT)');
      return db;
    });
    this.lru = new LRU({ max: size });
  }

  async get(key: string): Promise<string | null> {
    const mem = this.lru.get(key);
    if (mem) return mem;
    const db = await this.dbPromise;
    const res = db.exec('SELECT value FROM cache WHERE key = $key', { $key: key });
    if (res.length > 0 && res[0].values.length > 0) {
      const value = res[0].values[0][0] as string;
      this.lru.set(key, value);
      return value;
    }
    return null;
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.dbPromise;
    this.lru.set(key, value);
    db.run('INSERT OR REPLACE INTO cache (key, value) VALUES ($key, $value)', { $key: key, $value: value });
  }
}
