'use client';

import { useState } from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { mockUser } from '@/lib/mockData';

export default function Header() {
  const [isConnected] = useState(true);

  return (
    <header className="sticky top-0 z-40 glass-card border-t-0 border-x-0 rounded-none bg-white/70">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
            NovaLance
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          {isConnected ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-slate-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {mockUser.ens?.[0].toUpperCase() || mockUser.address[2].toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-slate-700 hidden md:block">
                {mockUser.ens || `${mockUser.address.slice(0, 6)}...${mockUser.address.slice(-4)}`}
              </span>
            </div>
          ) : (
            <button className="glass-button px-4 py-2 rounded-xl text-sm font-medium">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
