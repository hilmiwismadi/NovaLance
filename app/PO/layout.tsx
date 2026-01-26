'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleProvider, useRole } from '@/lib/useRole';
import POHeader from '@/components/layout/POHeader';
import POBottomNav from '@/components/layout/POBottomNav';

interface POLayoutProps {
  children: ReactNode;
}

function POLayoutContent({ children }: POLayoutProps) {
  const pathname = usePathname();
  const { role } = useRole();

  // Redirect if not in PO mode
  if (role !== 'PO' && typeof window !== 'undefined') {
    if (typeof window !== 'undefined') {
      window.location.href = '/FL';
    }
  }

  const navItems = [
    { href: '/PO', label: 'Dashboard' },
    { href: '/PO/projects', label: 'Projects' },
    { href: '/PO/create-project', label: 'Create Project' },
    { href: '/PO/profile', label: 'Profile' },
  ];

  return (
    <>
      <POHeader navItems={navItems} />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        {children}
      </main>
      <POBottomNav />
    </>
  );
}

export default function POLayout({ children }: POLayoutProps) {
  return (
    <RoleProvider defaultRole="PO">
      <div className="min-h-screen pb-24 md:pb-8">
        <POLayoutContent>{children}</POLayoutContent>
      </div>
    </RoleProvider>
  );
}
