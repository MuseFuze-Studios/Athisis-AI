import { useState, useCallback } from 'react';
import { ClipboardItem } from '../types';

export function useClipboard() {
  const [history, setHistory] = useState<ClipboardItem[]>([]);

  const copyToClipboard = useCallback(async (content: string, type: 'code' | 'text' = 'code', language?: string) => {
    try {
      await navigator.clipboard.writeText(content);
      
      const newItem: ClipboardItem = {
        id: Math.random().toString(36).substr(2, 9),
        content,
        timestamp: new Date(),
        type,
        language,
      };

      setHistory(prev => [newItem, ...prev.slice(0, 9)]); // Keep last 10 items
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    copyToClipboard,
    clearHistory,
  };
}