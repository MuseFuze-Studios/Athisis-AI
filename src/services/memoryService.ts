import { OllamaAPI } from './ollamaApi';
import { Memory, MemoryType } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper function for cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  if (magnitudeA === 0 || magnitudeB === 0) return 0; // Avoid division by zero
  return dotProduct / (magnitudeA * magnitudeB);
}

export class MemoryService {
  private memories: Memory[] = [];
  private ollamaApi: OllamaAPI;
  private embeddingModel: string;
  private readonly STORAGE_KEY = 'athisis-memories';
  private onMemoryChange: (() => void) | null = null;
  private readonly saveThreshold = 0.6;

  private readonly ttlByType: Record<MemoryType, number> = {
    profile: Number.MAX_SAFE_INTEGER,
    preference: 365 * 24 * 60 * 60 * 1000, // 1 year
    project: 90 * 24 * 60 * 60 * 1000, // 90 days
    fact: 180 * 24 * 60 * 60 * 1000, // 180 days
    glossary: 365 * 24 * 60 * 60 * 1000, // 1 year
    task: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  constructor(ollamaApi: OllamaAPI, embeddingModel: string) {
    this.ollamaApi = ollamaApi;
    this.embeddingModel = embeddingModel;
    this.loadMemories();
  }

  subscribe(callback: () => void) {
    this.onMemoryChange = callback;
  }

  setOnMemoryAdded(callback: (memory: Memory) => void) {
    this.onMemoryAdded = callback;
  }

  unsubscribe() {
    this.onMemoryChange = null;
  }

  private notify() {
    if (this.onMemoryChange) {
      this.onMemoryChange();
    }
  }

  private loadMemories() {
    try {
      const storedMemories = localStorage.getItem(this.STORAGE_KEY);
      if (storedMemories) {
        const parsed = JSON.parse(storedMemories) as Partial<Memory>[];
        this.memories = parsed.map(m => ({
          id: m.id || uuidv4(),
          type: (m.type as MemoryType) || 'fact',
          text: m.text ?? (m as { content?: string }).content ?? '',
          sourceMsgId: m.sourceMsgId,
          timestamp: m.timestamp || Date.now(),
          tags: m.tags || [],
          entities: m.entities || [],
          embedding: m.embedding || [],
          score: m.score || 0,
          ttl: m.ttl ?? this.ttlByType[(m.type as MemoryType) || 'fact'],
          confidence: m.confidence ?? 0.5,
        })).filter(m => !this.isExpired(m));
        console.log(`MemoryService: Loaded ${this.memories.length} memories from localStorage.`);
      }
    } catch (error) {
      console.error('Failed to load memories from localStorage:', error);
      this.memories = [];
    }
    this.notify();
  }

  private saveMemories() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memories));
      console.log(`MemoryService: Saved ${this.memories.length} memories to localStorage.`);
    } catch (error) {
      console.error('Failed to save memories to localStorage:', error);
    }
    this.notify();
  }

  private isExpired(memory: Memory): boolean {
    return Date.now() > memory.timestamp + memory.ttl;
  }
  
  private clearExpiredMemories() {
    const before = this.memories.length;
    this.memories = this.memories.filter(mem => !this.isExpired(mem));
    if (this.memories.length !== before) {
      console.log(`MemoryService: Cleared ${before - this.memories.length} expired memories.`);
      this.saveMemories();
    }
  }

  private calculateScore(text: string, type: MemoryType, recurrence: number): number {
    const intent = 1; // explicit call
    const specificity = /\d/.test(text) ? 1 : text.split(' ').length > 5 ? 0.7 : 0.4;
    const recency = 1;
    const longevity = type === 'task' ? 0.3 : type === 'fact' ? 0.6 : 1;
    const score = 0.35 * intent + 0.2 * specificity + 0.2 * recurrence + 0.15 * recency + 0.1 * longevity;
    return score;
  }

  async addMemory(
    text: string,
    type: MemoryType,
    options: { sourceMsgId?: string; tags?: string[]; entities?: string[]; ttl?: number; confidence?: number } = {}
  ): Promise<Memory | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;
    console.log(`MemoryService: addMemory called with text: "${trimmed.substring(0, 50)}..." and type: ${type}`);

    try {
      console.log(`MemoryService: Attempting to generate embedding for text: "${trimmed.substring(0, 50)}..." using model: ${this.embeddingModel}`);
      const embedding = await this.ollamaApi.generateEmbedding(trimmed, this.embeddingModel);
      console.log(`MemoryService: Embedding generated successfully. Length: ${embedding.length}`);

      const ttl = options.ttl ?? this.ttlByType[type];
      const existing = this.memories.find(m => cosineSimilarity(embedding, m.embedding) > 0.9);
      const score = this.calculateScore(trimmed, type, existing ? 1 : 0);

      if (score < this.saveThreshold) {
        console.log(`MemoryService: Memory score ${score.toFixed(2)} below threshold; not saved.`);
        return null;
      }

      if (existing) {
        existing.text = trimmed;
        existing.timestamp = Date.now();
        existing.tags = Array.from(new Set([...(existing.tags || []), ...(options.tags || [])]));
        existing.entities = Array.from(new Set([...(existing.entities || []), ...(options.entities || [])]));
        existing.confidence = Math.max(existing.confidence, options.confidence ?? existing.confidence);
        this.saveMemories();
        return existing;
      }

      const newMemory: Memory = {
        id: uuidv4(),
        type,
        text: trimmed,
        sourceMsgId: options.sourceMsgId,
        timestamp: Date.now(),
        tags: options.tags || [],
        entities: options.entities || [],
        embedding,
        score,
        ttl,
        confidence: options.confidence ?? 0.5,
      };
      this.memories.push(newMemory);
      console.log(`MemoryService: Memory added to internal array. Current count: ${this.memories.length}`);
      this.saveMemories();
      console.log(`MemoryService: Successfully added and saved memory. Total memories: ${this.memories.length}`);
      if (this.onMemoryAdded) {
        this.onMemoryAdded(newMemory);
      }
      return newMemory;
    } catch (error) {
      console.error(`MemoryService: Failed to add memory for text: "${trimmed}" with model "${this.embeddingModel}":`, error);
      throw error;
    }
  }

  async retrieveSimilarMemories(query: string, limit: number = 3): Promise<Memory[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    if (this.memories.length === 0) return [];

    this.clearExpiredMemories();

    try {
      const queryEmbedding = await this.ollamaApi.generateEmbedding(trimmed, this.embeddingModel);

      const scoredMemories = this.memories.map(memory => {
        const similarity = cosineSimilarity(queryEmbedding, memory.embedding);
        const recency = 1 - Math.min((Date.now() - memory.timestamp) / memory.ttl, 1);
        const finalScore = 0.8 * similarity + 0.2 * recency;
        return { memory, score: finalScore };
      });

      scoredMemories.sort((a, b) => b.score - a.score);

      const result = scoredMemories.slice(0, limit).map(item => item.memory);
      result.forEach(mem => this.reinforceMemory(mem.id));
      return result;
    } catch (error) {
      console.error('Failed to retrieve similar memories:', error);
      return [];
    }
  }

  reinforceMemory(id: string) {
    const mem = this.memories.find(m => m.id === id);
    if (mem) {
      mem.confidence = Math.min(1, mem.confidence + 0.1);
      this.saveMemories();
    }
  }

  getAllMemories(): Memory[] {
    this.clearExpiredMemories();
    console.log(`MemoryService: getAllMemories() called. Returning ${this.memories.length} memories.`, this.memories);
    return [...this.memories];
  }

  clearAllMemories() {
    this.memories = [];
    this.saveMemories();
  }

  deleteMemory(id: string) {
    this.memories = this.memories.filter(memory => memory.id !== id);
    this.saveMemories();
  }
}

// Export a singleton instance for convenience
// This will be initialized with default settings, but can be re-initialized if needed
// For a more robust solution, pass OllamaAPI and embeddingModel from a central place (e.g., App.tsx)
// For now, we'll assume the default OllamaAPI instance is sufficient.
// This will be properly initialized in useOllama hook.
export const memoryService = new MemoryService(new OllamaAPI(), 'nomic-embed-text');
