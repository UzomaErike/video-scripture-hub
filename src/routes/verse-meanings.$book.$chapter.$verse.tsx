import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getBook } from "@/lib/bible-books";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/verse-meanings/$book/$chapter/$verse")({
  loader: ({ params }) => {
    const book = getBook(params.book);
    if (!book) throw notFound();
    const chapter = parseInt(params.chapter, 10);
    const verse = parseInt(params.verse, 10);
    if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) throw notFound();
    if (!Number.isFinite(verse) || verse < 1) throw notFound();
    return { book, chapter, verse };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.book.name} ${loaderData.chapter}:${loaderData.verse} Meaning — VideoBible` },
          { name: "description", content: `Meaning of ${loaderData.book.name} ${loaderData.chapter}:${loaderData.verse}.` },
        ]
      : [],
  }),
  component: VerseMeaningPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="font-display text-4xl mb-3">Verse not found</h1>
        <Link to="/verse-meanings" className="text-primary underline">All verse meanings</Link>
      </div>
    </div>
  ),
});

function VerseMeaningPage() {
  const { book, chapter, verse } = Route.useLoaderData();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex-1">
        <Link to="/verse-meanings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <header className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            {book.name} {chapter}:{verse}
          </h1>
          <p className="text-muted-foreground">Verse meaning</p>
        </header>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="font-display text-2xl mb-2">Coming soon</p>
          <p className="text-muted-foreground text-sm">
            An in-depth meaning for this verse hasn't been added yet.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
