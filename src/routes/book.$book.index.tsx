import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getBook } from "@/lib/bible-books";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ChevronLeft, PlayCircle, Circle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/book/$book/")({
  loader: ({ params }) => {
    const book = getBook(params.book);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.book.name} — VideoBible` },
          { name: "description", content: `Watch every chapter of ${loaderData.book.name} on VideoBible.` },
        ]
      : [],
  }),
  component: BookPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-destructive mb-3">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="text-primary underline">Retry</button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="font-display text-4xl mb-3">Book not found</h1>
        <Link to="/" className="text-primary underline">Back to all books</Link>
      </div>
    </div>
  ),
});

function BookPage() {
  const { book } = Route.useLoaderData();

  const { data: videos } = useQuery({
    queryKey: ["videos", book.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("chapter,title")
        .eq("book_slug", book.slug);
      if (error) throw error;
      return new Set((data ?? []).map((v) => v.chapter));
    },
  });

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 flex-1">
        <div className="flex items-center mb-4">
          <Link to="/books" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
        <nav className="text-sm text-muted-foreground mb-6 text-center">
          <Link to="/" className="hover:text-primary transition">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/books" className="hover:text-primary transition">Books</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">{book.name}</span>
        </nav>
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-2">
            {book.testament === "old" ? "Old Testament" : "New Testament"}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl">{book.name}</h1>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
          {chapters.map((c) => {
            const has = videos?.has(c);
            return (
              <Link
                key={c}
                to="/book/$book/$chapter"
                params={{ book: book.slug, chapter: String(c) }}
                className="group aspect-square rounded-md border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all flex flex-col items-center justify-center relative"
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-0.5">Chapter</span>
                <span className="font-display text-xl leading-none">{c}</span>
                {has ? (
                  <PlayCircle className="absolute bottom-1.5 h-3.5 w-3.5 text-primary" />
                ) : (
                  <Circle className="absolute bottom-1.5 h-3 w-3 text-muted-foreground/40" />
                )}
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
