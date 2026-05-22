import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Search, PlayCircle, Play } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VideoBible — Browse all 66 books" },
      { name: "description", content: "Browse video commentary for every chapter of every book of the Bible." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter((b) => b.name.toLowerCase().includes(t));
  }, [q]);

  const ot = filtered.filter((b) => b.testament === "old");
  const nt = filtered.filter((b) => b.testament === "new");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80 mb-4">A cinematic scripture library</p>
          <h1 className="font-display text-5xl sm:text-7xl font-semibold leading-[1.05] mb-6">
            The World's First<br/>
            <span className="text-primary">Video Bible</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Explore every book and chapter of the Holy Bible through the power of video. A growing catalogue of teachings, documentaries and studies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              to="/book/genesis"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-base font-medium shadow hover:bg-primary/90 transition"
            >
              <Play className="h-5 w-5" />
              Watch Now
            </Link>
          </div>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a book… (e.g. John, Psalms, Revelation)"
              className="w-full rounded-full bg-card border border-border pl-12 pr-5 py-4 text-base outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
        </div>
      </section>

      {/* Books */}
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-16 flex-1">
        <BookSection title="Old Testament" books={ot} />
        <div className="h-16" />
        <BookSection title="New Testament" books={nt} />
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">No books match “{q}”.</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function BookSection({ title, books }: { title: string; books: typeof BIBLE_BOOKS }) {
  if (books.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
        <span className="text-sm text-muted-foreground">{books.length} books</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {books.map((b) => (
          <Link
            key={b.slug}
            to="/book/$book/"
            params={{ book: b.slug }}
            className="group relative rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/40 transition-all p-4 overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-all blur-2xl" />
            <div className="flex items-start justify-between mb-3">
              <PlayCircle className="h-5 w-5 text-primary/70 group-hover:text-primary transition" />
              <span className="text-xs text-muted-foreground">{b.chapters} ch</span>
            </div>
            <h3 className="font-display text-xl leading-tight">{b.name}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
