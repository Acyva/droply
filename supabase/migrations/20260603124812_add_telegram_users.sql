/*
  # Add Telegram User Storage

  1. New Tables
    - `telegram_users`
      - `id` (uuid, primary key)
      - `auth_id` (uuid, foreign key to auth.users)
      - `telegram_id` (bigint, unique) - Telegram user ID
      - `first_name` (text)
      - `last_name` (text, nullable)
      - `username` (text, nullable)
      - `photo_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `telegram_users`
    - Users can only read their own Telegram profile
    - Only service_role can write during auth flow

  3. Indexes
    - Index on telegram_id for fast lookups
    - Index on auth_id for user queries
*/

CREATE TABLE IF NOT EXISTS public.telegram_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id bigint UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text,
  username text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS telegram_users_telegram_id_idx ON public.telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS telegram_users_auth_id_idx ON public.telegram_users(auth_id);

-- Enable RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own Telegram profile
CREATE POLICY "Users can view own telegram profile"
  ON public.telegram_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

-- Only service role can insert during auth
CREATE POLICY "Service role manages telegram users"
  ON public.telegram_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_telegram_users_updated_at
  BEFORE UPDATE ON public.telegram_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
