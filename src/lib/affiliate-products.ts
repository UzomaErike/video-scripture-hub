/**
 * Amazon Associates catalog for VideoBible.
 *
 * Links are Amazon search URLs scoped to a curated keyword set, so they stay
 * valid even when individual listings change. The affiliate tag is appended to
 * every link by `amazonLink()`.
 */

export const AMAZON_TAG = "videobible-20";

export type ProductCategory =
  | "study-bibles"
  | "books"
  | "devotionals"
  | "kids"
  | "gifts"
  | "audio";

export type Product = {
  id: string;
  title: string;
  blurb: string;
  category: ProductCategory;
  /** Amazon search keywords used to build the affiliate link. */
  keywords: string;
};

export const categories: { id: ProductCategory; label: string; description: string }[] = [
  {
    id: "study-bibles",
    label: "Study Bibles",
    description: "Translations with notes, maps and cross-references for deeper reading.",
  },
  {
    id: "books",
    label: "Christian Books",
    description: "Classic and modern works on faith, theology and Christian living.",
  },
  {
    id: "devotionals",
    label: "Devotionals & Journals",
    description: "Daily readings, prayer journals and Scripture-writing notebooks.",
  },
  {
    id: "kids",
    label: "For Kids & Family",
    description: "Illustrated Bibles and family devotionals for younger readers.",
  },
  {
    id: "gifts",
    label: "Faith Gifts",
    description: "Wall art, mugs, journals and keepsakes for encouragement.",
  },
  {
    id: "audio",
    label: "Audio & Listening",
    description: "Audio Bibles and headphones for listening while you read along.",
  },
];

export const products: Product[] = [
  // Study Bibles
  { id: "nlt-study", title: "NLT Study Bible", blurb: "Readable translation with extensive study notes.", category: "study-bibles", keywords: "NLT study bible" },
  { id: "esv-study", title: "ESV Study Bible", blurb: "One of the most complete one-volume study Bibles available.", category: "study-bibles", keywords: "ESV study bible" },
  { id: "niv-study", title: "NIV Study Bible", blurb: "Balanced notes, maps and charts for everyday study.", category: "study-bibles", keywords: "NIV study bible" },
  { id: "kjv-large", title: "KJV Large Print Bible", blurb: "Traditional wording in a comfortable large-print layout.", category: "study-bibles", keywords: "KJV large print bible" },
  { id: "chronological", title: "Chronological Bible", blurb: "Scripture arranged in the order events happened.", category: "study-bibles", keywords: "chronological bible" },
  { id: "parallel", title: "Parallel Bible", blurb: "Compare multiple translations side by side.", category: "study-bibles", keywords: "parallel bible multiple translations" },

  // Christian books
  { id: "mere-christianity", title: "Christian Classics", blurb: "Timeless titles that have shaped Christian thinking.", category: "books", keywords: "christian classics books" },
  { id: "bible-handbook", title: "Bible Handbooks", blurb: "Book-by-book background, context and outlines.", category: "books", keywords: "bible handbook" },
  { id: "commentary", title: "Bible Commentaries", blurb: "Verse-by-verse explanation for serious study.", category: "books", keywords: "bible commentary one volume" },
  { id: "bible-atlas", title: "Bible Atlas & Maps", blurb: "See where the biblical story actually happened.", category: "books", keywords: "bible atlas maps" },
  { id: "apologetics", title: "Apologetics & Faith Questions", blurb: "Thoughtful answers to hard questions about belief.", category: "books", keywords: "christian apologetics books" },

  // Devotionals
  { id: "daily-devotional", title: "Daily Devotionals", blurb: "A short reading and prayer for every day of the year.", category: "devotionals", keywords: "daily christian devotional" },
  { id: "prayer-journal", title: "Prayer Journals", blurb: "Guided space to record prayers and answers.", category: "devotionals", keywords: "prayer journal christian" },
  { id: "scripture-writing", title: "Scripture Writing Journals", blurb: "Copy Scripture by hand to slow down and remember.", category: "devotionals", keywords: "scripture writing journal" },
  { id: "reading-plan", title: "Bible Reading Plans", blurb: "Structured plans to read through the whole Bible.", category: "devotionals", keywords: "bible in a year reading plan book" },

  // Kids & family
  { id: "kids-bible", title: "Children's Story Bibles", blurb: "Illustrated retellings for young readers.", category: "kids", keywords: "children's story bible illustrated" },
  { id: "family-devotional", title: "Family Devotionals", blurb: "Short readings designed for the whole household.", category: "kids", keywords: "family devotional book" },
  { id: "kids-activity", title: "Bible Activity Books", blurb: "Puzzles, coloring and activities tied to Bible stories.", category: "kids", keywords: "bible activity book kids" },

  // Gifts
  { id: "scripture-art", title: "Scripture Wall Art", blurb: "Framed verses and prints for home or office.", category: "gifts", keywords: "scripture wall art framed" },
  { id: "faith-mug", title: "Faith Mugs & Tumblers", blurb: "Everyday encouragement with your morning coffee.", category: "gifts", keywords: "christian mug scripture" },
  { id: "bible-cover", title: "Bible Covers & Cases", blurb: "Protect a well-loved Bible in style.", category: "gifts", keywords: "bible cover case" },
  { id: "highlighters", title: "Bible Study Supplies", blurb: "No-bleed highlighters, tabs and pens for marking pages.", category: "gifts", keywords: "bible highlighters no bleed tabs" },

  // Audio
  { id: "audio-bible", title: "Audio Bibles", blurb: "Full narrated Scripture on CD or digital player.", category: "audio", keywords: "audio bible narrated" },
  { id: "headphones", title: "Comfortable Headphones", blurb: "For long listening sessions and quiet study.", category: "audio", keywords: "over ear headphones comfortable" },
  { id: "speaker", title: "Bluetooth Speakers", blurb: "Play Scripture and hymns out loud at home.", category: "audio", keywords: "bluetooth speaker" },
];

export function amazonLink(keywords: string) {
  const params = new URLSearchParams({ k: keywords, tag: AMAZON_TAG });
  return `https://www.amazon.com/s?${params.toString()}`;
}

export function productsByCategory(category: ProductCategory) {
  return products.filter((p) => p.category === category);
}

/** Deterministic per-book selection so each chapter page shows stable picks. */
export function picksForSeed(seed: string, count = 3): Product[] {
  const pool = products.filter(
    (p) => p.category === "study-bibles" || p.category === "books" || p.category === "devotionals",
  );
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  const start = hash % pool.length;
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
}
