import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  bookSlug: z.string().min(1).max(40),
  bookName: z.string().min(1).max(40),
  chapter: z.number().int().min(1).max(200),
  verse: z.number().int().min(1).max(200),
});

type Section = { heading: string; body: string };

export interface VerseMeaningRow {
  book_slug: string;
  chapter: number;
  verse: number;
  title: string | null;
  intro: string | null;
  sections: Section[];
  themes: string[];
  application: string | null;
}

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—");
}

function extractVisibleText(html: string) {
  const mainMatch =
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
    html.match(/<main[\s\S]*?<\/main>/i)?.[0] ??
    html.match(/<body[\s\S]*?<\/body>/i)?.[0] ??
    html;

  return decodeEntities(
    mainMatch
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<img[^>]*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

function normalizeSourceText(text: string) {
  return text
    .replace(/Video Bible Interactive Bible Bible Commentary Bible Dictionary/gi, "")
    .replace(/Verse Meanings/gi, "")
    .replace(/Give Now/gi, "")
    .replace(/\bTOC\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchSourceHtml(url: string) {
  const attempts: Array<Record<string, string>> = [
    {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.8",
    },
  ];

  let lastHtml = "";
  let lastStatus = 0;
  for (const headers of attempts) {
    const response = await fetch(url, { headers, redirect: "follow" });
    lastStatus = response.status;
    lastHtml = await response.text();
    if (response.ok && lastHtml.length > 3000) {
      return { html: lastHtml, status: response.status };
    }
  }
  return { html: lastHtml, status: lastStatus };
}

function buildFallback(
  bookName: string,
  chapter: number,
  verse: number,
  sourceText: string,
): Omit<VerseMeaningRow, "book_slug" | "chapter" | "verse"> {
  const trimmed = normalizeSourceText(sourceText);
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 60);

  return {
    title: `${bookName} ${chapter}:${verse}`,
    intro: paragraphs[0]?.slice(0, 700) ?? `A meaning for ${bookName} ${chapter}:${verse} is being prepared.`,
    sections: paragraphs.slice(1, 4).map((p, i) => ({
      heading: i === 0 ? "Context" : i === 1 ? "Meaning" : "Reflection",
      body: p.slice(0, 900),
    })),
    themes: [],
    application: null,
  };
}

async function generateMeaning(
  bookName: string,
  chapter: number,
  verse: number,
  sourceText: string,
): Promise<Omit<VerseMeaningRow, "book_slug" | "chapter" | "verse">> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return buildFallback(bookName, chapter, verse, sourceText);

  const hasUsableSource = sourceText.trim().length >= 200;
  const system = `You are a Bible study writer. Given source material about a single verse, produce a clear, well-organized meaning in your own words (do not copy phrasing verbatim). Return ONLY JSON matching the requested schema.`;
  const user = `Write a structured meaning for ${bookName} ${chapter}:${verse}.

${hasUsableSource ? `Base it primarily on this source material, but rephrase everything in fresh language:

---
${sourceText.slice(0, 12000)}
---

` : `Use faithful biblical knowledge of this verse to create the meaning.

`}Return JSON with this exact shape:
{
  "title": string,
  "intro": string,
  "sections": [ { "heading": string, "body": string } ],
  "themes": string[],
  "application": string
}

Use 2-4 sections (e.g. Context, Meaning, Significance, Reflection). Rephrase everything in fresh language.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return buildFallback(bookName, chapter, verse, sourceText);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return buildFallback(bookName, chapter, verse, sourceText);
    const parsed = JSON.parse(content);
    return {
      title: parsed.title ?? `${bookName} ${chapter}:${verse}`,
      intro: parsed.intro ?? null,
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      application: parsed.application ?? null,
    };
  } catch {
    return buildFallback(bookName, chapter, verse, sourceText);
  }
}

export const getOrGenerateVerseMeaning = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<VerseMeaningRow> => {
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("verse_meanings")
      .select("*")
      .eq("book_slug", data.bookSlug)
      .eq("chapter", data.chapter)
      .eq("verse", data.verse)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (existing) return existing as unknown as VerseMeaningRow;

    // Cache miss: throttle AI generation per IP as a cost-abuse backstop.
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    enforceRateLimit("verse-meaning-gen", 10, 60 * 60 * 1000);

    const url = `https://www.videobible.com/meaning/${data.bookSlug}-${data.chapter}-${data.verse}`;
    const { html, status } = await fetchSourceHtml(url);
    const text = html && status < 400 ? normalizeSourceText(extractVisibleText(html)) : "";


    const generated = await generateMeaning(data.bookName, data.chapter, data.verse, text);
    const row = {
      book_slug: data.bookSlug,
      chapter: data.chapter,
      verse: data.verse,
      ...generated,
    };

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("verse_meanings")
      .upsert(row, { onConflict: "book_slug,chapter,verse" })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);
    return inserted as unknown as VerseMeaningRow;
  });
