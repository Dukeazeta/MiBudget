import React from 'react';
import { Logo } from './Logo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'lg', message, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="animate-pulse">
        <Logo size={size} />
      </div>
      {message && (
        <p className="mt-4 text-sm text-gray-500 animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}