/**
 * @file components/Alert.tsx
 * @description Modern alert/toast notification component
 */

import { useEffect } from 'react';
import type { AlertState } from '../types';

interface AlertProps extends AlertState {
  onClose: () => void;
}

const alertColors = {
  success: 'bg-green-50 text-green-900 border-green-200',
  error: 'bg-red-50 text-red-900 border-red-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  info: 'bg-blue-50 text-blue-900 border-blue-200',
};

const alertIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export const Alert: React.FC<AlertProps> = ({
  message,
  type,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg 
        border backdrop-blur-sm z-50 
        ${alertColors[type]} 
        animate-in fade-in slide-in-from-right-5 duration-300
        flex items-center gap-3 max-w-md
      `}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg">{alertIcons[type]}</span>
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
};
