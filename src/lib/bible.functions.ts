import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAuthedUserId } from "@/lib/require-auth";

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

function nltRefSlug(bookName: string) {
  // NLT API uses dotted refs like "1Samuel.3.1-50" — strip spaces/punct.
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

// Official NLT API (api.nlt.to) using the registered key. Paginates in
// 50-verse windows until the chapter is complete.
async function fetchNltApi(bookName: string, chapter: number): Promise<Verse[]> {
  const key = process.env.NLT_API_KEY;
  if (!key) throw new Error("NLT_API_KEY is not configured");

  const slug = nltRefSlug(bookName);
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
    if (all.size === before) break; // no new verses → chapter done
  }

  if (all.size === 0) throw new Error("NLT API returned no verses");
  return Array.from(all.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([verse, text]) => ({ verse, text }));
}

async function fetchNlt(bookName: string, chapter: number): Promise<Verse[]> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "system",
          content:
            "You are a Bible reference assistant. Return the complete chapter text in the New Living Translation (NLT). Output ONLY the verses — no headings, no commentary, no footnotes.",
        },
        {
          role: "user",
          content: `Provide the complete text of ${bookName} chapter ${chapter} in the New Living Translation (NLT). Include every verse in the chapter.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_chapter",
            description: "Return the chapter as an ordered list of verses.",
            parameters: {
              type: "object",
              properties: {
                verses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      verse: { type: "integer" },
                      text: { type: "string" },
                    },
                    required: ["verse", "text"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["verses"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_chapter" } },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Lovable AI error [${res.status}]: ${body}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        tool_calls?: Array<{ function?: { arguments?: string } }>;
      };
    }>;
  };

  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI did not return chapter verses");

  const parsed = JSON.parse(args) as { verses: Verse[] };
  return parsed.verses
    .filter((v) => v && typeof v.verse === "number" && typeof v.text === "string")
    .sort((a, b) => a.verse - b.verse);
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
    // Cache miss: throttle per IP as a cost-abuse backstop for the AI path.
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    enforceRateLimit("bible-chapter-gen", 15, 60 * 60 * 1000);

    let verses: Verse[];
    let usedFallback = false;
    try {
      if (data.translation === "kjv") {
        verses = await fetchKjv(data.bookName, data.chapter);
      } else {
        try {
          verses = await fetchNltApi(data.bookName, data.chapter);
        } catch (nltErr) {
          console.error("NLT API fetch failed, falling back to AI:", nltErr);
          verses = await fetchNlt(data.bookName, data.chapter);
        }
      }
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
