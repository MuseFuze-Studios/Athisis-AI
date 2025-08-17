import React, { useState } from 'react';
import { Message } from '../../types';
import { CodeBlock } from '../code/CodeBlock';
import { User, Bot, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatedTextMessage } from './AnimatedTextMessage';
import { useClipboard } from '../../hooks/useClipboard';

interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
}

export function ChatMessage({ message, isLastMessage }: ChatMessageProps) {
  const { copied, copyToClipboard } = useClipboard();
  

  const isUser = message.role === 'user';
  const Icon = isUser ? User : Bot;
  const bgColor = isUser ? 'bg-gray-800' : 'bg-gray-900';
  const textColor = isUser ? 'text-gray-100' : 'text-gray-200';

  return (
    <div className={clsx('flex items-start p-4 rounded-lg', bgColor)}>
      <div className="flex-shrink-0 mr-3">
        <Icon size={20} className={isUser ? 'text-blue-400' : 'text-green-400'} />
      </div>
      <div className="flex-1">
        <div className="font-semibold mb-1">{isUser ? 'You' : 'Athisis.AI'}</div>
        <div className={clsx('prose prose-invert max-w-none', textColor)}>
          {message.type === 'text' && (
            <p>{message.content}</p>
          )}
          {message.type === 'code' && (
            <CodeBlock code={message.content} language={message.language} />
          )}
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={() => copyToClipboard(message.content)}
            className="text-gray-400 hover:text-white flex items-center text-sm"
          >
            {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
