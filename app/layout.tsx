import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayout from "@/components/layout/RootLayout";
import { OnchainKitProvider } from '@coinbase/onchainkit';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovaLance - Web3 Freelance Marketplace on Base",
  description: "A futuristic freelance marketplace powered by Base blockchain",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <OnchainKitProvider
          miniKit={{ enabled: true }}
          apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
        >
          <RootLayout>{children}</RootLayout>
        </OnchainKitProvider>
      </body>
    </html>
  );
}
