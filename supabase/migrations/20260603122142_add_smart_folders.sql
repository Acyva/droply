/*
  # Add Smart Folders with Filter Rules

  ## Overview
  Adds support for dynamic smart folders similar to Apple Notes/Reminders.
  Smart folders are virtual folders that display items based on filter conditions.
  They support nesting and can contain other smart folders or regular folders.

  ## New Tables

  ### smart_folders
  - Stores dynamic folder definitions with filter rules
  - Supports nested smart folders via parent_folder_id
  - Conditions stored as JSON for flexibility (type, tag, date range, etc.)

  ## Changes
  - Added smart_folders table
  - Added smart_folder_conditions join table for rule management
  - Folders table now supports both regular and smart folder types
*/

CREATE TABLE IF NOT EXISTS smart_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  parent_folder_id uuid REFERENCES smart_folders(id) ON DELETE CASCADE,
  icon text DEFAULT 'filter',
  color text DEFAULT '#6B7280',
  sort_order integer DEFAULT 0,
  -- Filter conditions stored as JSON array
  -- Example: [{"field": "type", "operator": "equals", "value": "link"}, ...]
  conditions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own smart folders"
  ON smart_folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smart folders"
  ON smart_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart folders"
  ON smart_folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart folders"
  ON smart_folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS smart_folders_user_id_idx ON smart_folders(user_id);
CREATE INDEX IF NOT EXISTS smart_folders_parent_id_idx ON smart_folders(parent_folder_id);

-- Create trigger for updated_at
CREATE TRIGGER update_smart_folders_updated_at
  BEFORE UPDATE ON smart_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
