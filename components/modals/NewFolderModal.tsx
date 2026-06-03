'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { X, Check } from 'lucide-react';
import { ColorWheel } from '@/components/ui/color-wheel';
import { IconPicker, getIconComponent } from '@/components/ui/icon-picker';

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  parentId?: string | null;
  onCreated?: () => void;
}

export default function NewFolderModal({ open, onClose, parentId, onCreated }: NewFolderModalProps) {
  const { createFolder, updateFolder } = useApp();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [color, setColor] = useState('#F59E0B');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const folder = await createFolder(name.trim(), parentId);
    if (folder) {
      await updateFolder(folder.id, { icon, color });
    }
    setLoading(false);
    onCreated?.();
    setName('');
    setIcon('folder');
    setColor('#F59E0B');
    onClose();
  };

  const IconComponent = getIconComponent(icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">New Folder</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1.5 block">Folder name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My folder..."
              className="w-full text-sm px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 placeholder:text-stone-400"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
              style={{ backgroundColor: color }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Preview</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{name || 'Folder'}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2 block">Color</label>
            <ColorWheel value={color} onChange={setColor} size="lg" />
          </div>

          <div>
            <IconPicker value={icon} onChange={setIcon} label="Icon" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Create
          </button>
        </div>
      </div>
    </div>
  );
}
