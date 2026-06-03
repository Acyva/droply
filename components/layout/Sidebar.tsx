'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { FolderWithChildren } from '@/lib/database.types';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Star,
  Archive,
  Layers,
  Clock,
  MoreHorizontal,
  Trash2,
  Edit2,
  FolderPlus,
  Filter,
  Tag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import TagManager from '@/components/modals/TagManager';
import SmartFolderModal from '@/components/modals/SmartFolderModal';
import FolderEditorModal from '@/components/modals/FolderEditorModal';
import NewFolderModal from '@/components/modals/NewFolderModal';
import { getIconComponent } from '@/components/ui/icon-picker';

interface FolderNodeProps {
  folder: FolderWithChildren;
  depth: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

interface SmartFolderNodeProps {
  smartFolder: any;
  depth: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

function FolderNode({ folder, depth, onSelect, selectedId }: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showEditor, setShowEditor] = useState(false);
  const { deleteFolder, updateFolder, createFolder, items } = useApp();
  const isSelected = selectedId === folder.id;
  const hasChildren = folder.children.length > 0;
  const itemCount = items.filter(i => i.folder_id === folder.id && !i.is_archived).length;
  const IconComponent = getIconComponent(folder.icon);

  const handleRename = async () => {
    if (newName.trim() && newName !== folder.name) {
      await updateFolder(folder.id, { name: newName.trim() });
    }
    setEditingName(false);
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors select-none',
          isSelected
            ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-50'
            : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          onSelect(folder.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        <button
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {hasChildren ? (
            <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
          ) : (
            <span className="w-3 h-3" />
          )}
        </button>

        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 rounded text-xs" style={{ backgroundColor: folder.color }}>
          <IconComponent className="w-3 h-3 text-white" />
        </div>

        {editingName ? (
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false); }}
            className="flex-1 text-sm bg-transparent outline-none min-w-0"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
        )}

        {itemCount > 0 && !editingName && (
          <span className="text-xs text-stone-400 dark:text-stone-500 ml-auto mr-1">{itemCount}</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-600 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); setShowEditor(true); }}>
              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={e => { e.stopPropagation(); createFolder('New Folder', folder.id); setExpanded(true); }}>
              <FolderPlus className="w-3.5 h-3.5 mr-2" /> Add subfolder
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && folder.children.map(child => (
        <FolderNode key={child.id} folder={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
      ))}

      <FolderEditorModal
        open={showEditor}
        onClose={() => setShowEditor(false)}
        folderId={folder.id}
        initialName={folder.name}
        initialIcon={folder.icon}
        initialColor={folder.color}
      />
    </div>
  );
}

function SmartFolderNode({ smartFolder, depth, onSelect, selectedId }: SmartFolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const { deleteSmartFolder, smartFolders } = useApp();
  const isSelected = selectedId === `smart_${smartFolder.id}`;
  const children = smartFolders.filter(sf => sf.parent_folder_id === smartFolder.id);

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors select-none',
          isSelected
            ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-50'
            : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          onSelect(`smart_${smartFolder.id}`);
          if (children.length > 0) setExpanded(!expanded);
        }}
      >
        <button
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {children.length > 0 ? (
            <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
          ) : (
            <span className="w-3 h-3" />
          )}
        </button>

        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 rounded text-xs" style={{ backgroundColor: smartFolder.color }}>
          <Filter className="w-3 h-3 text-white" />
        </div>
        <span className="flex-1 text-sm font-medium truncate">{smartFolder.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-600 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={e => { e.stopPropagation(); deleteSmartFolder(smartFolder.id); }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && children.sort((a, b) => a.sort_order - b.sort_order).map(child => (
        <SmartFolderNode key={child.id} smartFolder={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  );
}

export default function Sidebar() {
  const { folderTree, smartFolderTree, selectedFolderId, setSelectedFolderId, createFolder, items } = useApp();
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showSmartFolderModal, setShowSmartFolderModal] = useState(false);
  const [showSmartFolders, setShowSmartFolders] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);

  const systemNavItems = [
    {
      id: 'all',
      label: 'All Items',
      icon: <Layers className="w-4 h-4" />,
      count: items.filter(i => !i.is_archived).length,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: <Star className="w-4 h-4 text-amber-500" />,
      count: items.filter(i => i.is_favorite && !i.is_archived).length,
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      count: (() => {
        const w = new Date(); w.setDate(w.getDate() - 7);
        return items.filter(i => !i.is_archived && new Date(i.created_at) > w).length;
      })(),
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="w-4 h-4 text-stone-400" />,
      count: items.filter(i => i.is_archived).length,
    },
  ];

  const userFolders = folderTree.filter(f => !f.is_system);

  return (
    <div className="h-full flex flex-col py-3 px-2 overflow-y-auto">
      <div className="space-y-0.5 mb-4">
        {systemNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => setSelectedFolderId(item.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedFolderId === item.id
                ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-50'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.count > 0 && (
              <span className="text-xs text-stone-400 dark:text-stone-500">{item.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {smartFolderTree.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <button
                onClick={() => setShowSmartFolders(!showSmartFolders)}
                className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider hover:text-stone-600 dark:hover:text-stone-400 flex items-center gap-1 transition-colors"
              >
                <ChevronRight className={cn('w-3 h-3 transition-transform', showSmartFolders && 'rotate-90')} />
                Smart Folders
              </button>
              <button
                onClick={() => setShowSmartFolderModal(true)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {showSmartFolders && (
              <div className="space-y-0.5">
                {smartFolderTree.map(sf => (
                  <SmartFolderNode
                    key={sf.id}
                    smartFolder={sf}
                    depth={0}
                    onSelect={setSelectedFolderId}
                    selectedId={selectedFolderId === `smart_${sf.id}` ? `smart_${sf.id}` : null}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Folders</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTagManager(true)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              title="Manage tags"
            >
              <Tag className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-0.5">
          {userFolders.map(folder => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={0}
              onSelect={setSelectedFolderId}
              selectedId={selectedFolderId}
            />
          ))}
        </div>

        {userFolders.length === 0 && (
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="w-full text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 px-3 py-2 text-left transition-colors"
          >
            + New folder
          </button>
        )}
      </div>

      <TagManager open={showTagManager} onClose={() => setShowTagManager(false)} />
      <SmartFolderModal open={showSmartFolderModal} onClose={() => setShowSmartFolderModal(false)} onCreated={() => {}} />
      <NewFolderModal open={showNewFolderModal} onClose={() => setShowNewFolderModal(false)} />
    </div>
  );
}
