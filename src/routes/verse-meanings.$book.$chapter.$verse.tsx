import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBook } from "@/lib/bible-books";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { getOrGenerateVerseMeaning } from "@/lib/verse-meaning.functions";
import { ArrowLeft, Loader2 } from "lucide-react";

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
  const fetchMeaning = useServerFn(getOrGenerateVerseMeaning);

  const { data, isLoading, error } = useQuery({
    queryKey: ["verse-meaning", book.slug, chapter, verse],
    queryFn: () =>
      fetchMeaning({
        data: { bookSlug: book.slug, bookName: book.name, chapter, verse },
      }),
    staleTime: 1000 * 60 * 60 * 24,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex-1">
        <Link
          to="/verse-meanings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-2">Verse Meaning</p>
          <h1 className="font-display text-4xl sm:text-5xl mb-1">
            {data?.title || `${book.name} ${chapter}:${verse}`}
          </h1>
          <p className="text-muted-foreground">
            {book.name} {chapter}:{verse}
          </p>
        </header>

        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
            <p className="font-display text-xl mb-1">Preparing the meaning…</p>
            <p className="text-sm text-muted-foreground">
              First-time lookups take a few seconds. We'll cache it for next time.
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
            <p className="font-medium mb-1">Couldn't load this meaning.</p>
            <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
          </div>
        )}

        {data && (
          <article className="space-y-8">
            {data.intro && (
              <p className="text-lg leading-relaxed text-foreground/90">{data.intro}</p>
            )}

            {data.sections?.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-2xl mb-2">{s.heading}</h2>
                <p className="leading-relaxed text-foreground/85 whitespace-pre-line">{s.body}</p>
              </section>
            ))}

            {data.application && (
              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="font-display text-2xl mb-2">Application</h2>
                <p className="leading-relaxed text-foreground/85 whitespace-pre-line">
                  {data.application}
                </p>
              </section>
            )}

            {data.themes?.length > 0 && (
              <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.themes.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
