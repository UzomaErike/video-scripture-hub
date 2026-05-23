CREATE TABLE public.verse_meanings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_slug text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  title text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  themes text[] NOT NULL DEFAULT '{}',
  application text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (book_slug, chapter, verse)
);

ALTER TABLE public.verse_meanings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view verse meanings"
ON public.verse_meanings FOR SELECT USING (true);

CREATE POLICY "admins can insert verse meanings"
ON public.verse_meanings FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update verse meanings"
ON public.verse_meanings FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete verse meanings"
ON public.verse_meanings FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_verse_meanings_updated_at
BEFORE UPDATE ON public.verse_meanings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_verse_meanings_lookup ON public.verse_meanings(book_slug, chapter, verse);