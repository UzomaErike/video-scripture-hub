
CREATE TABLE public.movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "admins can insert movies" ON public.movies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins can update movies" ON public.movies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins can delete movies" ON public.movies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER movies_touch_updated_at BEFORE UPDATE ON public.movies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.movie_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  embed_html TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_movie_episodes_movie ON public.movie_episodes(movie_id, sort_order, created_at);

ALTER TABLE public.movie_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view movie episodes" ON public.movie_episodes FOR SELECT USING (true);
CREATE POLICY "admins can insert movie episodes" ON public.movie_episodes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins can update movie episodes" ON public.movie_episodes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins can delete movie episodes" ON public.movie_episodes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER movie_episodes_touch_updated_at BEFORE UPDATE ON public.movie_episodes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('movie-images', 'movie-images', true);

CREATE POLICY "anyone can view movie images" ON storage.objects FOR SELECT USING (bucket_id = 'movie-images');
CREATE POLICY "admins can upload movie images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'movie-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins can update movie images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'movie-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins can delete movie images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'movie-images' AND has_role(auth.uid(), 'admin'::app_role));
