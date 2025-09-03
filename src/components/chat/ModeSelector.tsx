import React from 'react';

import { SophieMode } from '../../types';

interface ModeSelectorProps {
  selectedMode: SophieMode;
  onModeChange: (mode: SophieMode) => void;
}

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center space-x-2 glass rounded-2xl p-1">
      <button
        onClick={() => onModeChange('assistant')}
        className={`px-3 py-1 text-sm rounded-md ${
          selectedMode === 'assistant'
            ? 'glass-strong glow-primary text-white font-medium'
            : 'text-gray-400 hover:text-gray-300 font-medium'
        }`}
      >
        Assistant
      </button>
      <button
        onClick={() => onModeChange('girlfriend')}
        className={`px-3 py-1 text-sm rounded-md ${
          selectedMode === 'girlfriend'
            ? 'glass-strong glow-secondary text-white font-medium'
            : 'text-gray-400 hover:text-gray-300 font-medium'
        }`}
      >
        Girlfriend
      </button>
      <button
        onClick={() => onModeChange('deep')}
        className={`px-3 py-1 text-sm rounded-md ${
          selectedMode === 'deep'
            ? 'glass-strong glow-secondary text-white font-medium'
            : 'text-gray-400 hover:text-gray-300 font-medium'
        }`}
      >
        Deep Thinking
      </button>
    </div>
  );
}