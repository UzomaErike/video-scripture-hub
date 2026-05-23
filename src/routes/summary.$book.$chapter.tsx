import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBook } from "@/lib/bible-books";
import { getOrGenerateSummary } from "@/lib/summary.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ChevronLeft, ChevronRight, List, PlayCircle, ArrowLeft } from "lucide-react";

type SectionPoint = { title?: string; body: string };
type Section = { heading: string; points?: SectionPoint[]; body?: string };
type KeyVerse = { reference: string; text: string };

export const Route = createFileRoute("/summary/$book/$chapter")({
  loader: ({ params }) => {
    const book = getBook(params.book);
    if (!book) throw notFound();
    const chapter = parseInt(params.chapter, 10);
    if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) throw notFound();
    return { book, chapter };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.book.name} ${loaderData.chapter} Summary — VideoBible` },
          { name: "description", content: `Read a concise summary of ${loaderData.book.name} chapter ${loaderData.chapter}.` },
          { property: "og:title", content: `${loaderData.book.name} ${loaderData.chapter} Summary — VideoBible` },
          { property: "og:description", content: `Read a concise summary of ${loaderData.book.name} chapter ${loaderData.chapter}.` },
        ]
      : [],
  }),
  component: SummaryPage,
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
        <h1 className="font-display text-4xl mb-3">Summary not found</h1>
        <Link to="/summary" className="text-primary underline">All summaries</Link>
      </div>
    </div>
  ),
});

function SummaryPage() {
  const { book, chapter } = Route.useLoaderData();
  const fetchSummary = useServerFn(getOrGenerateSummary);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["chapter-summary", book.slug, chapter],
    queryFn: () => fetchSummary({ data: { bookSlug: book.slug, bookName: book.name, chapter } }),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const prev = chapter > 1 ? chapter - 1 : null;
  const next = chapter < book.chapters ? chapter + 1 : null;

  const sections = (summary?.sections ?? []) as unknown as Section[];
  const keyVerses = (summary?.key_verses ?? []) as unknown as KeyVerse[];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex-1">
        <div className="flex items-center mb-4">
          <Link to="/summary" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
        {/* Top nav strip */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
          {prev ? (
            <Link to="/summary/$book/$chapter" params={{ book: book.slug, chapter: String(prev) }} className="inline-flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> {book.name} {prev}
            </Link>
          ) : <span />}
          <Link to="/summary" className="inline-flex items-center gap-1 hover:text-foreground">
            <List className="h-4 w-4" /> TOC
          </Link>
          {next ? (
            <Link to="/summary/$book/$chapter" params={{ book: book.slug, chapter: String(next) }} className="inline-flex items-center gap-1 hover:text-foreground">
              {book.name} {next} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </div>

        <header className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            {book.name} {chapter} Summary
          </h1>
          {summary?.title && (
            <p className="font-display text-xl text-muted-foreground">{summary.title}</p>
          )}
        </header>

        {isLoading ? (
          <p className="text-muted-foreground">Preparing summary… this may take a moment the first time.</p>
        ) : !summary ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="font-display text-2xl mb-2">Summary coming soon</p>
            <p className="text-muted-foreground text-sm mb-4">
              A written summary for {book.name} {chapter} hasn't been added yet.
            </p>
            <Link
              to="/book/$book/$chapter"
              params={{ book: book.slug, chapter: String(chapter) }}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <PlayCircle className="h-4 w-4" /> Watch the video instead
            </Link>
          </div>
        ) : (
          <article className="prose-summary space-y-8">
            {summary.intro && (
              <p className="text-lg leading-relaxed text-foreground/90">{summary.intro}</p>
            )}

            {sections.map((sec, i) => (
              <section key={i}>
                <h2 className="font-display text-2xl mb-3">{sec.heading}</h2>
                {sec.body && <p className="leading-relaxed text-foreground/90 mb-3">{sec.body}</p>}
                {sec.points && (
                  <ul className="space-y-3">
                    {sec.points.map((p, j) => (
                      <li key={j} className="leading-relaxed text-foreground/90">
                        {p.title && <span className="font-semibold">{p.title}: </span>}
                        {p.body}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {summary.connection_to_jesus && (
              <section>
                <h2 className="font-display text-2xl mb-3">Theological Significance & Connection to Jesus</h2>
                <p className="leading-relaxed text-foreground/90">{summary.connection_to_jesus}</p>
              </section>
            )}

            {keyVerses.length > 0 && (
              <section>
                <h2 className="font-display text-2xl mb-3">Key Verses</h2>
                <ul className="space-y-3">
                  {keyVerses.map((v, i) => (
                    <li key={i} className="border-l-2 border-primary/60 pl-4">
                      <p className="text-foreground/90 italic">"{v.text}"</p>
                      <p className="text-sm text-muted-foreground mt-1">— {v.reference}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {summary.themes && summary.themes.length > 0 && (
              <section>
                <h2 className="font-display text-2xl mb-3">Themes</h2>
                <div className="flex flex-wrap gap-2">
                  {summary.themes.map((t: string) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/30">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {summary.contemporary_relevance && (
              <section>
                <h2 className="font-display text-2xl mb-3">Contemporary Relevance</h2>
                <p className="leading-relaxed text-foreground/90">{summary.contemporary_relevance}</p>
              </section>
            )}

            <div className="pt-6 border-t border-border">
              <Link
                to="/book/$book/$chapter"
                params={{ book: book.slug, chapter: String(chapter) }}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <PlayCircle className="h-4 w-4" /> Watch {book.name} {chapter}
              </Link>
            </div>
          </article>
        )}

        {/* Bottom nav */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
          {prev ? (
            <Link to="/summary/$book/$chapter" params={{ book: book.slug, chapter: String(prev) }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-accent transition">
              <ChevronLeft className="h-4 w-4" /> {book.name} {prev}
            </Link>
          ) : <div />}
          {next ? (
            <Link to="/summary/$book/$chapter" params={{ book: book.slug, chapter: String(next) }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-accent transition">
              {book.name} {next} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <div />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
