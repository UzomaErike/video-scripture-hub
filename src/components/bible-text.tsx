import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen } from "lucide-react";
import { getBibleChapter } from "@/lib/bible.functions";

type Translation = "kjv" | "nlt";

interface Verse {
  verse: number;
  text: string;
}

export function BibleText({ bookName, chapter }: { bookName: string; chapter: number }) {
  const [tab, setTab] = useState<Translation>("kjv");

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
            <TabsTrigger value="kjv">KJV</TabsTrigger>
            <TabsTrigger value="nlt">NLT</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-5 py-5 max-h-[500px] overflow-y-auto scrollbar-hide">
        <ChapterVerses bookName={bookName} chapter={chapter} translation={tab} />
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
  chapter,
  translation,
}: {
  bookName: string;
  chapter: number;
  translation: Translation;
}) {
  const nltFn = useServerFn(getNltChapter);

  const { data, isLoading, error } = useQuery({
    queryKey: ["bible", translation, bookName, chapter],
    queryFn: async (): Promise<Verse[]> => {
      if (translation === "kjv") return fetchKjv(bookName, chapter);
      const res = await nltFn({ data: { bookName, chapter } });
      return res.verses;
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

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
    <div className="font-display text-lg leading-relaxed text-foreground/95">
      {data.map((v) => (
        <span key={v.verse}>
          <sup className="text-primary font-sans font-semibold text-xs mr-1 align-super">
            {v.verse}
          </sup>
          <span>{v.text} </span>
        </span>
      ))}
    </div>
  );
}
