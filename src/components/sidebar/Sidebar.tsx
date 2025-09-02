import React from 'react';
import { ChatHistory } from './ChatHistory';
import { ChatSession } from '../../types';
import Settings from 'lucide-react/dist/esm/icons/settings.js';

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
    <div className="w-80 glass-strong border-r border-white/10 h-full flex flex-col relative">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 pointer-events-none rounded-l-2xl"></div>
      
      <ChatHistory 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={onSessionSelect}
        onNewChat={onNewChat}
        onDeleteChat={onDeleteChat}
        onRenameChat={onRenameChat}
      />
      <div className="p-6 border-t border-white/10 relative z-10">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center px-6 py-4 text-base font-medium glass glass-hover transition-glass rounded-2xl text-gray-200 group"
        >
          <Settings size={18} className="mr-3 group-hover:rotate-90 transition-transform duration-300" />
          Settings
        </button>
      </div>
    </div>
  );
}