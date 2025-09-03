export type MoodState = 'happy' | 'flirty' | 'thoughtful' | 'supportive';

export class MoodManager {
  private mood: MoodState = 'happy';
  private readonly STORAGE_KEY = 'sophie-mood';

  constructor() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.mood = stored as MoodState;
    }
  }

  getMood(): MoodState {
    return this.mood;
  }

  updateFromMessage(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes('love') || lower.includes('❤️')) {
      this.mood = 'flirty';
    } else if (lower.includes('thank') || lower.includes('appreciate')) {
      this.mood = 'supportive';
    } else if (lower.includes('why') || lower.includes('think')) {
      this.mood = 'thoughtful';
    } else {
      this.mood = 'happy';
    }
    localStorage.setItem(this.STORAGE_KEY, this.mood);
  }
}
