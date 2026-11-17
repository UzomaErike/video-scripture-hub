import { describe, expect, test } from "bun:test";
import { collectYoutubeData, matchChapter } from "../src/lib/video-import.functions.ts";

describe("chapter video playlist parsing", () => {
  test("finds a modern YouTube playlist entry on a channel page", () => {
    const page = {
      lockupViewModel: {
        contentId: "PLfIyQ6UHwNuA",
        contentType: "LOCKUP_CONTENT_TYPE_PLAYLIST",
        metadata: { lockupMetadataViewModel: { title: { content: "Psalms" } } },
      },
    };

    expect(collectYoutubeData(page).playlistIds).toContain("PLfIyQ6UHwNuA");
  });

  test("reports when YouTube hides unavailable playlist videos", () => {
    const page = {
      alerts: [{
        alertWithButtonRenderer: {
          text: { simpleText: "4 unavailable videos are hidden" },
        },
      },
      ],

    expect(collectYoutubeData(page).unavailableCount).toBe(4);
  });

  test("matches Psalm chapter labels at the end of video titles", () => {
    expect(matchChapter("The Terrifying Fate of the Ungodly || Psalm 1")).toEqual({
      bookSlug: "psalms",
      chapter: 1,
    });
  });

  test("matches numbered Bible books and chapters at title endings", () => {
    expect(matchChapter("The Gospel of Grace | 1 Corinthians 13")).toEqual({
      bookSlug: "1-corinthians",
      chapter: 13,
    });
  });

  test("ignores titles with no chapter suffix", () => {
    expect(matchChapter("The Terrifying Fate of the Ungodly")).toBeNull();
  });
});