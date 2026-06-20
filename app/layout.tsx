import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import SwRegister from '@/components/providers/SwRegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'droply — Personal Bookmark & Notes Manager',
  description: 'Your personal knowledge vault for links, notes, movies, books, and ideas.',
  manifest: '/manifest.json',
  themeColor: '#1c1917',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'droply',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <SwRegister />
      </body>
    </html>
  );
}
