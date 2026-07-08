import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import SwRegister from '@/components/providers/SwRegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Droply — Personal Bookmark & Notes Manager',
  description: 'Your personal knowledge vault for links, notes, movies, books, and ideas.',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Droply',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: '/Icon-iOS-Default-1024@1x.png', sizes: '1024x1024', type: 'image/png' },
    ],
    apple: [
      { url: '/Icon-iOS-Default-1024@1x.png', sizes: '1024x1024', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/Icon-iOS-Default-1024@1x.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
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
