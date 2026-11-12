import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ImportInput = z.object({
  provider: z.enum(["youtube", "rumble"]),
  url: z.string().trim().min(8).max(500),
});

type Provider = z.infer<typeof ImportInput>["provider"];
type ImportedSourceVideo = {
  id: string;
  title: string;
  youtubeUrl?: string;
  rumbleEmbed?: string;
};

const MAX_CHANNEL_PLAYLISTS = 20;
const MAX_PAGES_PER_PLAYLIST = 12;
const MAX_IMPORTED_VIDEOS = 300;

function safeUrl(rawUrl: string, provider: Provider) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Enter a valid public playlist or channel link.");
  }

  const hostname = url.hostname.toLowerCase();
  const isYoutube = hostname === "youtu.be" || hostname === "youtube.com" || hostname.endsWith(".youtube.com");
  const isRumble = hostname === "rumble.com" || hostname.endsWith(".rumble.com");
  if (url.protocol !== "https:" || (provider === "youtube" ? !isYoutube : !isRumble)) {
    throw new Error(provider === "youtube"
      ? "Enter a YouTube playlist or channel link."
      : "Enter a Rumble playlist or channel link.");
  }
  return url;
}

async function fetchPage(url: string, label: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/atom+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    console.warn(`[video-import] ${label} returned HTTP ${response.status}`);
    throw new Error(`Could not read that ${label}. Check that it is public and try again.`);
  }
  const text = await response.text();
  if (text.length > 12_000_000) throw new Error(`That ${label} is too large to import at once.`);
  return text;
}

function extractAssignedJson(html: string, variableName: string): unknown | null {
  const assignment = new RegExp(`(?:var\\s+)?${variableName}\\s*=\\s*`, "g");
  const match = assignment.exec(html);
  if (!match) return null;

  const start = html.indexOf("{", match.index + match[0].length);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function collectYoutubeData(root: unknown) {
  const videos: ImportedSourceVideo[] = [];
  const playlistIds: string[] = [];
  const continuationTokens: string[] = [];
  const seenObjects: unknown[] = [root];
  let visited = 0;

  while (seenObjects.length && visited < 120_000) {
    const current = seenObjects.pop();
    visited += 1;
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const value of current) seenObjects.push(value);
      continue;
    }

    const object = current as Record<string, unknown>;
    for (const rendererKey of ["videoRenderer", "playlistVideoRenderer"]) {
      const renderer = object[rendererKey];
      if (!renderer || typeof renderer !== "object") continue;
      const video = renderer as Record<string, unknown>;
      const id = typeof video.videoId === "string" ? video.videoId : "";
      const titleObject = video.title as { simpleText?: unknown; runs?: Array<{ text?: unknown }> } | undefined;
      const title = typeof titleObject?.simpleText === "string"
        ? titleObject.simpleText
        : Array.isArray(titleObject?.runs)
          ? titleObject.runs.map((run) => typeof run.text === "string" ? run.text : "").join("")
          : "";
      if (id && title) videos.push({ id, title, youtubeUrl: `https://www.youtube.com/watch?v=${id}` });
    }

    const playlist = object.playlistRenderer;
    if (playlist && typeof playlist === "object") {
      const id = (playlist as Record<string, unknown>).playlistId;
      if (typeof id === "string" && /^[\w-]{5,}$/.test(id)) playlistIds.push(id);
    }

    const token = (object.continuationCommand as { token?: unknown } | undefined)?.token;
    if (typeof token === "string" && token) continuationTokens.push(token);
    for (const value of Object.values(object)) seenObjects.push(value);
  }

  return {
    videos,
    playlistIds: [...new Set(playlistIds)],
    continuationTokens: [...new Set(continuationTokens)],
  };
}

function youtubeApiSettings(html: string) {
  const key = html.match(/"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION"\s*:\s*"([^"]+)"/)?.[1] ?? "2.20260601.00.00";
  return { key, clientVersion };
}

async function readYoutubePlaylist(playlistId: string): Promise<ImportedSourceVideo[]> {
  const html = await fetchPage(`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`, "YouTube playlist");
  const initialData = extractAssignedJson(html, "ytInitialData");
  if (!initialData) throw new Error("YouTube did not provide playlist details. Make sure the playlist is public and try again.");

  const settings = youtubeApiSettings(html);
  const results = new Map<string, ImportedSourceVideo>();
  const initial = collectYoutubeData(initialData);
  for (const video of initial.videos) results.set(video.id, video);

  let tokens = initial.continuationTokens;
  for (let page = 0; page < MAX_PAGES_PER_PLAYLIST && tokens.length && results.size < MAX_IMPORTED_VIDEOS; page += 1) {
    if (!settings.key) break;
    const token = tokens.shift();
    if (!token) break;
    const response = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${encodeURIComponent(settings.key)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.youtube.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
      },
      body: JSON.stringify({
        context: { client: { clientName: "WEB", clientVersion: settings.clientVersion, hl: "en", gl: "US" } },
        continuation: token,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      console.warn(`[video-import] YouTube playlist continuation returned HTTP ${response.status}`);
      break;
    }
    const data = await response.json() as unknown;
    const next = collectYoutubeData(data);
    for (const video of next.videos) results.set(video.id, video);
    tokens.push(...next.continuationTokens.filter((nextToken) => !tokens.includes(nextToken)));
  }
  return [...results.values()].slice(0, MAX_IMPORTED_VIDEOS);
}

async function readYoutubeChannel(url: URL): Promise<ImportedSourceVideo[]> {
  const basePath = url.pathname.replace(/\/+$/, "");
  const playlistPageUrl = new URL(`${basePath}/playlists`, "https://www.youtube.com");
  const playlistsHtml = await fetchPage(playlistPageUrl.toString(), "YouTube channel");
  const playlistData = extractAssignedJson(playlistsHtml, "ytInitialData");
  const playlistIds = playlistData ? collectYoutubeData(playlistData).playlistIds : [];

  if (playlistIds.length) {
    const allVideos = new Map<string, ImportedSourceVideo>();
    for (const playlistId of playlistIds.slice(0, MAX_CHANNEL_PLAYLISTS)) {
      const videos = await readYoutubePlaylist(playlistId);
      for (const video of videos) allVideos.set(video.id, video);
      if (allVideos.size >= MAX_IMPORTED_VIDEOS) break;
    }
    return [...allVideos.values()].slice(0, MAX_IMPORTED_VIDEOS);
  }

  const videosPageUrl = new URL(`${basePath}/videos`, "https://www.youtube.com");
  const videosHtml = await fetchPage(videosPageUrl.toString(), "YouTube channel videos");
  const videosData = extractAssignedJson(videosHtml, "ytInitialData");
  return videosData ? collectYoutubeData(videosData).videos.slice(0, MAX_IMPORTED_VIDEOS) : [];
}

async function readYoutubeSource(url: URL): Promise<ImportedSourceVideo[]> {
  const playlistId = url.searchParams.get("list");
  if (playlistId) return readYoutubePlaylist(playlistId);
  if (url.hostname.toLowerCase() === "youtu.be") {
    throw new Error("Paste a YouTube channel or playlist link, not a single-video link.");
  }
  return readYoutubeChannel(url);
}

function decodeEntities(value: string) {
  return value
    .replace(/&#x([\da-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function readRumbleSourceVideo(url: string, anchorAttributes: string, body: string): ImportedSourceVideo | null {
  let resolved: URL;
  try {
    resolved = new URL(decodeEntities(url), "https://rumble.com");
  } catch {
    return null;
  }
  const match = resolved.pathname.match(/\/(v[a-z\d]{5,})(?:-[^/]+)?\.html$/i);
  const id = match?.[1];
  if (!id) return null;

  const titleFromAttribute = anchorAttributes.match(/(?:aria-label|title)=["']([^"']+)["']/i)?.[1];
  const titleFromImage = body.match(/<img\b[^>]*\balt=["']([^"']+)["']/i)?.[1];
  const titleFromText = body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const slugTitle = resolved.pathname.match(/^[\/]v[a-z\d]+-(.+)\.html$/i)?.[1]?.replace(/-/g, " ");
  const title = decodeEntities(titleFromAttribute ?? titleFromImage ?? titleFromText ?? slugTitle ?? "").trim();
  if (!title) return null;

  const escapedTitle = title.replace(/[&"<>]/g, (character) => ({
    "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;",
  })[character] ?? character);
  return {
    id,
    title,
    rumbleEmbed: `<iframe class="rumble" width="100%" height="100%" src="https://rumble.com/embed/${id}/?pub=4" title="${escapedTitle}" frameborder="0" allowfullscreen></iframe>`,
  };
}

async function readRumbleSource(url: URL): Promise<ImportedSourceVideo[]> {
  const html = await fetchPage(url.toString(), "Rumble playlist or channel");
  const videos = new Map<string, ImportedSourceVideo>();
  const anchors = /<a\b([^>]*\bhref=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchors.exec(html)) !== null && videos.size < MAX_IMPORTED_VIDEOS) {
    const video = readRumbleSourceVideo(match[2], match[1], match[3]);
    if (video) videos.set(video.id, video);
  }
  return [...videos.values()];
}

function matchChapter(title: string) {
  const suffix = title.trim().replace(/[\s.,;:!?"'”’)\]}]+$/u, "").trim();
  const books = [...BIBLE_BOOKS].sort((a, b) => b.name.length - a.name.length);
  for (const book of books) {
    const aliases = book.slug === "psalms" ? [book.name, "Psalm"] : [book.name];
    for (const name of aliases) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = suffix.match(new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}\\s+(\\d+)$`, "iu"));
      if (!match) continue;
      const chapter = Number(match[1]);
      if (Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters) {
        return { bookSlug: book.slug, chapter };
      }
    }
  }
  return null;
}

export const importChapterVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminRole, error: roleError } = await context.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !adminRole) throw new Error("Only an admin can import chapter videos.");

    const url = safeUrl(data.url, data.provider);
    const sourceVideos = data.provider === "youtube"
      ? await readYoutubeSource(url)
      : await readRumbleSource(url);
    if (!sourceVideos.length) {
      throw new Error("No videos were found. Check that this playlist or channel is public.");
    }

    const matched = sourceVideos.flatMap((video) => {
      const chapter = matchChapter(video.title);
      return chapter ? [{ video, ...chapter }] : [];
    });
    const unique = new Map<string, (typeof matched)[number]>();
    for (const item of matched) unique.set(`${item.bookSlug}:${item.chapter}`, item);
    const items = [...unique.values()].slice(0, MAX_IMPORTED_VIDEOS);
    if (!items.length) {
      throw new Error("No chapter videos matched. Titles must end with a Bible book and chapter, such as “Psalm 1”.");
    }

    const bookSlugs = [...new Set(items.map((item) => item.bookSlug))];
    const chapters = [...new Set(items.map((item) => item.chapter))];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("videos")
      .select("book_slug,chapter,embed_html,youtube_url")
      .in("book_slug", bookSlugs)
      .in("chapter", chapters);
    if (existingError) throw new Error("Could not load existing chapter videos before importing.");

    const existingByChapter = new Map((existingRows ?? []).map((row) => [`${row.book_slug}:${row.chapter}`, row]));
    const rows = items.map(({ video, bookSlug, chapter }) => {
      const existing = existingByChapter.get(`${bookSlug}:${chapter}`);
      const youtubeUrl = data.provider === "youtube" ? video.youtubeUrl ?? null : existing?.youtube_url ?? null;
      const embedHtml = data.provider === "rumble" ? video.rumbleEmbed ?? "" : existing?.embed_html ?? "";
      return {
        book_slug: bookSlug,
        chapter,
        title: video.title,
        youtube_url: youtubeUrl,
        embed_html: embedHtml,
        provider: youtubeUrl ? "youtube" : "rumble",
      };
    });

    const { error: saveError } = await supabaseAdmin
      .from("videos")
      .upsert(rows, { onConflict: "book_slug,chapter" });
    if (saveError) throw new Error("The chapter videos could not be saved. Please refresh and try again.");

    return {
      imported: rows.length,
      skipped: Math.max(0, sourceVideos.length - rows.length),
      firstBookSlug: rows[0]?.book_slug ?? null,
    };
  });