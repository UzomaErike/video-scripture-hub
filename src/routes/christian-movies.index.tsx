import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

type Movie = { id: string; title: string; image_url: string | null };

export const Route = createFileRoute("/christian-movies/")({
  head: () => ({
    meta: [
      { title: "Christian Movies — VideoBible" },
      { name: "description", content: "Faith-based movies and series, episode by episode." },
    ],
  }),
  component: ChristianMoviesPage,
});

function ChristianMoviesPage() {
  const [movies, setMovies] = useState<Movie[] | null>(null);

  useEffect(() => {
    supabase
      .from("movies")
      .select("id,title,image_url")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => setMovies((data as Movie[]) ?? []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 flex-1">
        <nav className="text-center text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">Christian Movies</span>
        </nav>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Clapperboard className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Christian Movies
          </h1>
        </div>

        {movies === null ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : movies.length === 0 ? (
          <p className="text-center text-muted-foreground">No movies yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {movies.map((m) => (
              <Link
                key={m.id}
                to="/christian-movies/$id"
                params={{ id: m.id }}
                className="group rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="aspect-[3/4] bg-background overflow-hidden">
                  {m.image_url ? (
                    <img
                      src={m.image_url}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Clapperboard className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm sm:text-base line-clamp-2">{m.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
