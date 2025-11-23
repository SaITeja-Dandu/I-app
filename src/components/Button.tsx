/**
 * @file components/Button.tsx
 * @description Simple button component with clean styling
 */

import { type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses = {
  primary:
    'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 disabled:from-gray-400 disabled:to-gray-400 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100',
  secondary:
    'bg-white text-blue-600 border-2 border-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-400 shadow-md hover:shadow-lg',
  danger:
    'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 active:from-red-800 active:to-pink-800 disabled:from-red-300 disabled:to-pink-300 shadow-lg hover:shadow-xl',
  outline:
    'border-2 border-blue-600 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 disabled:border-gray-400 disabled:text-gray-400 hover:border-purple-600',
  ghost:
    'text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 disabled:text-gray-400',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm font-semibold rounded-xl',
  md: 'px-6 py-2.5 text-base font-semibold rounded-xl',
  lg: 'px-8 py-3 text-lg font-bold rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
