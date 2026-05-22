import { createFileRoute, Link } from "@tanstack/react-router";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { PlayCircle } from "lucide-react";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Books — VideoBible" },
      { name: "description", content: "Browse every book of the Bible — Old and New Testament video chapters." },
      { property: "og:title", content: "Books — VideoBible" },
      { property: "og:description", content: "Browse every book of the Bible — Old and New Testament video chapters." },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const ot = BIBLE_BOOKS.filter((b) => b.testament === "old");
  const nt = BIBLE_BOOKS.filter((b) => b.testament === "new");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-16 flex-1">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-4">All Books</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          Explore every book of the Holy Bible through video. Select a book to browse its chapters.
        </p>

        <BookSection title="Old Testament" books={ot} />
        <div className="h-16" />
        <BookSection title="New Testament" books={nt} />
      </main>

      <SiteFooter />
    </div>
  );
}

function BookSection({ title, books }: { title: string; books: typeof BIBLE_BOOKS }) {
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
