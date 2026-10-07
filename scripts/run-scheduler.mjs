const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;
const interval = Math.max(Number(process.env.SCHEDULER_INTERVAL_MS) || 60_000, 10_000);

if (!secret) {
  throw new Error("CRON_SECRET is required to run the scheduled publisher.");
}

let running = false;

async function publishDueStories() {
  if (running) return;
  running = true;
  try {
    const response = await fetch(`${baseUrl}/api/cron/publish`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Publisher returned HTTP ${response.status}`);
    console.log(`[${new Date().toISOString()}] Published ${result.published}; expired breaking flags ${result.expiredBreaking}.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Scheduled publisher failed:`, error instanceof Error ? error.message : error);
  } finally {
    running = false;
  }
}

await publishDueStories();
setInterval(publishDueStories, interval);
