'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { ItemWithTags } from '@/lib/database.types';
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink,
  MoreVertical,
  ChevronDown,
  Globe,
  FileText,
  Film,
  BookOpen,
  Heart,
  Trophy,
  Tag,
  Link2,
  MapPin,
  Map,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import QuickAddModal from '@/components/modals/QuickAddModal';
import MapView from '@/components/map/MapView';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  link: <Globe className="w-3.5 h-3.5" />,
  note: <FileText className="w-3.5 h-3.5" />,
  movie: <Film className="w-3.5 h-3.5" />,
  book: <BookOpen className="w-3.5 h-3.5" />,
  sport: <Trophy className="w-3.5 h-3.5" />,
  wishlist: <Heart className="w-3.5 h-3.5" />,
  place: <MapPin className="w-3.5 h-3.5" />,
  custom: <Tag className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
  link: 'text-blue-500',
  note: 'text-amber-500',
  movie: 'text-rose-500',
  book: 'text-emerald-500',
  sport: 'text-red-500',
  wishlist: 'text-pink-500',
  place: 'text-teal-500',
  custom: 'text-stone-500',
};

const ITEM_TYPES = ['link', 'note', 'movie', 'book', 'sport', 'wishlist', 'place', 'custom'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A–Z' },
];

interface ItemCardProps {
  item: ItemWithTags;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
}

function ItemCard({ item, viewMode, isSelected, onSelect }: ItemCardProps) {
  const { toggleFavorite, toggleArchive, deleteItem } = useApp();

  if (viewMode === 'list') {
    return (
      <div
        onClick={onSelect}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-stone-100 dark:border-stone-800 last:border-0',
          isSelected ? 'bg-stone-100 dark:bg-stone-800' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
        )}
      >
        <div className={cn('flex-shrink-0', TYPE_COLORS[item.type] || 'text-stone-400')}>
          {TYPE_ICONS[item.type] || TYPE_ICONS.link}
        </div>

        {item.favicon_url ? (
          <img src={item.favicon_url} alt="" className="w-4 h-4 rounded flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">{item.title || item.url || 'Untitled'}</span>
            {item.is_favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
          </div>
          {item.description && (
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">{item.description}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {item.location_name && (
              <span className="text-xs text-stone-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{item.location_name}</span>
            )}
            {item.tags.length > 0 && (
              <div className="flex gap-1">
                {item.tags.slice(0, 3).map(tag => (
                  <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400">{tag.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {item.domain && <span className="text-xs text-stone-400 hidden sm:block">{item.domain}</span>}
          <span className="text-xs text-stone-400 hidden md:block">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-all" onClick={e => e.stopPropagation()}>
                <MoreVertical className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {item.url && (
                <DropdownMenuItem onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" /> Open URL
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={e => { e.stopPropagation(); toggleFavorite(item.id, item.is_favorite); }}>
                {item.is_favorite ? <><StarOff className="w-3.5 h-3.5 mr-2" /> Unfavorite</> : <><Star className="w-3.5 h-3.5 mr-2" /> Favorite</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); toggleArchive(item.id, item.is_archived); }}>
                {item.is_archived ? <><ArchiveRestore className="w-3.5 h-3.5 mr-2" /> Unarchive</> : <><Archive className="w-3.5 h-3.5 mr-2" /> Archive</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}>
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex flex-col rounded-xl border cursor-pointer transition-all overflow-hidden',
        isSelected
          ? 'border-stone-400 dark:border-stone-500 ring-2 ring-stone-200 dark:ring-stone-700'
          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm'
      )}
    >
      {item.preview_image_url && (
        <div className="w-full h-36 bg-stone-100 dark:bg-stone-800 overflow-hidden flex-shrink-0">
          <img src={item.preview_image_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
        </div>
      )}

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            {item.favicon_url ? (
              <img src={item.favicon_url} alt="" className="w-4 h-4 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className={cn(TYPE_COLORS[item.type] || 'text-stone-400')}>
                {TYPE_ICONS[item.type] || TYPE_ICONS.link}
              </span>
            )}
            <span className="text-xs text-stone-400 dark:text-stone-500 capitalize">{item.type}</span>
          </div>
          <div className="flex items-center gap-1">
            {item.is_favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 transition-all" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="w-3.5 h-3.5 text-stone-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {item.url && (
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }}>
                    <ExternalLink className="w-3.5 h-3.5 mr-2" /> Open URL
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={e => { e.stopPropagation(); toggleFavorite(item.id, item.is_favorite); }}>
                  {item.is_favorite ? <><StarOff className="w-3.5 h-3.5 mr-2" /> Unfavorite</> : <><Star className="w-3.5 h-3.5 mr-2" /> Favorite</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); toggleArchive(item.id, item.is_archived); }}>
                  {item.is_archived ? <><ArchiveRestore className="w-3.5 h-3.5 mr-2" /> Unarchive</> : <><Archive className="w-3.5 h-3.5 mr-2" /> Archive</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}>
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-50 line-clamp-2 mb-1">
          {item.title || item.url || 'Untitled'}
        </h3>

        {item.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-2">{item.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          {item.location_name ? (
            <span className="text-xs text-stone-400 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location_name}
            </span>
          ) : item.domain ? (
            <span className="text-xs text-stone-400 truncate flex items-center gap-1">
              <Link2 className="w-3 h-3" /> {item.domain}
            </span>
          ) : null}
          <span className="text-xs text-stone-400 ml-auto">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400">{tag.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ItemList() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, filterType, setFilterType, selectedItemId, setSelectedItemId, getFilteredItems, selectedFolderId, folders, smartFolders, tags } = useApp();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const filtered = getFilteredItems();

  // Check if we should show map view (places tag selected or place type filtered)
  const placesTag = tags.find(t => t.name.toLowerCase() === 'places');
  const isPlacesView = placesTag && (
    (selectedFolderId?.startsWith('smart_') && smartFolders.some(sf => sf.id === selectedFolderId.substring(6) && sf.conditions?.some((c: any) => c.field === 'tag' && c.value === placesTag.id))) ||
    filterType === 'place'
  );
  const hasPlaces = filtered.some(i => i.latitude !== null && i.longitude !== null);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  const currentFolder = folders.find(f => f.id === selectedFolderId);
  let title = 'All Items';
  if (selectedFolderId === 'all' || !selectedFolderId) title = 'All Items';
  else if (selectedFolderId === 'favorites') title = 'Favorites';
  else if (selectedFolderId === 'recent') title = 'Recent';
  else if (selectedFolderId === 'archive') title = 'Archive';
  else if (selectedFolderId?.startsWith('smart_')) {
    const smartId = selectedFolderId.substring(6);
    const smartFolder = smartFolders.find(sf => sf.id === smartId);
    title = smartFolder?.name || 'Smart Folder';
  } else {
    title = currentFolder?.name || 'Folder';
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">{title}</h1>
          <div className="flex items-center gap-1">
            {/* Map toggle for places */}
            {hasPlaces && (
              <button
                onClick={() => setShowMap(!showMap)}
                className={cn('p-1.5 rounded-lg transition-colors', showMap ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300')}
                title="Toggle map view"
              >
                <Map className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'list' ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-50' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-50' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300')}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  Sort <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {SORT_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.value} onClick={() => setSortBy(opt.value)} className={sortBy === opt.value ? 'bg-stone-100 dark:bg-stone-700' : ''}>
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors ml-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-stone-100 dark:bg-stone-800 rounded-lg border-0 outline-none placeholder:text-stone-400 focus:ring-1 focus:ring-stone-300 dark:focus:ring-stone-600"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setFilterType(null)}
            className={cn('flex-shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors', !filterType ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700')}
          >
            All
          </button>
          {ITEM_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? null : type)}
              className={cn('flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full capitalize transition-colors', filterType === type ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700')}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {showMap ? (
        <div className="flex-1">
          <MapView items={filtered} onItemSelect={(id) => { setSelectedItemId(id); setShowMap(false); }} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-8">
              <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Nothing here yet</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Add a link, note, or idea to get started</p>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="mt-4 text-xs px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
              >
                Add first item
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div>
              {sorted.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  viewMode="list"
                  isSelected={selectedItemId === item.id}
                  onSelect={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
              {sorted.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  viewMode="grid"
                  isSelected={selectedItemId === item.id}
                  onSelect={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <QuickAddModal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </div>
  );
}
