'use client';

import { useRole } from '@/lib/useRole';
import { useRouter } from 'next/navigation';

interface RoleSwitcherProps {
  variant?: 'header' | 'standalone';
}

export default function RoleSwitcher({ variant = 'header' }: RoleSwitcherProps) {
  const { role, toggleRole } = useRole();
  const router = useRouter();

  const handleSwitch = () => {
    toggleRole();
    // Router push is handled by toggleRole
  };

  if (variant === 'standalone') {
    return (
      <button
        onClick={handleSwitch}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
      >
        {role === 'PO' ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Switch to Freelancer View
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Switch to Project Owner View
          </>
        )}
      </button>
    );
  }

  // Header variant - smaller, more compact
  return (
    <button
      onClick={handleSwitch}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
      title={`Switch to ${role === 'PO' ? 'Freelancer' : 'Project Owner'} View`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span className="hidden sm:inline">
        {role === 'PO' ? 'FL View' : 'PO View'}
      </span>
    </button>
  );
}
