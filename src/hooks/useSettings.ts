import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  ollama: {
    host: 'localhost',
    port: 11434,
    path: '/api',
    model: '',
    modelsDirectory: 'F:\AI\Ollama Models',
  },
  promptId: 'fallback',
  selectedModelComplexity: 'complex',
  embeddingModel: 'nomic-embed-text', // Default embedding model
  theme: 'dark',
  fontSize: 14,
  showLineNumbers: true,
  enableCuda: true,
  keyboardShortcuts: {
    'copy-code': 'Cmd+Shift+C',
    'clear-chat': 'Cmd+K',
    'focus-input': 'Cmd+L',
    'toggle-sidebar': 'Cmd+B',
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('athisis-settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('athisis-settings', JSON.stringify(newSettings));
  };

  return {
    settings,
    updateSettings,
  };
}