import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNltChapterFromApi } from "@/lib/nlt.server";

const Input = z.object({
  translation: z.enum(["kjv", "nlt"]),
  bookName: z.string().min(1).max(40),
  bookSlug: z.string().min(1).max(40),
  chapter: z.number().int().min(1).max(200),
});

interface Verse {
  verse: number;
  text: string;
}


async function fetchKjv(bookName: string, chapter: number): Promise<Verse[]> {
  const ref = `${bookName} ${chapter}`.toLowerCase().replace(/\s+/g, "+");
  const url = `https://bible-api.com/${ref}?translation=kjv`;
  // Retry on 429 with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`KJV API error: ${res.status}`);
    const data = (await res.json()) as { error?: string; verses?: Array<{ verse: number; text: string }> };
    if (data.error) throw new Error(data.error);
    return (data.verses ?? []).map((v) => ({ verse: v.verse, text: v.text.trim() }));
  }
  throw new Error("KJV API rate limited (429)");
}

async function fetchNlt(bookName: string, chapter: number): Promise<Verse[]> {
  return fetchNltChapterFromApi(bookName, chapter);
}


export const getBibleChapter = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    // 1. Try cache
    const { data: cached } = await supabaseAdmin
      .from("bible_chapters")
      .select("verses")
      .eq("translation", data.translation)
      .eq("book_slug", data.bookSlug)
      .eq("chapter", data.chapter)
      .maybeSingle();

    if (cached && Array.isArray(cached.verses) && (cached.verses as unknown as Verse[]).length > 0) {
      return { verses: cached.verses as unknown as Verse[], cached: true };
    }

    // 2. Fetch from upstream (with fallback for KJV rate limiting). Public access.
    let verses: Verse[];
    let usedFallback = false;
    try {
      verses =
        data.translation === "kjv"
          ? await fetchKjv(data.bookName, data.chapter)
          : await fetchNlt(data.bookName, data.chapter);
    } catch (err) {
      console.error(`Primary fetch failed for ${data.translation} ${data.bookName} ${data.chapter}:`, err);
      try {
        verses = await fetchNlt(data.bookName, data.chapter);
        usedFallback = data.translation !== "nlt";
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr);
        return { verses: [] as Verse[], cached: false, error: "Scripture service is temporarily unavailable. Please try again shortly." };
      }
    }

    // 3. Store (best-effort; ignore failures). Skip cache if we served a different translation as fallback.
    if (verses.length > 0 && !usedFallback) {
      await supabaseAdmin
        .from("bible_chapters")
        .upsert(
          {
            translation: data.translation,
            book_slug: data.bookSlug,
            chapter: data.chapter,
            verses: verses as never,
          },
          { onConflict: "translation,book_slug,chapter" },
        );
    }

    return { verses, cached: false };
  });
