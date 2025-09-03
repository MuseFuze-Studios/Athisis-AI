export interface Milestone {
  id: string;
  text: string;
  timestamp: number;
}

export class RelationshipArc {
  private milestones: Milestone[] = [];
  private intimacy = 0;
  private readonly STORAGE_KEY = 'sophie-milestones';

  constructor() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.milestones = data.milestones || [];
        this.intimacy = data.intimacy || 0;
      } catch {
        this.milestones = [];
      }
    }
  }

  getIntimacy() {
    return this.intimacy;
  }

  getMilestones(): Milestone[] {
    return [...this.milestones];
  }

  record(text: string) {
    const milestone = { id: String(Date.now()), text, timestamp: Date.now() };
    this.milestones.push(milestone);
    this.intimacy = Math.min(1, this.intimacy + 0.05);
    this.save();
    return milestone;
  }

  private save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ milestones: this.milestones, intimacy: this.intimacy }));
  }
}
