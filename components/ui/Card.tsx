import { ReactNode, MouseEvent, memo } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

function Card({ children, className = '', hover = false, gradient = false, onClick }: CardProps) {
  const baseClasses = 'glass-card p-4 md:p-6';
  const hoverClasses = hover ? 'hover:bg-white/10 transition-all duration-300 cursor-pointer' : '';
  const gradientClasses = gradient ? 'border-brand-500/30 shadow-glass' : '';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export default memo(Card);
