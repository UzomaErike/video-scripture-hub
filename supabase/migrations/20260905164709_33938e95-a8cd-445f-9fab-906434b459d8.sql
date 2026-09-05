ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'rumble',
  ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE public.videos ALTER COLUMN embed_html SET DEFAULT '';
