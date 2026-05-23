import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getBook } from "@/lib/bible-books";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { EmbedHtml } from "@/components/embed-html";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/book/$book/$chapter")({
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
          { title: `${loaderData.book.name} ${loaderData.chapter} — VideoBible` },
          { name: "description", content: `Watch ${loaderData.book.name} chapter ${loaderData.chapter} on VideoBible.` },
        ]
      : [],
  }),
  component: ChapterPage,
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
        <h1 className="font-display text-4xl mb-3">Chapter not found</h1>
        <Link to="/" className="text-primary underline">Back home</Link>
      </div>
    </div>
  ),
});

function ChapterPage() {
  const { book, chapter } = Route.useLoaderData();

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", book.slug, chapter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("embed_html,title")
        .eq("book_slug", book.slug)
        .eq("chapter", chapter)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const prev = chapter > 1 ? chapter - 1 : null;
  const next = chapter < book.chapters ? chapter + 1 : null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center mb-4">
          <Link to="/book/$book/" params={{ book: book.slug }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
        <nav className="text-sm text-muted-foreground mb-6 text-center">
          <Link to="/" className="hover:text-primary transition">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/books" className="hover:text-primary transition">Books</Link>
          <span className="mx-2">›</span>
          <Link to="/book/$book/" params={{ book: book.slug }} className="hover:text-primary transition">{book.name}</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">Chapter {chapter}</span>
        </nav>

        <div className="text-center mb-6">
          <h1 className="font-display text-4xl sm:text-5xl">
            {book.name} <span className="text-primary">{chapter}</span>
          </h1>
        </div>

        <div className="video-embed relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border" style={{ boxShadow: "var(--shadow-glow)" }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Loading…</div>
          ) : video?.embed_html ? (
            <EmbedHtml html={video.embed_html} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>div]:w-full [&>div]:h-full" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center p-8">
              <div>
                <p className="font-display text-2xl mb-2">No video yet</p>
                <p className="text-muted-foreground text-sm">A video for {book.name} {chapter} hasn't been added yet. Check back soon.</p>
              </div>
            </div>
          )}
        </div>

        {video?.title && (() => {
          const parts = video.title.split("||").map((p) => p.trim()).filter(Boolean);
          const subtitle = parts.length > 1 ? parts.slice(1).join(" — ") : parts[0];
          return (
            <p className="text-center text-muted-foreground mt-4 text-base sm:text-lg">
              {subtitle}
            </p>
          );
        })()}

        {/* Nav */}
        <div className="flex justify-between items-center mt-8">
          {prev ? (
            <Link to="/book/$book/$chapter" params={{ book: book.slug, chapter: String(prev) }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-accent transition">
              <ChevronLeft className="h-4 w-4" /> Chapter {prev}
            </Link>
          ) : <div />}
          {next ? (
            <Link to="/book/$book/$chapter" params={{ book: book.slug, chapter: String(next) }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-accent transition">
              Chapter {next} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <div />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
