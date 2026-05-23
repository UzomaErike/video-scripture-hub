import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BIBLE_BOOKS, getBook } from "@/lib/bible-books";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/studio-control-x9k2")({
  head: () => ({
    meta: [
      { title: "Admin — VideoBible" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // defer
        setTimeout(() => checkAdmin(s.user.id), 0);
      } else {
        setIsAdmin(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) checkAdmin(data.session.user.id);
      setBootstrapping(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) {
      console.error(error);
      setIsAdmin(false);
      return;
    }
    setIsAdmin(!!data);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <Toaster />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 flex-1">
        <h1 className="font-display text-4xl mb-8">Admin</h1>
        {bootstrapping ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !session ? (
          <AuthForm />
        ) : isAdmin === null ? (
          <p className="text-muted-foreground">Checking permissions…</p>
        ) : !isAdmin ? (
          <NotAdmin email={session.user.email ?? ""} userId={session.user.id} />
        ) : (
          <>
            <VideoManager email={session.user.email ?? ""} />
            <div className="my-12 border-t border-border" />
            <HymnsManager />
            <div className="my-12 border-t border-border" />
            <MoviesManager />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/studio-control-x9k2`;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast.success("Account created. You can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <p className="text-muted-foreground mb-6">
        {mode === "signin" ? "Sign in to manage videos." : "Create the admin account (first time only)."}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-card border border-border px-3 py-2.5 outline-none focus:border-primary/60" />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-card border border-border px-3 py-2.5 outline-none focus:border-primary/60" />
        </div>
        <button disabled={busy} className="w-full rounded-md bg-primary text-primary-foreground font-medium py-2.5 hover:opacity-90 transition disabled:opacity-50">
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sm text-muted-foreground hover:text-foreground">
          {mode === "signin" ? "First time? Create the admin account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}

function NotAdmin({ email, userId }: { email: string; userId: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-display text-2xl mb-2">Not an admin</h2>
      <p className="text-muted-foreground mb-4">
        You're signed in as <span className="text-foreground">{email}</span>, but this account doesn't have admin access.
      </p>
      <p className="text-sm text-muted-foreground mb-2">To grant admin access, run this once in your backend SQL editor:</p>
      <pre className="bg-background border border-border rounded-md p-3 text-xs overflow-auto">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId}', 'admin');`}
      </pre>
      <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm text-muted-foreground hover:text-foreground underline">
        Sign out
      </button>
    </div>
  );
}

interface VideoRow {
  book_slug: string;
  chapter: number;
  title: string | null;
}

function VideoManager({ email }: { email: string }) {
  const [bookSlug, setBookSlug] = useState(BIBLE_BOOKS[0].slug);
  const book = useMemo(() => getBook(bookSlug)!, [bookSlug]);
  const [chapter, setChapter] = useState(1);
  const [title, setTitle] = useState("");
  const [embedHtml, setEmbedHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<VideoRow[]>([]);
  const [editingHtml, setEditingHtml] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => { setChapter(1); }, [bookSlug]);

  useEffect(() => {
    refresh();
    supabase.from("book_covers").select("image_url").eq("book_slug", bookSlug).maybeSingle()
      .then(({ data }) => setCoverUrl(data?.image_url ?? null));
  }, [bookSlug]);

  useEffect(() => {
    supabase.from("videos").select("embed_html,title")
      .eq("book_slug", bookSlug).eq("chapter", chapter).maybeSingle()
      .then(({ data }) => {
        setEditingHtml(data?.embed_html ?? "");
        setTitle(data?.title ?? "");
        setEmbedHtml(data?.embed_html ?? "");
      });
  }, [bookSlug, chapter]);

  async function refresh() {
    const { data } = await supabase.from("videos").select("book_slug,chapter,title")
      .eq("book_slug", bookSlug).order("chapter");
    setExisting(data ?? []);
  }

  async function uploadCover(file: File) {
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${bookSlug}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("book-covers")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("book-covers").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("book_covers")
        .upsert({ book_slug: bookSlug, image_url: pub.publicUrl }, { onConflict: "book_slug" });
      if (dbErr) throw dbErr;
      setCoverUrl(pub.publicUrl);
      toast.success("Cover uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function removeCover() {
    if (!confirm(`Remove cover for ${book.name}?`)) return;
    const { error } = await supabase.from("book_covers").delete().eq("book_slug", bookSlug);
    if (error) { toast.error(error.message); return; }
    setCoverUrl(null);
    toast.success("Cover removed");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = embedHtml.trim();
    if (!trimmed) { toast.error("Paste the Rumble embed code"); return; }

    // Detect a plain Rumble page URL (the "Direct URL" / monetized share link).
    // That URL is NOT embeddable — Rumble blocks iframing of its page URLs and
    // the page slug is not the same as the embed ID.
    const looksLikePageUrl = /^https?:\/\/(www\.)?rumble\.com\/[^\s<>"]+\.html/i.test(trimmed);
    if (looksLikePageUrl) {
      toast.error(
        "That's a Rumble page URL, not an embed. On Rumble click Share → Embed (not Share → URL), then copy the <iframe> or <script> snippet and paste it here.",
        { duration: 9000 },
      );
      return;
    }

    const hasIframe = /<iframe[\s\S]*<\/iframe>/i.test(trimmed);
    const hasScript = /<script[\s\S]*<\/script>/i.test(trimmed);
    if (!hasIframe && !hasScript) {
      toast.error("That doesn't look like a Rumble embed. Paste the full <iframe> or <script> snippet from Rumble's Share → Embed tab.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("videos")
        .upsert({
          book_slug: bookSlug,
          chapter,
          title: title.trim() || null,
          embed_html: embedHtml.trim(),
        }, { onConflict: "book_slug,chapter" });
      if (error) throw error;
      toast.success(`Saved ${book.name} ${chapter}`);
      setEditingHtml(embedHtml);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete video for ${book.name} ${chapter}?`)) return;
    const { error } = await supabase.from("videos").delete()
      .eq("book_slug", bookSlug).eq("chapter", chapter);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setEmbedHtml(""); setTitle(""); setEditingHtml("");
    refresh();
  }

  const filledSet = new Set(existing.map((v) => v.chapter));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">Signed in as <span className="text-foreground">{email}</span></p>
        <div className="flex gap-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground underline">View site</Link>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-muted-foreground hover:text-foreground underline">Sign out</button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-5 rounded-lg border border-border bg-card p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1.5">Book</label>
            <select value={bookSlug} onChange={(e) => setBookSlug(e.target.value)}
              className="w-full rounded-md bg-background border border-border px-3 py-2.5">
              {BIBLE_BOOKS.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5">Chapter</label>
            <select value={chapter} onChange={(e) => setChapter(parseInt(e.target.value))}
              className="w-full rounded-md bg-background border border-border px-3 py-2.5">
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  Chapter {c} {filledSet.has(c) ? "✓" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1.5">Title (optional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
            className="w-full rounded-md bg-background border border-border px-3 py-2.5" />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Rumble embed code</label>
          <p className="text-xs text-muted-foreground mb-2">
            On Rumble click <span className="text-foreground">Share → Embed</span> (not Share → URL), then paste the full <code>&lt;iframe&gt;</code> or monetized <code>&lt;script&gt;</code> snippet. A plain <code>rumble.com/...html</code> page URL will not play here.
          </p>
          <textarea value={embedHtml} onChange={(e) => setEmbedHtml(e.target.value)} rows={5}
            placeholder='<iframe class="rumble" src="https://rumble.com/embed/..." ...></iframe>  — or —  <script>...</script><div id="rumble_..."></div><script>Rumble("play",{...})</script>'
            className="w-full rounded-md bg-background border border-border px-3 py-2.5 font-mono text-xs" />
        </div>
        <div className="flex gap-3">
          <button disabled={busy} className="rounded-md bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:opacity-90 disabled:opacity-50">
            {busy ? "Saving…" : editingHtml ? "Update video" : "Add video"}
          </button>
          {editingHtml && (
            <button type="button" onClick={remove} className="rounded-md border border-destructive text-destructive px-5 py-2.5 hover:bg-destructive/10">
              Delete
            </button>
          )}
        </div>
      </form>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-display text-xl mb-1">{book.name} cover image</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Shown on the Books page card. Recommended aspect ratio <span className="text-foreground">3:4</span> (portrait).
        </p>
        <div className="flex items-start gap-4">
          <div className="w-32 aspect-[3/4] rounded-md overflow-hidden bg-background border border-border shrink-0">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No cover</div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/*"
              disabled={uploadingCover}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCover(f);
                e.target.value = "";
              }}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-4 file:py-2 file:font-medium file:cursor-pointer"
            />
            {uploadingCover && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {coverUrl && (
              <button type="button" onClick={removeCover}
                className="text-sm text-destructive hover:underline">
                Remove cover
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl mb-3">{book.name} progress</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {existing.length} of {book.chapters} chapters have videos.
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChapter(c)}
              className={`aspect-square rounded text-sm border transition ${
                filledSet.has(c)
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-accent"
              } ${chapter === c ? "ring-2 ring-primary" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface HymnRow {
  id: string;
  title: string;
  embed_html: string;
  sort_order: number;
}

function HymnsManager() {
  const [hymns, setHymns] = useState<HymnRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [embedHtml, setEmbedHtml] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("hymns")
      .select("id,title,embed_html,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setHymns((data as HymnRow[]) ?? []);
  }

  useEffect(() => { refresh(); }, []);

  function reset() {
    setEditingId(null);
    setTitle("");
    setEmbedHtml("");
    setSortOrder(0);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const html = embedHtml.trim();
    if (!t) { toast.error("Enter a hymn title"); return; }
    if (!html) { toast.error("Paste the Rumble embed code"); return; }
    const looksLikePageUrl = /^https?:\/\/(www\.)?rumble\.com\/[^\s<>"]+\.html/i.test(html);
    if (looksLikePageUrl) {
      toast.error("That's a Rumble page URL, not an embed. Use Share → Embed and paste the <iframe> or <script>.", { duration: 9000 });
      return;
    }
    const hasIframe = /<iframe[\s\S]*<\/iframe>/i.test(html);
    const hasScript = /<script[\s\S]*<\/script>/i.test(html);
    if (!hasIframe && !hasScript) {
      toast.error("That doesn't look like a Rumble embed. Paste the full <iframe> or <script> snippet.");
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("hymns")
          .update({ title: t, embed_html: html, sort_order: sortOrder })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Hymn updated");
      } else {
        const { error } = await supabase.from("hymns")
          .insert({ title: t, embed_html: html, sort_order: sortOrder });
        if (error) throw error;
        toast.success("Hymn added");
      }
      reset();
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function edit(h: HymnRow) {
    setEditingId(h.id);
    setTitle(h.title);
    setEmbedHtml(h.embed_html);
    setSortOrder(h.sort_order);
  }

  async function remove(h: HymnRow) {
    if (!confirm(`Delete hymn "${h.title}"?`)) return;
    const { error } = await supabase.from("hymns").delete().eq("id", h.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    if (editingId === h.id) reset();
    refresh();
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Christian Hymns</h2>

      <form onSubmit={save} className="space-y-5 rounded-lg border border-border bg-card p-6">
        <div className="grid sm:grid-cols-[1fr_120px] gap-4">
          <div>
            <label className="block text-sm mb-1.5">Hymn title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              className="w-full rounded-md bg-background border border-border px-3 py-2.5" />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Sort order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full rounded-md bg-background border border-border px-3 py-2.5" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1.5">Rumble embed code</label>
          <textarea value={embedHtml} onChange={(e) => setEmbedHtml(e.target.value)} rows={5}
            placeholder='<iframe class="rumble" src="https://rumble.com/embed/..." ...></iframe>'
            className="w-full rounded-md bg-background border border-border px-3 py-2.5 font-mono text-xs" />
        </div>
        <div className="flex gap-3">
          <button disabled={busy} className="rounded-md bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:opacity-90 disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update hymn" : "Add hymn"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="rounded-md border border-border px-5 py-2.5 hover:bg-accent">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="font-display text-xl mb-3">All hymns ({hymns.length})</h3>
        {hymns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hymns yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {hymns.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground">Order: {h.sort_order}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => edit(h)} className="text-sm text-primary hover:underline">Edit</button>
                  <button onClick={() => remove(h)} className="text-sm text-destructive hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface MovieRow {
  id: string;
  title: string;
  image_url: string | null;
  sort_order: number;
}

interface EpisodeRow {
  id: string;
  movie_id: string;
  title: string;
  embed_html: string;
  sort_order: number;
}

function MoviesManager() {
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  async function refresh() {
    const { data } = await supabase
      .from("movies")
      .select("id,title,image_url,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setMovies((data as MovieRow[]) ?? []);
  }

  useEffect(() => { refresh(); }, []);

  function reset() {
    setEditingId(null);
    setTitle("");
    setImageUrl(null);
    setSortOrder(0);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `movie-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("movie-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("movie-images").getPublicUrl(path);
      setImageUrl(pub.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) { toast.error("Enter a movie title"); return; }
    setBusy(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("movies")
          .update({ title: t, image_url: imageUrl, sort_order: sortOrder })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Movie updated");
      } else {
        const { error } = await supabase.from("movies")
          .insert({ title: t, image_url: imageUrl, sort_order: sortOrder });
        if (error) throw error;
        toast.success("Movie added");
      }
      reset();
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function edit(m: MovieRow) {
    setEditingId(m.id);
    setTitle(m.title);
    setImageUrl(m.image_url);
    setSortOrder(m.sort_order);
  }

  async function remove(m: MovieRow) {
    if (!confirm(`Delete movie "${m.title}" and all its episodes?`)) return;
    const { error } = await supabase.from("movies").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    if (editingId === m.id) reset();
    if (selectedMovieId === m.id) setSelectedMovieId(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Christian Movies</h2>

      <form onSubmit={save} className="space-y-5 rounded-lg border border-border bg-card p-6">
        <div className="grid sm:grid-cols-[1fr_120px] gap-4">
          <div>
            <label className="block text-sm mb-1.5">Movie title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              className="w-full rounded-md bg-background border border-border px-3 py-2.5" />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Sort order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full rounded-md bg-background border border-border px-3 py-2.5" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1.5">Cover image</label>
          <div className="flex items-start gap-4">
            <div className="w-24 aspect-[3/4] rounded-md overflow-hidden bg-background border border-border shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                  e.target.value = "";
                }}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-4 file:py-2 file:font-medium file:cursor-pointer"
              />
              {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl(null)}
                  className="text-sm text-destructive hover:underline">
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button disabled={busy} className="rounded-md bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:opacity-90 disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update movie" : "Add movie"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="rounded-md border border-border px-5 py-2.5 hover:bg-accent">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="font-display text-xl mb-3">All movies ({movies.length})</h3>
        {movies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No movies yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {movies.map((m) => (
              <li key={m.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 aspect-[3/4] rounded overflow-hidden bg-background border border-border shrink-0">
                      {m.image_url && <img src={m.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">Order: {m.sort_order}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSelectedMovieId(selectedMovieId === m.id ? null : m.id)}
                      className="text-sm text-primary hover:underline">
                      {selectedMovieId === m.id ? "Hide episodes" : "Episodes"}
                    </button>
                    <button onClick={() => edit(m)} className="text-sm text-primary hover:underline">Edit</button>
                    <button onClick={() => remove(m)} className="text-sm text-destructive hover:underline">Delete</button>
                  </div>
                </div>
                {selectedMovieId === m.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <EpisodesManager movieId={m.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EpisodesManager({ movieId }: { movieId: string }) {
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [embedHtml, setEmbedHtml] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("movie_episodes")
      .select("id,movie_id,title,embed_html,sort_order")
      .eq("movie_id", movieId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setEpisodes((data as EpisodeRow[]) ?? []);
  }

  useEffect(() => { refresh(); }, [movieId]);

  function reset() {
    setEditingId(null);
    setTitle("");
    setEmbedHtml("");
    setSortOrder(0);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const html = embedHtml.trim();
    if (!t) { toast.error("Enter episode title"); return; }
    if (!html) { toast.error("Paste the Rumble embed code"); return; }
    const looksLikePageUrl = /^https?:\/\/(www\.)?rumble\.com\/[^\s<>"]+\.html/i.test(html);
    if (looksLikePageUrl) {
      toast.error("That's a Rumble page URL, not an embed. Use Share → Embed.", { duration: 9000 });
      return;
    }
    const hasIframe = /<iframe[\s\S]*<\/iframe>/i.test(html);
    const hasScript = /<script[\s\S]*<\/script>/i.test(html);
    if (!hasIframe && !hasScript) {
      toast.error("Paste the full <iframe> or <script> embed snippet.");
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("movie_episodes")
          .update({ title: t, embed_html: html, sort_order: sortOrder })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Episode updated");
      } else {
        const { error } = await supabase.from("movie_episodes")
          .insert({ movie_id: movieId, title: t, embed_html: html, sort_order: sortOrder });
        if (error) throw error;
        toast.success("Episode added");
      }
      reset();
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function edit(ep: EpisodeRow) {
    setEditingId(ep.id);
    setTitle(ep.title);
    setEmbedHtml(ep.embed_html);
    setSortOrder(ep.sort_order);
  }

  async function remove(ep: EpisodeRow) {
    if (!confirm(`Delete episode "${ep.title}"?`)) return;
    const { error } = await supabase.from("movie_episodes").delete().eq("id", ep.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    if (editingId === ep.id) reset();
    refresh();
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Episodes</h4>
      <form onSubmit={save} className="space-y-3 rounded-md border border-border bg-background p-4">
        <div className="grid sm:grid-cols-[1fr_100px] gap-3">
          <div>
            <label className="block text-xs mb-1">Episode title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs mb-1">Rumble embed</label>
          <textarea value={embedHtml} onChange={(e) => setEmbedHtml(e.target.value)} rows={3}
            placeholder='<iframe class="rumble" src="https://rumble.com/embed/..." ...></iframe>'
            className="w-full rounded-md bg-card border border-border px-3 py-2 font-mono text-xs" />
        </div>
        <div className="flex gap-2">
          <button disabled={busy} className="rounded-md bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update episode" : "Add episode"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">
              Cancel
            </button>
          )}
        </div>
      </form>

      {episodes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No episodes yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-background">
          {episodes.map((ep) => (
            <li key={ep.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{ep.title}</p>
                <p className="text-xs text-muted-foreground">Order: {ep.sort_order}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => edit(ep)} className="text-xs text-primary hover:underline">Edit</button>
                <button onClick={() => remove(ep)} className="text-xs text-destructive hover:underline">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
