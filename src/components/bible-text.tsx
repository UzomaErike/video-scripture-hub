import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen } from "lucide-react";
import { getBibleChapter } from "@/lib/bible.functions";
import { getVerseHighlightEnabled, subscribeVerseHighlight } from "@/lib/verse-highlight";
import { cn } from "@/lib/utils";

type Translation = "kjv" | "nlt";

interface Verse {
  verse: number;
  text: string;
}

export function BibleText({
  bookName,
  bookSlug,
  chapter,
  currentTime = 0,
  duration = 0,
}: {
  bookName: string;
  bookSlug: string;
  chapter: number;
  currentTime?: number;
  duration?: number;
}) {
  const [tab, setTab] = useState<Translation>("nlt");

  return (
    <div className="mt-8 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl">
            {bookName} {chapter}
          </h2>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Translation)}>
          <TabsList>
            <TabsTrigger value="nlt">NLT</TabsTrigger>
            <TabsTrigger value="kjv">KJV</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div data-verse-scroll className="px-5 py-5 max-h-[500px] overflow-y-auto scrollbar-hide">
        <ChapterVerses
          bookName={bookName}
          bookSlug={bookSlug}
          chapter={chapter}
          translation={tab}
          currentTime={currentTime}
          duration={duration}
        />
      </div>

      {tab === "nlt" && (
        <p className="text-[11px] text-muted-foreground text-center px-4 pb-3">
          Scripture quotations from the Holy Bible, New Living Translation, © Tyndale House Foundation.
        </p>
      )}
    </div>
  );
}

function ChapterVerses({
  bookName,
  bookSlug,
  chapter,
  translation,
  currentTime,
  duration,
}: {
  bookName: string;
  bookSlug: string;
  chapter: number;
  translation: Translation;
  currentTime: number;
  duration: number;
}) {
  const fetchChapter = useServerFn(getBibleChapter);

  const highlightEnabled = useSyncExternalStore(
    subscribeVerseHighlight,
    getVerseHighlightEnabled,
    () => true,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["bible", translation, bookSlug, chapter],
    queryFn: async (): Promise<Verse[]> => {
      const res = await fetchChapter({ data: { translation, bookName, bookSlug, chapter } });
      return res.verses;
    },
    staleTime: Infinity,
    retry: 1,
  });

  // Estimate per-verse time ranges, weighted by text length.
  const ranges = useMemo(() => {
    if (!data || data.length === 0 || duration <= 0) return [];
    const lens = data.map((v) => Math.max(1, v.text.length));
    const total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    return data.map((_, i) => {
      const start = (acc / total) * duration;
      acc += lens[i];
      const end = (acc / total) * duration;
      return { start, end };
    });
  }, [data, duration]);

  const activeIdx = useMemo(() => {
    if (!highlightEnabled) return -1;
    if (ranges.length === 0) return -1;
    if (currentTime <= 0) return -1;
    return ranges.findIndex((r) => currentTime >= r.start && currentTime < r.end);
  }, [ranges, currentTime, highlightEnabled]);

  const activeRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (!highlightEnabled) return;
    const el = activeRef.current;
    if (!el) return;
    const scroller = el.closest("[data-verse-scroll]") as HTMLElement | null;
    if (!scroller) return;
    const target = el.offsetTop - scroller.offsetTop;
    scroller.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [activeIdx, highlightEnabled]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading scripture…
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <p className="text-sm text-destructive py-6 text-center">
        Couldn't load chapter text. {error instanceof Error ? error.message : ""}
      </p>
    );
  }

  return (
    <div className="font-display text-lg leading-relaxed text-foreground/95 space-y-2">
      {data.map((v, i) => {
        const isActive = i === activeIdx;
        return (
          <p
            key={v.verse}
            ref={isActive ? activeRef : null}
            className={cn(
              "flex gap-2 rounded-md px-2 py-1 -mx-2 transition-colors duration-300",
              isActive && "bg-primary/15 ring-1 ring-primary/40"
            )}
          >
            <sup
              className={cn(
                "font-sans font-semibold text-xs mt-1.5 shrink-0",
                isActive ? "text-primary" : "text-primary/80"
              )}
            >
              {v.verse}
            </sup>
            <span>{v.text}</span>
          </p>
        );
      })}
    </div>
  );
}


