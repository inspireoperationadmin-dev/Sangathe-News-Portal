# Milestone 3 — MVP Publishing Platform

This milestone completes the requested Phase 1 MVP content, public website, search, SEO, audience and legal-page capabilities. AI assistance and advertising remain excluded.

## Article and multimedia management

- Article tags, people and location metadata.
- Additional gallery-image uploads and reusable media-library records.
- Video/YouTube and audio URLs.
- Manual related-story selection with automatic category fallback.
- Dedicated public video, photo, regional, author and archive pages.
- Print, WhatsApp, Facebook, Telegram and X sharing.

## Advanced search

- Keyword/headline/body search.
- Category, subcategory, author, tag, person, location and date-range filters.
- Paginated results and archive pagination.
- PostgreSQL GIN full-text index for future large-archive query optimization.

## Search and Google News readiness

- Article SEO headline and description metadata.
- Canonical URLs, Open Graph and X cards.
- NewsArticle, NewsMediaOrganization and BreadcrumbList structured data.
- XML sitemap, valid Google News sitemap and robots directives.
- Author pages, category URLs and image metadata.
- Search Console verification environment hook.

## Audience features

- GA4 loader controlled by `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- First-party CMS analytics for published stories, recorded views, top stories, category performance and subscriber totals.
- Newsletter signup, persistence and administrator subscriber management.
- Browser push subscription, service worker, VAPID delivery, newsroom alert composer and automatic breaking-story alerts.
- Authenticated cron endpoint for scheduled publishing and breaking-status expiry.

## Legal-page CMS

- Administrator editing for About, Contact, Privacy, Terms, Editorial Policy, Corrections Policy and Copyright pages.
- Sanitized HTML content and usable Tamil default copy.
- Public pages revalidate immediately after publication.

## Production configuration

The application code is complete. Deployment supplies environment-specific values for:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `GOOGLE_SITE_VERIFICATION`
- VAPID keys and subject
- `CRON_SECRET`
- Social profile URLs

Schedule an infrastructure cron request to `GET /api/cron/publish` with `Authorization: Bearer <CRON_SECRET>` at least once per minute.

## Acceptance checks

1. TypeScript, ESLint and the production build pass.
2. All Prisma migrations are applied.
3. Public MVP routes return successful responses.
4. CMS routes redirect unsigned users to login.
5. Invalid push subscriptions are rejected and the cron route rejects missing authentication.
6. Main and Google News sitemaps return XML and are listed in robots.txt.
7. Production dependencies have no known audit vulnerabilities.
