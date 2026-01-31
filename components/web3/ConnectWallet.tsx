'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useEffect, useRef } from 'react';
import { useNonce, useVerifySignature } from '@/lib/api-hooks';

interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className = '' }: ConnectWalletProps) {
  const { address, isConnected, status } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const nonceMutation = useNonce();
  const verifyMutation = useVerifySignature();

  // Track if we've already authenticated this session
  const hasAuthenticated = useRef(false);
  const isAuthenticating = useRef(false);

  // Authenticate with backend when wallet connects
  useEffect(() => {
    const authenticateWithBackend = async () => {
      // Prevent concurrent auth attempts
      if (isAuthenticating.current) {
        console.log('⏳ Authentication already in progress...');
        return;
      }

      // Check if JWT already exists
      const existingToken = typeof window !== 'undefined' ? localStorage.getItem('novalance_jwt') : null;
      console.log('🔍 Existing JWT:', existingToken ? 'Found' : 'Not found');

      // Only authenticate if:
      // 1. Wallet is connected
      // 2. We have an address
      // 3. Status is 'connected'
      // 4. We haven't authenticated yet this session
      // 5. JWT token doesn't already exist
      if (
        isConnected &&
        address &&
        status === 'connected' &&
        !hasAuthenticated.current &&
        !existingToken
      ) {
        isAuthenticating.current = true;
        console.log('🔐 Starting backend authentication...');

        try {
          // Step 1: Get nonce from backend
          console.log('1️⃣ Requesting nonce for:', address);
          const nonceData = await nonceMutation.mutateAsync(address);
          console.log('✅ Nonce received:', nonceData.nonce?.substring(0, 16) + '...');

          // Step 2: Sign the message with wallet
          console.log('2️⃣ Requesting signature...');
          const signature = await signMessageAsync({ message: nonceData.message });
          console.log('✅ Signature received:', signature?.substring(0, 20) + '...');

          // Step 3: Verify signature with backend to get JWT
          console.log('3️⃣ Verifying signature with backend...');
          const verifyResult = await verifyMutation.mutateAsync({ address, signature });
          console.log('✅ Backend authentication successful!');
          console.log('📝 Token received:', verifyResult.token?.substring(0, 30) + '...');

          // Verify token was stored
          const storedToken = localStorage.getItem('novalance_jwt');
          console.log('💾 Token stored:', storedToken ? 'Yes' : 'No');

          hasAuthenticated.current = true;
        } catch (error) {
          console.error('❌ Backend authentication failed:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
          });
          // Reset on failure so user can retry
          hasAuthenticated.current = false;
        } finally {
          isAuthenticating.current = false;
        }
      }
    };

    authenticateWithBackend();
  }, [isConnected, address, status, nonceMutation, verifyMutation, signMessageAsync]);

  // Reset auth flag when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      hasAuthenticated.current = false;
      isAuthenticating.current = false;
      console.log('🔌 Wallet disconnected, auth reset');
    }
  }, [isConnected, address]);

  return (
    <div className={className}>
      <ConnectButton
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
        showBalance={{
          smallScreen: false,
          largeScreen: true,
        }}
      />
    </div>
  );
}
