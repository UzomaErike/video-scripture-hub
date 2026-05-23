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

interface SummaryRow {
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

function stripHtml(html: string) {
  // Pull <article> if available, else <main>, else whole doc
  const article = html.match(/<article[\s\S]*?<\/article>/i)?.[0]
    ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0]
    ?? html;
  return article
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateSummary(
  bookName: string,
  chapter: number,
  sourceText: string,
): Promise<Omit<SummaryRow, "book_slug" | "chapter">> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const system = `You are a Bible study writer. Given source material about a chapter, produce a fresh, well-organized summary in your own words (do not copy phrasing verbatim). Return ONLY JSON matching the requested schema.`;

  const user = `Rephrase and structure a summary of ${bookName} chapter ${chapter} based on this source:

---
${sourceText.slice(0, 12000)}
---

Return JSON with this exact shape:
{
  "title": string (short subtitle for the chapter, e.g. "The Call of Abram"),
  "intro": string (1-2 paragraph overview),
  "sections": [ { "heading": string, "body"?: string, "points"?: [ { "title"?: string, "body": string } ] } ],
  "key_verses": [ { "reference": string (e.g. "Genesis 12:1-3"), "text": string } ],
  "themes": string[] (3-6 short theme tags),
  "connection_to_jesus": string (1 paragraph),
  "contemporary_relevance": string (1 paragraph)
}

Use 3-6 sections covering the main narrative beats. Rephrase everything in fresh language.`;

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
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no content");
  const parsed = JSON.parse(content);

  return {
    title: parsed.title ?? null,
    intro: parsed.intro ?? null,
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    key_verses: Array.isArray(parsed.key_verses) ? parsed.key_verses : [],
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    connection_to_jesus: parsed.connection_to_jesus ?? null,
    contemporary_relevance: parsed.contemporary_relevance ?? null,
  };
}

export const getOrGenerateSummary = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<SummaryRow | null> => {
    // 1. Cache lookup
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("chapter_summaries")
      .select("*")
      .eq("book_slug", data.bookSlug)
      .eq("chapter", data.chapter)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (existing) return existing as unknown as SummaryRow;

    // 2. Fetch source from videobible.com
    const url = `https://www.videobible.com/summary/${data.bookSlug}-${data.chapter}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 VideoBibleSummaryBot" },
    });
    if (!res.ok) throw new Error(`Source not found (${res.status})`);
    const html = await res.text();
    const text = stripHtml(html);
    if (text.length < 200) throw new Error("Source content too short");

    // 3. AI rephrase
    const generated = await generateSummary(data.bookName, data.chapter, text);

    // 4. Persist
    const row = {
      book_slug: data.bookSlug,
      chapter: data.chapter,
      ...generated,
    };
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("chapter_summaries")
      .insert(row)
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);
    return inserted as unknown as SummaryRow;
  });
