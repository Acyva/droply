'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Folder, Item, Tag, ItemWithTags, FolderWithChildren } from '@/lib/database.types';

export interface SmartFolder {
  id: string;
  user_id: string;
  name: string;
  description: string;
  parent_folder_id: string | null;
  icon: string;
  color: string;
  sort_order: number;
  conditions: any[];
  created_at: string;
  updated_at: string;
}

interface AppContextType {
  folders: Folder[];
  folderTree: FolderWithChildren[];
  smartFolders: SmartFolder[];
  smartFolderTree: SmartFolder[];
  items: ItemWithTags[];
  tags: Tag[];
  selectedFolderId: string | null;
  selectedItemId: string | null;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  filterType: string | null;
  loading: boolean;
  setSelectedFolderId: (id: string | null) => void;
  setSelectedItemId: (id: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (q: string) => void;
  setFilterType: (t: string | null) => void;
  refreshFolders: () => Promise<void>;
  refreshItems: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshSmartFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  createSmartFolder: (data: Partial<SmartFolder>) => Promise<SmartFolder | null>;
  updateSmartFolder: (id: string, updates: Partial<SmartFolder>) => Promise<void>;
  deleteSmartFolder: (id: string) => Promise<void>;
  createItem: (data: Partial<Item>) => Promise<ItemWithTags | null>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string, current: boolean) => Promise<void>;
  toggleArchive: (id: string, current: boolean) => Promise<void>;
  setItemTags: (itemId: string, tagIds: string[]) => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag | null>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getFilteredItems: () => ItemWithTags[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function buildFolderTree(folders: Folder[]): FolderWithChildren[] {
  const map = new Map<string, FolderWithChildren>();
  folders.forEach(f => map.set(f.id, { ...f, children: [] }));
  const roots: FolderWithChildren[] = [];
  map.forEach(folder => {
    if (folder.parent_folder_id) {
      const parent = map.get(folder.parent_folder_id);
      if (parent) parent.children.push(folder);
    } else {
      roots.push(folder);
    }
  });
  return roots.sort((a, b) => a.sort_order - b.sort_order);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [smartFolders, setSmartFolders] = useState<SmartFolder[]>([]);
  const [items, setItems] = useState<ItemWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshFolders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order');
    if (data) setFolders(data);
  }, [user]);

  const refreshItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('items')
      .select('*, item_tags(tag_id, tags(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      const mapped = data.map((item: any) => ({
        ...item,
        tags: (item.item_tags || []).map((it: any) => it.tags).filter(Boolean),
      }));
      setItems(mapped);
    }
  }, [user]);

  const refreshTags = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (data) setTags(data);
  }, [user]);

  const refreshSmartFolders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('smart_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order');
    if (data) setSmartFolders(data);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFolders([]);
      setSmartFolders([]);
      setItems([]);
      setTags([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([refreshFolders(), refreshItems(), refreshTags(), refreshSmartFolders()]).finally(() =>
      setLoading(false)
    );
  }, [user, refreshFolders, refreshItems, refreshTags, refreshSmartFolders]);

  const folderTree = buildFolderTree(folders);

  function buildSmartFolderTree(smartFolders: SmartFolder[]): SmartFolder[] {
    const roots: SmartFolder[] = [];
    smartFolders.forEach(sf => {
      if (!sf.parent_folder_id) roots.push(sf);
    });
    return roots.sort((a, b) => a.sort_order - b.sort_order);
  }

  const smartFolderTree = buildSmartFolderTree(smartFolders);

  const createFolder = async (name: string, parentId?: string | null): Promise<Folder | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: user.id, name, parent_folder_id: parentId ?? null })
      .select()
      .single();
    if (error || !data) return null;
    await refreshFolders();
    return data;
  };

  const deleteFolder = async (id: string) => {
    await supabase.from('folders').delete().eq('id', id);
    await refreshFolders();
    await refreshItems();
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    await supabase.from('folders').update(updates).eq('id', id);
    await refreshFolders();
  };

  const createSmartFolder = async (data: Partial<SmartFolder>): Promise<SmartFolder | null> => {
    if (!user) return null;
    const { data: created, error } = await supabase
      .from('smart_folders')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error || !created) return null;
    await refreshSmartFolders();
    return created;
  };

  const updateSmartFolder = async (id: string, updates: Partial<SmartFolder>) => {
    await supabase.from('smart_folders').update(updates).eq('id', id);
    await refreshSmartFolders();
  };

  const deleteSmartFolder = async (id: string) => {
    await supabase.from('smart_folders').delete().eq('id', id);
    await refreshSmartFolders();
  };

  const createItem = async (data: Partial<Item>): Promise<ItemWithTags | null> => {
    if (!user) return null;
    const { data: created, error } = await supabase
      .from('items')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error || !created) return null;
    await refreshItems();
    return { ...created, tags: [] };
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    await supabase.from('items').update(updates).eq('id', id);
    await refreshItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('items').delete().eq('id', id);
    await refreshItems();
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from('items').update({ is_favorite: !current }).eq('id', id);
    await refreshItems();
  };

  const toggleArchive = async (id: string, current: boolean) => {
    await supabase.from('items').update({ is_archived: !current }).eq('id', id);
    await refreshItems();
  };

  const setItemTags = async (itemId: string, tagIds: string[]) => {
    await supabase.from('item_tags').delete().eq('item_id', itemId);
    if (tagIds.length > 0) {
      await supabase.from('item_tags').insert(tagIds.map(tag_id => ({ item_id: itemId, tag_id })));
    }
    await refreshItems();
  };

  const createTag = async (name: string, color = '#6B7280'): Promise<Tag | null> => {
    if (!user) return null;
    const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();
    if (error || !data) return null;
    await refreshTags();
    return data;
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    await supabase.from('tags').update(updates).eq('id', id);
    await refreshTags();
  };

  const deleteTag = async (id: string) => {
    await supabase.from('tags').delete().eq('id', id);
    await refreshTags();
  };

  const getFilteredItems = (): ItemWithTags[] => {
    let filtered = items;

    if (selectedFolderId === 'favorites') {
      filtered = filtered.filter(i => i.is_favorite && !i.is_archived);
    } else if (selectedFolderId === 'archive') {
      filtered = filtered.filter(i => i.is_archived);
    } else if (selectedFolderId === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(i => !i.is_archived && new Date(i.created_at) > weekAgo);
    } else if (selectedFolderId === 'all' || selectedFolderId === null) {
      filtered = filtered.filter(i => !i.is_archived);
    } else if (selectedFolderId && selectedFolderId.startsWith('smart_')) {
      // Smart folder filtering
      const smartId = selectedFolderId.substring(6);
      const smartFolder = smartFolders.find(sf => sf.id === smartId);
      if (smartFolder && smartFolder.conditions && smartFolder.conditions.length > 0) {
        filtered = filtered.filter(item => {
          return smartFolder.conditions.every((cond: any) => {
            if (cond.field === 'type') {
              return item.type === cond.value;
            } else if (cond.field === 'tag') {
              return item.tags.some(t => t.id === cond.value);
            } else if (cond.field === 'is_favorite') {
              return item.is_favorite;
            }
            return true;
          });
        });
      }
    } else {
      // Regular folder
      filtered = filtered.filter(i => i.folder_id === selectedFolderId && !i.is_archived);
    }

    if (filterType) {
      filtered = filtered.filter(i => i.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        i =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.url.toLowerCase().includes(q) ||
          i.personal_notes.toLowerCase().includes(q) ||
          i.tags.some(t => t.name.toLowerCase().includes(q))
      );
    }

    return filtered;
  };

  return (
    <AppContext.Provider
      value={{
        folders,
        folderTree,
        smartFolders,
        smartFolderTree,
        items,
        tags,
        selectedFolderId,
        selectedItemId,
        viewMode,
        searchQuery,
        filterType,
        loading,
        setSelectedFolderId,
        setSelectedItemId,
        setViewMode,
        setSearchQuery,
        setFilterType,
        refreshFolders,
        refreshItems,
        refreshTags,
        refreshSmartFolders,
        createFolder,
        deleteFolder,
        updateFolder,
        createSmartFolder,
        updateSmartFolder,
        deleteSmartFolder,
        createItem,
        updateItem,
        deleteItem,
        toggleFavorite,
        toggleArchive,
        setItemTags,
        createTag,
        updateTag,
        deleteTag,
        getFilteredItems,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
