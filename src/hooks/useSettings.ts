import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  ollama: {
    host: 'localhost',
    port: 11434,
    path: '/api',
    model: '',
    modelsDirectory: '',
    quickChatModel: '',
    workhorseModel: '',
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
  qualityPassEnabled: false,
  tldrEnabled: false,
  ragEnabled: false,
  mode: 'girlfriend',
  affection: 0.5,
  playfulness: 0.5,
  directness: 0.5,
  intimacy: 0.5,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('sophie-settings');
    let loadedSettings: AppSettings = defaultSettings;

    if (saved) {
      try {
        loadedSettings = { ...defaultSettings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }

    // Automatic Ollama host configuration for external or wildcard hosts
    if (loadedSettings.ollama.host === 'localhost' || loadedSettings.ollama.host === '0.0.0.0') {
      const port = !loadedSettings.ollama.port || loadedSettings.ollama.port === 3000
        ? 11434
        : loadedSettings.ollama.port;
      loadedSettings = {
        ...loadedSettings,
        ollama: {
          ...loadedSettings.ollama,
          host: window.location.hostname,
          port,
        },
      };
      // Save the updated settings back to localStorage immediately
      localStorage.setItem('sophie-settings', JSON.stringify(loadedSettings));
    }

    setSettings(loadedSettings);
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('sophie-settings', JSON.stringify(newSettings));
  };

  return {
    settings,
    updateSettings,
  };
}