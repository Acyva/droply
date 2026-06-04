'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { ItemWithTags } from '@/lib/database.types';
import {
  X,
  ExternalLink,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit3,
  Check,
  Tag,
  FolderOpen,
  Link2,
  Globe,
  FileText,
  Film,
  BookOpen,
  Heart,
  Trophy,
  Calendar,
  RefreshCw,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ITEM_TYPES = ['link', 'note', 'movie', 'book', 'sport', 'wishlist', 'place', 'custom'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  link: <Globe className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
  movie: <Film className="w-4 h-4" />,
  book: <BookOpen className="w-4 h-4" />,
  sport: <Trophy className="w-4 h-4" />,
  wishlist: <Heart className="w-4 h-4" />,
  place: <MapPin className="w-4 h-4" />,
  custom: <Tag className="w-4 h-4" />,
};

export default function DetailPanel() {
  const { selectedItemId, setSelectedItemId, items, updateItem, deleteItem, toggleFavorite, toggleArchive, folders, tags, setItemTags, createTag } = useApp();
  const item = items.find(i => i.id === selectedItemId);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (item) {
      setFieldValues({
        title: item.title,
        description: item.description,
        url: item.url,
        personal_notes: item.personal_notes,
        location_name: item.location_name || '',
        location_address: item.location_address || '',
      });
    }
  }, [item?.id]);

  if (!item) return null;

  const startEdit = (field: string) => {
    setEditing(e => ({ ...e, [field]: true }));
    setFieldValues(v => ({ ...v, [field]: (item as any)[field] || '' }));
  };

  const saveField = async (field: string) => {
    await updateItem(item.id, { [field]: fieldValues[field] });
    setEditing(e => ({ ...e, [field]: false }));
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const tag = await createTag(newTag.trim());
    if (tag) {
      const currentTagIds = item.tags.map(t => t.id);
      if (!currentTagIds.includes(tag.id)) {
        await setItemTags(item.id, [...currentTagIds, tag.id]);
      }
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = async (tagId: string) => {
    const newTagIds = item.tags.filter(t => t.id !== tagId).map(t => t.id);
    await setItemTags(item.id, newTagIds);
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    await updateItem(item.id, { folder_id: folderId });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-stone-400">{TYPE_ICONS[item.type]}</span>
          <select
            value={item.type}
            onChange={e => updateItem(item.id, { type: e.target.value })}
            className="text-xs text-stone-500 dark:text-stone-400 bg-transparent outline-none cursor-pointer capitalize"
          >
            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFavorite(item.id, item.is_favorite)}
            className={cn('p-1.5 rounded-lg transition-colors', item.is_favorite ? 'text-amber-500' : 'text-stone-400 hover:text-amber-500')}
          >
            {item.is_favorite ? <Star className="w-4 h-4 fill-amber-500" /> : <Star className="w-4 h-4" />}
          </button>
          <button
            onClick={() => toggleArchive(item.id, item.is_archived)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            {item.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { deleteItem(item.id); setSelectedItemId(null); }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedItemId(null)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {item.preview_image_url && (
          <div className="w-full h-40 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
            <img src={item.preview_image_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
          </div>
        )}

        <div>
          {editing.title ? (
            <div className="flex items-start gap-2">
              <textarea
                value={fieldValues.title}
                onChange={e => setFieldValues(v => ({ ...v, title: e.target.value }))}
                className="flex-1 text-base font-semibold bg-stone-50 dark:bg-stone-800 rounded-lg px-2 py-1 outline-none resize-none min-h-[60px] text-stone-900 dark:text-stone-50"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveField('title'); } }}
              />
              <button onClick={() => saveField('title')} className="p-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-start gap-2 cursor-text" onClick={() => startEdit('title')}>
              <h2 className="flex-1 text-base font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                {item.title || <span className="text-stone-400 italic">No title</span>}
              </h2>
              <Edit3 className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
            </div>
          )}
        </div>

        {item.url && (
          <div className="flex items-center gap-2 p-2.5 bg-stone-50 dark:bg-stone-800 rounded-lg">
            {item.favicon_url && (
              <img src={item.favicon_url} alt="" className="w-4 h-4 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <span className="text-xs text-stone-500 dark:text-stone-400 truncate flex-1">{item.url}</span>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5 block">Description</label>
          {editing.description ? (
            <div className="flex items-start gap-2">
              <textarea
                value={fieldValues.description}
                onChange={e => setFieldValues(v => ({ ...v, description: e.target.value }))}
                className="flex-1 text-sm bg-stone-50 dark:bg-stone-800 rounded-lg px-2 py-1.5 outline-none resize-none min-h-[80px] text-stone-700 dark:text-stone-300"
                autoFocus
                placeholder="Add a description..."
              />
              <button onClick={() => saveField('description')} className="p-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-start gap-2 cursor-text" onClick={() => startEdit('description')}>
              <p className="flex-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {item.description || <span className="text-stone-300 dark:text-stone-600 italic">Add a description...</span>}
              </p>
              <Edit3 className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
            </div>
          )}
        </div>

        {/* Location section */}
        {(item.type === 'place' || item.latitude) && (
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5" /> Location
            </div>

            {editing.location_name ? (
              <div className="flex items-center gap-2">
                <input
                  value={fieldValues.location_name}
                  onChange={e => setFieldValues(v => ({ ...v, location_name: e.target.value }))}
                  className="flex-1 text-sm bg-white dark:bg-stone-900 rounded-lg px-2 py-1 outline-none border border-stone-200 dark:border-stone-700"
                  autoFocus
                  placeholder="Place name..."
                />
                <button onClick={() => saveField('location_name')} className="p-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded flex-shrink-0">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2 cursor-pointer" onClick={() => startEdit('location_name')}>
                <span className="flex-1 text-sm text-stone-700 dark:text-stone-300">{item.location_name || <span className="text-stone-300 italic">Add place name...</span>}</span>
                <Edit3 className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100" />
              </div>
            )}

            {editing.location_address ? (
              <div className="flex items-center gap-2">
                <input
                  value={fieldValues.location_address}
                  onChange={e => setFieldValues(v => ({ ...v, location_address: e.target.value }))}
                  className="flex-1 text-sm bg-white dark:bg-stone-900 rounded-lg px-2 py-1 outline-none border border-stone-200 dark:border-stone-700"
                  autoFocus
                  placeholder="Address..."
                />
                <button onClick={() => saveField('location_address')} className="p-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded flex-shrink-0">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2 cursor-pointer" onClick={() => startEdit('location_address')}>
                <span className="flex-1 text-xs text-stone-500 dark:text-stone-400">{item.location_address || <span className="text-stone-300 italic">Add address...</span>}</span>
                <Edit3 className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100" />
              </div>
            )}

            {item.latitude && item.longitude && (
              <div className="text-xs text-stone-400">
                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5 block">Personal notes</label>
          {editing.personal_notes ? (
            <div className="flex items-start gap-2">
              <textarea
                value={fieldValues.personal_notes}
                onChange={e => setFieldValues(v => ({ ...v, personal_notes: e.target.value }))}
                className="flex-1 text-sm bg-stone-50 dark:bg-stone-800 rounded-lg px-2 py-1.5 outline-none resize-none min-h-[120px] text-stone-700 dark:text-stone-300 leading-relaxed"
                autoFocus
                placeholder="Write your thoughts..."
              />
              <button onClick={() => saveField('personal_notes')} className="p-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-start gap-2 cursor-text" onClick={() => startEdit('personal_notes')}>
              <p className="flex-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap">
                {item.personal_notes || <span className="text-stone-300 dark:text-stone-600 italic">Add notes...</span>}
              </p>
              <Edit3 className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5 block">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(tag => (
              <span key={tag.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                {tag.name}
                <button onClick={() => handleRemoveTag(tag.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-200 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {showTagInput ? (
              <input
                autoFocus
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onBlur={handleAddTag}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') { setShowTagInput(false); setNewTag(''); } }}
                placeholder="Tag name"
                className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-800 outline-none w-24 border border-stone-300 dark:border-stone-600"
              />
            ) : (
              <button onClick={() => setShowTagInput(true)} className="text-xs px-2 py-1 rounded-full border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 transition-colors">
                + Tag
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5 block">Folder</label>
          <select
            value={item.folder_id || ''}
            onChange={e => handleMoveToFolder(e.target.value || null)}
            className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg outline-none border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
          >
            <option value="">No folder</option>
            {folders.filter(f => !f.is_system).map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Created {format(new Date(item.created_at), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Updated {format(new Date(item.updated_at), 'MMM d, yyyy')}</span>
          </div>
          {item.domain && (
            <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
              <Link2 className="w-3.5 h-3.5" />
              <span>{item.domain}</span>
            </div>
          )}
          {item.latitude && item.longitude && (
            <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
