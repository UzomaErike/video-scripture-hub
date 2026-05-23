import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  bookSlug: z.string().min(1).max(40),
  bookName: z.string().min(1).max(40),
  chapter: z.number().int().min(1).max(200),
});

type SectionPoint = { title?: string; body: string };
type Section = { heading: string; points?: SectionPoint[]; body?: string };
type KeyVerse = { reference: string; text: string };

export interface SummaryRow {
  book_slug: string;
  chapter: number;
  title: string | null;
  intro: string | null;
  sections: Section[];
  key_verses: KeyVerse[];
  themes: string[];
  connection_to_jesus: string | null;
  contemporary_relevance: string | null;
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
  const attempts = [
    {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
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
    if (!response.ok) continue;
    if (lastHtml.length > 5000 && !/max challenge attempts exceeded/i.test(lastHtml)) {
      return { html: lastHtml, status: response.status };
    }
  }

  return { html: lastHtml, status: lastStatus };
}

function buildFallbackSummary(bookName: string, chapter: number, sourceText: string): Omit<SummaryRow, "book_slug" | "chapter"> {
  const trimmed = normalizeSourceText(sourceText);
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter((item) => item.length > 60);

  const intro = paragraphs[0]?.slice(0, 700) ?? `A summary for ${bookName} ${chapter} is being prepared.`;
  const sections = paragraphs.slice(1, 5).map((paragraph, index) => ({
    heading: index === 0 ? "Overview" : `Section ${index + 1}`,
    body: paragraph.slice(0, 900),
  }));

  return {
    title: `${bookName} ${chapter}`,
    intro,
    sections,
    key_verses: [],
    themes: ["Bible Study", "Chapter Summary"],
    connection_to_jesus: null,
    contemporary_relevance: null,
  };
}

async function generateSummary(
  bookName: string,
  chapter: number,
  sourceText: string,
): Promise<Omit<SummaryRow, "book_slug" | "chapter">> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return buildFallbackSummary(bookName, chapter, sourceText);
  }

  const system = `You are a Bible study writer. Given source material about a chapter, produce a fresh, well-organized summary in your own words (do not copy phrasing verbatim). Return ONLY JSON matching the requested schema.`;

  const user = `Rephrase and structure a summary of ${bookName} chapter ${chapter} based on this source:

---
${sourceText.slice(0, 12000)}
---

Return JSON with this exact shape:
{
  "title": string,
  "intro": string,
  "sections": [ { "heading": string, "body"?: string, "points"?: [ { "title"?: string, "body": string } ] } ],
  "key_verses": [ { "reference": string, "text": string } ],
  "themes": string[],
  "connection_to_jesus": string,
  "contemporary_relevance": string
}

Use 3-6 sections covering the main narrative beats. Rephrase everything in fresh language.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return buildFallbackSummary(bookName, chapter, sourceText);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return buildFallbackSummary(bookName, chapter, sourceText);
    }

    const parsed = JSON.parse(content);

    return {
      title: parsed.title ?? `${bookName} ${chapter}`,
      intro: parsed.intro ?? null,
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      key_verses: Array.isArray(parsed.key_verses) ? parsed.key_verses : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      connection_to_jesus: parsed.connection_to_jesus ?? null,
      contemporary_relevance: parsed.contemporary_relevance ?? null,
    };
  } catch {
    return buildFallbackSummary(bookName, chapter, sourceText);
  }
}

export const getOrGenerateSummary = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<SummaryRow | null> => {
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("chapter_summaries")
      .select("*")
      .eq("book_slug", data.bookSlug)
      .eq("chapter", data.chapter)
      .maybeSingle();

    if (selErr) throw new Error(selErr.message);
    if (existing) return existing as unknown as SummaryRow;

    const url = `https://www.videobible.com/summary/${data.bookSlug}-${data.chapter}`;
    const { html, status } = await fetchSourceHtml(url);
    if (!html || status >= 400) {
      throw new Error(`Source not found (${status || 500})`);
    }

    const text = normalizeSourceText(extractVisibleText(html));
    if (text.length < 200) {
      throw new Error("Unable to extract enough source content for this chapter right now.");
    }

    const generated = await generateSummary(data.bookName, data.chapter, text);
    const row = {
      book_slug: data.bookSlug,
      chapter: data.chapter,
      ...generated,
    };

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("chapter_summaries")
      .upsert(row, { onConflict: "book_slug,chapter" })
      .select("*")
      .single();

    if (insErr) throw new Error(insErr.message);
    return inserted as unknown as SummaryRow;
  });