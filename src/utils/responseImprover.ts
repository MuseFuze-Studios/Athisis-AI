export interface ImprovementResult {
  refined: string;
  tldr: string;
  score: number;
}

// Very lightweight heuristic-based response improver.
export function improveResponse(text: string): ImprovementResult {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const words = text.split(/\s+/);
  const avgSentenceLength = sentences.length ? words.length / sentences.length : words.length;

  // Simple heuristics for scoring
  const clarity = Math.max(0, Math.min(1, 20 / (avgSentenceLength || 1)));
  const usefulness = /should|try|consider|step|use|build|create/.test(text.toLowerCase()) ? 1 : 0.5;
  const factuality = /\d/.test(text) ? 1 : 0.5;
  const score = Math.round(((clarity + usefulness + factuality) / 3) * 100);

  // Basic TL;DR takes first two sentences
  const tldr = sentences.slice(0, 2).join(' ').trim();

  // Refined text: ensure sentences trimmed and end with period
  const refined = sentences.map(s => s.trim().replace(/\s+/g, ' ')).join(' ');

  return { refined, tldr, score };
}
