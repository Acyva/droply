/*
  # Add Location Data to Items

  1. New Columns on `items`
    - `latitude` (double precision, nullable) - GPS latitude
    - `longitude` (double precision, nullable) - GPS longitude
    - `location_name` (text, nullable) - Human-readable place name
    - `location_address` (text, nullable) - Street address

  2. Indexes
    - GIST index on (latitude, longitude) for spatial queries

  3. Notes
    - Only items tagged as "places" need location data
    - Null values allowed — most items won't have coordinates
*/

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_address text;

CREATE INDEX IF NOT EXISTS items_location_idx ON public.items(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
