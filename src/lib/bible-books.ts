export type Testament = "old" | "new";

export interface BibleBook {
  slug: string;
  name: string;
  chapters: number;
  testament: Testament;
}

export const BIBLE_BOOKS: BibleBook[] = [
  { slug: "genesis", name: "Genesis", chapters: 50, testament: "old" },
  { slug: "exodus", name: "Exodus", chapters: 40, testament: "old" },
  { slug: "leviticus", name: "Leviticus", chapters: 27, testament: "old" },
  { slug: "numbers", name: "Numbers", chapters: 36, testament: "old" },
  { slug: "deuteronomy", name: "Deuteronomy", chapters: 34, testament: "old" },
  { slug: "joshua", name: "Joshua", chapters: 24, testament: "old" },
  { slug: "judges", name: "Judges", chapters: 21, testament: "old" },
  { slug: "ruth", name: "Ruth", chapters: 4, testament: "old" },
  { slug: "1-samuel", name: "1 Samuel", chapters: 31, testament: "old" },
  { slug: "2-samuel", name: "2 Samuel", chapters: 24, testament: "old" },
  { slug: "1-kings", name: "1 Kings", chapters: 22, testament: "old" },
  { slug: "2-kings", name: "2 Kings", chapters: 25, testament: "old" },
  { slug: "1-chronicles", name: "1 Chronicles", chapters: 29, testament: "old" },
  { slug: "2-chronicles", name: "2 Chronicles", chapters: 36, testament: "old" },
  { slug: "ezra", name: "Ezra", chapters: 10, testament: "old" },
  { slug: "nehemiah", name: "Nehemiah", chapters: 13, testament: "old" },
  { slug: "esther", name: "Esther", chapters: 10, testament: "old" },
  { slug: "job", name: "Job", chapters: 42, testament: "old" },
  { slug: "psalms", name: "Psalms", chapters: 150, testament: "old" },
  { slug: "proverbs", name: "Proverbs", chapters: 31, testament: "old" },
  { slug: "ecclesiastes", name: "Ecclesiastes", chapters: 12, testament: "old" },
  { slug: "song-of-solomon", name: "Song of Solomon", chapters: 8, testament: "old" },
  { slug: "isaiah", name: "Isaiah", chapters: 66, testament: "old" },
  { slug: "jeremiah", name: "Jeremiah", chapters: 52, testament: "old" },
  { slug: "lamentations", name: "Lamentations", chapters: 5, testament: "old" },
  { slug: "ezekiel", name: "Ezekiel", chapters: 48, testament: "old" },
  { slug: "daniel", name: "Daniel", chapters: 12, testament: "old" },
  { slug: "hosea", name: "Hosea", chapters: 14, testament: "old" },
  { slug: "joel", name: "Joel", chapters: 3, testament: "old" },
  { slug: "amos", name: "Amos", chapters: 9, testament: "old" },
  { slug: "obadiah", name: "Obadiah", chapters: 1, testament: "old" },
  { slug: "jonah", name: "Jonah", chapters: 4, testament: "old" },
  { slug: "micah", name: "Micah", chapters: 7, testament: "old" },
  { slug: "nahum", name: "Nahum", chapters: 3, testament: "old" },
  { slug: "habakkuk", name: "Habakkuk", chapters: 3, testament: "old" },
  { slug: "zephaniah", name: "Zephaniah", chapters: 3, testament: "old" },
  { slug: "haggai", name: "Haggai", chapters: 2, testament: "old" },
  { slug: "zechariah", name: "Zechariah", chapters: 14, testament: "old" },
  { slug: "malachi", name: "Malachi", chapters: 4, testament: "old" },
  { slug: "matthew", name: "Matthew", chapters: 28, testament: "new" },
  { slug: "mark", name: "Mark", chapters: 16, testament: "new" },
  { slug: "luke", name: "Luke", chapters: 24, testament: "new" },
  { slug: "john", name: "John", chapters: 21, testament: "new" },
  { slug: "acts", name: "Acts", chapters: 28, testament: "new" },
  { slug: "romans", name: "Romans", chapters: 16, testament: "new" },
  { slug: "1-corinthians", name: "1 Corinthians", chapters: 16, testament: "new" },
  { slug: "2-corinthians", name: "2 Corinthians", chapters: 13, testament: "new" },
  { slug: "galatians", name: "Galatians", chapters: 6, testament: "new" },
  { slug: "ephesians", name: "Ephesians", chapters: 6, testament: "new" },
  { slug: "philippians", name: "Philippians", chapters: 4, testament: "new" },
  { slug: "colossians", name: "Colossians", chapters: 4, testament: "new" },
  { slug: "1-thessalonians", name: "1 Thessalonians", chapters: 5, testament: "new" },
  { slug: "2-thessalonians", name: "2 Thessalonians", chapters: 3, testament: "new" },
  { slug: "1-timothy", name: "1 Timothy", chapters: 6, testament: "new" },
  { slug: "2-timothy", name: "2 Timothy", chapters: 4, testament: "new" },
  { slug: "titus", name: "Titus", chapters: 3, testament: "new" },
  { slug: "philemon", name: "Philemon", chapters: 1, testament: "new" },
  { slug: "hebrews", name: "Hebrews", chapters: 13, testament: "new" },
  { slug: "james", name: "James", chapters: 5, testament: "new" },
  { slug: "1-peter", name: "1 Peter", chapters: 5, testament: "new" },
  { slug: "2-peter", name: "2 Peter", chapters: 3, testament: "new" },
  { slug: "1-john", name: "1 John", chapters: 5, testament: "new" },
  { slug: "2-john", name: "2 John", chapters: 1, testament: "new" },
  { slug: "3-john", name: "3 John", chapters: 1, testament: "new" },
  { slug: "jude", name: "Jude", chapters: 1, testament: "new" },
  { slug: "revelation", name: "Revelation", chapters: 22, testament: "new" },
];

export const BOOKS_BY_SLUG: Record<string, BibleBook> = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.slug, b]),
);

export function getBook(slug: string): BibleBook | undefined {
  return BOOKS_BY_SLUG[slug];
}
