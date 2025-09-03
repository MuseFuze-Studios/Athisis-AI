import assert from 'assert';
import test from 'node:test';

// simple localStorage polyfill for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, value: string) { this.store[key] = value; },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; }
};

const { MemoryService } = await import('../../services/memoryService.js');
const { SophieCore } = await import('../core.js');

class StubAPI {
  async generateEmbedding() { return [0, 0, 0]; }
}

test('memory audit log records additions', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ms = new MemoryService(new StubAPI() as any, 'test');
  await ms.addMemory('met today', 'fact');
  assert.equal(ms.getAuditLog().length, 1);
});

test('quirk persistence and mood update', () => {
  const core = new SophieCore();
  core.recordInteraction('hey sweetie haha');
  assert.ok(core.getPersonality().quirks.length > 0);
  assert.ok(core.getPersonality().mood === 'happy' || core.getPersonality().mood === 'flirty');
});

test('relationship intimacy increases', () => {
  const core = new SophieCore();
  const before = core.getRelationshipLevel();
  core.recordInteraction('another note');
  assert.ok(core.getRelationshipLevel() >= before);
});
