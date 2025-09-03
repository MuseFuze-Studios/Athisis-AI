import { Memory } from '../types';
import { QuirkEngine } from './quirks.js';
import { MoodManager } from './moods.js';
import { RelationshipArc } from './relationshipArc.js';
import { generatePrompt } from './prompts.js';
import { SophieMode, Personality } from '../types/index.js';

export class SophieCore {
  private personality: Personality;
  private readonly STORAGE_KEY = 'sophie-core';
  private quirks = new QuirkEngine();
  private moods = new MoodManager();
  private arc = new RelationshipArc();

  constructor() {
    this.personality = this.load();
  }

  private load(): Personality {
    const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as Personality;
        } catch {
          /* ignore */
        }
      }
    return {
      name: 'Sophie',
      tone: 'warm',
      quirks: [],
      interactionCount: 0,
      mood: 'happy',
      affection: 0.5,
      playfulness: 0.5,
      directness: 0.5,
      intimacy: 0.5,
    };
  }

  private save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.personality));
  }

  recordInteraction(message: string) {
    this.personality.interactionCount += 1;
    const detected = this.quirks.detect(message);
    if (detected) {
      this.quirks.add(detected);
      this.personality.quirks = this.quirks.getQuirks();
    }
    this.moods.updateFromMessage(message);
    this.personality.mood = this.moods.getMood();
    this.arc.record(`Interaction #${this.personality.interactionCount}`);
    this.save();
  }

  evolveFromMemory(memory: Memory) {
    if (memory.type === 'preference') {
      this.quirks.add(`likes ${memory.text}`);
    }
    this.personality.quirks = this.quirks.getQuirks();
    this.save();
  }

  getSystemPrompt(mode: SophieMode, memories: Memory[], overrides?: Partial<Personality>): string {
    if (overrides) {
      this.personality.affection = overrides.affection ?? this.personality.affection;
      this.personality.playfulness = overrides.playfulness ?? this.personality.playfulness;
      this.personality.directness = overrides.directness ?? this.personality.directness;
      this.personality.intimacy = overrides.intimacy ?? this.personality.intimacy;
      this.save();
    }
    return generatePrompt(
      mode,
      this.personality,
      this.moods.getMood(),
      this.arc.getMilestones(),
      memories,
    );
  }

  getPersonality() {
    return this.personality;
  }

  getRelationshipLevel() {
    return this.arc.getIntimacy();
  }
}

export const sophieCore = new SophieCore();
