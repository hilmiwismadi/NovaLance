'use client';

import { ReactNode, memo, useCallback } from 'react';

interface AccordionProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  actionButton?: ReactNode;
  badge?: ReactNode;
  className?: string;
  contentClassName?: string;
  allowOverflow?: boolean;
}

function Accordion({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
  actionButton,
  badge,
  className = '',
  contentClassName = '',
  allowOverflow = false,
}: AccordionProps) {
  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className={`border border-slate-200/60 rounded-xl ${allowOverflow ? '' : 'overflow-hidden'} bg-white/40 backdrop-blur-sm ${className}`}>
      <div
        onClick={handleToggle}
        className="w-full px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between text-left hover:bg-white/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform duration-300 ease-out flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-base sm:text-lg">{title}</span>
              {badge}
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actionButton && (
          <div onClick={handleActionClick}>
            {actionButton}
          </div>
        )}
      </div>
      <div
        className={`transition-all duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}
      >
        <div className={`px-4 pb-4 sm:px-5 sm:pb-5 border-t border-slate-200/60 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default memo(Accordion);
