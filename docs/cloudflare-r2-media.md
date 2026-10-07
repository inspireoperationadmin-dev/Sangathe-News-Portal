# Cloudflare R2 media storage

All new CMS uploads use Cloudflare R2. This includes article featured images, article galleries, and files uploaded through the media library. PostgreSQL stores both the public URL and the private R2 object key.

## Cloudflare setup

1. Create an R2 bucket, for example `sangathe-media`.
2. Create an R2 API token with **Object Read & Write** permission for that bucket.
3. Connect a public custom domain to the bucket. A custom domain is recommended for production caching and stable URLs. The R2 development URL also works when public access is enabled.
4. Set these server-side environment variables:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=sangathe-media
R2_PUBLIC_URL=https://media.example.com
```

Only `R2_PUBLIC_URL` is used to construct browser-facing URLs. Credentials remain server-side and must never use a `NEXT_PUBLIC_` prefix.

## Existing local uploads

After setting the variables and taking a backup, migrate existing `/public/uploads` records once:

```powershell
npm run media:migrate-r2
```

The migration uploads each available file, then updates its database record. Missing local files are reported and skipped. It does not remove local files; keep them until the migrated URLs have been checked on the website.

## Storage lifecycle

- New files receive immutable, UUID-based keys grouped by purpose, year, and month.
- Replacing an article's featured image removes its previous R2 object after the database update succeeds.
- Deleting an unused media-library record removes the R2 object before deleting the record.
- Failed database writes clean up newly uploaded objects.
- Existing non-R2 and external URLs continue to render.
