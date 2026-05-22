import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BIBLE_BOOKS, type BibleBook } from "@/lib/bible-books";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

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
          <TabButton active={filter === "old"} onClick={() => setFilter("old")}>
            Old Testament
          </TabButton>
          <TabButton active={filter === "new"} onClick={() => setFilter("new")}>
            New Testament
          </TabButton>
          <TabButton active={filter === "all"} onClick={() => setFilter("all")}>
            All Books
          </TabButton>
        </div>

        {(filter === "old" || filter === "all") && (
          <BookSection title="Old Testament" subtitle={`${ot.length} Books`} books={ot} />
        )}
        {filter === "all" && <div className="h-12" />}
        {(filter === "new" || filter === "all") && (
          <BookSection title="New Testament" subtitle={`${nt.length} Books`} books={nt} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 sm:px-5 py-2 text-sm sm:text-base rounded-full transition-all " +
        (active
          ? "bg-primary text-primary-foreground shadow"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function BookSection({
  title,
  subtitle,
  books,
}: {
  title: string;
  subtitle: string;
  books: BibleBook[];
}) {
  return (
    <section>
      <h2 className="font-display text-2xl sm:text-3xl mb-6">
        {title} <span className="text-muted-foreground font-normal">— {subtitle}</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} testamentLabel={b.testament === "old" ? "OT" : "NT"} />
        ))}
      </div>
    </section>
  );
}

function BookCard({ book, testamentLabel }: { book: BibleBook; testamentLabel: string }) {
  return (
    <Link
      to="/book/$book/"
      params={{ book: book.slug }}
      className="group relative flex flex-col items-center text-center rounded-xl border border-border bg-card hover:border-primary/60 hover:bg-accent/40 transition-all p-5 overflow-hidden"
    >
      <div className="absolute inset-x-0 -top-12 h-24 bg-primary/0 group-hover:bg-primary/10 blur-3xl transition-all" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
        {testamentLabel} · {book.category}
      </span>
      <span className="text-5xl mb-3 transition-transform group-hover:scale-110" aria-hidden>
        {book.emoji}
      </span>
      <h3 className="font-display text-lg leading-tight mb-1">{book.name}</h3>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{book.chapters}</span> chapters
      </p>
    </Link>
  );
}
