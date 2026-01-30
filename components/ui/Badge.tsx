import { ReactNode, memo } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'pending' | 'error' | 'default';
  className?: string;
}

function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    pending: 'badge-pending',
    error: 'badge-error',
    default: 'bg-slate-200 text-slate-700 border border-slate-300',
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default memo(Badge);
