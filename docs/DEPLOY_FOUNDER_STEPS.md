# AlmiJapanese — Deploy & Founder Steps (Phase 5)

Wave-1 build is complete and green. The remaining launch steps are **founder-gated** (accounts,
DNS, DB, GSC). Do them in this order.

## 0. Pre-flight (already done in code)
- `robots.txt` → `https://almijapanese.almiworld.com/sitemap-index.xml`
- `sitemap-index.xml` lists 6 chunks (`/sitemap/0.xml` … `/sitemap/5.xml`)
- Total sitemap URLs ≈ **163,687** (163,660 corridor/family pages + 27 core/static). Recruitment-stopped
  universities and not-yet-operational SSW fields are **excluded** (verified in the sitemap).

## 1. Vercel project
- Create a Vercel project from the GitHub repo `smnasiruz016-blip/almi-japanese`.
- **Set Production Branch = `master`** BEFORE pointing the domain at it (the standing 404-trap fix —
  if production branch ≠ the branch that has the code, the domain serves 404s).
- Framework preset: Next.js. Build command default (`npm run build`, which runs `prisma generate` first).

## 2. Domain
- Add domain **`almijapanese.almiworld.com`** in Vercel → add the **CNAME** record it shows at the DNS host.

## 3. Neon Postgres (prod DB)
- Create a Neon project (region close to Vercel, e.g. us-east-1).
- Set Vercel env vars (Production):
  - `DATABASE_URL` = the **pooled** connection string, and it **MUST** end with `?sslmode=require&pgbouncer=true`
    (drop `channel_binding`) — otherwise every DB op 500s on serverless.
  - `DATABASE_URL_UNPOOLED` = the **direct** (unpooled) host, for migrations.
  - `APP_URL` = `https://almijapanese.almiworld.com`
- Apply schema: `npx prisma migrate deploy` (or `prisma db push` for first stand-up) against the direct URL.
- **Seed the item bank:** `npm run seed:batch1` (idempotent upsert of the 240 Batch-1 items). Verify the
  live `JapaneseItem` count = 240.

## 4. Google Search Console
- Add the property for `almijapanese.almiworld.com` (DNS or URL-prefix).
- Submit the sitemap: **`https://almijapanese.almiworld.com/sitemap-index.xml`**.

## 5. AlmiMonitor registry (Phase 7)
Add **one active row** for AlmiJapanese in the AlmiMonitor Neon registry (never hard-coded — one row,
the launch-checklist doctrine):
- **name:** `AlmiJapanese`
- **url:** `https://almijapanese.almiworld.com`
- **statusPath:** `/api/status` (built — returns `itemBank.total`, `pages.wave1Total`, exclusion counts,
  and a live `dbItemsActive` once the DB is seeded)
- **sitemapPath:** `/sitemap-index.xml`
- **baseline:** after the first seed, `itemBank.total` = **240** and `dbItemsActive` = **240**;
  `pages.wave1Total` = **163,660** (sitemap total 163,687)
- **active:** `true`

Also confirm the AlmiMonitor **Known-Date Registry** already carries the JLPT July / December windows
and the JFT-Basic August 2026 sitting (they are). This repo itself hard-codes **no** exam date — sittings
are shown honestly per-origin from the parsed overseas-site flags, and JFT-Basic dates stay "confirm
locally", so nothing here can go stale.

## 6. Billing (Phase 6 — founder-gated env; code is built & fail-closed)
Auth (bcrypt + DB sessions) and Stripe are wired and compile green, but **billing is OFF until you set the
env vars** — `isBillingEnabled()` fail-closes so no paywall shows or charges before it is real; free
practice stays open. To turn it on:
- In the shared AlmiWorld **Stripe** account, create the **AlmiJapanese Pro** product: **$12/month, 7-day
  free trial**. Copy the **price id**.
- Set Vercel env (Production): `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`,
  `OWNER_EMAILS`, `ADMIN_EMAILS`.
- Add a Stripe **webhook** → `https://almijapanese.almiworld.com/api/webhooks/stripe` (events:
  `customer.subscription.created/updated/deleted`); paste its signing secret into `STRIPE_WEBHOOK_SECRET`.
- Note: the owner (in `OWNER_EMAILS`) bypasses billing, so **test checkout with a different email**.
- Requires the Neon DB from step 3 (users, sessions, subscription state live there).

## Deferred to later phases
- **Full timed mock + Listening TTS audio + saved attempts:** needs the DB (step 3) + TTS wiring.
- **Email verification / password reset:** not wired in Wave 1 (no email service yet).
