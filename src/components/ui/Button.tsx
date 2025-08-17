import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl font-medium transition-glass',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'glass-strong glow-primary text-white hover:glow-primary': variant === 'primary',
          'glass glass-hover text-gray-100': variant === 'secondary',
          'glass-hover text-gray-300 hover:text-white': variant === 'ghost',
          'glass-strong bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-500/30': variant === 'danger',
        },
        {
          'px-4 py-2 text-sm': size === 'sm',
          'px-5 py-3 text-sm': size === 'md',
          'px-7 py-4 text-base': size === 'lg',
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
}