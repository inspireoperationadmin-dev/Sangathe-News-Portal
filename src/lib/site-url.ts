import { headers } from "next/headers";

const FALLBACK_SITE_URL = "http://localhost:3000";

function cleanOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

/**
 * Resolve the origin that served the current request. This keeps share and
 * canonical URLs correct on workers.dev, preview deployments, and a future
 * custom domain without relying on a stale build-time public variable.
 */
export async function getRequestSiteUrl() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"))
    ?.split(",")[0]
    .trim();

  if (host) {
    const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
    const protocol = forwardedProtocol || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return cleanOrigin(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL);
}
