'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';
import RoleSwitcher from '@/components/ui/RoleSwitcher';
import WalletConnectModal from '@/components/auth/WalletConnectModal';
import { mockUser } from '@/lib/mockData';

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
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only access localStorage after component is mounted (client-side only)
    if (typeof window !== 'undefined') {
      // Get logged in username
      const storedUsername = localStorage.getItem('po-username');
      if (storedUsername) {
        setUsername(storedUsername);
      }

      // Check wallet connection status
      const isWalletConnected = localStorage.getItem('po-wallet-connected');
      const storedWalletAddress = localStorage.getItem('po-wallet-address');
      if (isWalletConnected && storedWalletAddress) {
        setWalletConnected(true);
        setWalletAddress(storedWalletAddress);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('po-auth');
    localStorage.removeItem('po-username');
    router.push('/PO/login');
  };

  const handleWalletConnected = () => {
    setWalletConnected(true);
    setWalletAddress(localStorage.getItem('po-wallet-address') || '');
    setShowWalletModal(false);
  };

  const handleDisconnectWallet = () => {
    localStorage.removeItem('po-wallet-connected');
    localStorage.removeItem('po-wallet-address');
    setWalletConnected(false);
    setWalletAddress('');
  };

  // Compute these once to avoid hydration issues - use mock username if logged in, otherwise use mock data
  const displayUsername = username || (mockUser.ens || `${mockUser.address.slice(0, 6)}...${mockUser.address.slice(-4)}`);
  const userInitial = username ? username[0].toUpperCase() : (mockUser.ens ? mockUser.ens[0].toUpperCase() : mockUser.address[2].toUpperCase());

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

          {/* Right side - Role Switcher, Notification & Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <RoleSwitcher variant="header" />
            <NotificationBell />

            {/* Wallet Connection Button */}
            {walletConnected ? (
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
                  {formatWalletAddress(walletAddress)}
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
