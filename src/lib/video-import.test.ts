import { describe, expect, test } from "bun:test";
import { matchChapter } from "@/lib/video-import.functions";

describe("video title chapter matching", () => {
  test("matches a Psalm number at the end of a title", () => {
    expect(matchChapter("The Terrifying Fate of the Ungodly || Psalm 1")).toEqual({ bookSlug: "psalms", chapter: 1 });
  });

  test("matches numbered Bible book names at the end of a title", () => {
    expect(matchChapter("The Gospel of Grace | 1 Corinthians 13")).toEqual({ bookSlug: "1-corinthians", chapter: 13 });
  });

  test("rejects titles without a book-and-chapter suffix", () => {
    expect(matchChapter("The Terrifying Fate of the Ungodly")).toBeNull();
  });
});