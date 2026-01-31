'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import NotificationBell from './NotificationBell';
import RoleSwitcher from '@/components/ui/RoleSwitcher';
import WalletConnectModal from '@/components/auth/WalletConnectModal';
import { mockUser } from '@/lib/mockData';

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
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Use wagmi's useAccount for real wallet connection state
  const { address, isConnected, status } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);

    // Only access localStorage after component is mounted (client-side only)
    // Get logged in username
    const storedUsername = localStorage.getItem('fl-username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Sync wallet connection state with wagmi
  useEffect(() => {
    if (isConnected && address && status === 'connected') {
      localStorage.setItem('fl-wallet-connected', 'true');
      localStorage.setItem('fl-wallet-address', address);
    } else {
      localStorage.removeItem('fl-wallet-connected');
      localStorage.removeItem('fl-wallet-address');
    }
  }, [isConnected, address, status]);

  const handleLogout = () => {
    // Also disconnect wallet when logging out
    disconnect();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fl-auth');
      localStorage.removeItem('fl-username');
    }
    router.push('/FL/login');
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

  const toggleMobileMenu = () => {
    if (showMobileMenu) {
      setIsMenuAnimating(true);
      setTimeout(() => {
        setShowMobileMenu(false);
        setIsMenuAnimating(false);
      }, 200);
    } else {
      setShowMobileMenu(true);
    }
  };

  // Compute these once to avoid hydration issues - use mock username if logged in, otherwise use mock data
  const displayUsername = username || (mockUser.ens || `${mockUser.address.slice(0, 6)}...${mockUser.address.slice(-4)}`);
  const userInitial = username ? username[0].toUpperCase() : (mockUser.ens ? mockUser.ens[0].toUpperCase() : mockUser.address[2].toUpperCase());

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
            <Link href="/FL" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/NovaLanceLogo.png"
                alt="NovaLance"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
              />
              <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent hidden sm:block">
                NovaLance
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">
                Freelancer
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = mounted && (
                  pathname === item.href ||
                  (item.href === '/FL/jobs' && pathname.startsWith('/FL/jobs') && pathname !== '/FL/jobs') ||
                  (item.href === '/FL/projects' && pathname.startsWith('/FL/projects') && pathname !== '/FL/projects')
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
                  onClick={toggleMobileMenu}
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
                {(showMobileMenu || isMenuAnimating) && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={toggleMobileMenu}
                    />
                    <div
                      ref={mobileMenuRef}
                      className="absolute right-0 top-full mt-2 w-80 glass-card z-20 bg-white/90"
                      style={{
                        opacity: showMobileMenu ? 1 : 0,
                        transform: showMobileMenu ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
                        transformOrigin: 'top right',
                        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
                      }}
                    >
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Menu</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {/* Navigation Items */}
                        {navItems.map((item) => {
                          const isActive = mounted && (
                            pathname === item.href ||
                            (item.href === '/FL/jobs' && pathname.startsWith('/FL/jobs') && pathname !== '/FL/jobs') ||
                            (item.href === '/FL/projects' && pathname.startsWith('/FL/projects') && pathname !== '/FL/projects')
                          );
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={toggleMobileMenu}
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
                          <button
                            onClick={() => {
                              handleDisconnectWallet();
                              toggleMobileMenu();
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
                        ) : (
                          <button
                            onClick={() => {
                              setShowWalletModal(true);
                              toggleMobileMenu();
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
                              <p className="text-xs text-slate-500">Connect to receive payments</p>
                            </div>
                          </button>
                        )}

                        {/* Profile */}
                        <Link
                          href="/FL/profile"
                          onClick={toggleMobileMenu}
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
                            toggleMobileMenu();
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
                <button
                  onClick={handleDisconnectWallet}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors group"
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
                <Link href="/FL/profile" className="flex items-center gap-2 hover:bg-white/80 rounded-full transition-colors">
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
