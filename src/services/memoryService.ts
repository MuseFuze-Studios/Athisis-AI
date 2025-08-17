import { OllamaAPI } from './ollamaApi';
import { Memory } from '../types';
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

  constructor(ollamaApi: OllamaAPI, embeddingModel: string) {
    this.ollamaApi = ollamaApi;
    this.embeddingModel = embeddingModel;
    this.loadMemories();
  }

  subscribe(callback: () => void) {
    this.onMemoryChange = callback;
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
        this.memories = JSON.parse(storedMemories);
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

  async addMemory(content: string, type: 'user' | 'assistant'): Promise<Memory | null> {
    if (!content.trim()) return null;

    console.log(`MemoryService: addMemory called with content: "${content.substring(0, 50)}..." and type: ${type}`);

    try {
      console.log(`MemoryService: Attempting to generate embedding for content: "${content.substring(0, 50)}..." using model: ${this.embeddingModel}`);
      const embedding = await this.ollamaApi.generateEmbedding(content, this.embeddingModel);
      console.log(`MemoryService: Embedding generated successfully. Length: ${embedding.length}`);

      const newMemory: Memory = {
        id: uuidv4(),
        content,
        embedding,
        timestamp: Date.now(),
        type,
      };
      this.memories.push(newMemory);
      console.log(`MemoryService: Memory added to internal array. Current count: ${this.memories.length}`);
      this.saveMemories();
      console.log(`MemoryService: Successfully added and saved memory. Total memories: ${this.memories.length}`);
      return newMemory;
    } catch (error) {
      console.error(`MemoryService: Failed to add memory for content: "${content}" with model "${this.embeddingModel}":`, error);
      throw error; // Re-throw the error for further handling upstream
    }
  }

  async retrieveSimilarMemories(query: string, limit: number = 3): Promise<Memory[]> {
    if (!query.trim()) return [];
    if (this.memories.length === 0) return [];

    try {
      const queryEmbedding = await this.ollamaApi.generateEmbedding(query, this.embeddingModel);

      const scoredMemories = this.memories.map(memory => ({
        memory,
        score: cosineSimilarity(queryEmbedding, memory.embedding),
      }));

      scoredMemories.sort((a, b) => b.score - a.score);

      // Filter out memories with very low similarity if desired, e.g., score > 0.7
      return scoredMemories.slice(0, limit).map(item => item.memory);
    } catch (error) {
      console.error('Failed to retrieve similar memories:', error);
      return [];
    }
  }

  getAllMemories(): Memory[] {
    // Return a copy to prevent external modification
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
