import React from 'react';
import { ClipboardItem } from '../../types';
import { Clock, Copy, Code } from 'lucide-react';
import { Button } from '../ui/Button';
import { useClipboard } from '../../hooks/useClipboard';

interface ClipboardHistoryProps {
  items: ClipboardItem[];
}

export function ClipboardHistory({ items }: ClipboardHistoryProps) {
  const { copyToClipboard } = useClipboard();

  const handleReCopy = async (item: ClipboardItem) => {
    await copyToClipboard(item.content, item.type, item.language);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-300">Clipboard History</h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No clipboard history</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Code size={14} className="text-blue-400" />
                    {item.language && (
                      <span className="text-xs text-gray-400 uppercase">
                        {item.language}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Copy size={12} />}
                    onClick={() => handleReCopy(item)}
                  />
                </div>
                
                <pre className="text-xs text-gray-300 font-mono line-clamp-3 overflow-hidden">
                  {item.content}
                </pre>
                
                <div className="text-xs text-gray-500 mt-2">
                  {item.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}