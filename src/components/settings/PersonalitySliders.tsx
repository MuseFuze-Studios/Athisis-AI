import React from 'react';
import { AppSettings } from '../../types';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export function PersonalitySliders({ settings, onUpdateSettings }: Props) {
  const sliders = [
    { key: 'affection', label: 'Affection' },
    { key: 'playfulness', label: 'Playfulness' },
    { key: 'directness', label: 'Directness' },
    { key: 'intimacy', label: 'Intimacy' },
  ] as const;

  return (
    <div className="space-y-4">
      {sliders.map(s => (
        <div key={s.key} className="flex items-center space-x-2">
          <label className="w-24 text-sm">{s.label}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings[s.key] ?? 0.5}
            onChange={e => onUpdateSettings({ [s.key]: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="w-10 text-right text-xs">{Math.round((settings[s.key] ?? 0.5) * 100)}</span>
        </div>
      ))}
    </div>
  );
}
