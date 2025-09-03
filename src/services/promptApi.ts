export interface Prompt {
  id: string;
  name: string;
  content: string;
  isFallback: boolean;
}

interface PromptData {
  activePromptId: string;
  prompts: Record<string, Prompt>;
}

const STORAGE_KEY = 'prompt-data';

const defaultData: PromptData = {
  activePromptId: 'fallback',
  prompts: {
    fallback: {
      id: 'fallback',
      name: 'Fallback Safe Prompt',
      content: 'You are AthIsis.AI, a local assistant modeled after OpenAI\'s ChatGPT. Provide clear, concise and thoughtful answers with step-by-step reasoning when helpful. Use stored memories only when they are directly relevant to the user\'s request. Maintain an efficient and professional tone.',
      isFallback: true,
    },
  },
};

function loadData(): PromptData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as PromptData;
    }
  } catch (error) {
    console.error('Failed to load prompts from localStorage:', error);
  }
  saveData(defaultData);
  return defaultData;
}

function saveData(data: PromptData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save prompts to localStorage:', error);
  }
}

export const promptApi = {
  getPrompts: async (): Promise<Prompt[]> => {
    const data = loadData();
    return Object.values(data.prompts);
  },

  getActivePrompt: async (): Promise<Prompt> => {
    const data = loadData();
    return data.prompts[data.activePromptId] || data.prompts['fallback'];
  },

  getPromptById: async (id: string): Promise<Prompt> => {
    const data = loadData();
    const prompt = data.prompts[id];
    if (!prompt) {
      throw new Error('Prompt not found.');
    }
    return prompt;
  },

  createPrompt: async (name: string, content: string): Promise<Prompt> => {
    const data = loadData();
    const newId = Date.now().toString();
    data.prompts[newId] = { id: newId, name, content, isFallback: false };
    saveData(data);
    return data.prompts[newId];
  },

  updatePrompt: async (id: string, name: string, content: string): Promise<Prompt> => {
    const data = loadData();
    const existing = data.prompts[id];
    if (!existing) {
      throw new Error('Prompt not found.');
    }
    if (existing.isFallback) {
      throw new Error('Fallback prompt cannot be edited.');
    }
    data.prompts[id] = {
      ...existing,
      name: name || existing.name,
      content: content || existing.content,
    };
    saveData(data);
    return data.prompts[id];
  },

  deletePrompt: async (id: string): Promise<void> => {
    const data = loadData();
    const existing = data.prompts[id];
    if (!existing) {
      throw new Error('Prompt not found.');
    }
    if (existing.isFallback) {
      throw new Error('Fallback prompt cannot be deleted.');
    }
    if (data.activePromptId === id) {
      data.activePromptId = 'fallback';
    }
    delete data.prompts[id];
    saveData(data);
  },

  setActivePrompt: async (id: string): Promise<Prompt> => {
    const data = loadData();
    const prompt = data.prompts[id];
    if (!prompt) {
      throw new Error('Prompt not found.');
    }
    data.activePromptId = id;
    saveData(data);
    return prompt;
  },

  resetToFallback: async (): Promise<Prompt> => {
    const data = loadData();
    data.activePromptId = 'fallback';
    saveData(data);
    return data.prompts['fallback'];
  },
};

