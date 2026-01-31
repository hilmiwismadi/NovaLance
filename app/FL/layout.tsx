'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { RoleProvider, useRole } from '@/lib/useRole';
import FLHeader from '@/components/layout/FLHeader';
import FLBottomNav from '@/components/layout/FLBottomNav';

interface FLLayoutProps {
  children: ReactNode;
}

function FLLayoutContent({ children }: FLLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('📍 FL Layout mounted, pathname:', pathname);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    console.log('🔍 Checking authentication...');

    // Check if user is authenticated (has JWT token)
    const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('novalance_jwt') : null;
    console.log('📝 JWT Token present:', !!jwtToken, jwtToken ? jwtToken.substring(0, 20) + '...' : 'none');

    if (!jwtToken) {
      // Not authenticated, redirect to login
      console.log('❌ No JWT token, redirecting to /PO/login');
      router.push('/PO/login');
    } else {
      console.log('✅ JWT token found, user authenticated');
      setIsAuthenticated(!!jwtToken);
    }
    setIsLoading(false);
  }, [pathname, router, mounted]);

  // Show loading state
  if (isLoading) {
    console.log('⏳ FL Layout: showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
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
