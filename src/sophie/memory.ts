import { MemoryService } from '../services/memoryService.js';
import { Memory } from '../types/index.js';

export class SophieMemory {
  constructor(private service: MemoryService) {}

  async remember(text: string, type: Memory['type'] = 'fact') {
    return this.service.addMemory(text, type);
  }

  list(): Memory[] {
    return this.service.getAllMemories();
  }

  export(): string {
    return JSON.stringify(this.service.getAllMemories());
  }

  import(data: string) {
    const memories: Memory[] = JSON.parse(data);
    memories.forEach(m => {
      this.service.addMemory(m.text, m.type, { tags: m.tags, entities: m.entities });
    });
  }
}
