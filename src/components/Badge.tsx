/**
 * @file components/Badge.tsx
 * @description Simple badge component
 */

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'secondary',
  size = 'md',
  icon,
}) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-900',
    secondary: 'bg-gray-200 text-gray-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-100 text-red-900',
    info: 'bg-blue-50 text-blue-900',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs font-semibold',
    md: 'px-4 py-1.5 text-sm font-semibold',
    lg: 'px-5 py-2 text-base font-bold',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
};
