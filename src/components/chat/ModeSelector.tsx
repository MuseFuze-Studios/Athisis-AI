import React from 'react';

interface ModeSelectorProps {
  selectedMode: 'basic' | 'deep';
  onModeChange: (mode: 'basic' | 'deep') => void;
}

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center space-x-2 glass rounded-2xl p-1">
      <button
        onClick={() => onModeChange('basic')}
        className={`px-3 py-1 text-sm rounded-md ${
          selectedMode === 'basic' 
            ? 'glass-strong glow-primary text-white font-medium' 
            : 'text-gray-400 hover:text-gray-300 font-medium'
        }`}
      >
        Sophie Basic
      </button>
      <button
        onClick={() => onModeChange('deep')}
        className={`px-3 py-1 text-sm rounded-md ${
          selectedMode === 'deep' 
            ? 'glass-strong glow-secondary text-white font-medium' 
            : 'text-gray-400 hover:text-gray-300 font-medium'
        }`}
      >
        Sophie Deep Thinking
      </button>
    </div>
  );
}