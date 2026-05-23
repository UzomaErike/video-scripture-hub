import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ChevronRight, FileText, Search } from "lucide-react";


export const Route = createFileRoute("/summary/")({
  head: () => ({
    meta: [
      { title: "Chapter Summaries — VideoBible" },
      { name: "description", content: "Concise, chapter-by-chapter summaries of every book of the Bible." },
      { property: "og:title", content: "Chapter Summaries — VideoBible" },
      { property: "og:description", content: "Concise, chapter-by-chapter summaries of every book of the Bible." },
    ],
  }),
  component: SummaryIndex,
});

function SummaryIndex() {
  const [tab, setTab] = useState<"old" | "new" | "all">("old");
  const [search, setSearch] = useState("");

  const { data: available } = useQuery({
    queryKey: ["chapter-summaries-index"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_summaries")
        .select("book_slug,chapter");
      if (error) throw error;
      const map = new Map<string, Set<number>>();
      for (const row of data ?? []) {
        if (!map.has(row.book_slug)) map.set(row.book_slug, new Set());
        map.get(row.book_slug)!.add(row.chapter);
      }
      return map;
    },
  });

  const searchLower = search.trim().toLowerCase();
  const books = BIBLE_BOOKS.filter(
    (b) =>
      (tab === "all" || b.testament === tab) &&
      (!searchLower ||
        b.name.toLowerCase().includes(searchLower) ||
        b.slug.toLowerCase().includes(searchLower))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-12 flex-1">
        <nav className="text-sm text-muted-foreground mb-6 text-center">
          <Link to="/" className="hover:text-primary transition">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">Chapter Summaries</span>
        </nav>

        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80 mb-3">
            <FileText className="h-3.5 w-3.5" /> Chapter Summaries
          </p>
          <h1 className="font-display text-5xl sm:text-6xl mb-3">Table of Contents</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse every book of the Bible and dive into a concise summary of each chapter.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {(["old", "new", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm border transition ${
                tab === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              {t === "old" ? "Old Testament" : t === "new" ? "New Testament" : "All Books"}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search books"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => {
            const has = available?.get(book.slug);
            const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
            return (
              <div key={book.slug} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-xl">
                    <span className="mr-2">{book.emoji}</span>
                    {book.name}
                  </h2>
                  <span className="text-xs text-muted-foreground">{book.chapters} ch</span>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {chapters.map((c) => {
                    const hasSummary = has?.has(c);
                    return (
                      <Link
                        key={c}
                        to="/summary/$book/$chapter"
                        params={{ book: book.slug, chapter: String(c) }}
                        className={`aspect-square rounded text-xs flex items-center justify-center border transition ${
                          hasSummary
                            ? "border-primary/60 text-primary hover:bg-primary/10"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {c}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

