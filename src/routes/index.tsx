import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Play } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VideoBible — The World's First Video Bible" },
      { name: "description", content: "Explore every book and chapter of the Holy Bible through the power of video." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden flex-1 flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80 mb-4">A cinematic scripture library</p>
          <h1 className="font-display text-5xl sm:text-7xl font-semibold leading-[1.05] mb-6">
            The World's First<br/>
            <span className="text-primary">Video Bible</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Explore every book and chapter of the Holy Bible through the power of video. A growing collection of teachings, documentaries and studies.
          </p>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-base font-medium shadow hover:bg-primary/90 transition"
          >
            <Play className="h-5 w-5" />
            Watch Now
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
