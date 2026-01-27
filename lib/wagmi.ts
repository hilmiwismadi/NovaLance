import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

// Get WalletConnect Project ID from environment variable
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const wagmiConfig = getDefaultConfig({
  appName: 'NovaLance',
  projectId: walletConnectProjectId,
  chains: [base, baseSepolia],
  ssr: true, // Enable server-side rendering support
});

// Export chains for use in components
export const chains = [base, baseSepolia] as const;

// Export default chain (Base mainnet for production)
export const defaultChain = base;
