// Structured server logging for security events and caught errors (audit C9).
//
// ── WHAT WAS WRONG ──
// Six routes refused requests with 401/402/403/429 and logged NOTHING. A credential-stuffing
// run against /api/auth/login, or someone probing /api/ko/submit for the answer key it
// discloses, left no trace at all — there was nothing to notice, and nothing to look at
// afterwards. Separately, the handful of routes that did log used bare `console.error` with a
// prose prefix, so nothing could be filtered or counted.
//
// ── THE RULE THIS FILE ENFORCES: NO PII, NO SECRETS, EVER ──
// Logs are retained by the platform, readable by anyone with project access, and outlive the
// request by a long way. So the safety is structural rather than a habit:
//
//   • The public functions take a CLOSED set of fields. There is no `extra: any` to smuggle a
//     request body through, so "just log the payload to debug it" is not reachable by accident.
//   • Nothing accepts an email, a password, a token, or a cookie. The client is identified by
//     a HASH (below), and the user by their internal cuid — never by address.
//   • Errors are reduced to name + message + digest. A stack can carry a file path and, on a
//     thrown validation error, the offending VALUE — which for this product is a learner's
//     Korean essay. `redactMessage` scrubs anything key-shaped that reached a message anyway.
//
// ── WHY THE CLIENT HASH IS SALTED PER PROCESS ──
// An IP address is personal data, and /privacy says we do not keep more than we said. But
// "one source made 200 failed logins" is the entire point of a security log. So the IP is
// hashed with a salt generated at module load and never persisted: identical clients collapse
// to one id WITHIN a process, which is exactly the window a burst shows up in, and the value
// is unlinkable across restarts and to any real address. No configured secret is involved —
// nothing to provision, rotate, or leak.

import { createHash, randomBytes } from "node:crypto";

const SALT = randomBytes(16).toString("hex");

/** Stable-within-process, unlinkable-outside id for an unauthenticated caller. */
export function clientHash(req: Request): string {
  // On Vercel the platform overwrites x-forwarded-for at the edge, so the FIRST entry is the
  // real client and a spoofed header is harmless. "unknown" buckets every unidentifiable
  // caller together, which is the safe way to be wrong.
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(SALT).update(ip).digest("hex").slice(0, 12);
}

/** Anything key-shaped that reached a message string anyway. Belt and braces. */
function redactMessage(msg: string): string {
  return msg
    .replace(/\b(sk-[A-Za-z0-9_-]{8,}|vercel_blob_rw_[A-Za-z0-9_-]{8,}|whsec_[A-Za-z0-9_-]{8,})/g, "[redacted-key]")
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, "[redacted-email]")
    // THE VALUE CAN CONTAIN A SPACE, AND `\S+` STOPPED AT IT.
    //
    // This was `…[:=]\s*\S+`. Against `authorization=Bearer abc.def.ghi` that matched exactly
    // "Bearer" — so the line came out as `authorization=[redacted] abc.def.ghi` and PUBLISHED
    // THE TOKEN, in the one function whose entire job is to stop that.
    //
    // Why the proof did not catch it: every credential-word fixture had a space-free value
    // (`password: hunter2`, `api_key=sk-…`). The Anthropic and Blob keys were caught by the
    // key-SHAPE rule above, not by this one, so this rule had only ever been exercised on
    // single-token values. A scheme-prefixed credential — `Bearer`, `Basic`, `token` — is the
    // one common shape with a space in it, and it was the one shape untested.
    //
    // Now: the scheme word is eaten explicitly, then the value, then the REST OF THE LINE. A
    // credential is the last thing that should be truncated by a cautious quantifier — if this
    // rule fires at all, everything after the delimiter is suspect. `m` so `$` is end-of-line
    // rather than end-of-string, or one credential on line 1 would blank a whole multi-line
    // message.
    .replace(
      /\b(password|passwd|token|secret|api[-_]?key|authorization|cookie)\s*[:=]\s*(?:bearer|basic|token)?\s*[^\s,;]+.*$/gim,
      "$1=[redacted]",
    )
    .slice(0, 600);
}

/** An unknown thrown value reduced to something safe to keep. No stack: see the header. */
function describeError(e: unknown): { name: string; message: string; status?: number } {
  if (e instanceof Error) {
    const status = (e as { status?: unknown }).status;
    return {
      name: e.name,
      message: redactMessage(e.message),
      ...(typeof status === "number" ? { status } : {}),
    };
  }
  return { name: "NonError", message: redactMessage(String(e)) };
}

function emit(level: "warn" | "error", payload: Record<string, unknown>): void {
  // One JSON object per line: greppable in `vercel logs`, and parseable by anything later.
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  if (level === "error") console.error(line);
  else console.warn(line);
}

/**
 * A request that was REFUSED. This is the C9 event: the thing that leaves a trace when
 * somebody is working through a password list or probing a paid endpoint.
 *
 * Note the parameter list — there is nowhere to put an email or a body.
 */
export function logRefusal(args: {
  route: string;
  status: 401 | 402 | 403 | 404 | 413 | 429;
  /** Short machine-readable cause, e.g. "no-session", "not-paid", "rate-limited". */
  reason: string;
  req: Request;
  /** Internal cuid only. Present when the caller was authenticated but still refused. */
  userId?: string;
}): void {
  emit("warn", {
    level: "warn",
    event: "refusal",
    route: args.route,
    status: args.status,
    reason: args.reason,
    client: clientHash(args.req),
    ...(args.userId ? { userId: args.userId } : {}),
  });
}

/** A caught exception. `op` names what was being attempted, so the line is searchable. */
export function logError(args: {
  route: string;
  /** e.g. "grade-writing", "persist-attempt", "send-verification-email". */
  op: string;
  error: unknown;
  req?: Request;
  userId?: string;
}): void {
  emit("error", {
    level: "error",
    event: "error",
    route: args.route,
    op: args.op,
    ...describeError(args.error),
    ...(args.req ? { client: clientHash(args.req) } : {}),
    ...(args.userId ? { userId: args.userId } : {}),
  });
}

/** Exported for the offline proof — the redactor has to be shown working. */
export const __redactMessage = redactMessage;
