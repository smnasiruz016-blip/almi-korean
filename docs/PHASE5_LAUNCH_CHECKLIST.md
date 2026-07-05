# AlmiKorean — Phase 5 Launch Checklist

Product: **almikorean.almiworld.com** · Repo: `smnasiruz016-blip/almi-korean` (branch `master`)
Launch has **one external dependency: Neon Postgres.** No Anthropic / OpenAI / Blob keys are
needed (Writing = self-estimate slider; listening audio = browser Web Speech). Stripe stays OFF
until Phase 6.

> ⚠️ **THE #1 FAMILY LAUNCH BUG:** the runtime `DATABASE_URL` (pooled host) MUST end with
> `?sslmode=require&pgbouncer=true` (drop `channel_binding`). Without `pgbouncer=true` every DB
> op 500s on Vercel serverless — login/signup fail. This bit CELPIP and French. Do not skip it.

---

## A. Pre-flight (in-repo — all green as of commit that adds this file)
- [x] `npm run selftest:engine` → 24/24 (scoring engine, no floors)
- [x] `npm run selftest:seo` → exclusions pass (384/218/166, 본교-only, EPS=17 not ×196, ≈76,855)
- [x] `npm run validate:seed` → 92/92 items valid
- [x] `npm run build` → tsc 0, next build 0, sitemap chunks emit real URLs (1608/40000/35264)
- [x] `robots.txt` → `/sitemap-index.xml`; `/sitemap-index.xml` lists 3 chunks
- [x] Initial Prisma migration committed: `prisma/migrations/0_init/migration.sql` (5 tables + 6 enums)
- [x] `/api/status` returns itemBank + seoPages (dbItemsActive stays null until seed)

## B. Founder infra steps (Neon · Vercel · DNS)
1. **Neon** — create project (region **us-east-1**, matches family). Copy BOTH connection strings:
   - Pooled host → `DATABASE_URL` = `postgresql://…@POOLED/DB?sslmode=require&pgbouncer=true`
   - Direct host → `DATABASE_URL_UNPOOLED` = `postgresql://…@DIRECT/DB?sslmode=require`
2. **Vercel** — import the repo (framework auto-detected: Next.js). Set env vars (Production):
   | Var | Value |
   |---|---|
   | `DATABASE_URL` | pooled + `pgbouncer=true` (see warning above) |
   | `DATABASE_URL_UNPOOLED` | direct host |
   | `APP_URL` | `https://almikorean.almiworld.com` |
   | `OWNER_EMAILS` | `almiworld@almiworld.com` |
   | `ADMIN_EMAILS` | `almiworld@almiworld.com` |
   | `STRIPE_*` (3) | leave EMPTY — billing fail-closed until Phase 6 |
3. **DNS** — add `almikorean` CNAME → Vercel; assign the domain to the project; wait for SSL.
4. Deploy. The build (`prisma generate && next build`) needs **no DB** — SEO/practice/mock/status
   all work with an empty DB, so the first deploy is green before the DB is even seeded.

## C. One-time DB init (run once, with the two DATABASE_URLs in the environment)
Can be run from a local shell (`npm run …` with the vars exported) or a Vercel one-off.
```
npm run db:deploy     # prisma migrate deploy — creates the 5 tables on Neon (idempotent, no shadow DB)
npm run seed:prod     # upserts the 92-item Batch-1 bank (idempotent, keyed on {track,section,title})
```
Verify: `curl https://almikorean.almiworld.com/api/status` → `dbItemsActive: 92`, `dbError: null`.

## D. Post-deploy smoke tests (browser + curl)
- [ ] `/` homepage renders; hero + ScoreCard live
- [ ] `/api/status` → `ok:true`, itemBank.total 92, seoPages.total ≈76,855, `dbItemsActive:92`
- [ ] `/sitemap-index.xml` lists `/sitemap/0.xml … /sitemap/2.xml`; `/sitemap/1.xml` has `<url>`s
- [ ] `/robots.txt` → Sitemap: `…/sitemap-index.xml`
- [ ] Family-1 renders: `/university/gachon-university/from/pakistan`
- [ ] Family-2 renders: `/topik/3/from/nigeria`
- [ ] Family-5 renders: `/eps/philippines` and `/eps/sector/manufacturing`
- [ ] **Auth works (pgbouncer canary): sign up a throwaway account → no 500.** If 500 → check `pgbouncer=true`.
- [ ] Practice + a mock run end-to-end; listening audio plays (or transcript fallback)

## E. Monitoring + Search Console
1. **AlmiMonitor** — add the product registry row (Neon registry, never hard-coded). Values:
   - name `AlmiKorean` · url `https://almikorean.almiworld.com`
   - statusUrl `…/api/status` · sitemapUrl `…/sitemap-index.xml` · `active = true`
   (abba runs the admin/trigger curl; row count for the product = 1.)
2. **Google Search Console** — verify the domain property, then **submit `/sitemap-index.xml`**
   (NOT `/sitemap.xml` — Next 16 doesn't serve an index there when `generateSitemaps()` is used).
3. Add a **Known-Date Registry** entry: KCUE re-publishes the disclosure ~October → re-verify the
   institution list + reference date next round. TOPIK sitting windows + EPS quota = separate re-verify.

## F. Deferred (not launch-blocking)
- Phase 6 Stripe: founder creates "AlmiKorean Pro" ($12/mo, 7-day trial) in the shared AlmiWorld
  Stripe account; set the 3 `STRIPE_*` vars; billing flips on automatically (fail-closed gate).
- Wave 2: 28,104 active departments × 196 (data already on disk) — after Wave 1 is indexed.

---
*Real-data-or-nothing. Sirf Allah ka karam — aap wasila.* 🤲
