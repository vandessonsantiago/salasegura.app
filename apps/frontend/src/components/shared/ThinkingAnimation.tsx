'use client';

import { useState, useEffect } from 'react';

interface ThinkingAnimationProps {
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export default function ThinkingAnimation({ 
  duration = 1500, 
  onComplete, 
  className = "" 
}: ThinkingAnimationProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-gray-500">Pensando</span>
      <div className="flex gap-1">
        <div 
          className={`w-2 h-2 rounded-full bg-gray-400 transition-all duration-300 ${
            dots >= 1 ? 'opacity-100' : 'opacity-30'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full bg-gray-400 transition-all duration-300 ${
            dots >= 2 ? 'opacity-100' : 'opacity-30'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full bg-gray-400 transition-all duration-300 ${
            dots >= 3 ? 'opacity-100' : 'opacity-30'
          }`}
        />
      </div>
    </div>
  );
}
