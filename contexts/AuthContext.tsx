'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isTelegramApp: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithTelegram: () => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
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
      };
    };
  }
}

function validateEnvVars(): { valid: boolean; error?: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
    return { valid: false, error: 'Supabase URL not configured' };
  }

  if (!key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return { valid: false, error: 'Supabase key not configured' };
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
    return { valid: false, error: 'Invalid Supabase URL' };
  }

  return { valid: true };
}

async function ensureDefaultFolders(userId: string) {
  try {
    const { error } = await supabase.rpc('create_default_folders_for_user', { p_user_id: userId });
    if (error) {
      console.error('Error creating default folders:', error);
    }
  } catch (err) {
    console.error('Unexpected error in ensureDefaultFolders:', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTelegramApp, setIsTelegramApp] = useState(false);

  useEffect(() => {
    // Validate env vars on mount
    const envValidation = validateEnvVars();
    if (!envValidation.valid) {
      console.error('Environment validation failed:', envValidation.error);
      setLoading(false);
      return;
    }

    const tg = typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
    setIsTelegramApp(tg);
    if (tg) {
      try {
        window.Telegram!.WebApp.ready();
      } catch (err) {
        console.error('Error calling Telegram.WebApp.ready():', err);
      }
    }

    // Restore session (also handles OAuth redirect hash fragments)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (tg && !session) {
          handleTelegramAutoAuth().finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error restoring session:', err);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        // Ensure folders exist for any sign-in method (Google, email, Telegram)
        ensureDefaultFolders(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleTelegramAutoAuth() {
    if (!window.Telegram?.WebApp?.initData) {
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase credentials not available for Telegram auth');
        return;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/telegram-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
      });

      if (!res.ok) {
        console.error('Telegram auth failed:', res.status, await res.text());
        return;
      }

      const data = await res.json();
      if (data.access_token && data.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
        } catch (err) {
          console.error('Error setting session:', err);
        }
      }
    } catch (err) {
      console.error('Telegram auto-auth failed:', err);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        return { error: 'Email and password are required' };
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        return { error: 'Email and password are required' };
      }

      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' };
      }

      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message ?? null };
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signInWithTelegram = async () => {
    try {
      if (!window.Telegram?.WebApp?.initData) {
        return { error: 'Not running inside Telegram' };
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return { error: 'Supabase credentials not configured' };
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/telegram-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error ?? 'Authentication failed' };
      }

      if (data.access_token && data.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          return { error: null };
        } catch (err) {
          console.error('Error setting session:', err);
          return { error: 'Failed to set session' };
        }
      }

      return { error: 'No session data returned' };
    } catch (err) {
      console.error('Telegram sign in error:', err);
      return { error: err instanceof Error ? err.message : 'An unexpected error occurred' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });
      // signInWithOAuth triggers a full page redirect — only reaches here on error
      return { error: error?.message ?? null };
    } catch (err) {
      console.error('Google sign-in error:', err);
      return { error: err instanceof Error ? err.message : 'Google sign-in failed' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isTelegramApp,
        signIn,
        signUp,
        signInWithTelegram,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
