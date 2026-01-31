'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { useNonce, useVerifySignature } from '@/lib/api-hooks';
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
  const [error, setError] = useState('');
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const { connect, isPending } = useConnect();
  const { address, isConnected, status } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  // Backend authentication mutations
  const nonceMutation = useNonce();
  const verifyMutation = useVerifySignature();

  // Watch for connection success after connect() is called
  useEffect(() => {
    const authenticateWithBackend = async () => {
      if (selectedWallet && isConnected && address && status === 'connected' && !connectionSuccess) {
        setIsAuthenticating(true);

        try {
          // Step 1: Get nonce from backend
          const nonceData = await nonceMutation.mutateAsync(address);
          const messageToSign = nonceData.message || `Sign this message to authenticate with NovaLance:\n\nNonce: ${nonceData.nonce}`;

          // Step 2: Sign the message with wallet
          const signature = await signMessageAsync({ message: messageToSign });

          // Step 3: Verify signature with backend to get JWT
          await verifyMutation.mutateAsync({ address, signature });

          // Connection successful - store state and close modal
          if (typeof window !== 'undefined') {
            localStorage.setItem('po-wallet-connected', 'true');
            localStorage.setItem('po-wallet-address', address);
          }

          setConnectionSuccess(true);

          if (onConnected) {
            onConnected();
          }

          // Small delay before closing to show success
          setTimeout(() => {
            onClose();
            setSelectedWallet(null);
            setConnectionSuccess(false);
          }, 500);
        } catch (err) {
          const error = err as Error;
          setError(`Authentication failed: ${error.message}`);
          console.error('Backend authentication error:', error);
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    authenticateWithBackend();
  }, [selectedWallet, isConnected, address, status, onConnected, onClose, connectionSuccess, nonceMutation, verifyMutation, signMessageAsync]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedWallet(null);
      setError('');
      setConnectionSuccess(false);
    }
  }, [isOpen]);

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
      connector: injected(),
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
      connector: walletConnect({ projectId: 'c4f79cc821966d8e861678be7e692a27' }),
    },
  ];

  const handleConnect = async (walletId: string, connector: ReturnType<typeof injected> | ReturnType<typeof walletConnect>) => {
    setSelectedWallet(walletId);
    setError('');

    try {
      await connect({ connector });
      // Don't close modal here - wait for useEffect to detect connection
    } catch (err) {
      const error = err as Error;
      setError(`Failed to connect: ${error.message}`);
      setSelectedWallet(null);
      console.error('Wallet connection error:', error);
    }
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

  // Show connecting state
  const isConnecting = selectedWallet && (isPending || isAuthenticating);
  // Show success state (explicitly boolean)
  const showSuccess: boolean = connectionSuccess && isConnected && !!address;

  // Format address for display
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <Modal isOpen={isOpen} onClose={handleLater} title="" showCloseButton={showSuccess}>
      <div className="text-center">
        {/* Success State */}
        {showSuccess ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Wallet Connected!
            </h2>
            <p className="text-slate-600 mb-6">
              {address ? formatAddress(address) : 'Connecting...'}
            </p>
          </>
        ) : (
          <>
            {/* Wallet Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isConnecting ? 'Connecting...' : 'Connect Your Wallet'}
            </h2>
            <p className="text-slate-600 mb-6">
              {isConnecting
                ? isAuthenticating
                  ? 'Authenticating with backend...'
                  : 'Confirm the connection in your wallet...'
                : 'Connect your wallet to interact with smart contracts and manage payments'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Wallet Options */}
            <div className="space-y-3 mb-6">
              {walletOptions.map((wallet) => {
                const isWalletConnecting = selectedWallet === wallet.id;

                return (
                  <button
                    key={wallet.id}
                    onClick={() => !isWalletConnecting && !isPending && handleConnect(wallet.id, wallet.connector)}
                    disabled={isWalletConnecting || isPending}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${
                      isWalletConnecting
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-500 hover:bg-brand-50/50'
                    }`}
                  >
                    <div className="flex-shrink-0 p-2 rounded-lg bg-white shadow-sm">
                      {wallet.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-slate-900">{wallet.name}</p>
                      <p className="text-xs text-slate-500">{wallet.description}</p>
                    </div>
                    {isWalletConnecting || isPending ? (
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

            {/* Info Box - Hide when connecting */}
            {!isConnecting && (
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
                      <li>• Backend authentication for offchain data</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Hide when connecting or on success */}
            {!isConnecting && (
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
            )}
          </>
        )}

        {/* Footer - Only show when not connecting and not on success */}
        {!isConnecting && !showSuccess && (
          <p className="text-xs text-slate-500 mt-4">
            You can connect your wallet anytime from your profile settings
          </p>
        )}
      </div>
    </Modal>
  );
}
