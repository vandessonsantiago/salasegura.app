'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onProgress?: () => void;
  className?: string;
}

export default function TypingAnimation({ 
  text, 
  speed = 50, 
  onComplete, 
  onProgress,
  className = "" 
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Reset states when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        // Callback de progresso para scroll
        if (onProgress) {
          onProgress();
        }
      }, speed);

      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, onProgress]);

  return (
    <div className={`whitespace-pre-line ${className}`}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-5 bg-gray-900 dark:bg-white ml-0.5 animate-pulse">
          &nbsp;
        </span>
      )}
    </div>
  );
}
