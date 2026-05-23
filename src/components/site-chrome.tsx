"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Menu, Headphones, FileText, MessageSquareQuote, Heart, Mail, Settings, Clapperboard, Music } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

type NavItem = {
  label: string;
  icon: typeof Headphones;
  to?: string;
  href?: string;
  dialogTrigger?: boolean;
};

const navItems: NavItem[] = [
  { label: "Chapter Summaries", to: "/summary", icon: FileText },
  { label: "Verse Meanings", to: "/verse-meanings", icon: MessageSquareQuote },
  { label: "Christian Movies", to: "/christian-movies", icon: Clapperboard },
  { label: "Support This Mission", href: "#", icon: Heart, dialogTrigger: true },
  { label: "Contact Us", href: "mailto:videobible.watch@gmail.com", icon: Mail },
  { label: "About Us", to: "/about", icon: BookOpen },
  { label: "Settings", to: "/settings", icon: Settings },
];

/* ------------------------------------------------------------------ */
//  Shared donate-dialog state
/* ------------------------------------------------------------------ */
const DonateDialogContext = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

export function DonateDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <DonateDialogContext.Provider value={{ open, setOpen }}>
      {children}
      {mounted && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DonateDialogContent />
        </Dialog>
      )}
    </DonateDialogContext.Provider>
  );
}

export function useDonateDialog() {
  const ctx = React.useContext(DonateDialogContext);
  if (!ctx) throw new Error("useDonateDialog must be used within DonateDialogProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
//  Header
/* ------------------------------------------------------------------ */
export function SiteHeader() {
  const { setOpen } = useDonateDialog();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const openDonate = React.useCallback(() => {
    setSheetOpen(false);
    setOpen(true);
  }, [setOpen]);

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
          {navItems.map((item) =>
            item.dialogTrigger ? (
              <button
                key={item.label}
                onClick={() => setOpen(true)}
                className="hover:text-foreground transition-colors whitespace-nowrap"
              >
                {item.label}
              </button>
            ) : item.to ? (
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
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
              {navItems.map((item) =>
                item.dialogTrigger ? (
                  <button
                    key={item.label}
                    onClick={openDonate}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ) : item.to ? (
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

/* ------------------------------------------------------------------ */
//  Footer
/* ------------------------------------------------------------------ */
export function SiteFooter() {
  const { setOpen } = useDonateDialog();

  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-display font-semibold shadow-lg transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 hover:scale-105 active:scale-95 active:translate-y-0 bg-primary text-primary-foreground"
        >
          <span aria-hidden className="inline-block transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">🙏</span>
          Become a Video Bible Maker
        </button>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="#" aria-label="Download on the App Store" className="group inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white border border-white/10 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 active:translate-y-0">
            <svg viewBox="0 0 24 24" className="h-7 w-7 transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-110" fill="currentColor" aria-hidden>
              <path d="M16.365 1.43c0 1.14-.43 2.23-1.21 3.02-.84.86-2.22 1.52-3.34 1.43-.14-1.12.41-2.29 1.18-3.05.85-.87 2.3-1.51 3.37-1.4zM20.5 17.27c-.56 1.29-.83 1.86-1.55 3-1.01 1.6-2.44 3.6-4.21 3.62-1.57.02-1.97-1.02-4.1-1.01-2.13.01-2.58 1.03-4.15 1.01-1.77-.02-3.12-1.82-4.13-3.42C-.36 16.95-.65 11.61 1.99 8.74c1.41-1.53 3.63-2.5 5.66-2.5 2.07 0 3.38 1.13 5.09 1.13 1.66 0 2.67-1.13 5.06-1.13 1.81 0 3.73.99 5.1 2.69-4.48 2.45-3.75 8.85-2.4 8.34z"/>
            </svg>
            <span className="flex flex-col leading-tight text-left">
              <span className="text-[10px] opacity-80 transition-opacity duration-300 group-hover:opacity-100">Download on the</span>
              <span className="text-base font-semibold -mt-0.5 transition-transform duration-300 group-hover:translate-x-0.5">App Store</span>
            </span>
          </a>
          <a href="#" aria-label="Get it on Google Play" className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-black border border-black/10 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 active:translate-y-0">
            <svg viewBox="0 0 24 24" className="h-7 w-7 transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110" aria-hidden>
              <path fill="#34A853" d="M3.6 20.5l10.2-10.2 2.8 2.8L6.4 23.3a1.7 1.7 0 0 1-2.8-1.2v-1.6z"/>
              <path fill="#FBBC04" d="M19.9 10.6l-3.4-1.9-3 3 3 3 3.4-1.9a1.7 1.7 0 0 0 0-2.2z"/>
              <path fill="#4285F4" d="M3.6 3.5v17l10.2-10.2L3.6 3.5z"/>
              <path fill="#EA4335" d="M6.4.7l10.2 5.9-2.8 2.8L3.6 .2 6.4.7z"/>
            </svg>
            <span className="flex flex-col leading-tight text-left">
              <span className="text-[10px] opacity-70 transition-opacity duration-300 group-hover:opacity-100">GET IT ON</span>
              <span className="text-base font-semibold -mt-0.5 transition-transform duration-300 group-hover:translate-x-0.5">Google Play</span>
            </span>
          </a>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} VideoBible.</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
//  Dialog content
/* ------------------------------------------------------------------ */
function DonateDialogContent() {
  const testimonials = [
    { quote: "With humble tears…thank you! The Video Bible is perfectly timed. The world needs it more than ever!", author: "Judi P." },
    { quote: "There is something about being able to \"watch and read\" that is truly life altering and feeds my soul.", author: "Adriana G." },
    { quote: "The Video Bible brings my imagination to life. It has me meditating on God like never before.", author: "William D." },
  ];
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide bg-background border-border">
      <div className="flex flex-col items-center text-center pt-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <span className="text-3xl text-primary">✝</span>
        </div>
        <DialogTitle className="font-display text-3xl sm:text-4xl text-primary tracking-wide">
          Become a Video Bible Maker
        </DialogTitle>
        <DialogDescription className="mt-2 text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Help us bring God's word to the world
        </DialogDescription>
        <div className="mt-4 h-px w-24 bg-primary/40" />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-6 text-left">
        <h3 className="font-display text-lg text-primary mb-3">📖 Why Your Support Matters</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          VideoBible exists to make Scripture accessible to every person on earth — in the most engaging and life-giving way possible. Every chapter you watch represents hours of careful curation, production, and publishing.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          <span className="text-foreground font-semibold">Your donation directly funds the creation of more videos.</span> Each contribution helps us cover the cost of video production, licensing, hosting, and the dedicated team working to bring every one of the Bible's 1,189 chapters to life on screen.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          Whether you give $5 or $500 — every gift moves us one chapter closer to completing the full Video Bible for generations to come.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { n: "66", l: "Books of the Bible" },
          { n: "1,189", l: "Chapters to Film" },
          { n: "∞", l: "Lives to Transform" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-border bg-card px-3 py-4 text-center">
            <div className="font-display text-2xl text-primary">{s.n}</div>
            <div className="mt-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center">
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=SFGP3UFGSQ48J"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-3 rounded-full px-8 py-3 text-base font-display font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(180deg, #2b6fd6 0%, #1e3a8a 100%)" }}
        >
          <span className="inline-flex items-center justify-center rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#003087]">PayPal</span>
          Donate with PayPal
        </a>
        <p className="mt-2 text-xs text-muted-foreground">🔒 Secure · Fast · Any amount welcome</p>
        <p className="mt-1 text-xs text-muted-foreground">You will be taken to PayPal's secure checkout to complete your gift.</p>
      </div>

      <div className="mt-6">
        <h4 className="text-center text-sm tracking-[0.2em] uppercase text-primary">✦ What People Are Saying ✦</h4>
        <div className="mt-4 space-y-3">
          {testimonials.map((t) => (
            <blockquote key={t.author} className="rounded-lg border border-border bg-card p-4 border-l-4 border-l-primary">
              <p className="text-sm italic text-muted-foreground">"{t.quote}"</p>
              <footer className="mt-2 text-xs tracking-wider uppercase text-primary">— {t.author}</footer>
            </blockquote>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <DialogClose asChild>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md border border-border">
            ← Back to VideoBible
          </button>
        </DialogClose>
      </div>
    </DialogContent>
  );
}
