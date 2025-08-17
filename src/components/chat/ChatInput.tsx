import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Code } from 'lucide-react';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

interface ChatInputProps {
  onSendMessage: (content: string, attachedFiles?: File[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachedFiles.length > 0) {
      onSendMessage(input, attachedFiles);
      setInput('');
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Only Enter, no Shift
      e.preventDefault(); // Prevent default new line
      handleSubmit(e);
    }
    // If Shift + Enter, allow default behavior (new line)
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <>
      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center bg-gray-800 rounded-full px-4 py-2 text-sm border border-gray-700">
              <Code size={16} className="mr-2 text-blue-400" />
              <span className="text-gray-300">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 text-gray-500 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-4">
        <div className="flex-1">
          <textarea
            key="chat-input-textarea"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "AI is thinking..." : "Ask Athisis.AI about your code..."}
            className={clsx(
              'w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-2xl',
              'text-gray-100 placeholder-gray-500 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-colors duration-200 min-h-[56px] max-h-40 overflow-y-auto'
            )}
            disabled={disabled}
            rows={1}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yaml,.yml,.md,.txt"
            multiple
            className="hidden"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="lg"
            icon={<Paperclip size={22} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="rounded-full text-gray-400 hover:text-white"
          />
          
          <Button
            type="submit"
            disabled={disabled || (!input.trim() && attachedFiles.length === 0)}
            size="lg"
            icon={disabled ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send size={22} />}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          />
        </div>
      </form>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Press Enter to send • Shift+Enter for new line • Attach files for context
      </div>
    </>
  );
}