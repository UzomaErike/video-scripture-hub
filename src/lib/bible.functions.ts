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
            verses: verses as never,
          },
          { onConflict: "translation,book_slug,chapter" },
        );
    }

    return { verses, cached: false };
  });
