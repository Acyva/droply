'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { X, Loader2, Globe, FileText, Film, BookOpen, Heart, Trophy, Tag, Link2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const ITEM_TYPES = [
  { value: 'link', label: 'Link', icon: <Globe className="w-4 h-4" /> },
  { value: 'note', label: 'Note', icon: <FileText className="w-4 h-4" /> },
  { value: 'movie', label: 'Movie', icon: <Film className="w-4 h-4" /> },
  { value: 'book', label: 'Book', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'sport', label: 'Sport', icon: <Trophy className="w-4 h-4" /> },
  { value: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
  { value: 'custom', label: 'Custom', icon: <Tag className="w-4 h-4" /> },
];

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  initialFolderId?: string | null;
}

export default function QuickAddModal({ open, onClose, initialFolderId }: QuickAddModalProps) {
  const { createItem, folders, tags, createTag, setItemTags, selectedFolderId } = useApp();
  const [type, setType] = useState('link');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [folderId, setFolderId] = useState<string>(initialFolderId || (selectedFolderId && !['all', 'favorites', 'recent', 'archive'].includes(selectedFolderId) ? selectedFolderId : '') || '');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metaFetched, setMetaFetched] = useState(false);

  useEffect(() => {
    if (!open) {
      setType('link');
      setUrl('');
      setTitle('');
      setDescription('');
      setPersonalNotes('');
      setSelectedTags([]);
      setTagInput('');
      setMetaFetched(false);
    }
  }, [open]);

  useEffect(() => {
    if (selectedFolderId && !['all', 'favorites', 'recent', 'archive'].includes(selectedFolderId)) {
      setFolderId(selectedFolderId);
    }
  }, [selectedFolderId]);

  const fetchMetadata = async () => {
    if (!url || metaFetched) return;
    try {
      setFetchingMeta(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ url }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.title && !title) setTitle(data.title);
        if (data.description && !description) setDescription(data.description);
        setMetaFetched(true);
      }
    } catch {}
    finally {
      setFetchingMeta(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const tag = await createTag(tagInput.trim());
    if (tag && !selectedTags.includes(tag.id)) {
      setSelectedTags(s => [...s, tag.id]);
    }
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !url && !personalNotes) return;
    setLoading(true);
    let domain = '';
    let faviconUrl = '';
    if (url) {
      try {
        const u = new URL(url);
        domain = u.hostname.replace('www.', '');
        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      } catch {}
    }
    const item = await createItem({
      type,
      url,
      title: title || url || '',
      description,
      personal_notes: personalNotes,
      folder_id: folderId || null,
      domain,
      favicon_url: faviconUrl,
    });
    if (item && selectedTags.length > 0) {
      await setItemTags(item.id, selectedTags);
    }
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  const userFolders = folders.filter(f => !f.is_system);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Add to droply</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {ITEM_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors',
                      type === t.value
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    )}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {(type === 'link' || type === 'article' || type === 'video' || type === 'product') && (
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">URL</label>
                <div className="flex gap-2">
                  <input
                    value={url}
                    onChange={e => { setUrl(e.target.value); setMetaFetched(false); }}
                    onBlur={fetchMetadata}
                    placeholder="https://..."
                    type="url"
                    className="flex-1 text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 placeholder:text-stone-400"
                  />
                  {fetchingMeta && <Loader2 className="w-4 h-4 animate-spin text-stone-400 self-center" />}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter a title..."
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief description..."
                rows={2}
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 resize-none placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Personal notes</label>
              <textarea
                value={personalNotes}
                onChange={e => setPersonalNotes(e.target.value)}
                placeholder="Your thoughts..."
                rows={3}
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 resize-none placeholder:text-stone-400"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Folder</label>
                <select
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none text-stone-700 dark:text-stone-300"
                >
                  <option value="">No folder</option>
                  {userFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Tags</label>
                <div className="flex gap-1 flex-wrap">
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <span key={tagId} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {tag.name}
                        <button type="button" onClick={() => setSelectedTags(s => s.filter(id => id !== tagId))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } if (e.key === ',') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add tag..."
                    className="text-xs px-2 py-0.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none w-24 placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!title && !url && !personalNotes)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
