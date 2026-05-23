import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { EmbedHtml } from "@/components/embed-html";

type Hymn = { id: string; title: string; embed_html: string };

export const Route = createFileRoute("/christian-hymns/$id")({
  component: HymnDetailPage,
});

function HymnDetailPage() {
  const { id } = Route.useParams();
  const [hymn, setHymn] = useState<Hymn | null | undefined>(undefined);

  useEffect(() => {
    supabase
      .from("hymns")
      .select("id,title,embed_html")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setHymn((data as Hymn | null) ?? null));
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 flex-1">
        <nav className="text-center text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-1.5">›</span>
          <Link to="/christian-hymns" className="hover:text-foreground transition-colors">Christian Hymns</Link>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">{hymn?.title ?? "…"}</span>
        </nav>

        {hymn === undefined ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : hymn === null ? (
          <p className="text-center text-muted-foreground">Hymn not found.</p>
        ) : (
          <>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-6">
              {hymn.title}
            </h1>
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <EmbedHtml html={hymn.embed_html} className="aspect-video w-full [&_iframe]:w-full [&_iframe]:h-full" />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
