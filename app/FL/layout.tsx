'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleProvider, useRole } from '@/lib/useRole';
import FLHeader from '@/components/layout/FLHeader';
import FLBottomNav from '@/components/layout/FLBottomNav';

interface FLLayoutProps {
  children: ReactNode;
}

function FLLayoutContent({ children }: FLLayoutProps) {
  const pathname = usePathname();
  const { role } = useRole();

  // Redirect if not in FL mode
  if (role !== 'FL' && typeof window !== 'undefined') {
    if (typeof window !== 'undefined') {
      window.location.href = '/PO';
    }
  }

  const navItems = [
    { href: '/FL', label: 'Dashboard' },
    { href: '/FL/jobs', label: 'Browse Jobs' },
    { href: '/FL/projects', label: 'Projects' },
    { href: '/FL/profile', label: 'Profile' },
  ];

  return (
    <>
      <FLHeader navItems={navItems} />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        {children}
      </main>
      <FLBottomNav />
    </>
  );
}

export default function FLLayout({ children }: FLLayoutProps) {
  return (
    <RoleProvider defaultRole="FL">
      <div className="min-h-screen pb-24 md:pb-8">
        <FLLayoutContent>{children}</FLLayoutContent>
      </div>
    </RoleProvider>
  );
}
