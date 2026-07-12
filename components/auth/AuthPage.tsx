'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookmarkIcon, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { signIn, signUp, signInWithTelegram, signInWithGoogle, isTelegramApp } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error);
      else setSuccess('Account created! Check your email to confirm.');
    }
    setLoading(false);
  };

  const handleTelegramAuth = async () => {
    setError('');
    setLoading(true);
    const { error } = await signInWithTelegram();
    if (error) setError(error);
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setLoading(false);
    }
    // If no error, user will be redirected to Google
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 dark:bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
            <BookmarkIcon className="w-6 h-6 text-stone-100 dark:text-stone-900" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight">droply</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Your personal knowledge vault</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 p-6">
          {isTelegramApp ? (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <p className="text-sm text-stone-600 dark:text-stone-300">Sign in with your Telegram account</p>
              </div>

              <Button
                onClick={handleTelegramAuth}
                disabled={loading}
                className="w-full text-white rounded-lg h-10 font-medium transition-colors"
                style={{ backgroundColor: '#0088cc' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295-.388 0-.32-.145-.451-.51l-1.003-3.291-2.95-.924c-.64-.203-.658-.64.135-.953l11.53-4.453c.538-.196 1.006.128.835.953z"/>
                    </svg>
                    Sign in with Telegram
                  </span>
                )}
              </Button>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>
          ) : (
            <>
              {/* Google sign-in first */}
              <Button
                onClick={handleGoogleAuth}
                disabled={loading}
                variant="outline"
                className="w-full rounded-lg h-10 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </span>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200 dark:border-stone-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-stone-900 px-2 text-stone-400">or</span>
                </div>
              </div>

              <div className="flex gap-1 mb-4 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                <button
                  onClick={() => setMode('signin')}
                  className={`flex-1 text-sm py-1.5 rounded-md transition-all font-medium ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`flex-1 text-sm py-1.5 rounded-md transition-all font-medium ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-stone-700 dark:text-stone-300 text-xs font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-1 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-stone-700 dark:text-stone-300 text-xs font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="mt-1 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 rounded-lg"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
                )}
                {success && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">{success}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 hover:bg-stone-700 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-white rounded-lg h-10 font-medium"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'signin' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
