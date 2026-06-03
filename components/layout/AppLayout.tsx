'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import ItemList from '@/components/items/ItemList';
import DetailPanel from '@/components/items/DetailPanel';
import QuickAddModal from '@/components/modals/QuickAddModal';
import {
  BookmarkIcon,
  Sun,
  Moon,
  LogOut,
  Plus,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { selectedItemId, loading } = useApp();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-12 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 z-20">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
              <BookmarkIcon className="w-3.5 h-3.5 text-white dark:text-stone-900" />
            </div>
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-50 tracking-tight">droply</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Quick Add
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1 pl-1 border-l border-stone-200 dark:border-stone-700 ml-1">
            <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-10 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={cn(
          'w-56 flex-shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 overflow-hidden transition-transform',
          'fixed lg:static inset-y-0 left-0 z-20 top-12',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          <Sidebar />
        </aside>

        <main className="flex-1 flex overflow-hidden">
          <div className={cn(
            'flex-1 overflow-hidden',
            selectedItemId ? 'hidden md:block' : 'block'
          )}>
            <ItemList />
          </div>

          {selectedItemId && (
            <div className="w-80 xl:w-96 flex-shrink-0 overflow-hidden">
              <DetailPanel />
            </div>
          )}
        </main>
      </div>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
