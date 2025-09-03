import React, { useState } from 'react';
import { Message } from '../../types';
import { CodeBlock } from '../code/CodeBlock';
import User from 'lucide-react/dist/esm/icons/user.js';
import Bot from 'lucide-react/dist/esm/icons/bot.js';
import Copy from 'lucide-react/dist/esm/icons/copy.js';
import Check from 'lucide-react/dist/esm/icons/check.js';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.js';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up.js';
import Pin from 'lucide-react/dist/esm/icons/pin.js';
import { clsx } from 'clsx';
import { AnimatedTextMessage } from './AnimatedTextMessage';
import { useClipboard } from '../../hooks/useClipboard';
import { parseMessageContent } from '../../utils/markdownParser';

interface ChatMessageProps {
  message: Message;
  showLineNumbers?: boolean;
  isLatestMessage?: boolean;
  thinkingProcess?: string | null;
  onPin?: (id: string) => void;
}

export function ChatMessage({ message, showLineNumbers, isLatestMessage, thinkingProcess, onPin }: ChatMessageProps) {
  const { copied, copyToClipboard } = useClipboard();
  const [showThinkingProcess, setShowThinkingProcess] = useState(false); // State for toggling thinking process

  const isUser = message.role === 'user';
  const messageSegments = parseMessageContent(message.content);

  return (
    <div className={clsx(
      'flex mb-1',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={clsx(
        'flex items-start p-3 mx-2 rounded-2xl message-enter transition-glass max-w-fit',
        isUser
          ? 'glass-strong glow-primary'
          : 'glass glow-secondary',
        message.pinned && 'border-2 border-yellow-400'
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
          <div className="font-medium text-white flex items-center">
            {isUser ? 'You' : 'Sophie'}
            {typeof message.score === 'number' && (
              <span className="ml-2 text-xs text-emerald-400 glass px-2 py-0.5 rounded-full">{message.score}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 font-normal">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {/* Thinking Process Display */}
        {thinkingProcess && !isUser && (
          <div className="mb-4 glass-subtle rounded-2xl p-4 border border-purple-400/20">
            <div className="flex items-center mb-2 justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">Thinking Process</span>
              </div>
              <button 
                onClick={() => setShowThinkingProcess(!showThinkingProcess)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showThinkingProcess ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {showThinkingProcess && (
              <div className="text-sm text-gray-300 whitespace-pre-wrap font-normal leading-relaxed">
                {thinkingProcess}
              </div>
            )}
          </div>
        )}
        
        {/* Image Display */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {message.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Attached image ${index + 1}`}
                className="max-w-full h-auto rounded-lg shadow-md"
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
              />
            ))}
          </div>
        )}
        
        <div className="prose prose-invert max-w-none text-gray-200">
          {messageSegments.map((segment, index) => (
            segment.type === 'text' ? (
              <AnimatedTextMessage 
                key={index} 
                text={segment.content} 
                isLatestMessage={isLatestMessage && index === messageSegments.length - 1 && segment.type === 'text'}
              />
            ) : (
              <CodeBlock 
                key={index} 
                code={segment.content} 
                language={segment.lang || 'plaintext'} 
                showLineNumbers={showLineNumbers}
              />
            )
          ))}
        </div>

        {message.tldr && (
          <div className="mt-2 text-sm text-gray-400 border-t border-white/10 pt-2">
            <strong>TL;DR:</strong> {message.tldr}
          </div>
        )}

        <div className="flex justify-end mt-4 space-x-2">
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
          {!isUser && (
            <button
              onClick={() => onPin?.(message.id)}
              className="glass glass-hover transition-glass px-3 py-2 rounded-full text-gray-400 hover:text-white flex items-center text-sm font-medium group"
            >
              <Pin size={14} className={clsx('mr-2', message.pinned ? 'text-yellow-400' : 'group-hover:scale-110 transition-transform')} />
              {message.pinned ? 'Pinned' : 'Pin'}
            </button>
          )}
        </div>
      </div>
    </div>
  </div> // This is the newly added closing div for the outer wrapper
  );
}
