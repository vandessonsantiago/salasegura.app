'use client';

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

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
  const safeText = typeof text === 'string' ? text : '';
  console.log('⌨️ TypingAnimation iniciada com texto:', { text, safeText, length: safeText.length });
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);

    if (safeText) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          
          if (newIndex <= safeText.length) {
            setDisplayText(safeText.slice(0, newIndex));
            
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
  }, [safeText, speed, onComplete, onProgress]);

  return (
    <div className="whitespace-pre-wrap">
      <ReactMarkdown
        components={{
          // Parágrafos com espaçamento reduzido
                    // Parágrafos sem espaçamento
                    p: ({node, ...props}) => <p className="mb-0 leading-relaxed" {...props} />,          // Texto em negrito
          strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
          
          // Texto em itálico
          em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
          
                    // Listas sem espaçamento
                    ul: ({node, ...props}) => <ul className="mb-0 space-y-0" {...props} />,
                    
                    // Listas ordenadas sem espaçamento
                    ol: ({node, ...props}) => <ol className="mb-0 space-y-0" {...props} />,
                    
                    // Items de lista sem espaçamento
                    li: ({node, ...props}) => <li className="mb-0" {...props} />,          // Links
          a: ({node, ...props}) => (
            <a 
              className="text-teal-600 hover:text-teal-800 underline font-medium" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          
          // Títulos sem espaçamento
          h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mb-0 mt-0" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 mb-0 mt-0" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-bold text-gray-900 mb-0 mt-0" {...props} />,
          
          // Código inline
          code: ({node, ...props}) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />
          ),
          
          // Blocos de código
          pre: ({node, ...props}) => (
            <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-2" {...props} />
          )
        }}
      >
        {displayText}
      </ReactMarkdown>
      {currentIndex < safeText.length && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
}
