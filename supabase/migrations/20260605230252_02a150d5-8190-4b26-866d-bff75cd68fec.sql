ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'good',
  ALTER COLUMN price_pkr DROP NOT NULL;