# Scheduled publishing

Editors and administrators manage timed releases at `/admin/schedule`. All times entered and displayed in the CMS use **Asia/Colombo (Sri Lanka time)**. The database stores the corresponding UTC instant.

## Editorial workflow

1. Approve an article.
2. Open the article editor, choose a future **Scheduled publication** time, and use **Schedule Publication**.
3. Use the schedule desk to reschedule, publish immediately, or cancel the schedule. Cancelling returns the article to `APPROVED`.
4. Review the publisher health indicator and execution history on the schedule desk.

The publisher changes due articles from `SCHEDULED` to `PUBLISHED`, records an audit event, and sends the breaking-news push notification when applicable. A PostgreSQL advisory lock serializes overlapping executions so an article is published once.

## Automatic execution

Set `CRON_SECRET` to a long random value in every environment. The endpoint accepts `GET` or `POST` at `/api/cron/publish` with this header:

```text
Authorization: Bearer <CRON_SECRET>
```

`vercel.json` configures a one-minute Vercel Cron trigger. For a self-hosted deployment, run the website and the worker as separate supervised processes:

```powershell
npm run start
npm run scheduler
```

The worker reads `.env`, calls the protected endpoint once per minute, and logs each result. `APP_URL` selects the deployed site URL and `SCHEDULER_INTERVAL_MS` can change the interval. Keep one or more supervised workers running; database locking makes overlapping calls safe.
