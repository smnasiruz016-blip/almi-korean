// Fixed-window rate limiting for the unauthenticated POST routes (audit C7).
//
// ── WHAT WAS UNPROTECTED ──
// /api/auth/login accepted unlimited password attempts. Nothing counted failures, nothing
// slowed down, and the reply distinguishes nothing useful — so the only cost of guessing a
// password was bandwidth. /api/auth/signup was likewise free to spam into an account table.
// The only rate limit anywhere in the product was the resend-verification cooldown, which is a
// column on the User row and only covers that one action.
//
// ── HONEST ABOUT WHAT THIS IS ──
// This counter lives in the process. On Vercel that means PER INSTANCE, and an attacker whose
// requests land on several warm instances gets the limit multiplied by however many there are.
// It is a speed bump, not a wall, and calling it anything else would be the kind of green tick
// that stops anyone looking again.
//
// It is still worth having: Fluid Compute reuses instances across concurrent requests, so a
// burst from one source overwhelmingly lands on one of them, and this turns "unlimited guesses
// per second" into "a handful per minute" for a burst — which is the difference that matters
// against automated credential stuffing. It needs no schema change and no external store.
//
// The real fix, when it is worth the migration: a durable counter (a table keyed by
// identifier + window, or a shared KV store) so the limit holds across instances. Until then
// the guarantee this offers is exactly the one written above.

type Window = { count: number; resetAt: number };

// Module scope so it survives between invocations on a warm instance. globalThis so it also
// survives a dev-server hot reload, which would otherwise clear the map on every edit and make
// the limiter look broken while developing.
const KEY = "__almiKoreanRateLimit";
const g = globalThis as unknown as { [KEY]?: Map<string, Window> };
const windows: Map<string, Window> = (g[KEY] ??= new Map());

/** Cheap eviction: a fixed window is dead the moment it expires, so a full sweep on write is
 *  enough to stop an attacker growing the map without bound by varying the key. */
function sweep(now: number): void {
  if (windows.size < 512) return;
  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
}

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the window resets — sent as Retry-After so a caller can behave. */
  retryAfterSec: number;
  remaining: number;
};

/**
 * Count one attempt against `key`.
 * @param limit  attempts allowed per window
 * @param windowMs  window length
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: Math.ceil(windowMs / 1000), remaining: limit - 1 };
  }
  existing.count++;
  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return { ok: existing.count <= limit, retryAfterSec, remaining: Math.max(0, limit - existing.count) };
}

/**
 * Best-effort client identity for an unauthenticated request.
 *
 * x-forwarded-for is caller-settable in general, but on Vercel the platform overwrites it at
 * the edge, so the FIRST entry is the real client. Taking the first (not the last) is what
 * makes a spoofed header harmless here. x-real-ip is the fallback; "unknown" is the last
 * resort, and it buckets every unidentifiable caller together — deliberately, since that
 * bucket should be empty in production and sharing a limit is the safe way to be wrong.
 */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** The 429 body + Retry-After, shaped like every other error reply in the product. */
export function tooManyRequests(message: string, retryAfterSec: number): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSec) },
  });
}

/** Reset — for the offline proof only, so a limit proved RED does not leak into the next check. */
export function __resetRateLimits(): void {
  windows.clear();
}
