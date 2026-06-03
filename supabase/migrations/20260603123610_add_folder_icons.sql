/*
  # Update folders table with icon column

  ## Changes
  - Adds icon column to folders table if not exists
  - Ensures all folders have icons assigned
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'folders' AND column_name = 'icon'
  ) THEN
    ALTER TABLE folders ADD COLUMN icon text DEFAULT 'folder';
  END IF;
END $$;
