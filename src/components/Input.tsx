/**
 * @file components/Input.tsx
 * @description Simple input component
 */

import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full px-4 ${icon ? 'pl-10' : 'pl-4'} py-2.5
            border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
            transition-all duration-200
            placeholder-gray-400 text-gray-900 text-base
            ${error ? 'border-red-500 focus:ring-red-600' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
