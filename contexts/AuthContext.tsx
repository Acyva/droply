'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isTelegramApp: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithTelegram: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        close: () => void;
        MainButton: any;
        BackButton: any;
      };
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTelegramApp, setIsTelegramApp] = useState(false);

  useEffect(() => {
    // Check if running in Telegram Mini App
    const isTelegram = !!window.Telegram?.WebApp;
    setIsTelegramApp(isTelegram);

    if (isTelegram) {
      window.Telegram!.WebApp.ready();
    }

    // Try to get existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // If in Telegram and no session, try Telegram auth
      if (isTelegram && !session) {
        handleTelegramAuth();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          await supabase.rpc('create_default_folders_for_user', { p_user_id: session.user.id });
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTelegramAuth = async () => {
    try {
      if (!window.Telegram?.WebApp?.initData) {
        setLoading(false);
        return;
      }

      const initData = window.Telegram.WebApp.initData;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telegram-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ initData }),
        }
      );

      if (!response.ok) {
        console.error('Telegram auth failed:', response.statusText);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.access_token && data.refresh_token) {
        // Set session manually
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signInWithTelegram = async () => {
    if (!window.Telegram?.WebApp?.initData) {
      return { error: new Error('Not running in Telegram Mini App') };
    }

    try {
      const initData = window.Telegram.WebApp.initData;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telegram-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ initData }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { error: new Error(error.error || 'Telegram auth failed') };
      }

      const data = await response.json();

      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        return { error: null };
      }

      return { error: new Error('Failed to get session') };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isTelegramApp, signIn, signUp, signInWithTelegram, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
