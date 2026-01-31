'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RoleProvider, useRole } from '@/lib/useRole';
import POHeader from '@/components/layout/POHeader';
import POBottomNav from '@/components/layout/POBottomNav';

interface POLayoutProps {
  children: ReactNode;
}

function POLayoutContent({ children }: POLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if user is authenticated
    const authStatus = localStorage.getItem('po-auth');
    const isLoginRoute = pathname === '/PO/login';

    if (!authStatus && !isLoginRoute) {
      // Not authenticated and not on login page, redirect to login
      router.push('/PO/login');
    } else if (authStatus && isLoginRoute) {
      // Already authenticated and on login page, redirect to dashboard
      router.push('/PO');
    } else {
      setIsAuthenticated(!!authStatus);
    }
    setIsLoading(false);
  }, [pathname, router, mounted]);

  // Show login page without header/footer
  if (pathname === '/PO/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Redirect if not in PO mode
  if (role !== 'PO') {
    router.push('/FL');
  }

  const navItems = [
    { href: '/PO', label: 'Dashboard' },
    { href: '/PO/projects', label: 'Projects' },
    { href: '/PO/portfolio', label: 'Portfolio Performance' },
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
