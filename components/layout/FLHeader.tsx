'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import NotificationBell from './NotificationBell';
import RoleSwitcher from '@/components/ui/RoleSwitcher';
import { useIDRXBalance } from '@/lib/hooks';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';

interface NavItem {
  href: string;
  label: string;
}

interface FLHeaderProps {
  navItems: NavItem[];
}

export default function FLHeader({ navItems }: FLHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Get wallet address for token balance and display
  const { address } = useAccount();
  const { balance: tokenBalance, formatted: tokenBalanceFormatted, isLoading: isBalanceLoading } = useIDRXBalance(address);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute user display from actual wallet address
  const userInitial = address ? address.slice(2, 3).toUpperCase() : '?';
  const userDisplay = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet';

  return (
    <header className="sticky top-0 z-40 glass-card border-t-0 border-x-0 rounded-none bg-white/70">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/FL" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent hidden sm:block">
              NovaLance
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">
              FL
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

          {/* Right side - Role Switcher, Token Balance & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <RoleSwitcher variant="header" />
            <NotificationBell />

            {/* Token Balance Display - Desktop */}
            {address && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-indigo-700">
                  {isBalanceLoading ? (
                    '...'
                  ) : tokenBalance !== undefined ? (
                    <CurrencyDisplay amount={formatCurrency(tokenBalance, 'IDRX')} currency="IDRX" className="text-xs font-semibold" />
                  ) : (
                    '0 IDRX'
                  )}
                </span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="relative md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Mobile Menu Dropdown */}
              {showMobileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMobileMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 glass-card z-20 bg-white/90">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-800">Quick Actions</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {/* Token Balance - Mobile */}
                      {address && (
                        <div className="flex items-center gap-3 p-4 bg-indigo-50">
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-semibold text-indigo-700">
                              {isBalanceLoading ? (
                                '...'
                              ) : tokenBalance ? (
                                <CurrencyDisplay amount={formatCurrency(tokenBalance, 'IDRX')} currency="IDRX" className="text-xs font-semibold" />
                              ) : (
                                '0 IDRX'
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Profile */}
                      <Link
                        href="/FL/profile"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {userInitial}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{userDisplay}</p>
                          <p className="text-xs text-slate-500">View Profile</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile - Desktop */}
            <Link href="/FL/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-slate-200 shadow-sm hover:bg-white/80 transition-colors">
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
