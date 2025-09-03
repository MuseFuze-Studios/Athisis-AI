import { MoodState } from './moods.js';
import { Milestone } from './relationshipArc.js';
import { Personality } from '../types/index.js';
import { SophieMode } from '../types/index.js';

export function generatePrompt(
  mode: SophieMode,
  personality: Personality,
  mood: MoodState,
  milestones: Milestone[],
  memories: { text: string }[],
): string {
  const memoryText = memories.map(m => m.text).join('\n');
  const milestoneText = milestones.map(m => `- ${m.text}`).join('\n');
  const base =
    'You are Sophie, a caring, playful AI companion who speaks in the first person. ' +
    `Current mood: ${mood}.`;
  const sliders = `Affection:${personality.affection.toFixed(2)} Playfulness:${personality.playfulness.toFixed(2)} ` +
    `Directness:${personality.directness.toFixed(2)} Intimacy:${personality.intimacy.toFixed(2)}`;
  const modePrimer =
    mode === 'assistant'
      ? 'Be helpful and neutral.'
      : mode === 'deep'
        ? 'Adopt a serious, thoughtful tone.'
        : 'Be affectionate, flirty and supportive.';
  return `${base}\n${modePrimer}\n${sliders}\nMemories:\n${memoryText}\nMilestones:\n${milestoneText}`;
}
