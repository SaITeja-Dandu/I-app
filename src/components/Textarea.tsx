/**
 * @file components/Textarea.tsx
 * @description Simple textarea component
 */

import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  maxLength,
  className = '',
  value,
  ...props
}) => {
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 rounded-lg
          border border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
          transition-all duration-200
          placeholder-gray-400 text-gray-900
          resize-none
          ${error ? 'border-red-500 focus:ring-red-600' : ''}
          ${className}
        `}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      <div className="flex justify-between items-center mt-1">
        <div>
          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-xs text-gray-500">{helperText}</p>
          )}
        </div>
        {maxLength && (
          <p className={`text-xs font-medium ${
            charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-500'
          }`}>
            {charCount} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};
