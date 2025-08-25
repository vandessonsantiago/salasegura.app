'use client';

import { useEffect, useState, useRef } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onProgress?: () => void;
}

export default function TypingAnimation({ 
  text, 
  speed = 30, 
  onComplete, 
  onProgress 
}: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);

    if (text) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          
          if (newIndex <= text.length) {
            setDisplayText(text.slice(0, newIndex));
            
            // Chamar callback de progresso
            if (onProgress) {
              onProgress();
            }
            
            return newIndex;
          } else {
            // Animação completa
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            
            if (onComplete) {
              setTimeout(onComplete, 100); // Pequeno delay antes de completar
            }
            
            return prevIndex;
          }
        });
      }, speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, onComplete, onProgress]);

  return (
    <div className="whitespace-pre-wrap">
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
}
