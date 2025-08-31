'use client';

import { useEffect } from 'react';
import { CheckCircle, Warning, Info, XCircle, X } from '@phosphor-icons/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-400',
    title: 'text-green-800',
    message: 'text-green-700',
    iconComponent: CheckCircle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    message: 'text-red-700',
    iconComponent: XCircle,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    iconComponent: Warning,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    message: 'text-blue-700',
    iconComponent: Info,
  },
};

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const style = toastStyles[type];
  const IconComponent = style.iconComponent;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div className={`w-full min-w-[320px] max-w-md ${style.bg} border ${style.border} rounded-xl p-6 shadow-2xl transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-2 fade-in backdrop-blur-sm`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <IconComponent className={`h-6 w-6 ${style.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${style.title} leading-tight`}>
            {title}
          </p>
          {message && (
            <p className={`mt-2 text-sm ${style.message} leading-relaxed`}>
              {message}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 ml-2">
          <button
            className={`inline-flex rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 hover:bg-black hover:bg-opacity-10 ${style.title}`}
            onClick={() => onClose(id)}
          >
            <span className="sr-only">Fechar</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}