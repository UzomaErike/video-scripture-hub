import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BIBLE_BOOKS, type BibleBook } from "@/lib/bible-books";
import { getNltChapter } from "@/lib/nlt.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { MessageSquareQuote, Search, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/verse-meanings/")({
  head: () => ({
    meta: [
      { title: "Verse Meanings — VideoBible" },
      { name: "description", content: "Explore the meaning of every verse in the Bible, chapter by chapter." },
      { property: "og:title", content: "Verse Meanings — VideoBible" },
      { property: "og:description", content: "Explore the meaning of every verse in the Bible, chapter by chapter." },
    ],
  }),
  component: VerseMeaningsIndex,
});

function VerseMeaningsIndex() {
  const [tab, setTab] = useState<"old" | "new" | "all">("old");
  const [search, setSearch] = useState("");
  const [openChapter, setOpenChapter] = useState<{ book: string; chapter: number } | null>(null);

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
          <span className="text-foreground">Verse Meanings</span>
        </nav>

        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80 mb-3">
            <MessageSquareQuote className="h-3.5 w-3.5" /> Verse Meanings
          </p>
          <h1 className="font-display text-5xl sm:text-6xl mb-3">Explore Verse by Verse</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick a book, open a chapter, and dive into the meaning of each verse.
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
          {books.map((book) => (
            <BookCard
              key={book.slug}
              book={book}
              openChapter={openChapter?.book === book.slug ? openChapter.chapter : null}
              onToggle={(ch) =>
                setOpenChapter((prev) =>
                  prev?.book === book.slug && prev.chapter === ch ? null : { book: book.slug, chapter: ch }
                )
              }
            />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function BookCard({
  book,
  openChapter,
  onToggle,
}: {
  book: BibleBook;
  openChapter: number | null;
  onToggle: (chapter: number) => void;
}) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl">
          <span className="mr-2">{book.emoji}</span>
          {book.name}
        </h2>
        <span className="text-xs text-muted-foreground">{book.chapters} ch</span>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {chapters.map((c) => {
          const isOpen = openChapter === c;
          return (
            <button
              key={c}
              onClick={() => onToggle(c)}
              className={`aspect-square rounded text-xs flex items-center justify-center border transition ${
                isOpen
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      {openChapter && (
        <VersePicker book={book} chapter={openChapter} />
      )}
    </div>
  );
}

function VersePicker({ book, chapter }: { book: BibleBook; chapter: number }) {
  const fetchChapter = useServerFn(getNltChapter);
  const { data, isLoading, error } = useQuery({
    queryKey: ["nlt-chapter-verses", book.slug, chapter],
    queryFn: () => fetchChapter({ data: { bookName: book.name, chapter } }),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <ChevronDown className="h-3 w-3" />
        {book.name} {chapter} — pick a verse
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading verses…</p>
      ) : error ? (
        <p className="text-xs text-destructive">Couldn't load verses.</p>
      ) : (
        <div className="grid grid-cols-8 gap-1.5">
          {(data?.verses ?? []).map((v) => (
            <Link
              key={v.verse}
              to="/verse-meanings/$book/$chapter/$verse"
              params={{ book: book.slug, chapter: String(chapter), verse: String(v.verse) }}
              className="aspect-square rounded text-xs flex items-center justify-center border border-primary/40 text-primary hover:bg-primary/10 transition"
            >
              {v.verse}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
