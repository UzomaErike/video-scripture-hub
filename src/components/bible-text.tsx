import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, BookOpen } from "lucide-react";

type Translation = "kjv" | "nlt";

interface Verse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleApiResponse {
  reference: string;
  verses: Verse[];
  text: string;
  translation_id: string;
  translation_name: string;
}

async function fetchChapter(bookName: string, chapter: number, translation: Translation): Promise<BibleApiResponse> {
  // bible-api.com — free, public domain translations. KJV supported, NLT NOT supported (copyrighted).
  const ref = `${bookName} ${chapter}`.toLowerCase().replace(/\s+/g, "+");
  const res = await fetch(`https://bible-api.com/${ref}?translation=${translation}`);
  if (!res.ok) throw new Error(`Bible API error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
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
        {tab === "nlt" ? (
          <NltNotice />
        ) : (
          <ChapterVerses bookName={bookName} chapter={chapter} translation="kjv" />
        )}
      </div>
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["bible", translation, bookName, chapter],
    queryFn: () => fetchChapter(bookName, chapter, translation),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading scripture…
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive py-6 text-center">
        Couldn't load chapter text. {error instanceof Error ? error.message : ""}
      </p>
    );
  }

  return (
    <div className="font-display text-lg leading-relaxed text-foreground/95 space-y-1">
      {data.verses.map((v) => (
        <p key={v.verse} className="inline">
          <sup className="text-primary font-sans font-semibold text-xs mr-1 align-super">
            {v.verse}
          </sup>
          <span>{v.text.trim()} </span>
        </p>
      ))}
    </div>
  );
}

function NltNotice() {
  return (
    <div className="text-center py-8 px-4">
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        The New Living Translation is copyrighted by Tyndale House Publishers and isn't available
        through free Bible APIs. To enable NLT here, a licensed API key from{" "}
        <a
          href="https://scripture.api.bible/"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline"
        >
          API.Bible
        </a>{" "}
        (with NLT permissions) is required.
      </p>
    </div>
  );
}
