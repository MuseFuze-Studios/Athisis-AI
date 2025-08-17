import React from 'react';
import { ChatHistory } from './ChatHistory';
import { ChatSession } from '../../types';
import { Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  activeSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newName: string) => void;
}

export function Sidebar({
  isOpen,
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onOpenSettings,
  onDeleteChat,
  onRenameChat
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-gray-900/70 border-r border-gray-800 h-full flex flex-col backdrop-blur-md">
      <ChatHistory 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={onSessionSelect}
        onNewChat={onNewChat}
        onDeleteChat={onDeleteChat}
        onRenameChat={onRenameChat}
      />
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center px-4 py-3 text-base font-medium transition-colors bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
        >
          <Settings size={18} className="mr-2" />
          Settings
        </button>
      </div>
    </div>
  );
}