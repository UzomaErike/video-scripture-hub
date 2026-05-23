import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Music } from "lucide-react";

export const Route = createFileRoute("/christian-hymns")({
  component: ChristianHymnsPage,
});

function ChristianHymnsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <nav className="text-center text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <span className="mx-1.5">›</span>
        <span className="text-foreground">Christian Hymns</span>
      </nav>

      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
          Christian Hymns
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Coming soon — a collection of beloved Christian hymns with lyrics and history.
        </p>
      </div>
    </div>
  );
}
