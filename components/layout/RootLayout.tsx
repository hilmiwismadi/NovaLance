'use client';

import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <div className="min-h-screen pb-24 md:pb-8">
        <Header />
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
