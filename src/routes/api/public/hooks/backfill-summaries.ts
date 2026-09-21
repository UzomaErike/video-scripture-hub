import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { generateAndCacheSummary, GatewayBlockedError } from "@/lib/summary.functions";

const JOB = "summary-backfill";
/** Bounded work per run. ~1,189 chapters total, so a full pass takes ~2 days. */
const BATCH_SIZE = 25;
/** Lease length: a crashed run can't block the job forever. */
const LEASE_MINUTES = 50;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function setState(patch: Record<string, unknown>) {
  await supabaseAdmin
    .from("job_state")
    .upsert({ job_name: JOB, updated_at: new Date().toISOString(), ...patch }, { onConflict: "job_name" });
}

export const Route = createFileRoute("/api/public/hooks/backfill-summaries")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Only the scheduler (which sends the project's anon key) may trigger this.
        const key =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!key || key !== process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]) {
          return json({ error: "Unauthorized" }, 401);
        }

        const nowIso = new Date().toISOString();

        const { data: state } = await supabaseAdmin
          .from("job_state")
          .select("*")
          .eq("job_name", JOB)
          .maybeSingle();

        // Paused-state guard (credits / policy / provider block).
        if (state?.status === "paused") {
          return json({ skipped: "paused", reason: state.pause_reason });
        }
        if (state?.status === "done") {
          return json({ skipped: "done" });
        }

        // Single-flight lock: a live lease means another run is working.
        if (state?.lease_until && state.lease_until > nowIso) {
          return json({ skipped: "locked", lease_until: state.lease_until });
        }

        await setState({
          status: "running",
          lease_until: new Date(Date.now() + LEASE_MINUTES * 60_000).toISOString(),
          last_run_at: nowIso,
          last_error: null,
        });

        // Idempotent progress: skip anything already cached.
        const { data: existing, error: exErr } = await supabaseAdmin
          .from("chapter_summaries")
          .select("book_slug,chapter");

        if (exErr) {
          await setState({ status: "idle", lease_until: null, last_error: exErr.message });
          return json({ error: exErr.message }, 500);
        }

        const done = new Set((existing ?? []).map((r) => `${r.book_slug}:${r.chapter}`));

        const pending: Array<{ slug: string; name: string; chapter: number }> = [];
        for (const book of BIBLE_BOOKS) {
          for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
            if (done.has(`${book.slug}:${chapter}`)) continue;
            pending.push({ slug: book.slug, name: book.name, chapter });
            if (pending.length >= BATCH_SIZE) break;
          }
          if (pending.length >= BATCH_SIZE) break;
        }

        if (pending.length === 0) {
          await setState({ status: "done", lease_until: null, processed_count: done.size });
          return json({ finished: true, cached: done.size });
        }

        let processed = 0;
        let consecutiveFailures = 0;
        let paused: string | null = null;
        let lastError: string | null = null;

        for (const item of pending) {
          try {
            await generateAndCacheSummary(item.slug, item.name, item.chapter);
            processed += 1;
            consecutiveFailures = 0;
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            lastError = `${item.slug} ${item.chapter}: ${message}`;

            // Circuit breaker: gateway credit/policy/rate-limit blocks stop the run.
            if (err instanceof GatewayBlockedError) {
              if ([402, 403].includes(err.status)) {
                paused = `AI gateway returned ${err.status}. Generation is paused until this is resolved.`;
                break;
              }
              if (err.status === 429) {
                // Park the rest of the work until the next scheduled run.
                break;
              }
            }

            consecutiveFailures += 1;
            if (consecutiveFailures >= 5) {
              paused = `5 consecutive failures. Last error: ${message}`;
              break;
            }
          }
        }

        await setState({
          status: paused ? "paused" : "idle",
          pause_reason: paused,
          lease_until: null,
          last_error: lastError,
          processed_count: done.size + processed,
        });

        return json({
          processed,
          remaining_estimate: 1189 - (done.size + processed),
          paused,
          last_error: lastError,
        });
      },
    },
  },
});
