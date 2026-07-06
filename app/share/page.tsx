'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import QuickAddModal from '@/components/modals/QuickAddModal';
import { Loader2, BookmarkIcon } from 'lucide-react';

function ShareHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  // Extract shared data from URL params
  const sharedTitle = params.get('title') || '';
  const sharedText = params.get('text') || '';
  const sharedUrlParam = params.get('url') || '';

  // Detect URL: either from url param or extracted from text
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const urlFromText = sharedText.match(urlRegex)?.[0] || '';
  const sharedUrl = sharedUrlParam || urlFromText || '';

  // Text content (excluding URL if it was extracted)
  const noteText = sharedUrl && sharedText.includes(sharedUrl)
    ? sharedText.replace(sharedUrl, '').trim()
    : sharedText;

  const type = sharedUrl ? 'link' : noteText ? 'note' : 'link';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    setOpen(true);
  }, [loading, user]);

  const handleClose = () => {
    setOpen(false);
    router.replace('/');
  };

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 dark:bg-stone-100 rounded-2xl flex items-center justify-center">
            <BookmarkIcon className="w-5 h-5 text-white dark:text-stone-900" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <QuickAddModal
          open={open}
          onClose={handleClose}
          initialData={{
            type,
            url: sharedUrl,
            title: sharedTitle || noteText.substring(0, 100),
            description: noteText && sharedTitle ? noteText : '',
          }}
        />
        {/* Background in case modal is closed without saving */}
        {!open && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 mx-auto bg-stone-900 dark:bg-stone-100 rounded-2xl flex items-center justify-center">
                <BookmarkIcon className="w-5 h-5 text-white dark:text-stone-900" />
              </div>
              <p className="text-sm text-stone-500">Returning to droply...</p>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 dark:bg-stone-100 rounded-2xl flex items-center justify-center">
              <BookmarkIcon className="w-5 h-5 text-white dark:text-stone-900" />
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        </div>
      }
    >
      <ShareHandler />
    </Suspense>
  );
}
