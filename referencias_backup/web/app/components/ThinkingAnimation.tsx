'use client';

import { useState, useEffect } from 'react';
import { constants } from '../constants';

interface ThinkingAnimationProps {
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export default function ThinkingAnimation({ 
  duration = 2000, 
  onComplete, 
  className = "" 
}: ThinkingAnimationProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 500);

    const timer = setTimeout(() => {
      clearInterval(interval);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration, onComplete]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-gray-500 dark:text-gray-400">{constants.chat.thinking}</span>
      <div className="flex gap-1">
        <div 
          className={`w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 transition-all duration-300 ${
            dots >= 1 ? 'opacity-100' : 'opacity-30'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 transition-all duration-300 ${
            dots >= 2 ? 'opacity-100' : 'opacity-30'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 transition-all duration-300 ${
            dots >= 3 ? 'opacity-100' : 'opacity-30'
          }`}
        />
      </div>
    </div>
  );
}
