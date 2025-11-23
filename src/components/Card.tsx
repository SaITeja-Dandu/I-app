/**
 * @file components/Card.tsx
 * @description Simple card component with clean styling
 */

import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
}) => {

  return (
    <div
      className={`
        bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg
        border border-white/20
        ${hoverable ? 'hover:shadow-xl hover:bg-white transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`${className}`}>{children}</div>;
};
