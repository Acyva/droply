'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { X, Loader2, Globe, FileText, Film, BookOpen, Heart, Trophy, Tag, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEM_TYPES = [
  { value: 'link', label: 'Link', icon: <Globe className="w-4 h-4" /> },
  { value: 'note', label: 'Note', icon: <FileText className="w-4 h-4" /> },
  { value: 'movie', label: 'Movie', icon: <Film className="w-4 h-4" /> },
  { value: 'book', label: 'Book', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'sport', label: 'Sport', icon: <Trophy className="w-4 h-4" /> },
  { value: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
  { value: 'place', label: 'Place', icon: <MapPin className="w-4 h-4" /> },
  { value: 'custom', label: 'Custom', icon: <Tag className="w-4 h-4" /> },
];

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    city?: string;
    country?: string;
  };
}

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  initialFolderId?: string | null;
  initialData?: {
    type?: string;
    title?: string;
    url?: string;
    description?: string;
    personalNotes?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    locationAddress?: string;
  };
}

export default function QuickAddModal({ open, onClose, initialFolderId, initialData }: QuickAddModalProps) {
  const { createItem, folders, tags, createTag, setItemTags, selectedFolderId } = useApp();
  const [type, setType] = useState('link');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metaFetched, setMetaFetched] = useState(false);

  // Location state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setType('link'); setUrl(''); setTitle(''); setDescription('');
      setPersonalNotes(''); setSelectedTags([]); setTagInput(''); setMetaFetched(false);
      setLocationQuery(''); setLocationResults([]); setSelectedLocation(null); setShowLocationDropdown(false);
    }
    if (open && initialData) {
      if (initialData.type) setType(initialData.type);
      if (initialData.title) setTitle(initialData.title);
      if (initialData.url) setUrl(initialData.url);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.personalNotes) setPersonalNotes(initialData.personalNotes);
      if (initialData.locationName) setLocationQuery(initialData.locationName);
    }
  }, [open]);

  useEffect(() => {
    const id = initialFolderId || (selectedFolderId && !['all', 'favorites', 'recent', 'archive'].includes(selectedFolderId) ? selectedFolderId : '');
    setFolderId(id || '');
  }, [open, initialFolderId, selectedFolderId]);

  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      return;
    }
    setLocationSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'droply-app/1.0' } }
      );
      const data: LocationResult[] = await res.json();
      setLocationResults(data);
      setShowLocationDropdown(data.length > 0);
    } catch {
      setLocationResults([]);
    } finally {
      setLocationSearching(false);
    }
  };

  const handleLocationInput = (value: string) => {
    setLocationQuery(value);
    setSelectedLocation(null);
    if (locationSearchRef.current) clearTimeout(locationSearchRef.current);
    locationSearchRef.current = setTimeout(() => searchLocation(value), 400);
  };

  const handleSelectLocation = (result: LocationResult) => {
    setSelectedLocation(result);
    const shortName = result.display_name.split(',').slice(0, 2).join(',').trim();
    setLocationQuery(shortName);
    if (!title) setTitle(shortName);
    setShowLocationDropdown(false);
    setLocationResults([]);
  };

  const fetchMetadata = async () => {
    if (!url || metaFetched) return;
    try {
      setFetchingMeta(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ url }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.title && !title) setTitle(data.title);
        if (data.description && !description) setDescription(data.description);
        setMetaFetched(true);
      }
    } catch {}
    finally { setFetchingMeta(false); }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const tag = await createTag(tagInput.trim());
    if (tag && !selectedTags.includes(tag.id)) setSelectedTags(s => [...s, tag.id]);
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTitle = title || (type === 'place' ? locationQuery : '') || url || '';
    if (!effectiveTitle && !personalNotes) return;
    setLoading(true);

    let domain = '', faviconUrl = '';
    if (url) {
      try {
        const u = new URL(url);
        domain = u.hostname.replace('www.', '');
        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      } catch {}
    }

    const itemData: any = {
      type,
      url,
      title: effectiveTitle,
      description,
      personal_notes: personalNotes,
      folder_id: folderId || null,
      domain,
      favicon_url: faviconUrl,
    };

    if (type === 'place' && selectedLocation) {
      itemData.latitude = parseFloat(selectedLocation.lat);
      itemData.longitude = parseFloat(selectedLocation.lon);
      itemData.location_name = title || locationQuery;
      itemData.location_address = selectedLocation.display_name;
    }

    const item = await createItem(itemData);
    if (item && selectedTags.length > 0) await setItemTags(item.id, selectedTags);
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  const userFolders = folders.filter(f => !f.is_system);
  const canSubmit = !!(title || (type === 'place' && locationQuery) || url || personalNotes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200 dark:border-stone-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Add to droply</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Type selector */}
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {ITEM_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors',
                      type === t.value ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    )}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* URL field for links */}
            {type === 'link' && (
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">URL</label>
                <div className="flex gap-2">
                  <input value={url} onChange={e => { setUrl(e.target.value); setMetaFetched(false); }} onBlur={fetchMetadata}
                    placeholder="https://..." type="url"
                    className="flex-1 text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 placeholder:text-stone-400" />
                  {fetchingMeta && <Loader2 className="w-4 h-4 animate-spin text-stone-400 self-center" />}
                </div>
              </div>
            )}

            {/* Location search for place type */}
            {type === 'place' && (
              <div className="relative">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Location</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    value={locationQuery}
                    onChange={e => handleLocationInput(e.target.value)}
                    onFocus={() => locationResults.length > 0 && setShowLocationDropdown(true)}
                    placeholder="Search for a place..."
                    className="w-full text-sm pl-8 pr-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 placeholder:text-stone-400"
                  />
                  {locationSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-stone-400" />}
                  {selectedLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-500" />
                  )}
                </div>

                {showLocationDropdown && locationResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-lg overflow-hidden">
                    {locationResults.map(result => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectLocation(result)}
                        className="w-full text-left px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors border-b border-stone-100 dark:border-stone-700 last:border-0"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                              {result.display_name.split(',')[0]}
                            </p>
                            <p className="text-xs text-stone-400 truncate">
                              {result.display_name.split(',').slice(1, 3).join(',')}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedLocation && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {parseFloat(selectedLocation.lat).toFixed(4)}, {parseFloat(selectedLocation.lon).toFixed(4)}
                  </p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">
                {type === 'place' ? 'Place name (optional)' : 'Title'}
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder={type === 'place' ? 'Custom name for this place...' : 'Enter a title...'}
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 placeholder:text-stone-400" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="A brief description..." rows={2}
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 resize-none placeholder:text-stone-400" />
            </div>

            {/* Personal notes */}
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Personal notes</label>
              <textarea value={personalNotes} onChange={e => setPersonalNotes(e.target.value)}
                placeholder="Your thoughts..." rows={3}
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 resize-none placeholder:text-stone-400" />
            </div>

            {/* Folder + Tags */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Folder</label>
                <select value={folderId} onChange={e => setFolderId(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none text-stone-700 dark:text-stone-300">
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
                      <span key={tagId} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                        {tag.name}
                        <button type="button" onClick={() => setSelectedTags(s => s.filter(id => id !== tagId))}><X className="w-3 h-3" /></button>
                      </span>
                    ) : null;
                  })}
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } if (e.key === ',') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add tag..."
                    className="text-xs px-2 py-0.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none w-24 placeholder:text-stone-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-stone-100 dark:border-stone-800 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !canSubmit}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
