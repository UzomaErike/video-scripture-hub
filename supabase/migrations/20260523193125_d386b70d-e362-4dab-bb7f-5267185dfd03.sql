CREATE TABLE public.hymns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  embed_html text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hymns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view hymns"
ON public.hymns FOR SELECT
USING (true);

CREATE POLICY "admins can insert hymns"
ON public.hymns FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update hymns"
ON public.hymns FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete hymns"
ON public.hymns FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER hymns_touch_updated_at
BEFORE UPDATE ON public.hymns
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX hymns_sort_idx ON public.hymns (sort_order, created_at);