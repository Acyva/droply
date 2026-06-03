/*
  # Fix Function Security Issues

  ## Overview
  Addresses Supabase security warnings by:
  1. Making function search_path immutable (not role-mutable)
  2. Changing create_default_folders_for_user to SECURITY INVOKER
     to prevent unauthorized execution via REST API

  ## Changes
  - Drop and recreate update_updated_at_column with IMMUTABLE search_path
  - Drop and recreate create_default_folders_for_user as SECURITY INVOKER
  - Revoke public/anon execute permissions on create_default_folders_for_user

  ## Security Impact
  - Functions now have fixed search_path instead of role-dependent
  - create_default_folders_for_user respects caller's permissions
  - REST API cannot invoke create_default_folders_for_user
*/

-- Drop triggers first to allow function recreation
DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;
DROP TRIGGER IF EXISTS update_folders_updated_at ON public.folders;
DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
DROP TRIGGER IF EXISTS update_smart_folders_updated_at ON public.smart_folders;

-- Drop dependent functions
DROP FUNCTION IF EXISTS public.create_default_folders_for_user(uuid);
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate update_updated_at_column with immutable search_path
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate create_default_folders_for_user with SECURITY INVOKER
CREATE FUNCTION public.create_default_folders_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.folders (user_id, name, color, icon, is_system)
  VALUES
    (p_user_id, 'Inbox', '#F59E0B', 'inbox', true),
    (p_user_id, 'Archive', '#6B7280', 'archive', true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Explicitly revoke execute permissions
REVOKE EXECUTE ON FUNCTION public.create_default_folders_for_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_default_folders_for_user(uuid) FROM authenticated;

-- Grant execute only to service role (internal use)
GRANT EXECUTE ON FUNCTION public.create_default_folders_for_user(uuid) TO service_role;

-- Recreate triggers
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smart_folders_updated_at
  BEFORE UPDATE ON public.smart_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
