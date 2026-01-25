'use client';

import { ReactNode } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import Header from './Header';
import BottomNav from './BottomNav';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const { context } = useMiniKit();

  // Get safe area insets from MiniKit context
  const safeAreaTop = context?.client?.safeAreaInsets?.top ?? 0;
  const safeAreaBottom = context?.client?.safeAreaInsets?.bottom ?? 0;

  const containerStyle = {
    paddingTop: `${Math.max(safeAreaTop, 24)}px`, // At least 24px for header
    paddingBottom: `${Math.max(safeAreaBottom, 96)}px`, // At least 96px for bottom nav
  };

  return (
    <>
      <div className="min-h-screen" style={containerStyle}>
        <Header />
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
