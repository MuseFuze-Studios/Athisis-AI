import React, { useState } from 'react';
import { Message } from '../../types';
import { CodeBlock } from '../code/CodeBlock';
import { User, Bot, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatedTextMessage } from './AnimatedTextMessage';
import { useClipboard } from '../../hooks/useClipboard';

interface ChatMessageProps {
  message: Message;
  showLineNumbers?: boolean;
  isLatestMessage?: boolean;
  thinkingProcess?: string | null;
}

export function ChatMessage({ message, showLineNumbers, isLatestMessage, thinkingProcess }: ChatMessageProps) {
  const { copied, copyToClipboard } = useClipboard();

  const isUser = message.role === 'user';

  return (
    <div className={clsx(
      'flex items-start p-6 mb-4 mx-4 rounded-3xl message-enter transition-glass',
      isUser 
        ? 'glass-strong ml-12 glow-primary' 
        : 'glass mr-12 glow-secondary'
    )}>
      <div className={clsx(
        'flex-shrink-0 mr-4 p-2 rounded-full transition-glass',
        isUser ? 'glass glow-primary' : 'glass-subtle glow-accent'
      )}>
        {isUser ? (
          <User size={18} className="text-blue-400" />
        ) : (
          <Bot size={18} className="text-emerald-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium text-white">
            {isUser ? 'You' : 'Athisis.AI'}
          </div>
          <div className="text-xs text-gray-500 font-normal">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {/* Thinking Process Display */}
        {thinkingProcess && !isUser && (
          <div className="mb-4 glass-subtle rounded-2xl p-4 border border-purple-400/20">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">Thinking Process</span>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-wrap font-normal leading-relaxed">
              {thinkingProcess}
            </div>
          </div>
        )}
        
        <div className="prose prose-invert max-w-none text-gray-200">
          <AnimatedTextMessage 
            text={message.content} 
            isLatestMessage={isLatestMessage}
          />
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={() => copyToClipboard(message.content)}
            className="glass glass-hover transition-glass px-3 py-2 rounded-full text-gray-400 hover:text-white flex items-center text-sm font-medium group"
          >
            {copied ? (
              <Check size={14} className="mr-2 text-emerald-400" />
            ) : (
              <Copy size={14} className="mr-2 group-hover:scale-110 transition-transform" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
