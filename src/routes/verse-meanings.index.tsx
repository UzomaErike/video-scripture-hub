import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BIBLE_BOOKS, type BibleBook, getBook } from "@/lib/bible-books";
import { getNltChapter } from "@/lib/nlt.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { MessageSquareQuote, Check, ChevronsUpDown, ArrowRight, Home } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verse-meanings/")({
  head: () => ({
    meta: [
      { title: "Verse Meanings — VideoBible" },
      {
        name: "description",
        content: "Explore the meaning of every verse in the Bible, chapter by chapter.",
      },
      { property: "og:title", content: "Verse Meanings — VideoBible" },
      {
        property: "og:description",
        content: "Explore the meaning of every verse in the Bible, chapter by chapter.",
      },
    ],
  }),
  component: VerseMeaningsIndex,
});

function VerseMeaningsIndex() {
  const navigate = useNavigate();
  const [testament, setTestament] = useState<"old" | "new">("old");
  const [bookSlug, setBookSlug] = useState<string>("");
  const [chapter, setChapter] = useState<string>("");
  const [verse, setVerse] = useState<string>("");

  const book = bookSlug ? getBook(bookSlug) : undefined;

  const handleTestament = (t: "old" | "new") => {
    setTestament(t);
    setBookSlug("");
    setChapter("");
    setVerse("");
  };

  const handleBook = (slug: string) => {
    setBookSlug(slug);
    setChapter("");
    setVerse("");
  };

  const handleChapter = (c: string) => {
    setChapter(c);
    setVerse("");
  };

  const canGo = bookSlug && chapter && verse;
  const onGo = () => {
    if (!canGo) return;
    navigate({
      to: "/verse-meanings/$book/$chapter/$verse",
      params: { book: bookSlug, chapter, verse },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
        >
          <Home className="h-4 w-4" /> Home
        </Link>

        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80 mb-3">
            <MessageSquareQuote className="h-3.5 w-3.5" /> Verse Meanings
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mb-3">Explore Verse by Verse</h1>
          <p className="text-muted-foreground">
            Choose a book, chapter, and verse to discover its meaning.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {/* Testament toggle */}
          <div className="flex justify-center gap-2 mb-6">
            {(["old", "new"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTestament(t)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm border transition",
                  testament === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent",
                )}
              >
                {t === "old" ? "Old Testament" : "New Testament"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <FieldRow label="Book" step={1}>
              <BookCombobox testament={testament} value={bookSlug} onChange={handleBook} />
            </FieldRow>

            <FieldRow label="Chapter" step={2}>
              <Select
                value={chapter}
                onValueChange={handleChapter}
                disabled={!book}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={book ? "Select a chapter" : "Select a book first"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {book &&
                    Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        Chapter {c}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Verse" step={3}>
              <VerseSelect
                book={book}
                chapter={chapter ? parseInt(chapter, 10) : null}
                value={verse}
                onChange={setVerse}
              />
            </FieldRow>
          </div>

          <Button onClick={onGo} disabled={!canGo} className="w-full mt-8" size="lg">
            View Meaning
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {canGo && book && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {book.name} {chapter}:{verse}
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FieldRow({
  label,
  step,
  children,
}: {
  label: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
          {step}
        </span>
        <label className="text-sm font-medium">{label}</label>
      </div>
      {children}
    </div>
  );
}

function BookCombobox({
  testament,
  value,
  onChange,
}: {
  testament: "old" | "new";
  value: string;
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const books: BibleBook[] = BIBLE_BOOKS.filter((b) => b.testament === testament);
  const selected = books.find((b) => b.slug === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span>{selected.emoji}</span>
              {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Search or select a book…</span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search books…" />
          <CommandList>
            <CommandEmpty>No book found.</CommandEmpty>
            <CommandGroup>
              {books.map((b) => (
                <CommandItem
                  key={b.slug}
                  value={b.name}
                  onSelect={() => {
                    onChange(b.slug);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2">{b.emoji}</span>
                  <span className="flex-1">{b.name}</span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === b.slug ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function VerseSelect({
  book,
  chapter,
  value,
  onChange,
}: {
  book: BibleBook | undefined;
  chapter: number | null;
  value: string;
  onChange: (v: string) => void;
}) {
  const fetchChapter = useServerFn(getNltChapter);
  const enabled = !!book && !!chapter;
  const { data, isLoading, error } = useQuery({
    queryKey: ["nlt-chapter-verses", book?.slug, chapter],
    queryFn: () => fetchChapter({ data: { bookName: book!.name, chapter: chapter! } }),
    enabled,
    staleTime: 1000 * 60 * 60,
  });

  const placeholder = !book
    ? "Select a book first"
    : !chapter
    ? "Select a chapter first"
    : isLoading
    ? "Loading verses…"
    : error
    ? "Couldn't load verses"
    : "Select a verse";

  return (
    <Select value={value} onValueChange={onChange} disabled={!enabled || isLoading || !!error}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {(data?.verses ?? []).map((v) => (
          <SelectItem key={v.verse} value={String(v.verse)}>
            Verse {v.verse}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
