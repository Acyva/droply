/*
  # Create Telegram Pending Items Table

  1. New Table
    - `telegram_pending_items`
      - `telegram_id` (bigint, primary key) - Telegram user ID
      - `step` (text) - Current conversation step: 'folder', 'tags', 'notes'
      - `type` (text) - Item type: 'link', 'note', 'place', etc.
      - `title` (text) - Item title
      - `url` (text) - URL if link
      - `description` (text) - Description
      - `personal_notes` (text) - User notes
      - `photo_url` (text) - Photo URL if photo was sent
      - `folder_id` (text) - Selected folder ID
      - `tags` (jsonb) - Array of selected tag IDs
      - `latitude` (double precision, nullable) - GPS latitude
      - `longitude` (double precision, nullable) - GPS longitude
      - `location_name` (text, nullable) - Place name
      - `location_address` (text, nullable) - Place address
      - `created_at` (timestamptz) - When pending item was created

  2. Security
    - Only service_role can access (internal bot state)
    - No user-facing access needed

  3. Notes
    - Used to track conversation state between bot messages
    - Items are deleted once saved to the items table
    - telegram_id is unique - one pending item per user
*/

CREATE TABLE IF NOT EXISTS public.telegram_pending_items (
  telegram_id bigint PRIMARY KEY,
  step text NOT NULL DEFAULT 'folder',
  type text NOT NULL DEFAULT 'note',
  title text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  personal_notes text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '',
  folder_id text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  latitude double precision,
  longitude double precision,
  location_name text,
  location_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.telegram_pending_items ENABLE ROW LEVEL SECURITY;

-- Only service_role can access pending items (bot internal state)
CREATE POLICY "Service role manages pending items"
  ON public.telegram_pending_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
