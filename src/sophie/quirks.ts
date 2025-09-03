export class QuirkEngine {
  private quirks: string[] = [];
  private readonly STORAGE_KEY = 'sophie-quirks';

  constructor() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.quirks = JSON.parse(stored);
      } catch {
        this.quirks = [];
      }
    }
  }

  getQuirks(): string[] {
    return [...this.quirks];
  }

  detect(message: string): string | null {
    const lower = message.toLowerCase();
    if (lower.includes('sweetie')) {
      return 'uses pet name sweetie';
    }
    if (lower.includes('haha') || lower.includes('lol')) {
      return 'laughs a lot';
    }
    return null;
  }

  add(quirk: string) {
    if (!this.quirks.includes(quirk)) {
      this.quirks.push(quirk);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.quirks));
    }
  }
}
