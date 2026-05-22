import { Link } from "@tanstack/react-router";
import { BookOpen, Menu, Headphones, FileText, MessageSquareQuote, Heart, Mail, Info, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  icon: typeof Headphones;
  to?: string;
  href?: string;
};

const navItems: NavItem[] = [
  { label: "Audio Bible", href: "#", icon: Headphones },
  { label: "Chapter Summaries", to: "/summary", icon: FileText },
  { label: "Verse Meanings", href: "#", icon: MessageSquareQuote },
  { label: "Support This Mission", href: "#", icon: Heart },
  { label: "Contact Us", href: "#", icon: Mail },
  { label: "About Us", href: "#", icon: Info },
  { label: "Settings", to: "/settings", icon: Settings },
];

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

        {/* Desktop tabs */}
        <nav className="hidden lg:flex items-center gap-5 text-sm text-muted-foreground">
          <Link to="/books" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            Books
          </Link>
          {navItems.map((item) =>
            item.to ? (
              <Link key={item.label} to={item.to} activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors whitespace-nowrap">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="hover:text-foreground transition-colors whitespace-nowrap">
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Mobile sidebar trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left font-display text-xl">
                Video<span className="text-primary">Bible</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              <Link to="/books" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors">
                <BookOpen className="h-4 w-4" />
                Books
              </Link>
              {navItems.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                )
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} VideoBible.</p>
      </div>
    </footer>
  );
}
