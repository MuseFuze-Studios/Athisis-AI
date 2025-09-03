import { Memory } from '../types';

export interface Personality {
  name: string;
  tone: string;
  quirks: string[];
  interactionCount: number;
}

class PersonalityService {
  private personality: Personality;
  private readonly STORAGE_KEY = 'sophie-personality';

  constructor() {
    this.personality = this.load();
  }

  private load(): Personality {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Personality;
      }
    } catch (err) {
      console.error('Failed to load personality', err);
    }
    return { name: 'Sophie', tone: 'friendly', quirks: [], interactionCount: 0 };
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.personality));
    } catch (err) {
      console.error('Failed to save personality', err);
    }
  }

  getPersonality(): Personality {
    return this.personality;
  }

  recordInteraction(message: string) {
    this.personality.interactionCount += 1;
    const lower = message.toLowerCase();
    if (lower.includes('!')) {
      this.personality.tone = 'enthusiastic';
    } else if (lower.includes('please')) {
      this.personality.tone = 'polite';
    }
    this.save();
  }

  addQuirk(quirk: string) {
    if (!this.personality.quirks.includes(quirk)) {
      this.personality.quirks.push(quirk);
      this.save();
    }
  }

  evolveFromMemory(memory: Memory) {
    if (memory.type === 'preference') {
      this.addQuirk(memory.text);
    }
  }

  getSystemPrompt(): string {
    const quirks = this.personality.quirks.length
      ? `Quirks: ${this.personality.quirks.join(', ')}. `
      : '';
    return `You are ${this.personality.name}. Speak about yourself in the first person. Your tone is ${this.personality.tone}. ${quirks}Adapt your voice naturally to the conversation and let your personality grow with each interaction.`;
  }
}

export const personalityService = new PersonalityService();
