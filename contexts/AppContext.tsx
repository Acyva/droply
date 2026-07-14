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
  conditions: Array<{
    field: 'type' | 'tag' | 'is_favorite';
    value: string | boolean;
  }>;
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
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  const refreshFolders = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      
      if (err) {
        console.error('Error fetching folders:', err);
        setError('Failed to load folders');
        return;
      }
      
      setFolders(data ?? []);
      setError(null);
    } catch (err) {
      console.error('Unexpected error in refreshFolders:', err);
      setError('Unexpected error loading folders');
    }
  }, [user]);

  const refreshItems = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('items')
        .select('*, item_tags(tag_id, tags(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load items');
        return;
      }
      
      if (data) {
        const mapped = data.map((item: any) => ({
          ...item,
          tags: (item.item_tags || []).map((it: any) => it.tags).filter(Boolean),
          latitude: item.latitude ?? null,
          longitude: item.longitude ?? null,
          location_name: item.location_name ?? null,
          location_address: item.location_address ?? null,
        }));
        setItems(mapped);
      }
      setError(null);
    } catch (err) {
      console.error('Unexpected error in refreshItems:', err);
      setError('Unexpected error loading items');
    }
  }, [user]);

  const refreshTags = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (err) {
        console.error('Error fetching tags:', err);
        setError('Failed to load tags');
        return;
      }
      
      setTags(data ?? []);
      setError(null);
    } catch (err) {
      console.error('Unexpected error in refreshTags:', err);
      setError('Unexpected error loading tags');
    }
  }, [user]);

  const refreshSmartFolders = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('smart_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      
      if (err) {
        console.error('Error fetching smart folders:', err);
        setError('Failed to load smart folders');
        return;
      }
      
      setSmartFolders(data ?? []);
      setError(null);
    } catch (err) {
      console.error('Unexpected error in refreshSmartFolders:', err);
      setError('Unexpected error loading smart folders');
    }
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
    setError(null);
    
    Promise.all([refreshFolders(), refreshItems(), refreshTags(), refreshSmartFolders()])
      .catch(err => {
        console.error('Error during initial data load:', err);
        setError('Failed to load data');
      })
      .finally(() => setLoading(false));
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
    try {
      const { data, error: err } = await supabase
        .from('folders')
        .insert({ user_id: user.id, name, parent_folder_id: parentId ?? null })
        .select()
        .single();
      
      if (err || !data) {
        console.error('Error creating folder:', err);
        setError('Failed to create folder');
        return null;
      }
      
      await refreshFolders();
      setError(null);
      return data;
    } catch (err) {
      console.error('Unexpected error in createFolder:', err);
      setError('Unexpected error creating folder');
      return null;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const { error: err } = await supabase.from('folders').delete().eq('id', id);
      if (err) {
        console.error('Error deleting folder:', err);
        setError('Failed to delete folder');
        return;
      }
      await refreshFolders();
      await refreshItems();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in deleteFolder:', err);
      setError('Unexpected error deleting folder');
    }
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    try {
      const { error: err } = await supabase.from('folders').update(updates).eq('id', id);
      if (err) {
        console.error('Error updating folder:', err);
        setError('Failed to update folder');
        return;
      }
      await refreshFolders();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in updateFolder:', err);
      setError('Unexpected error updating folder');
    }
  };

  const createSmartFolder = async (data: Partial<SmartFolder>): Promise<SmartFolder | null> => {
    if (!user) return null;
    try {
      const { data: created, error: err } = await supabase
        .from('smart_folders')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      
      if (err || !created) {
        console.error('Error creating smart folder:', err);
        setError('Failed to create smart folder');
        return null;
      }
      
      await refreshSmartFolders();
      setError(null);
      return created;
    } catch (err) {
      console.error('Unexpected error in createSmartFolder:', err);
      setError('Unexpected error creating smart folder');
      return null;
    }
  };

  const updateSmartFolder = async (id: string, updates: Partial<SmartFolder>) => {
    try {
      const { error: err } = await supabase.from('smart_folders').update(updates).eq('id', id);
      if (err) {
        console.error('Error updating smart folder:', err);
        setError('Failed to update smart folder');
        return;
      }
      await refreshSmartFolders();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in updateSmartFolder:', err);
      setError('Unexpected error updating smart folder');
    }
  };

  const deleteSmartFolder = async (id: string) => {
    try {
      const { error: err } = await supabase.from('smart_folders').delete().eq('id', id);
      if (err) {
        console.error('Error deleting smart folder:', err);
        setError('Failed to delete smart folder');
        return;
      }
      await refreshSmartFolders();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in deleteSmartFolder:', err);
      setError('Unexpected error deleting smart folder');
    }
  };

  const createItem = async (data: Partial<Item>): Promise<ItemWithTags | null> => {
    if (!user) return null;
    try {
      const { data: created, error: err } = await supabase
        .from('items')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      
      if (err || !created) {
        console.error('Error creating item:', err);
        setError('Failed to create item');
        return null;
      }
      
      await refreshItems();
      setError(null);
      return { ...created, tags: [] };
    } catch (err) {
      console.error('Unexpected error in createItem:', err);
      setError('Unexpected error creating item');
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    try {
      const { error: err } = await supabase.from('items').update(updates).eq('id', id);
      if (err) {
        console.error('Error updating item:', err);
        setError('Failed to update item');
        return;
      }
      await refreshItems();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in updateItem:', err);
      setError('Unexpected error updating item');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error: err } = await supabase.from('items').delete().eq('id', id);
      if (err) {
        console.error('Error deleting item:', err);
        setError('Failed to delete item');
        return;
      }
      await refreshItems();
      if (selectedItemId === id) setSelectedItemId(null);
      setError(null);
    } catch (err) {
      console.error('Unexpected error in deleteItem:', err);
      setError('Unexpected error deleting item');
    }
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      const { error: err } = await supabase.from('items').update({ is_favorite: !current }).eq('id', id);
      if (err) {
        console.error('Error toggling favorite:', err);
        setError('Failed to toggle favorite');
        return;
      }
      await refreshItems();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in toggleFavorite:', err);
      setError('Unexpected error toggling favorite');
    }
  };

  const toggleArchive = async (id: string, current: boolean) => {
    try {
      const { error: err } = await supabase.from('items').update({ is_archived: !current }).eq('id', id);
      if (err) {
        console.error('Error toggling archive:', err);
        setError('Failed to toggle archive');
        return;
      }
      await refreshItems();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in toggleArchive:', err);
      setError('Unexpected error toggling archive');
    }
  };

  const setItemTags = async (itemId: string, tagIds: string[]) => {
    try {
      const { error: err1 } = await supabase.from('item_tags').delete().eq('item_id', itemId);
      if (err1) {
        console.error('Error deleting item tags:', err1);
        setError('Failed to update tags');
        return;
      }
      
      if (tagIds.length > 0) {
        const { error: err2 } = await supabase.from('item_tags').insert(
          tagIds.map(tag_id => ({ item_id: itemId, tag_id }))
        );
        if (err2) {
          console.error('Error inserting item tags:', err2);
          setError('Failed to update tags');
          return;
        }
      }
      
      await refreshItems();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in setItemTags:', err);
      setError('Unexpected error updating tags');
    }
  };

  const createTag = async (name: string, color = '#6B7280'): Promise<Tag | null> => {
    if (!user) return null;
    try {
      const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      
      const { data, error: err } = await supabase
        .from('tags')
        .insert({ user_id: user.id, name, color })
        .select()
        .single();
      
      if (err || !data) {
        console.error('Error creating tag:', err);
        setError('Failed to create tag');
        return null;
      }
      
      await refreshTags();
      setError(null);
      return data;
    } catch (err) {
      console.error('Unexpected error in createTag:', err);
      setError('Unexpected error creating tag');
      return null;
    }
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    try {
      const { error: err } = await supabase.from('tags').update(updates).eq('id', id);
      if (err) {
        console.error('Error updating tag:', err);
        setError('Failed to update tag');
        return;
      }
      await refreshTags();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in updateTag:', err);
      setError('Unexpected error updating tag');
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error: err } = await supabase.from('tags').delete().eq('id', id);
      if (err) {
        console.error('Error deleting tag:', err);
        setError('Failed to delete tag');
        return;
      }
      await refreshTags();
      setError(null);
    } catch (err) {
      console.error('Unexpected error in deleteTag:', err);
      setError('Unexpected error deleting tag');
    }
  };

  const getFilteredItems = (): ItemWithTags[] => {
    let filtered = [...items];

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
    } else if (selectedFolderId?.startsWith('smart_')) {
      // Smart folder filtering
      const smartId = selectedFolderId.substring(6);
      const smartFolder = smartFolders.find(sf => sf.id === smartId);
      if (smartFolder?.conditions && smartFolder.conditions.length > 0) {
        filtered = filtered.filter(item => {
          return smartFolder.conditions.every((cond) => {
            if (cond.field === 'type') {
              return item.type === cond.value;
            } else if (cond.field === 'tag') {
              return item.tags.some(t => t.id === cond.value);
            } else if (cond.field === 'is_favorite') {
              return item.is_favorite === cond.value;
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
      filtered = filtered.filter(i => {
        const title = i.title?.toLowerCase() ?? '';
        const description = i.description?.toLowerCase() ?? '';
        const url = i.url?.toLowerCase() ?? '';
        const notes = i.personal_notes?.toLowerCase() ?? '';
        
        return (
          title.includes(q) ||
          description.includes(q) ||
          url.includes(q) ||
          notes.includes(q) ||
          i.tags.some(t => t.name.toLowerCase().includes(q))
        );
      });
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
        error,
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
