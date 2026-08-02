"use client";

// The last-resort boundary: an error thrown in the ROOT layout itself, where nothing else
// exists to catch it. Next replaces the entire document here, which is why this file renders
// its own <html> and <body> and cannot use GlobalHeader/GlobalFooter — the shell that would
// have provided them is the thing that failed.
//
// ── WHY THE COPY IS SHAPED LIKE THIS ──
// Next's default is an unstyled grey page reading "Application error: a client-side exception
// has occurred". A learner mid-attempt reads that as "my work is gone", and on a paid product
// often as "I have been charged for something broken". So this says the two things that are
// actually true and useful: it is our fault, and their account and saved results are intact.
// It does NOT promise their current unsaved answers survived, because they may not have.
//
// ── WHAT IT DELIBERATELY DOES NOT SHOW ──
// `error.message`. A message thrown in a server component can carry an internal path or a
// query fragment; Next already replaces it with an opaque digest in production for exactly
// that reason, and printing the raw string here would undo that. The digest IS shown, because
// it is the one string that lets a user's report be matched to a log line.
//
// Styling is inline on purpose. A root-layout failure can BE the stylesheet, and a fallback
// that depends on the thing that broke is not a fallback. Colours are the brand tokens from
// lib/brand.ts, hardcoded here for the same reason.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          backgroundColor: "#FFFAF3",
          color: "#3B352D",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <main style={{ maxWidth: "34rem", width: "100%" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#F2624F",
            }}
          >
            AlmiKorean
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "1.875rem", fontWeight: 700, color: "#14110D" }}>
            Something broke on our side
          </h1>
          <p style={{ margin: "1rem 0 0", lineHeight: 1.6 }}>
            This page failed to load, and that is a fault in AlmiKorean rather than anything you did. Your
            account and your saved results are not affected.
          </p>
          <p style={{ margin: "0.75rem 0 0", lineHeight: 1.6 }}>
            Try again — most of these clear on a second attempt. If it keeps happening, email{" "}
            <a href="mailto:almiworld@almiworld.com" style={{ color: "#F2624F" }}>
              almiworld@almiworld.com
            </a>
            {error.digest ? " and quote the reference below, which points us straight at the log line." : "."}
          </p>

          <div style={{ marginTop: "1.75rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: "9999px",
                padding: "0.7rem 1.75rem",
                fontSize: "1rem",
                fontWeight: 600,
                backgroundColor: "#FF7A6B",
                color: "#14110D",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: "9999px",
                border: "1px solid #ECE3D6",
                padding: "0.7rem 1.75rem",
                fontSize: "1rem",
                fontWeight: 500,
                color: "#14110D",
                textDecoration: "none",
              }}
            >
              Back to the homepage
            </a>
          </div>

          {error.digest && (
            <p style={{ margin: "1.5rem 0 0", fontSize: "0.75rem", color: "#6B6156" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
