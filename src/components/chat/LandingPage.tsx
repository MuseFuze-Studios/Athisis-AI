import React from 'react';
import Bot from 'lucide-react/dist/esm/icons/bot.js';

interface LandingPageProps {
  onNewChat: () => void;
}

export function LandingPage({ onNewChat }: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="glass p-8 rounded-3xl shadow-xl max-w-md w-full flex flex-col items-center">
        <Bot size={64} className="text-blue-400 mb-6 animate-pulse" />
        <h2 className="text-3xl font-bold text-white mb-4">Welcome to Sophie</h2>
        <p className="text-gray-300 text-lg mb-6">
          Your local AI coding assistant. Start a new conversation or select an existing one from the sidebar.
        </p>
        <button
          onClick={onNewChat}
          className="glass glass-hover transition-glass px-6 py-3 rounded-full text-lg font-semibold text-blue-300 hover:text-blue-200 glow-primary"
        >
          Start New Chat
        </button>
      </div>
    </div>
  );
}
