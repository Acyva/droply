'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorWheel } from '@/components/ui/color-wheel';

interface TagManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function TagManager({ open, onClose }: TagManagerProps) {
  const { tags, createTag, deleteTag, updateTag } = useApp();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!open) return null;

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    setLoading(true);
    await createTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setShowColorPicker(false);
    setLoading(false);
  };

  const handleStartEdit = (tag: any) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return;
    setLoading(true);
    await updateTag(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
    setLoading(false);
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Delete this tag? Items with this tag will keep their associations.')) return;
    setLoading(true);
    await deleteTag(tagId);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Manage Tags</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {tags.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-4">No tags yet. Create your first tag below.</p>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800 group">
                  {editingId === tag.id ? (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-shrink-0">
                          <button
                            className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600 transition-colors hover:scale-110"
                            style={{ backgroundColor: editColor }}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                          />
                        </div>
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 text-sm bg-transparent outline-none min-w-0 text-stone-900 dark:text-stone-50"
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        />
                      </div>
                      {showColorPicker && (
                        <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg">
                          <ColorWheel value={editColor} onChange={setEditColor} size="sm" />
                        </div>
                      )}
                      <button onClick={handleSaveEdit} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600 flex-shrink-0" style={{ backgroundColor: tag.color }} />
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-50">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(tag)} className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTag(tag.id)} className="p-1 rounded text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">New tag</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <button
                      className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-stone-600 transition-colors hover:scale-110"
                      style={{ backgroundColor: newTagColor }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      title="Click to change color"
                    />
                  </div>
                  <input
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }}
                    placeholder="Tag name..."
                    className="flex-1 text-sm px-2 py-1.5 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 placeholder:text-stone-400"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTagName.trim() || loading}
                    className="flex-shrink-0 p-1.5 rounded bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showColorPicker && (
                  <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <ColorWheel value={newTagColor} onChange={setNewTagColor} size="md" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-stone-100 dark:border-stone-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
