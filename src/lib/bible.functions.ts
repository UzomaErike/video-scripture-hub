import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

function nltRefSlug(bookName: string) {
  return bookName.replace(/\s+/g, "").replace(/[^A-Za-z0-9]/g, "");
}

function parseNltVerses(html: string): Verse[] {
  const verses: Verse[] = [];
  const re = /<verse_export[^>]*vn="(\d+)"[^>]*>([\s\S]*?)<\/verse_export>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const num = parseInt(m[1], 10);
    let inner = m[2];
    inner = inner.replace(/<a class="a-tn"[\s\S]*?<\/span>/g, "");
    inner = inner.replace(/<span class="tn"[\s\S]*?<\/span>/g, "");
    inner = inner.replace(/<span class="vn">\d+<\/span>/g, "");
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&ldquo;|&rdquo;/g, '"')
      .replace(/&lsquo;|&rsquo;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (text) verses.push({ verse: num, text });
  }
  return verses;
}

async function fetchKjv(bookName: string, chapter: number): Promise<Verse[]> {
  const ref = `${bookName} ${chapter}`.toLowerCase().replace(/\s+/g, "+");
  const res = await fetch(`https://bible-api.com/${ref}?translation=kjv`);
  if (!res.ok) throw new Error(`KJV API error: ${res.status}`);
  const data = (await res.json()) as { error?: string; verses?: Array<{ verse: number; text: string }> };
  if (data.error) throw new Error(data.error);
  return (data.verses ?? []).map((v) => ({ verse: v.verse, text: v.text.trim() }));
}

async function fetchNlt(bookName: string, chapter: number): Promise<Verse[]> {
  const slug = nltRefSlug(bookName);
  const key = process.env.NLT_API_KEY || "TEST";
  const all = new Map<number, string>();
  for (let start = 1; start <= 200; start += 50) {
    const end = start + 49;
    const ref = `${slug}.${chapter}.${start}-${end}`;
    const url = `https://api.nlt.to/api/passages?ref=${encodeURIComponent(ref)}&version=NLT&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (start === 1) throw new Error(`NLT API error: ${res.status}`);
      break;
    }
    const html = await res.text();
    const verses = parseNltVerses(html);
    const before = all.size;
    for (const v of verses) {
      if (v.verse >= start && v.verse <= end && !all.has(v.verse)) {
        all.set(v.verse, v.text);
      }
    }
    if (all.size === before) break;
  }
  return Array.from(all.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([verse, text]) => ({ verse, text }));
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

    if (cached && Array.isArray(cached.verses) && (cached.verses as Verse[]).length > 0) {
      return { verses: cached.verses as Verse[], cached: true };
    }

    // 2. Fetch from upstream
    const verses =
      data.translation === "kjv"
        ? await fetchKjv(data.bookName, data.chapter)
        : await fetchNlt(data.bookName, data.chapter);

    // 3. Store (best-effort; ignore failures)
    if (verses.length > 0) {
      await supabaseAdmin
        .from("bible_chapters")
        .upsert(
          {
            translation: data.translation,
            book_slug: data.bookSlug,
            chapter: data.chapter,
            verses: verses as unknown as object,
          },
          { onConflict: "translation,book_slug,chapter" },
        );
    }

    return { verses, cached: false };
  });
