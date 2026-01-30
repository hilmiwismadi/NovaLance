'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function POLoginPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  // If already connected, redirect to dashboard
  if (isConnected && address) {
    router.push('/PO');
    return null;
  }

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Try to connect with MetaMask via injected connector
      await connect({ connector: injected() });

      // Store connection state
      if (typeof window !== 'undefined') {
        localStorage.setItem('po-wallet-connected', 'true');
        if (address) {
          localStorage.setItem('po-wallet-address', address);
        }
      }

      // Redirect to dashboard
      router.push('/PO');
    } catch (err) {
      const error = err as Error;
      setError('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
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
          <p className="text-slate-600 mt-1">Connect your wallet to manage projects</p>
        </div>

        {/* Wallet Connection Card */}
        <Card className="p-8">
          <div className="space-y-6">
            {/* MetaMask Connection */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleWalletConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M36 20C36 28.8366 28.8366 36 20 36C11.1634 36 4 28.8366 4 20C4 11.1634 11.1634 4 20 4C28.8366 4 36 11.1634 36 20Z" fill="#F6851B"/>
                    <path d="M25.2842 21.2842C25.2842 21.2842 24.4916 21.6527 23.4146 21.9612C22.3376 22.2697 21.1071 22.4395 20.0037 22.4395C18.9004 22.4395 17.6606 22.2627 16.5698 21.9455C15.4791 21.6283 14.6695 21.2479 14.6695 21.2479C14.6695 21.2479 16.2678 21.0977 17.4618 21.4189C18.6558 21.7401 19.5404 22.3546 19.5404 22.3546C19.5404 22.3546 18.7478 22.6098 17.8157 22.6914C16.8837 22.773 15.8547 22.6292 15.8547 22.6292L19.0068 27.4173C19.0068 27.4173 19.2425 28.0163 20.0037 28.0163C20.7649 28.0163 21.0007 27.4173 21.0007 27.4173L24.1528 22.6292C24.1528 22.6292 23.1238 22.773 22.1917 22.6914C21.2596 22.6098 20.467 22.3546 20.467 22.3546C20.467 22.3546 21.3516 21.7401 22.5456 21.4189C23.7396 21.0977 25.338 21.2479 25.338 21.2479L25.2842 21.2842Z" fill="white"/>
                    <path d="M15.8219 13.9382C16.8778 13.9382 17.8779 14.2845 18.6685 14.8784C19.4592 15.4724 20.0007 16.2941 20.0007 17.2094C20.0007 18.1247 19.4592 18.9464 18.6685 19.5404C17.8779 20.1343 16.8778 20.4806 15.8219 20.4806C14.7659 20.4806 13.7658 20.1343 12.9752 19.5404C12.1845 18.9464 11.643 18.1247 11.643 17.2094C11.643 16.2941 12.1845 15.4724 12.9752 14.8784C13.7658 14.2845 14.7659 13.9382 15.8219 13.9382ZM24.1787 13.9382C25.2347 13.9382 26.2348 14.2845 27.0254 14.8784C27.816 15.4724 28.3575 16.2941 28.3575 17.2094C28.3575 18.1247 27.816 18.9464 27.0254 19.5404C26.2348 20.1343 25.2347 20.4806 24.1787 20.4806C23.1228 20.4806 22.1227 20.1343 21.332 19.5404C20.5414 18.9464 19.9999 18.1247 19.9999 17.2094C19.9999 16.2941 20.5414 15.4724 21.332 14.8784C22.1227 14.2845 23.1228 13.9382 24.1787 13.9382Z" fill="white"/>
                  </svg>
                  Connect MetaMask
                </span>
              )}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong className="font-semibold">Wallet Required:</strong> Connect your MetaMask wallet to access the Project Owner portal.
              </p>
            </div>

            {/* Help Link */}
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600">
                Don't have MetaMask?{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Install here
                </a>
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
