const API_BASE_URL = '/api/prompts';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  isFallback: boolean;
}

export const promptApi = {
  getPrompts: async (): Promise<Prompt[]> => {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getActivePrompt: async (): Promise<Prompt> => {
    const response = await fetch(`${API_BASE_URL}/active`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getPromptById: async (id: string): Promise<Prompt> => {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  createPrompt: async (name: string, content: string): Promise<Prompt> => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, content }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  updatePrompt: async (id: string, name: string, content: string): Promise<Prompt> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, content }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  deletePrompt: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  setActivePrompt: async (id: string): Promise<Prompt> => {
    const response = await fetch(`${API_BASE_URL}/active/${id}`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  resetToFallback: async (): Promise<Prompt> => {
    const response = await fetch(`${API_BASE_URL}/reset-fallback`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};