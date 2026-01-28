'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import WalletConnectModal from '@/components/auth/WalletConnectModal';

export default function POLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    setTimeout(() => {
      // Mock login - any username/password works
      if (username.trim() && password.trim()) {
        // Store mock auth in localStorage (client-side only)
        if (typeof window !== 'undefined') {
          localStorage.setItem('po-auth', 'true');
          localStorage.setItem('po-username', username);

          // Check if wallet is already connected or skipped
          const walletConnected = localStorage.getItem('po-wallet-connected');
          const walletSkipped = localStorage.getItem('po-wallet-skipped');

          setIsLoading(false);

          // Show wallet modal if not already connected/skipped
          if (!walletConnected && !walletSkipped) {
            setShowWalletModal(true);
          } else {
            // Redirect to PO dashboard
            router.push('/PO');
          }
        }
      } else {
        setError('Please enter both username and password');
        setIsLoading(false);
      }
    }, 500);
  };

  const handleWalletConnected = () => {
    router.push('/PO');
  };

  const handleWalletModalClose = () => {
    setShowWalletModal(false);
    router.push('/PO');
  };

  return (
    <>
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={handleWalletModalClose}
        onConnected={handleWalletConnected}
      />

      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Project Owner Portal</h1>
            <p className="text-slate-600 mt-1">Sign in to manage your projects</p>
          </div>

        {/* Login Card */}
        <Card className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="Enter your username"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Mock Info */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong className="font-semibold">Mock Login:</strong> Enter any username and password to sign in.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
        </div>
      </div>
    </>
  );
}
