import type { NextConfig } from "next";

// ── SECURITY HEADERS (audit C5) ──────────────────────────────────────────────
// There were none. No sibling in the network had any either, so this is the first pass at the
// pattern rather than a port of one — which is why it is deliberately conservative: every
// header here is one that cannot break a page that currently works.
//
// ── WHAT IS DELIBERATELY *NOT* HERE ──
// A full Content-Security-Policy. A real `script-src` for Next.js needs per-request nonces
// threaded through the App Router, and the usual shortcut — `'unsafe-inline' 'unsafe-eval'` —
// buys a passing header scan and almost no actual protection. Shipping that would make the
// audit green while leaving the hole open, which is worse than an honest gap. The CSP below
// therefore sets ONLY the three directives that need no nonce and have no false-positive risk;
// it has no `default-src`, so media (the Blob-hosted listening clips), styles and scripts are
// untouched. A nonce-based script-src is a separate, larger job.
//
// `preload` is also absent from HSTS on purpose: submitting to the preload list is a one-way
// commitment for the whole apex domain and is the founder's call, not a config default.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // frame-ancestors is the modern equivalent of X-Frame-Options; both are sent because older
  // browsers honour only the latter and it costs nothing.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The product uses none of these. Denying them is free and stops an embedded third party
  // from asking on our origin's behalf.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "almiworld.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
