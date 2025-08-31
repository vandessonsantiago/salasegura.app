'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from './Toast';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

export default function ToastProvider({ children, position = 'top-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const getPositionClasses = (pos: ToastPosition) => {
    const baseClasses = "fixed z-[9999] space-y-4 max-w-lg";
    
    switch (pos) {
      case 'top-right':
        return `${baseClasses} top-8 right-8`;
      case 'top-left':
        return `${baseClasses} top-8 left-8`;
      case 'bottom-right':
        return `${baseClasses} bottom-8 right-8`;
      case 'bottom-left':
        return `${baseClasses} bottom-8 left-8`;
      case 'top-center':
        return `${baseClasses} top-8 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseClasses} bottom-8 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseClasses} top-8 right-8`;
    }
  };

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastData = {
      id,
      type,
      title,
      message,
      duration,
    };

    setToasts((prevToasts) => [...prevToasts, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    addToast('success', title, message, duration);
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addToast('error', title, message, duration);
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    addToast('warning', title, message, duration);
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    addToast('info', title, message, duration);
  }, [addToast]);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className={getPositionClasses(position)}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Named export for compatibility
export { ToastProvider };