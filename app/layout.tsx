import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayout from "@/components/layout/RootLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovaLance - Web3 Freelance Marketplace on Base",
  description: "A futuristic freelance marketplace powered by Base blockchain",
  other: {
    'base:app_id': '6975de6f3a92926b661fd499',
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  );
}
