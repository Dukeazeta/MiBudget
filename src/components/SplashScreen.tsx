import React from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  message?: string;
}

export function SplashScreen({ message = 'Loading...' }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-pulse">
          <Logo size="xl" className="w-32 h-32" />
        </div>
        
        {/* Subtle loading indicator */}
        <div className="mt-8 flex space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}
