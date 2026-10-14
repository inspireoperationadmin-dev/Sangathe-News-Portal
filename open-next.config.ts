import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache is configured: every page is rendered per request
// (see `dynamic = "force-dynamic"` in src/app/layout.tsx).
export default defineCloudflareConfig();
