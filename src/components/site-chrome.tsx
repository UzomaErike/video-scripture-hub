import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: "var(--gradient-gold)" }}>
            <BookOpen className="h-5 w-5 text-background" />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight">
            Video<span className="text-primary">Bible</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            Books
          </Link>
          <Link to="/about" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 text-sm text-muted-foreground flex flex-col sm:flex-row gap-3 justify-between">
        <p>© {new Date().getFullYear()} VideoBible. All scripture videos hosted on Rumble.</p>
        <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
      </div>
    </footer>
  );
}
