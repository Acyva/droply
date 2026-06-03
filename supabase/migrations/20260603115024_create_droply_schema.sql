/*
  # Droply - Personal Bookmark and Notes Manager Schema

  ## Overview
  Creates the full database schema for Droply, a personal knowledge vault.

  ## Tables

  ### folders
  - Recursive hierarchy via parent_folder_id
  - Supports unlimited nesting
  - Special system folders (favorites, archive) tracked by is_system flag

  ### items
  - Core content items (links, notes, movies, books, articles, videos, products, custom)
  - URL metadata: title, description, favicon, preview image, domain
  - Personal notes, favorite status, archive status
  - Linked to folders

  ### tags
  - User-owned tags for organizing items

  ### item_tags
  - Many-to-many join between items and tags

  ## Security
  - RLS enabled on all tables
  - All policies require authenticated users
  - Users can only access their own data
*/

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  icon text DEFAULT 'folder',
  color text DEFAULT '#6B7280',
  is_system boolean DEFAULT false,
  system_type text, -- 'favorites', 'archive', 'all', 'recent'
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'link',
  -- 'link', 'note', 'movie', 'book', 'article', 'video', 'product', 'custom'
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  url text DEFAULT '',
  domain text DEFAULT '',
  favicon_url text DEFAULT '',
  preview_image_url text DEFAULT '',
  personal_notes text DEFAULT '',
  is_favorite boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_user_id_idx ON items(user_id);
CREATE INDEX IF NOT EXISTS items_folder_id_idx ON items(folder_id);
CREATE INDEX IF NOT EXISTS items_type_idx ON items(type);
CREATE INDEX IF NOT EXISTS items_is_favorite_idx ON items(is_favorite);
CREATE INDEX IF NOT EXISTS items_is_archived_idx ON items(is_archived);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON items(created_at DESC);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Item tags join table
CREATE TABLE IF NOT EXISTS item_tags (
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item tags"
  ON item_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_tags.item_id AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own item tags"
  ON item_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_tags.item_id AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own item tags"
  ON item_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_tags.item_id AND items.user_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default folders for new users
CREATE OR REPLACE FUNCTION create_default_folders_for_user(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO folders (user_id, name, icon, color, is_system, system_type, sort_order)
  VALUES
    (p_user_id, 'Favorites', 'star', '#F59E0B', true, 'favorites', 0),
    (p_user_id, 'Archive', 'archive', '#6B7280', true, 'archive', 1)
  ON CONFLICT DO NOTHING;
END;
$$ language 'plpgsql' SECURITY DEFINER;
