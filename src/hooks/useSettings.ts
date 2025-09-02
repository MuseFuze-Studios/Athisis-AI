import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  ollama: {
    host: '149.88.113.223',
    port: 11434,
    path: '/api',
    model: '',
    modelsDirectory: 'F:/AI/Ollama Models',
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
      loadedSettings = {
        ...loadedSettings,
        ollama: {
          ...loadedSettings.ollama,
          host: window.location.hostname,
          port: loadedSettings.ollama.port || 11434, // Ensure port is set, default to 11434
        },
      };
      // Save the updated settings back to localStorage immediately
      localStorage.setItem('athisis-settings', JSON.stringify(loadedSettings));
    }

    setSettings(loadedSettings);
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