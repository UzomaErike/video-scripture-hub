
CREATE TABLE public.chapter_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_slug text NOT NULL,
  chapter integer NOT NULL,
  title text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_verses jsonb NOT NULL DEFAULT '[]'::jsonb,
  themes text[] NOT NULL DEFAULT '{}',
  connection_to_jesus text,
  contemporary_relevance text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_slug, chapter)
);

ALTER TABLE public.chapter_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view chapter summaries"
  ON public.chapter_summaries FOR SELECT
  USING (true);

CREATE POLICY "admins can insert chapter summaries"
  ON public.chapter_summaries FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update chapter summaries"
  ON public.chapter_summaries FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete chapter summaries"
  ON public.chapter_summaries FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER chapter_summaries_touch_updated_at
  BEFORE UPDATE ON public.chapter_summaries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX chapter_summaries_book_idx ON public.chapter_summaries (book_slug, chapter);
