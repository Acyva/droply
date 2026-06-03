'use client';

import React from 'react';
import {
  Folder,
  FolderOpen,
  BookOpen,
  Heart,
  Star,
  Zap,
  Lightbulb,
  Bookmark,
  Archive,
  Check,
  Target,
  Sparkles,
  Trophy,
  Flame,
  Music,
  Palette,
  Coffee,
  Home,
  Briefcase,
  Layers,
  Grid,
  List,
  Tag,
  Hash,
  AtSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FOLDER_ICONS = [
  { name: 'Folder', value: 'folder', icon: Folder },
  { name: 'Folder Open', value: 'folder-open', icon: FolderOpen },
  { name: 'Book', value: 'book', icon: BookOpen },
  { name: 'Heart', value: 'heart', icon: Heart },
  { name: 'Star', value: 'star', icon: Star },
  { name: 'Zap', value: 'zap', icon: Zap },
  { name: 'Lightbulb', value: 'lightbulb', icon: Lightbulb },
  { name: 'Bookmark', value: 'bookmark', icon: Bookmark },
  { name: 'Archive', value: 'archive', icon: Archive },
  { name: 'Check', value: 'check', icon: Check },
  { name: 'Target', value: 'target', icon: Target },
  { name: 'Sparkles', value: 'sparkles', icon: Sparkles },
  { name: 'Trophy', value: 'trophy', icon: Trophy },
  { name: 'Flame', value: 'flame', icon: Flame },
  { name: 'Music', value: 'music', icon: Music },
  { name: 'Palette', value: 'palette', icon: Palette },
  { name: 'Coffee', value: 'coffee', icon: Coffee },
  { name: 'Home', value: 'home', icon: Home },
  { name: 'Briefcase', value: 'briefcase', icon: Briefcase },
  { name: 'Layers', value: 'layers', icon: Layers },
  { name: 'Grid', value: 'grid', icon: Grid },
  { name: 'List', value: 'list', icon: List },
  { name: 'Tag', value: 'tag', icon: Tag },
  { name: 'Hash', value: 'hash', icon: Hash },
];

const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  folder: Folder,
  'folder-open': FolderOpen,
  book: BookOpen,
  heart: Heart,
  star: Star,
  zap: Zap,
  lightbulb: Lightbulb,
  bookmark: Bookmark,
  archive: Archive,
  check: Check,
  target: Target,
  sparkles: Sparkles,
  trophy: Trophy,
  flame: Flame,
  music: Music,
  palette: Palette,
  coffee: Coffee,
  home: Home,
  briefcase: Briefcase,
  layers: Layers,
  grid: Grid,
  list: List,
  tag: Tag,
  hash: Hash,
};

export function getIconComponent(iconName: string) {
  return ICON_COMPONENTS[iconName] || Folder;
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [search, setSearch] = React.useState('');

  const filtered = FOLDER_ICONS.filter(icon =>
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">{label}</label>
      )}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search icons..."
        className="w-full text-xs px-2 py-1.5 bg-stone-50 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 placeholder:text-stone-400"
      />
      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
        {filtered.map(icon => {
          const IconComponent = icon.icon;
          const isSelected = value === icon.value;
          return (
            <button
              key={icon.value}
              onClick={() => onChange(icon.value)}
              className={cn(
                'p-2 rounded-lg border transition-all hover:bg-stone-100 dark:hover:bg-stone-700',
                isSelected
                  ? 'border-stone-900 dark:border-stone-100 bg-stone-100 dark:bg-stone-700'
                  : 'border-stone-200 dark:border-stone-600'
              )}
              title={icon.name}
            >
              <IconComponent className="w-4 h-4 mx-auto text-stone-600 dark:text-stone-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
