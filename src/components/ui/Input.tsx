import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  textarea?: boolean;
  rows?: number;
  description?: string;
}

export function Input({ label, error, textarea, rows, description, className, ...props }: InputProps) {
  const Component = textarea ? 'textarea' : 'input';
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-2 font-normal">{description}</p>
      )}
      <Component
        className={clsx(
          'w-full px-4 py-3 glass border border-white/20 rounded-2xl',
          'text-gray-100 placeholder-gray-400 font-medium',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
          'transition-glass resize-none',
          error && 'border-red-500/50 focus:ring-red-500/50',
          textarea && 'min-h-[100px]',
          className
        )}
        rows={textarea ? rows : undefined}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}