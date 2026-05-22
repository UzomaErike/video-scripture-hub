export type Testament = "old" | "new";

export interface BibleBook {
  slug: string;
  name: string;
  chapters: number;
  testament: Testament;
  category: string;
  emoji: string;
}

export const BIBLE_BOOKS: BibleBook[] = [
  { slug: "genesis", name: "Genesis", chapters: 50, testament: "old", category: "Law", emoji: "🌍" },
  { slug: "exodus", name: "Exodus", chapters: 40, testament: "old", category: "Law", emoji: "🔥" },
  { slug: "leviticus", name: "Leviticus", chapters: 27, testament: "old", category: "Law", emoji: "📜" },
  { slug: "numbers", name: "Numbers", chapters: 36, testament: "old", category: "Law", emoji: "🏕️" },
  { slug: "deuteronomy", name: "Deuteronomy", chapters: 34, testament: "old", category: "Law", emoji: "📖" },
  { slug: "joshua", name: "Joshua", chapters: 24, testament: "old", category: "History", emoji: "⚔️" },
  { slug: "judges", name: "Judges", chapters: 21, testament: "old", category: "History", emoji: "🗡️" },
  { slug: "ruth", name: "Ruth", chapters: 4, testament: "old", category: "History", emoji: "🌾" },
  { slug: "1-samuel", name: "1 Samuel", chapters: 31, testament: "old", category: "History", emoji: "👑" },
  { slug: "2-samuel", name: "2 Samuel", chapters: 24, testament: "old", category: "History", emoji: "👑" },
  { slug: "1-kings", name: "1 Kings", chapters: 22, testament: "old", category: "History", emoji: "🏛️" },
  { slug: "2-kings", name: "2 Kings", chapters: 25, testament: "old", category: "History", emoji: "🏛️" },
  { slug: "1-chronicles", name: "1 Chronicles", chapters: 29, testament: "old", category: "History", emoji: "📚" },
  { slug: "2-chronicles", name: "2 Chronicles", chapters: 36, testament: "old", category: "History", emoji: "📚" },
  { slug: "ezra", name: "Ezra", chapters: 10, testament: "old", category: "History", emoji: "✍️" },
  { slug: "nehemiah", name: "Nehemiah", chapters: 13, testament: "old", category: "History", emoji: "🧱" },
  { slug: "esther", name: "Esther", chapters: 10, testament: "old", category: "History", emoji: "👸" },
  { slug: "job", name: "Job", chapters: 42, testament: "old", category: "Poetry", emoji: "🌪️" },
  { slug: "psalms", name: "Psalms", chapters: 150, testament: "old", category: "Poetry", emoji: "🎵" },
  { slug: "proverbs", name: "Proverbs", chapters: 31, testament: "old", category: "Poetry", emoji: "💡" },
  { slug: "ecclesiastes", name: "Ecclesiastes", chapters: 12, testament: "old", category: "Poetry", emoji: "🍃" },
  { slug: "song-of-solomon", name: "Song of Solomon", chapters: 8, testament: "old", category: "Poetry", emoji: "🌹" },
  { slug: "isaiah", name: "Isaiah", chapters: 66, testament: "old", category: "Major Prophet", emoji: "🕊️" },
  { slug: "jeremiah", name: "Jeremiah", chapters: 52, testament: "old", category: "Major Prophet", emoji: "😢" },
  { slug: "lamentations", name: "Lamentations", chapters: 5, testament: "old", category: "Major Prophet", emoji: "🕯️" },
  { slug: "ezekiel", name: "Ezekiel", chapters: 48, testament: "old", category: "Major Prophet", emoji: "👁️" },
  { slug: "daniel", name: "Daniel", chapters: 12, testament: "old", category: "Major Prophet", emoji: "🦁" },
  { slug: "hosea", name: "Hosea", chapters: 14, testament: "old", category: "Minor Prophet", emoji: "💔" },
  { slug: "joel", name: "Joel", chapters: 3, testament: "old", category: "Minor Prophet", emoji: "🌾" },
  { slug: "amos", name: "Amos", chapters: 9, testament: "old", category: "Minor Prophet", emoji: "⚖️" },
  { slug: "obadiah", name: "Obadiah", chapters: 1, testament: "old", category: "Minor Prophet", emoji: "🏔️" },
  { slug: "jonah", name: "Jonah", chapters: 4, testament: "old", category: "Minor Prophet", emoji: "🐋" },
  { slug: "micah", name: "Micah", chapters: 7, testament: "old", category: "Minor Prophet", emoji: "⚖️" },
  { slug: "nahum", name: "Nahum", chapters: 3, testament: "old", category: "Minor Prophet", emoji: "🏙️" },
  { slug: "habakkuk", name: "Habakkuk", chapters: 3, testament: "old", category: "Minor Prophet", emoji: "🙏" },
  { slug: "zephaniah", name: "Zephaniah", chapters: 3, testament: "old", category: "Minor Prophet", emoji: "⚡" },
  { slug: "haggai", name: "Haggai", chapters: 2, testament: "old", category: "Minor Prophet", emoji: "🏗️" },
  { slug: "zechariah", name: "Zechariah", chapters: 14, testament: "old", category: "Minor Prophet", emoji: "🐴" },
  { slug: "malachi", name: "Malachi", chapters: 4, testament: "old", category: "Minor Prophet", emoji: "📨" },
  { slug: "matthew", name: "Matthew", chapters: 28, testament: "new", category: "Gospel", emoji: "✝️" },
  { slug: "mark", name: "Mark", chapters: 16, testament: "new", category: "Gospel", emoji: "🦁" },
  { slug: "luke", name: "Luke", chapters: 24, testament: "new", category: "Gospel", emoji: "🐂" },
  { slug: "john", name: "John", chapters: 21, testament: "new", category: "Gospel", emoji: "🕊️" },
  { slug: "acts", name: "Acts", chapters: 28, testament: "new", category: "History", emoji: "🔥" },
  { slug: "romans", name: "Romans", chapters: 16, testament: "new", category: "Pauline Epistle", emoji: "✉️" },
  { slug: "1-corinthians", name: "1 Corinthians", chapters: 16, testament: "new", category: "Pauline Epistle", emoji: "❤️" },
  { slug: "2-corinthians", name: "2 Corinthians", chapters: 13, testament: "new", category: "Pauline Epistle", emoji: "🤝" },
  { slug: "galatians", name: "Galatians", chapters: 6, testament: "new", category: "Pauline Epistle", emoji: "🕊️" },
  { slug: "ephesians", name: "Ephesians", chapters: 6, testament: "new", category: "Pauline Epistle", emoji: "🛡️" },
  { slug: "philippians", name: "Philippians", chapters: 4, testament: "new", category: "Pauline Epistle", emoji: "😊" },
  { slug: "colossians", name: "Colossians", chapters: 4, testament: "new", category: "Pauline Epistle", emoji: "👑" },
  { slug: "1-thessalonians", name: "1 Thessalonians", chapters: 5, testament: "new", category: "Pauline Epistle", emoji: "⏳" },
  { slug: "2-thessalonians", name: "2 Thessalonians", chapters: 3, testament: "new", category: "Pauline Epistle", emoji: "⏳" },
  { slug: "1-timothy", name: "1 Timothy", chapters: 6, testament: "new", category: "Pauline Epistle", emoji: "👨‍🏫" },
  { slug: "2-timothy", name: "2 Timothy", chapters: 4, testament: "new", category: "Pauline Epistle", emoji: "👨‍🏫" },
  { slug: "titus", name: "Titus", chapters: 3, testament: "new", category: "Pauline Epistle", emoji: "📋" },
  { slug: "philemon", name: "Philemon", chapters: 1, testament: "new", category: "Pauline Epistle", emoji: "🤲" },
  { slug: "hebrews", name: "Hebrews", chapters: 13, testament: "new", category: "General Epistle", emoji: "⛪" },
  { slug: "james", name: "James", chapters: 5, testament: "new", category: "General Epistle", emoji: "💪" },
  { slug: "1-peter", name: "1 Peter", chapters: 5, testament: "new", category: "General Epistle", emoji: "🪨" },
  { slug: "2-peter", name: "2 Peter", chapters: 3, testament: "new", category: "General Epistle", emoji: "🪨" },
  { slug: "1-john", name: "1 John", chapters: 5, testament: "new", category: "General Epistle", emoji: "❤️" },
  { slug: "2-john", name: "2 John", chapters: 1, testament: "new", category: "General Epistle", emoji: "💌" },
  { slug: "3-john", name: "3 John", chapters: 1, testament: "new", category: "General Epistle", emoji: "💌" },
  { slug: "jude", name: "Jude", chapters: 1, testament: "new", category: "General Epistle", emoji: "⚔️" },
  { slug: "revelation", name: "Revelation", chapters: 22, testament: "new", category: "Apocalyptic", emoji: "🐉" },
];

export const BOOKS_BY_SLUG: Record<string, BibleBook> = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.slug, b]),
);

export function getBook(slug: string): BibleBook | undefined {
  return BOOKS_BY_SLUG[slug];
}
