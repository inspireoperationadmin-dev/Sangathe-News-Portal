# Deployment environment variables

Use `.env.example` as the canonical variable list. Store production secrets in the deployment provider's encrypted environment settings; do not commit a populated `.env` file.

| Variable | Local test | Production | Visibility | Purpose |
|---|---:|---:|---|---|
| `DATABASE_URL` | Required | Required | Secret | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Required | Required | Public | Canonical website origin |
| `SESSION_SECRET` | Required | Required | Secret | Signs and encrypts CMS sessions and 2FA data |
| `CRON_SECRET` | Required | Required | Secret | Authenticates the scheduled publisher |
| `R2_ACCOUNT_ID` | For upload tests | Required | Secret | Cloudflare account identity |
| `R2_ACCESS_KEY_ID` | For upload tests | Required | Secret | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | For upload tests | Required | Secret | R2 API token secret |
| `R2_BUCKET_NAME` | For upload tests | Required | Server-only | Media bucket name |
| `R2_PUBLIC_URL` | For upload tests | Required | Public URL | Public media origin/custom domain |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | To test push | To enable push | Public | Browser push public key |
| `VAPID_PRIVATE_KEY` | To test push | To enable push | Secret | Browser push private key |
| `VAPID_SUBJECT` | To test push | To enable push | Server-only | Push operator contact URI |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Recommended | Public | GA4 web-stream ID |
| `GOOGLE_SITE_VERIFICATION` | Optional | Recommended | Public token | Search Console verification |
| `NEXT_PUBLIC_FACEBOOK_URL` | Optional | Optional | Public | Publication Facebook profile |
| `NEXT_PUBLIC_YOUTUBE_URL` | Optional | Optional | Public | Publication YouTube profile |
| `NEXT_PUBLIC_WHATSAPP_URL` | Optional | Optional | Public | Publication WhatsApp link |
| `NEXT_PUBLIC_X_URL` | Optional | Optional | Public | Publication X profile |
| `APP_URL` | Scheduler only | Self-hosted only | Server-only | Origin called by scheduler worker |
| `SCHEDULER_INTERVAL_MS` | Scheduler only | Self-hosted only | Server-only | Worker polling interval |
| `SEED_ADMIN_PASSWORD` | Seed only | Temporary | Secret | Initial administrator password |
| `SEED_REPORTER_PASSWORD` | Seed only | Temporary | Secret | Initial reporter password |

`NODE_ENV` is managed by Next.js and should normally not be added manually. Redis currently has no application integration, so no `REDIS_URL` is required.

## Secret generation

Generate separate `SESSION_SECRET` and `CRON_SECRET` values:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Run the command twice and use a different result for each variable. Generate the VAPID key pair with:

```powershell
npx web-push generate-vapid-keys
```

## Local test startup

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Fill the R2 values before testing uploads. Start the self-hosted scheduled publisher in a second terminal when required:

```powershell
npm run scheduler
```

## Production checks

Before starting production, confirm that the site and R2 public URLs use HTTPS, migrations have completed, the R2 token can write and delete objects, the cron endpoint returns HTTP 200 with its bearer secret, and the seed passwords have been removed from the production environment.
