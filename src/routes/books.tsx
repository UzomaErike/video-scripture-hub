import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { BIBLE_BOOKS, type BibleBook } from "@/lib/bible-books";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";

type Filter = "old" | "new" | "all";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Browse the Bible — VideoBible" },
      { name: "description", content: "Browse every book of the Bible — Old and New Testament video chapters." },
      { property: "og:title", content: "Browse the Bible — VideoBible" },
      { property: "og:description", content: "Browse every book of the Bible — Old and New Testament video chapters." },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const [filter, setFilter] = useState<Filter>("old");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [covers, setCovers] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [{ data: vids }, { data: cvs }] = await Promise.all([
        supabase.from("videos").select("book_slug"),
        supabase.from("book_covers").select("book_slug,image_url"),
      ]);
      if (vids) {
        const c: Record<string, number> = {};
        for (const v of vids as { book_slug: string }[]) {
          c[v.book_slug] = (c[v.book_slug] ?? 0) + 1;
        }
        setCounts(c);
      }
      if (cvs) {
        const m: Record<string, string> = {};
        for (const r of cvs as { book_slug: string; image_url: string }[]) {
          m[r.book_slug] = r.image_url;
        }
        setCovers(m);
      }
    })();
  }, []);

  const ot = BIBLE_BOOKS.filter((b) => b.testament === "old");
  const nt = BIBLE_BOOKS.filter((b) => b.testament === "new");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 sm:py-14 flex-1">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">Books</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-5xl font-semibold mb-3 flex items-center gap-3">
          <span>📖</span> Browse the Bible
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Select a book to explore its chapters through video.
        </p>

        <div className="inline-flex rounded-full border border-border bg-card p-1 mb-10">
          <TabButton active={filter === "old"} onClick={() => setFilter("old")}>Old Testament</TabButton>
          <TabButton active={filter === "new"} onClick={() => setFilter("new")}>New Testament</TabButton>
          <TabButton active={filter === "all"} onClick={() => setFilter("all")}>All Books</TabButton>
        </div>

        {(filter === "old" || filter === "all") && (
          <BookSection title="Old Testament" subtitle={`${ot.length} Books`} books={ot} counts={counts} covers={covers} />
        )}
        {filter === "all" && <div className="h-12" />}
        {(filter === "new" || filter === "all") && (
          <BookSection title="New Testament" subtitle={`${nt.length} Books`} books={nt} counts={counts} covers={covers} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 sm:px-5 py-2 text-sm sm:text-base rounded-full transition-all " +
        (active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function BookSection({
  title, subtitle, books, counts, covers,
}: {
  title: string; subtitle: string; books: BibleBook[];
  counts: Record<string, number>; covers: Record<string, string>;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl sm:text-3xl mb-6">
        {title} <span className="text-muted-foreground font-normal">— {subtitle}</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((b) => (
          <BookCard
            key={b.slug}
            book={b}
            testamentLabel={b.testament === "old" ? "OT" : "NT"}
            videoCount={counts[b.slug] ?? 0}
            coverUrl={covers[b.slug]}
          />
        ))}
      </div>
    </section>
  );
}

function BookCard({
  book, testamentLabel, videoCount, coverUrl,
}: {
  book: BibleBook; testamentLabel: string; videoCount: number; coverUrl?: string;
}) {
  return (
    <Link
      to="/book/$book/"
      params={{ book: book.slug }}
      className="group relative rounded-xl border border-border bg-card hover:border-primary/60 hover:bg-accent/40 transition-all overflow-hidden flex gap-3 p-3"
    >
      <div className="absolute inset-x-0 -top-12 h-24 bg-primary/0 group-hover:bg-primary/10 blur-3xl transition-all pointer-events-none" />

      <div className="flex-1 min-w-0 flex flex-col pr-1">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
          {testamentLabel} · {book.category}
        </span>
        <span className="text-4xl mb-2 transition-transform group-hover:scale-110" aria-hidden>
          {book.emoji}
        </span>
        <h3 className="font-display text-lg leading-tight mb-1 truncate">{book.name}</h3>
        <p className="text-xs text-muted-foreground mt-auto">
          <span className="font-semibold text-primary">{book.chapters}</span> chapters
        </p>
      </div>

      <div className="relative w-[42%] shrink-0 aspect-[3/4] rounded-md overflow-hidden bg-background/40 self-end">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${book.name} cover`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
        {videoCount > 0 && (
          <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur border border-border px-2 py-0.5 text-xs font-medium text-primary">
            <Play className="h-3 w-3 fill-current" />
            {videoCount}
          </span>
        )}
      </div>
    </Link>
  );
}
