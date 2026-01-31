import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import RootLayout from "@/components/layout/RootLayout";

// Use display-swap for faster initial render
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "NovaLance - Web3 Freelance Marketplace on Base",
  description: "A futuristic freelance marketplace powered by Base blockchain",
  other: {
    'base:app_id': '697df8f42aafa0bc9ad8a29e',
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <RootLayout>{children}</RootLayout>
        </Providers>
      </body>
    </html>
  );
}
