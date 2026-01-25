'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import { mockUser } from '@/lib/mockData';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/projects', label: 'Projects' },
];

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute these once to avoid hydration issues
  const userInitial = mockUser.ens ? mockUser.ens[0].toUpperCase() : mockUser.address[2].toUpperCase();
  const userDisplay = mockUser.ens || `${mockUser.address.slice(0, 6)}...${mockUser.address.slice(-4)}`;

  return (
    <header className="sticky top-0 z-40 glass-card border-t-0 border-x-0 rounded-none bg-white/70">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent hidden sm:block">
              NovaLance
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = mounted && pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${
                    isActive
                      ? 'text-brand-600 bg-brand-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Notification & Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationBell />

            <Link href="/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-slate-200 shadow-sm hover:bg-white/80 transition-colors">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {userInitial}
                </span>
              </div>
              <span className="text-sm text-slate-700 hidden md:block">
                {userDisplay}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
