import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  bookName: z.string().min(1).max(40),
  chapter: z.number().int().min(1).max(200),
});

interface NltVerse {
  verse: number;
  text: string;
}

function refSlug(bookName: string) {
  // NLT API uses dotted refs like "1Samuel.3.1-50" — strip spaces/punct.
  return bookName.replace(/\s+/g, "").replace(/[^A-Za-z0-9]/g, "");
}

function parseVerses(html: string): NltVerse[] {
  const verses: NltVerse[] = [];
  // Each verse lives inside <verse_export ... vn="N"> ... </verse_export>
  const re = /<verse_export[^>]*vn="(\d+)"[^>]*>([\s\S]*?)<\/verse_export>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const num = parseInt(m[1], 10);
    let inner = m[2];
    // Drop translator notes / footnote markers
    inner = inner.replace(/<a class="a-tn"[\s\S]*?<\/span>/g, "");
    inner = inner.replace(/<span class="tn"[\s\S]*?<\/span>/g, "");
    // Drop verse number span (we already have it)
    inner = inner.replace(/<span class="vn">\d+<\/span>/g, "");
    // Strip remaining tags
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

export const getNltChapter = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const slug = refSlug(data.bookName);
    // Anonymous key — limited to 50 verses per request, 500/day per IP.
    // To raise limits, register at https://api.nlt.to and set NLT_API_KEY env.
    const key = process.env.NLT_API_KEY || "TEST";

    const all = new Map<number, string>();
    // Paginate in 50-verse windows; stop when a page yields nothing new.
    for (let start = 1; start <= 200; start += 50) {
      const end = start + 49;
      const ref = `${slug}.${data.chapter}.${start}-${end}`;
      const url = `https://api.nlt.to/api/passages?ref=${encodeURIComponent(
        ref,
      )}&version=NLT&key=${key}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (start === 1) throw new Error(`NLT API error: ${res.status}`);
        break;
      }
      const html = await res.text();
      const verses = parseVerses(html);
      const before = all.size;
      for (const v of verses) {
        if (v.verse >= start && v.verse <= end && !all.has(v.verse)) {
          all.set(v.verse, v.text);
        }
      }
      if (all.size === before) break; // no new verses → chapter done
    }

    const sorted = Array.from(all.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([verse, text]) => ({ verse, text }));

    return { verses: sorted };
  });
