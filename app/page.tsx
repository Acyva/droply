'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import AppLayout from '@/components/layout/AppLayout';
import AuthPage from '@/components/auth/AuthPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          <p className="text-sm text-stone-400">Loading droply...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default function HomePage() {
  return <AppContent />;
}
