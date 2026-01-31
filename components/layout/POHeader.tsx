'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import NotificationBell from './NotificationBell';
import RoleSwitcher from '@/components/ui/RoleSwitcher';
import WalletConnectModal from '@/components/auth/WalletConnectModal';
import { useIDRXBalance } from '@/lib/hooks';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { formatCurrency } from '@/lib/contract';

interface NavItem {
  href: string;
  label: string;
}

interface POHeaderProps {
  navItems: NavItem[];
}

export default function POHeader({ navItems }: POHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Use wagmi's useAccount for real wallet connection state
  const { address, isConnected, status } = useAccount();
  const { disconnect } = useDisconnect();

  // Get user's IDRX token balance
  const { balance: tokenBalance, formatted: tokenBalanceFormatted, isLoading: isBalanceLoading } = useIDRXBalance(address);

  useEffect(() => {
    setMounted(true);

    // Only access localStorage after component is mounted (client-side only)
    if (typeof window !== 'undefined') {
      // Get logged in username
      const storedUsername = localStorage.getItem('po-username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }
  }, []);

  // Sync wallet connection state with wagmi
  useEffect(() => {
    if (isConnected && address && status === 'connected') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('po-wallet-connected', 'true');
        localStorage.setItem('po-wallet-address', address);
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('po-wallet-connected');
        localStorage.removeItem('po-wallet-address');
      }
    }
  }, [isConnected, address, status]);

  const handleLogout = () => {
    // Also disconnect wallet when logging out
    disconnect();
    localStorage.removeItem('po-auth');
    localStorage.removeItem('po-username');
    router.push('/PO/login');
  };

  const handleWalletConnected = () => {
    setShowWalletModal(false);
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  // Compute these once to avoid hydration issues - use username if available, otherwise use wallet address
  const displayUsername = username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet');
  const userInitial = username ? username[0].toUpperCase() : (address ? address.slice(2, 3).toUpperCase() : '?');

  // Format wallet address for display
  const formatWalletAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={handleWalletConnected}
      />

      <header className="sticky top-0 z-40 glass-card border-t-0 border-x-0 rounded-none bg-white/70">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/PO" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent hidden sm:block">
                NovaLance
              </span>
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full ml-1">
                PO
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = mounted && (
                  pathname === item.href ||
                  (item.href === '/PO/projects' && pathname.startsWith('/PO/projects') && pathname !== '/PO/projects')
                );
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

            {/* Right side - Role Switcher, Notification & Profile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <RoleSwitcher variant="header" />
              <NotificationBell />

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
                        <h3 className="font-semibold text-slate-800">Menu</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {/* Navigation Items */}
                        {navItems.map((item) => {
                          const isActive = mounted && (
                            pathname === item.href ||
                            (item.href === '/PO/projects' && pathname.startsWith('/PO/projects') && pathname !== '/PO/projects')
                          );
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setShowMobileMenu(false)}
                              className={`flex items-center gap-3 p-4 transition-colors ${
                                isActive
                                  ? 'bg-brand-50 text-brand-600'
                                  : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <span className="text-sm font-medium flex-1">{item.label}</span>
                              {isActive && (
                                <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Quick Actions</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {/* Wallet Connection */}
                        {isConnected && address ? (
                          <>
                            <div className="w-full flex items-center gap-3 p-4 bg-emerald-50 border-b border-slate-100">
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
                            <button
                              onClick={() => {
                                handleDisconnectWallet();
                                setShowMobileMenu(false);
                              }}
                              className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-slate-800">Wallet Connected</p>
                                <p className="text-xs text-slate-500">{formatWalletAddress(address)}</p>
                              </div>
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setShowWalletModal(true);
                              setShowMobileMenu(false);
                            }}
                            className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-slate-800">Connect Wallet</p>
                              <p className="text-xs text-slate-500">Connect to earn yield</p>
                            </div>
                          </button>
                        )}

                        {/* Profile */}
                        <Link
                          href="/PO/profile"
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {userInitial}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{displayUsername}</p>
                            <p className="text-xs text-slate-500">View Profile</p>
                          </div>
                        </Link>

                        {/* Logout */}
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowMobileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-red-600">Logout</p>
                            <p className="text-xs text-slate-500">Sign out of your account</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Wallet Connection Button - Desktop */}
              {isConnected && address ? (
                <div className="hidden sm:flex items-center gap-2">
                  {/* Token Balance Display */}
                  <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-indigo-700">
                      {isBalanceLoading ? (
                        '...'
                      ) : tokenBalance !== undefined ? (
                        <CurrencyDisplay
                          amount={formatCurrency(tokenBalance, 'IDRX')}
                          currency="IDRX"
                          className="text-xs font-semibold text-indigo-700"
                        />
                      ) : (
                        '0 IDRX'
                      )}
                    </span>
                  </div>
                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnectWallet}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors group"
                    title="Connected - Click to disconnect"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 hidden md:block">
                      {formatWalletAddress(address)}
                    </span>
                    <svg className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                  title="Connect Wallet"
                >
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-xs font-medium text-amber-700 hidden md:block">Connect Wallet</span>
                </button>
              )}

              {/* Profile - Desktop */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-slate-200 shadow-sm">
                <Link href="/PO/profile" className="flex items-center gap-2 hover:bg-white/80 rounded-full transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {userInitial}
                    </span>
                  </div>
                  <span className="text-sm text-slate-700 hidden md:block">
                    {displayUsername}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-1 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-red-600"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
