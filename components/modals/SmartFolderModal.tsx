'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { X, Plus, Trash2, Check, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEM_TYPES = ['link', 'note', 'movie', 'book', 'sport', 'wishlist', 'custom'];

interface SmartFolderCondition {
  field: 'type' | 'tag' | 'is_favorite';
  operator: 'equals' | 'contains';
  value: string;
}

interface SmartFolderFormProps {
  open: boolean;
  onClose: () => void;
  parentId?: string | null;
  onCreated?: () => void;
}

export default function SmartFolderModal({ open, onClose, parentId, onCreated }: SmartFolderFormProps) {
  const { createSmartFolder, tags } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [conditions, setConditions] = useState<SmartFolderCondition[]>([]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleAddCondition = () => {
    setConditions([...conditions, { field: 'type', operator: 'equals', value: 'link' }]);
  };

  const handleRemoveCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const handleUpdateCondition = (idx: number, updates: Partial<SmartFolderCondition>) => {
    const updated = [...conditions];
    updated[idx] = { ...updated[idx], ...updates };
    setConditions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createSmartFolder({
      name: name.trim(),
      description,
      parent_folder_id: parentId || null,
      color,
      conditions: conditions as any,
    });
    setLoading(false);
    onCreated?.();
    setName('');
    setDescription('');
    setColor('#3B82F6');
    setConditions([]);
    onClose();
  };

  const colors = ['#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#84CC16', '#F97316', '#EC4899'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Filter className="w-4 h-4" /> New Smart Folder
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Folder name</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Books to Read, Movie Ideas..."
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this folder for?"
                rows={2}
                className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 resize-none placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn('w-6 h-6 rounded-full border-2 transition-all', color === c ? 'border-stone-900 dark:border-stone-100 ring-2 ring-offset-1 dark:ring-offset-stone-900' : 'border-stone-200 dark:border-stone-700')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide">Conditions</label>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="text-xs px-2 py-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {conditions.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">Add conditions to automatically include items (e.g., all links, favorites, items with certain tags)</p>
              ) : (
                <div className="space-y-2">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                      <div className="flex-1 space-y-1.5">
                        <select
                          value={cond.field}
                          onChange={e => handleUpdateCondition(idx, { field: e.target.value as any })}
                          className="w-full text-xs px-2 py-1 bg-white dark:bg-stone-700 rounded border border-stone-200 dark:border-stone-600 outline-none"
                        >
                          <option value="type">Item type</option>
                          <option value="tag">Has tag</option>
                          <option value="is_favorite">Is favorite</option>
                        </select>

                        {cond.field === 'type' && (
                          <select
                            value={cond.value}
                            onChange={e => handleUpdateCondition(idx, { value: e.target.value })}
                            className="w-full text-xs px-2 py-1 bg-white dark:bg-stone-700 rounded border border-stone-200 dark:border-stone-600 outline-none"
                          >
                            {ITEM_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                          </select>
                        )}

                        {cond.field === 'tag' && (
                          <select
                            value={cond.value}
                            onChange={e => handleUpdateCondition(idx, { value: e.target.value })}
                            className="w-full text-xs px-2 py-1 bg-white dark:bg-stone-700 rounded border border-stone-200 dark:border-stone-600 outline-none"
                          >
                            <option value="">Select a tag...</option>
                            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        )}

                        {cond.field === 'is_favorite' && (
                          <div className="text-xs text-stone-500 py-1">Always true</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="flex-shrink-0 p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
