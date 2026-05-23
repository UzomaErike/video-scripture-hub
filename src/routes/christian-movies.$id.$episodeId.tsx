import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { EmbedHtml } from "@/components/embed-html";

type Episode = { id: string; title: string; embed_html: string; movie_id: string };
type Movie = { id: string; title: string };

export const Route = createFileRoute("/christian-movies/$id/$episodeId")({
  component: EpisodePage,
});

function EpisodePage() {
  const { id, episodeId } = Route.useParams();
  const [episode, setEpisode] = useState<Episode | null | undefined>(undefined);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    supabase
      .from("movie_episodes")
      .select("id,title,embed_html,movie_id")
      .eq("id", episodeId)
      .maybeSingle()
      .then(({ data }) => setEpisode((data as Episode | null) ?? null));

    supabase
      .from("movies")
      .select("id,title")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setMovie((data as Movie | null) ?? null));
  }, [id, episodeId]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 flex-1">
        <nav className="text-center text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-1.5">›</span>
          <Link to="/christian-movies" className="hover:text-foreground transition-colors">Christian Movies</Link>
          <span className="mx-1.5">›</span>
          <Link to="/christian-movies/$id" params={{ id }} className="hover:text-foreground transition-colors">
            {movie?.title ?? "…"}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">{episode?.title ?? "…"}</span>
        </nav>

        {episode === undefined ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : episode === null ? (
          <p className="text-center text-muted-foreground">Episode not found.</p>
        ) : (
          <>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-6">
              {episode.title}
            </h1>
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <EmbedHtml html={episode.embed_html} className="aspect-video w-full [&_iframe]:w-full [&_iframe]:h-full" />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
