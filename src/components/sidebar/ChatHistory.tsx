import React, { useState } from 'react';
import { ChatSession } from '../../types';
import { MessageSquare, PlusCircle } from 'lucide-react';
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
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Chats</h2>
        <button onClick={onNewChat} className="text-gray-400 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-gray-800">
          <PlusCircle size={22} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            onContextMenu={(e) => handleContextMenu(e, session.id)}
            className={clsx(
              'flex items-center p-4 mx-2 rounded-lg cursor-pointer transition-colors duration-200',
              session.id === activeSessionId ? 'bg-blue-600/20 text-blue-200' : 'hover:bg-gray-800 text-gray-300'
            )}
          >
            <MessageSquare size={18} className={clsx('mr-3', session.id === activeSessionId ? 'text-blue-400' : 'text-gray-500')} />
            <div className="flex-1">
              {editingSessionId === session.id ? (
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onBlur={() => handleRenameSubmit(session.id)}
                  onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                  className="w-full bg-gray-700 text-white text-base font-medium p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <p className="text-base font-semibold truncate">{session.name}</p>
              )}
              <p className="text-xs text-gray-400 truncate mt-1">
                {session.messages.length > 0 ? session.messages[session.messages.length - 1].content : 'New Chat'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={handleCloseContextMenu}
          onContextMenu={handleCloseContextMenu}
        >
          <div
            className="absolute bg-gray-700 rounded-lg shadow-xl py-1 z-50"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 rounded-md"
              onClick={() => handleRenameClick(contextMenu.sessionId, sessions.find(s => s.id === contextMenu.sessionId)?.name || '')}
            >
              Rename
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white rounded-md"
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