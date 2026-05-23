CREATE TABLE public.bible_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  translation text NOT NULL CHECK (translation IN ('kjv','nlt')),
  book_slug text NOT NULL,
  chapter integer NOT NULL CHECK (chapter > 0),
  verses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (translation, book_slug, chapter)
);

ALTER TABLE public.bible_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view bible chapters"
ON public.bible_chapters FOR SELECT
USING (true);

CREATE POLICY "admins can insert bible chapters"
ON public.bible_chapters FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update bible chapters"
ON public.bible_chapters FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete bible chapters"
ON public.bible_chapters FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bible_chapters_updated_at
BEFORE UPDATE ON public.bible_chapters
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_bible_chapters_lookup ON public.bible_chapters (translation, book_slug, chapter);