// LOGGING PROOF — the C9 claim, checked rather than asserted.
//
// Two halves, and the second is the one that matters:
//   1. Every refusing route actually calls the logger. That is what C9 measures, and it is a
//      static fact about the source, so it is read from the source.
//   2. NOTHING the logger emits carries PII or a secret — including when a caller does the
//      wrong thing and hands it an error whose message is full of them. "No PII in logs" is a
//      promise the /privacy page now makes on our behalf, so it needs to survive contact with
//      a hostile input, not just a tidy one.
//
// Runs OFFLINE. No network, no database, no key.
//
// Run: npm run proof:logging

import fs from "node:fs";
import path from "node:path";

let failures = 0;
let checks = 0;
function assert(label: string, cond: boolean, detail: string): void {
  checks++;
  if (cond) console.log(`  ✓ ${label} — ${detail}`);
  else { failures++; console.error(`  ✗ ${label} — ${detail}`); }
}

const ROOT = path.join(import.meta.dirname, "..");
const { logRefusal, logError, clientHash, __redactMessage } = await import("../src/lib/observability");

/** Capture what actually reaches the console, which is the only thing that ends up retained. */
function capture(fn: () => void): string[] {
  const lines: string[] = [];
  const origWarn = console.warn;
  const origError = console.error;
  console.warn = (...a: unknown[]) => { lines.push(a.map(String).join(" ")); };
  console.error = (...a: unknown[]) => { lines.push(a.map(String).join(" ")); };
  try { fn(); } finally { console.warn = origWarn; console.error = origError; }
  return lines;
}

const req = (ip = "203.0.113.7") =>
  new Request("http://localhost/api/x", { headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } });

// ── PART 1 — every refusing route logs ───────────────────────────────────────
console.log("PART 1 — every refusing route leaves a trace (this is what C9 measures)");
{
  const apiDir = path.join(ROOT, "src", "app", "api");
  const routes: string[] = [];
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "route.ts") routes.push(p);
    }
  })(apiDir);

  const REFUSES = /status:\s*(401|402|403|429)|tooManyRequests\(/;
  const LOGS = /logRefusal\(|logError\(/;
  const refusing = routes.filter((f) => REFUSES.test(fs.readFileSync(f, "utf8")));
  const silent = refusing.filter((f) => !LOGS.test(fs.readFileSync(f, "utf8")));

  assert(
    "every route that refuses a request calls the logger",
    silent.length === 0,
    `${refusing.length} refusing route(s), ${silent.length} silent${silent.length ? `: ${silent.map((f) => path.relative(ROOT, f)).join(", ")}` : ""}`,
  );

  // No bare console.* left in a route — those are unfilterable and bypass the redactor.
  const bare = routes.filter((f) => /console\.(log|warn|error|info)\s*\(/.test(fs.readFileSync(f, "utf8")));
  assert(
    "no route logs through a bare console call",
    bare.length === 0,
    `a bare console.error bypasses redaction entirely${bare.length ? `: ${bare.map((f) => path.relative(ROOT, f)).join(", ")}` : ""}`,
  );

  // `reason` is free text by type. Keep it to machine tokens, so nobody ever puts an address
  // or an input in the one field that would accept it.
  const reasons = new Set<string>();
  for (const f of routes) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/reason:\s*(?:secret \? )?"([^"]+)"(?:\s*:\s*"([^"]+)")?/g)) {
      reasons.add(m[1]);
      if (m[2]) reasons.add(m[2]);
    }
  }
  assert(
    "every `reason` in the codebase is a machine token, not prose",
    [...reasons].every((r) => /^[a-z0-9-]{3,24}$/.test(r)) && reasons.size > 0,
    `${reasons.size} distinct: ${[...reasons].sort().join(", ")}`,
  );
}

// ── PART 2 — the emitted line is structured ──────────────────────────────────
console.log("\nPART 2 — what comes out is one parseable object per line");
{
  const [line] = capture(() => logRefusal({ route: "/api/ko/submit", status: 401, reason: "no-session", req: req() }));
  let parsed: Record<string, unknown> = {};
  let ok = true;
  try { parsed = JSON.parse(line); } catch { ok = false; }
  assert("a refusal emits valid JSON", ok, ok ? `keys: ${Object.keys(parsed).join(", ")}` : `unparseable: ${line}`);
  assert(
    "it carries the fields an investigation needs",
    parsed.event === "refusal" && parsed.route === "/api/ko/submit" && parsed.status === 401 &&
      parsed.reason === "no-session" && typeof parsed.client === "string" && typeof parsed.ts === "string",
    `event/route/status/reason/client/ts all present.`,
  );
}

// ── PART 3 — no PII, no secrets. The half that matters. ──────────────────────
console.log("\nPART 3 — nothing personal or secret survives into a log line");
{
  const EMAIL = "nasir.private@example.com";
  const KEY = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const BLOB = "vercel_blob_rw_ZZZZZZZZZZZZZZZZ_abcdefgh";
  const WHSEC = "whsec_ABCDEFGHIJKLMNOPQRSTUVWX";

  // A caller doing the WRONG thing: an error whose message is stuffed with everything we
  // promised never to keep. This is the realistic failure — an upstream SDK error that
  // echoes the request back.
  const nasty = new Error(
    `auth failed for ${EMAIL} using api_key=${KEY} and ${BLOB}; signature ${WHSEC}; password: hunter2`,
  );
  const [line] = capture(() => logError({ route: "/api/ko/writing", op: "grade-writing", error: nasty, req: req() }));

  for (const [what, needle] of [["an email address", EMAIL], ["an Anthropic key", KEY], ["a Blob token", BLOB], ["a webhook secret", WHSEC]] as const) {
    assert(`SEEN RED — ${what} in an error message is redacted`, !line.includes(needle), `absent from the emitted line.`);
  }
  assert("a password= value is redacted", !/hunter2/.test(line), `the value is gone; the field NAME may remain, which is a diagnostic not a disclosure.`);
  assert(
    "the message is still useful after redaction",
    /auth failed/.test(line) && /redacted/.test(line),
    `redaction replaces the values, it does not blank the line: ${JSON.parse(line).message.slice(0, 90)}…`,
  );

  // The stack is where a file path — and, for a Zod failure, the learner's own essay — would
  // otherwise ride along.
  assert("no stack trace is emitted", !line.includes("at ") && !line.includes(".ts:"), `name + message + status only.`);

  // Direct unit checks on the redactor, so each shape is proven on its own.
  for (const [what, s] of [["sk-", `x ${KEY} y`], ["vercel_blob_rw_", `x ${BLOB} y`], ["whsec_", `x ${WHSEC} y`], ["email", `x ${EMAIL} y`]] as const) {
    assert(`SEEN RED — the redactor catches a bare ${what} value`, !__redactMessage(s).includes(s.split(" ")[1]), `replaced.`);
  }
  assert("ordinary text is left alone", __redactMessage("connection reset by peer") === "connection reset by peer", `no over-redaction.`);

  // ── THE BLIND SPOT THIS PROOF USED TO HAVE ────────────────────────────────
  // Everything above passed 23/23 while the redactor was publishing bearer tokens.
  //
  // The reason is visible in the fixtures: every credential-WORD case had a value with no
  // space in it (`password: hunter2`, `api_key=sk-…`), and the Anthropic/Blob/webhook keys
  // were caught by the key-SHAPE rule, not by the credential-word rule at all. So the
  // credential-word rule had only ever been exercised on single-token values, and
  // `…[:=]\s*\S+` is correct for exactly those.
  //
  // `authorization=Bearer <token>` is the common shape whose value CONTAINS A SPACE. `\S+`
  // matched "Bearer" and stopped, so the emitted line read
  //     authorization=[redacted] abc.def.ghi
  // — the scheme redacted, the credential published.
  const BEARER_TOKEN = "abc.def.ghijklmnop";

  // THE PRECISE CONDITION IS "the value contains a space", not "the value is a credential".
  // These three leak under the old rule because a scheme word sits between the delimiter and
  // the secret.
  const SCHEME_CASES = [
    ["bearer", `rejected: authorization=Bearer ${BEARER_TOKEN}`],
    ["basic", `denied: authorization: Basic ${BEARER_TOKEN}`],
    ["token scheme", `upstream said token: Token ${BEARER_TOKEN}`],
  ] as const;

  // A cookie with attributes does NOT leak under the old rule — `session=abc…;` has no space
  // before the secret, so `\S+` swallowed it correctly. It is asserted separately as a
  // REGRESSION guard rather than as a red case, because claiming the old rule leaked here
  // would be a false statement about what was wrong, and this proof's whole value is that its
  // claims are literally true. (Written as a red case first; the proof rejected it.)
  const alreadyHandled = `cookie=session=${BEARER_TOKEN}; Path=/; HttpOnly`;
  assert(
    "a cookie with attributes was already safe, and still is",
    !__redactMessage(alreadyHandled).includes(BEARER_TOKEN),
    `now: "${__redactMessage(alreadyHandled)}"`,
  );

  // THE RED, KEPT IN THE FILE ON PURPOSE. The old pattern is re-created here and shown to
  // leak, so this is not "a case we added once" but a permanent demonstration of what the
  // current pattern is protecting against. If someone reverts the fix, the assertion below
  // that compares them starts failing.
  const OLD_PATTERN = /\b(password|passwd|token|secret|api[-_]?key|authorization|cookie)\s*[:=]\s*\S+/gi;
  const redactedByOldRule = (s: string) => s.replace(OLD_PATTERN, "$1=[redacted]");

  for (const [what, input] of SCHEME_CASES) {
    const old = redactedByOldRule(input);
    const now = __redactMessage(input);
    // 1. The old rule must genuinely leak — otherwise this whole section proves nothing.
    assert(
      `SEEN RED — the OLD \\S+ rule leaks a ${what} credential`,
      old.includes(BEARER_TOKEN),
      `old rule emitted: "${old}"`,
    );
    // 2. The current rule must not.
    assert(
      `the credential is gone from a ${what} value`,
      !now.includes(BEARER_TOKEN),
      `now: "${now}"`,
    );
    // 3. …and the line must still say something. A redactor that returns "" is not a redactor.
    assert(
      `the ${what} line is still readable after redaction`,
      now.trim().length > 0 && /redacted/.test(now),
      `now: "${now}"`,
    );
  }

  // A multi-line message must not lose everything after the first credential — `$` has to be
  // end-of-LINE, which is why the pattern carries `m`.
  const multi = __redactMessage(`authorization=Bearer ${BEARER_TOKEN}\nrequest id 12345 is fine`);
  assert("a credential on line 1 does not blank line 2", multi.includes("request id 12345"), `got: ${JSON.stringify(multi)}`);
  assert("…and the token is still gone from line 1", !multi.includes(BEARER_TOKEN), `got: ${JSON.stringify(multi)}`);
}

// ── PART 4 — the client id is not an address ─────────────────────────────────
console.log("\nPART 4 — the client is countable but not identifiable");
{
  const IP = "203.0.113.7";
  const a = clientHash(req(IP));
  const b = clientHash(req(IP));
  const c = clientHash(req("198.51.100.9"));
  assert("the raw IP never appears in the id", !a.includes(IP) && a !== IP, `id "${a}" for ${IP}.`);
  assert("the same client collapses to the same id (a burst is countable)", a === b, `${a} === ${b}`);
  assert("a different client gets a different id", a !== c, `${a} ≠ ${c}`);
  assert("the id is short and opaque", /^[a-f0-9]{12}$/.test(a), `12 hex chars, salted per process — unlinkable across restarts.`);

  // A spoofed x-forwarded-for must not let a caller dodge its own bucket: Vercel overwrites
  // the header at the edge, so the FIRST entry is the real client and later ones are ignored.
  const spoofed = new Request("http://localhost/api/x", { headers: { "x-forwarded-for": `${IP}, 1.2.3.4, 5.6.7.8` } });
  assert("only the first x-forwarded-for entry is used", clientHash(spoofed) === a, `appended entries cannot shift the bucket.`);

  const [line] = capture(() => logRefusal({ route: "/api/auth/login", status: 401, reason: "bad-credentials", req: req(IP) }));
  assert(
    "a failed login logs no email and no address",
    !line.includes(IP) && !/@/.test(line),
    `the log records that a refusal happened and from which bucket — never who was guessed at, so it cannot be mined to enumerate accounts.`,
  );
}

console.log(`\n${failures === 0 ? "✓ ALL GREEN" : "✗ FAILURES"} — ${checks - failures}/${checks} checks passed.`);
if (failures > 0) process.exit(1);
