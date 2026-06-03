export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Using a simplified database type that avoids TypeScript overload issues with supabase-js
export type Database = {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_folder_id: string | null;
          icon: string;
          color: string;
          is_system: boolean;
          system_type: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_folder_id?: string | null;
          icon?: string;
          color?: string;
          is_system?: boolean;
          system_type?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_folder_id?: string | null;
          icon?: string;
          color?: string;
          is_system?: boolean;
          system_type?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          type: string;
          title: string;
          description: string;
          url: string;
          domain: string;
          favicon_url: string;
          preview_image_url: string;
          personal_notes: string;
          is_favorite: boolean;
          is_archived: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          type?: string;
          title?: string;
          description?: string;
          url?: string;
          domain?: string;
          favicon_url?: string;
          preview_image_url?: string;
          personal_notes?: string;
          is_favorite?: boolean;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          type?: string;
          title?: string;
          description?: string;
          url?: string;
          domain?: string;
          favicon_url?: string;
          preview_image_url?: string;
          personal_notes?: string;
          is_favorite?: boolean;
          is_archived?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
        };
      };
      item_tags: {
        Row: {
          item_id: string;
          tag_id: string;
        };
        Insert: {
          item_id: string;
          tag_id: string;
        };
        Update: {
          item_id?: string;
          tag_id?: string;
        };
      };
    };
  };
}

export type Folder = Database['public']['Tables']['folders']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type ItemTag = Database['public']['Tables']['item_tags']['Row'];

export type ItemWithTags = Item & {
  tags: Tag[];
};

export type FolderWithChildren = Folder & {
  children: FolderWithChildren[];
  item_count?: number;
};

export type ItemType =
  | 'link'
  | 'note'
  | 'movie'
  | 'book'
  | 'sport'
  | 'wishlist'
  | 'custom';
