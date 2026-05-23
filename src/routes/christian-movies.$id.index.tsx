import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

type Movie = { id: string; title: string; image_url: string | null };
type Episode = { id: string; title: string };

export const Route = createFileRoute("/christian-movies/$id/")({
  component: MovieDetailPage,
});

function MovieDetailPage() {
  const { id } = Route.useParams();
  const [movie, setMovie] = useState<Movie | null | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);

  useEffect(() => {
    supabase
      .from("movies")
      .select("id,title,image_url")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setMovie((data as Movie | null) ?? null));

    supabase
      .from("movie_episodes")
      .select("id,title")
      .eq("movie_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => setEpisodes((data as Episode[]) ?? []));
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex-1">
        <nav className="text-center text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-1.5">›</span>
          <Link to="/christian-movies" className="hover:text-foreground transition-colors">Christian Movies</Link>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">{movie?.title ?? "…"}</span>
        </nav>

        {movie === undefined ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : movie === null ? (
          <p className="text-center text-muted-foreground">Movie not found.</p>
        ) : (
          <>
            {movie.image_url && (
              <div className="mx-auto mb-6 w-40 aspect-[3/4] rounded-lg overflow-hidden border border-border">
                <img src={movie.image_url} alt={movie.title} className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-8">
              {movie.title}
            </h1>

            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Episodes</h2>
            {episodes === null ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : episodes.length === 0 ? (
              <p className="text-muted-foreground">No episodes yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {episodes.map((ep, i) => (
                  <li key={ep.id}>
                    <Link
                      to="/christian-movies/$id/$episodeId"
                      params={{ id: movie.id, episodeId: ep.id }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Play className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-medium flex-1 min-w-0 truncate">{ep.title}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
