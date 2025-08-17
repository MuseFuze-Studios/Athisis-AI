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
        <div className="mb-6 flex flex-wrap gap-3">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center glass rounded-2xl px-4 py-3 text-sm transition-glass group">
              <div className="p-1 rounded-full glass-subtle mr-3">
                <Code size={14} className="text-blue-400" />
              </div>
              <span className="text-gray-300 font-medium">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="ml-3 text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-500/20"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-4 float-up">
        <div className="flex-1 relative">
          <textarea
            key="chat-input-textarea"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "AI is thinking..." : "Ask Athisis.AI about your code..."}
            className={clsx(
              'w-full px-6 py-5 glass border-0 rounded-3xl',
              'text-gray-100 placeholder-gray-400 resize-none font-medium',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:glow-primary',
              'transition-glass min-h-[64px] max-h-40 overflow-y-auto text-base leading-relaxed'
            )}
            disabled={disabled}
            rows={1}
          />
        </div>

        <div className="flex items-center gap-2">
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
            size="md"
            icon={<Paperclip size={22} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="glass glass-hover transition-glass rounded-2xl p-4 text-gray-400 hover:text-white group"
          />
          
          <Button
            type="submit"
            disabled={disabled || (!input.trim() && attachedFiles.length === 0)}
            size="md"
            icon={disabled ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
            ) : (
              <Send size={20} className="group-hover:translate-x-0.5 transition-transform" />
            )}
            className="glass-strong glow-primary transition-glass rounded-2xl px-6 py-4 text-white font-medium group hover:glow-primary"
          />
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center font-normal">
        <span className="glass-subtle px-3 py-1 rounded-full">
          Press Enter to send • Shift+Enter for new line • Attach files for context
        </span>
      </div>
    </>
  );
}