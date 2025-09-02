import React, { useState } from 'react';
import { ChatSession } from '../../types';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square.js';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle.js';
import { clsx } from 'clsx';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newName: string) => void;
}

export function ChatHistory({ sessions, activeSessionId, onSessionSelect, onNewChat, onDeleteChat, onRenameChat }: ChatHistoryProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sessionId: string } | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState<string>('');

  const handleContextMenu = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sessionId });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleRenameClick = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setNewSessionName(currentName);
    handleCloseContextMenu();
  };

  const handleRenameSubmit = (sessionId: string) => {
    if (newSessionName.trim() !== '') {
      onRenameChat(sessionId, newSessionName.trim());
    }
    setEditingSessionId(null);
    setNewSessionName('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setNewSessionName('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10 flex items-center justify-between relative z-10">
        <h2 className="text-xl font-semibold text-white tracking-tight">Conversations</h2>
        <button 
          onClick={onNewChat} 
          className="glass glass-hover transition-glass p-3 rounded-full text-gray-300 hover:text-blue-400 group"
        >
          <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 relative z-10">
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            onContextMenu={(e) => handleContextMenu(e, session.id)}
            className={clsx(
              'flex items-center p-4 mb-2 rounded-2xl cursor-pointer transition-glass message-enter group',
              session.id === activeSessionId 
                ? 'glass-strong glow-primary text-blue-200 border-blue-400/20' 
                : 'glass-subtle glass-hover text-gray-300'
            )}
          >
            <div className={clsx(
              'p-2 rounded-full mr-4 transition-glass',
              session.id === activeSessionId ? 'glass glow-primary' : 'glass-subtle'
            )}>
              <MessageSquare size={16} className={clsx(
                session.id === activeSessionId ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
              )} />
            </div>
            <div className="flex-1">
              {editingSessionId === session.id ? (
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onBlur={() => handleRenameSubmit(session.id)}
                  onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                  className="w-full glass text-white text-base font-medium p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 border-0"
                  autoFocus
                />
              ) : (
                <p className="text-base font-medium truncate">{session.name}</p>
              )}
              <p className="text-xs text-gray-500 truncate mt-1 font-normal">
                {session.messages.length > 0 
                  ? (session.messages[session.messages.length - 1].content.length > 15 
                    ? session.messages[session.messages.length - 1].content.substring(0, 15) + '...' 
                    : session.messages[session.messages.length - 1].content)
                  : 'New Chat'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={handleCloseContextMenu}
          onContextMenu={handleCloseContextMenu}
        >
          <div
            className="absolute glass-strong rounded-2xl shadow-2xl py-2 z-[101] min-w-[120px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors font-medium"
              onClick={() => handleRenameClick(contextMenu.sessionId, sessions.find(s => s.id === contextMenu.sessionId)?.name || '')}
            >
              Rename
            </button>
            <button
              className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors font-medium"
              onClick={() => {
                onDeleteChat(contextMenu.sessionId);
                handleCloseContextMenu();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}