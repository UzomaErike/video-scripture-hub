interface NltVerse {
  verse: number;
  text: string;
}

function refSlug(bookName: string) {
  return bookName.replace(/\s+/g, "").replace(/[^A-Za-z0-9]/g, "");
}

function parseVerses(html: string): NltVerse[] {
  const verses: NltVerse[] = [];
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

export async function fetchNltChapterFromApi(bookName: string, chapter: number): Promise<NltVerse[]> {
  const slug = refSlug(bookName);
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
    const verses = parseVerses(html);
    const before = all.size;

    for (const v of verses) {
      if (v.verse >= start && v.verse <= end && !all.has(v.verse)) {
        all.set(v.verse, v.text);
      }
    }

    if (all.size === before) break;
  }

  const sorted = Array.from(all.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([verse, text]) => ({ verse, text }));

  if (sorted.length === 0) {
    throw new Error(`No NLT verses returned for ${bookName} ${chapter}`);
  }

  return sorted;
}