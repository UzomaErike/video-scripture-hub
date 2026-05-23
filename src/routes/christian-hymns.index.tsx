import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Music, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

type Hymn = { id: string; title: string };

export const Route = createFileRoute("/christian-hymns/")({
  head: () => ({
    meta: [
      { title: "Christian Hymns and Lyrics — VideoBible" },
      { name: "description", content: "A growing collection of beloved Christian hymns with video and lyrics." },
    ],
  }),
  component: ChristianHymnsPage,
});

function ChristianHymnsPage() {
  const [hymns, setHymns] = useState<Hymn[] | null>(null);

  useEffect(() => {
    supabase
      .from("hymns")
      .select("id,title")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => setHymns((data as Hymn[]) ?? []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex-1">
        <nav className="text-center text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">Christian Hymns and Lyrics</span>
        </nav>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Music className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Christian Hymns and Lyrics
          </h1>
        </div>

        {hymns === null ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : hymns.length === 0 ? (
          <p className="text-center text-muted-foreground">No hymns yet. Check back soon.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {hymns.map((h) => (
              <li key={h.id}>
                <Link
                  to="/christian-hymns/$id"
                  params={{ id: h.id }}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium">{h.title}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
