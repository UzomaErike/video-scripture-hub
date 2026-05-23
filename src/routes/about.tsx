import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — VideoBible" },
      { name: "description", content: "About VideoBible — a free video library covering every chapter of the Bible." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-16 flex-1">
        <div className="mb-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Home
          </Link>
        </div>
        <h1 className="font-display text-5xl mb-6 text-center">About VideoBible</h1>
        <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
          <p>
            VideoBible is a free, growing library of videos walking through every chapter of every book of
            the Bible — Genesis through Revelation, all 66 books.
          </p>
          <p>
            All videos are hosted on Rumble and embedded here for easy chapter-by-chapter viewing. There
            is no account needed and nothing to install. Just choose a book, pick a chapter, and watch.
          </p>
          <p>
            New chapters are added continuously. If a chapter doesn't have a video yet, it will soon.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
