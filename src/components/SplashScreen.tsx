import React from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  message?: string;
}

export function SplashScreen({ message = 'Loading...' }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-bounce-gentle">
          <Logo size="xl" className="w-24 h-24" />
        </div>
        
        <div className="mt-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Mi<span className="text-blue-600">Budget</span>
          </h1>
          <p className="text-gray-600 text-center font-medium">{message}</p>
        </div>
        
        {/* Minimal loading indicator */}
        <div className="mt-6 flex space-x-1">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}
