'use client';

import { useState, useEffect, useCallback } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  maxDuration?: number; // Tempo máximo de animação em ms
  onComplete?: () => void;
  onProgress?: () => void;
  className?: string;
}

export default function TypingAnimation({ 
  text, 
  speed = 50, 
  maxDuration = 3000, // 3 segundos máximo
  onComplete, 
  onProgress,
  className = "" 
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Callback para completar a animação
  const completeAnimation = useCallback(() => {
    setIsTyping(false);
    if (onComplete) {
      // Usar setTimeout para evitar setState durante renderização
      setTimeout(() => {
        onComplete();
      }, 0);
    }
  }, [onComplete]);

  // Reset states when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [text]);

  useEffect(() => {
    // Calcular quantos caracteres devem ser mostrados por segundo
    const totalChars = text.length;
    const estimatedTimePerChar = speed;
    const estimatedTotalTime = totalChars * estimatedTimePerChar;
    
    // Se o tempo estimado for maior que o máximo, usar o máximo
    const actualDuration = Math.min(estimatedTotalTime, maxDuration);
    const charsPerInterval = Math.max(1, Math.ceil(totalChars / (actualDuration / speed)));

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    if (currentIndex < text.length) {
      intervalId = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = Math.min(prev + charsPerInterval, text.length);
          const newText = text.substring(0, nextIndex);
          setDisplayedText(newText);
          
          // Callback de progresso para scroll
          if (onProgress) {
            // Usar setTimeout para evitar setState durante renderização
            setTimeout(() => {
              onProgress();
            }, 0);
          }

          // Se chegou ao final, parar a animação
          if (nextIndex >= text.length) {
            completeAnimation();
            return nextIndex;
          }

          return nextIndex;
        });
      }, speed);

      // Timeout de segurança para garantir que a animação termine
      timeoutId = setTimeout(() => {
        setDisplayedText(text);
        setCurrentIndex(text.length);
        completeAnimation();
      }, actualDuration);
    } else {
      completeAnimation();
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [currentIndex, text, speed, maxDuration, onProgress, completeAnimation]);

  return (
    <div className={`whitespace-pre-line ${className}`}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-5 bg-gray-900 ml-0.5 animate-pulse">
          &nbsp;
        </span>
      )}
    </div>
  );
}
