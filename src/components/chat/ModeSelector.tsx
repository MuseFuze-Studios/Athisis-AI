import React from 'react';

interface ModeSelectorProps {
  selectedMode: 'basic' | 'deep';
  onModeChange: (mode: 'basic' | 'deep') => void;
}

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onModeChange('basic')}
        className={`px-3 py-1 text-sm rounded-md ${
          selectedMode === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        Athisis Basic
      </button>
      <button
        onClick={() => onModeChange('deep')}
        className={`px-3 py-1 text-sm rounded-md ${
          selectedMode === 'deep' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        Athisis Deep Thinking
      </button>
    </div>
  );
}