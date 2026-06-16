import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";

// Best-effort, in-memory per-IP rate limiter. Acts as a backstop against bots
// hammering AI-generation endpoints. State lives per worker isolate, so this
// is a soft cap, not a strict guarantee. Cached reads should bypass this.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientKey(scope: string): string {
  let ip: string | undefined;
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? undefined;
  } catch {
    ip = undefined;
  }
  if (!ip) {
    try {
      ip =
        getRequestHeader("cf-connecting-ip") ??
        getRequestHeader("x-real-ip") ??
        getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
    } catch {
      ip = "unknown";
    }
  }
  return `${scope}:${ip}`;
}

/**
 * Throws an Error with a clear, user-safe message when the caller exceeds
 * `limit` requests per `windowMs` for the given `scope`.
 */
export function enforceRateLimit(scope: string, limit: number, windowMs: number) {
  const key = clientKey(scope);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    const retrySec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new Error(
      `Too many requests. Please wait ${retrySec}s before requesting more new content.`,
    );
  }

  bucket.count += 1;

  // Opportunistic cleanup to avoid unbounded growth.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }
}
