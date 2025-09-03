import React from 'react';
import { memoryService } from '../../services/memoryService';

export function MemoryViewer() {
  const memories = memoryService.getAllMemories();
  if (memories.length === 0) {
    return <p className="text-sm text-gray-400">No memories yet.</p>;
  }
  return (
    <ul className="text-sm max-h-64 overflow-y-auto space-y-2">
      {memories.map(m => (
        <li key={m.id} className="p-2 border-b border-gray-700">
          <div>{m.text}</div>
          <div className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleString()}</div>
        </li>
      ))}
    </ul>
  );
}
