'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
  onConnected,
}: WalletConnectModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using your MetaMask wallet',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <path d="M36.3429 9.58666L22.2971 2.49793C21.1445 1.90812 19.7543 1.90812 18.6017 2.49793L4.55597 9.58666C3.14546 10.3207 2.25 11.7862 2.25 13.3827V26.7576C2.25 28.3541 3.14546 29.8196 4.55597 30.5536L18.6017 37.6424C19.7543 38.2322 21.1445 38.2322 22.2971 37.6424L36.3429 30.5536C37.7534 29.8196 38.6489 28.3541 38.6489 26.7576V13.3827C38.6489 11.7862 37.7534 10.3207 36.3429 9.58666Z" fill="#E2761B" stroke="#E2761B"/>
        </svg>
      ),
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Scan with WalletConnect to connect',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <path d="M10.5 15C15.7467 10.5 24.2533 10.5 29.5 15M13 18C16.5 15 23.5 15 27 18M15.5 21C17.5 19.5 22.5 19.5 24.5 21" stroke="#3B99FC" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect using your Coinbase Wallet',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#0052FF"/>
          <path d="M20 11C15.0294 11 11 15.0294 11 20C11 24.9706 15.0294 29 20 29C24.9706 29 29 24.9706 29 20C29 15.0294 24.9706 11 20 11ZM20 25.5C16.9624 25.5 14.5 23.0376 14.5 20C14.5 16.9624 16.9624 14.5 20 14.5C23.0376 14.5 25.5 16.9624 25.5 20C25.5 23.0376 23.0376 25.5 20 25.5Z" fill="white"/>
        </svg>
      ),
    },
  ];

  const handleConnect = (walletId: string) => {
    setSelectedWallet(walletId);
    // Mock connection for UI demo
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('po-wallet-connected', 'true');
        localStorage.setItem('po-wallet-address', '0x' + Math.random().toString(16).slice(2, 42));
      }
      if (onConnected) {
        onConnected();
      }
      onClose();
    }, 1500);
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('po-wallet-skipped', 'true');
    }
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleLater} title="" showCloseButton={false}>
      <div className="text-center">
        {/* Wallet Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-slate-600 mb-6">
          Connect your wallet to interact with smart contracts and manage payments
        </p>

        {/* Wallet Options */}
        <div className="space-y-3 mb-6">
          {walletOptions.map((wallet) => {
            const isConnecting = selectedWallet === wallet.id;

            return (
              <button
                key={wallet.id}
                onClick={() => !isConnecting && handleConnect(wallet.id)}
                disabled={isConnecting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex-shrink-0 p-2 rounded-lg bg-white shadow-sm">
                  {wallet.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-slate-900">{wallet.name}</p>
                  <p className="text-xs text-slate-500">{wallet.description}</p>
                </div>
                {isConnecting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Why connect a wallet?</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Secure project escrow payments</li>
                <li>• Automatic milestone releases</li>
                <li>• Earn yield on deposited funds</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleSkip}
          >
            Skip for Now
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleLater}
          >
            Remind Me Later
          </Button>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          You can connect your wallet anytime from your profile settings
        </p>
      </div>
    </Modal>
  );
}
