import { Role } from "@prisma/client";
import {
  BellRing,
  Globe,
  Info,
  Link2,
  MessageSquare,
  Send,
} from "lucide-react";

import { sendNewsAlert } from "@/actions/notifications";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

const styles = `
  .sng-notifications {
    position: relative;
    isolation: isolate;
  }

  .sng-notifications .sng-alert-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-notifications .sng-alert-icon {
    display: flex;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid #dbeafe;
    border-radius: 15px;
    background: linear-gradient(145deg, white, #e8efff);
    color: #2563eb;
    box-shadow:
      3px 3px 8px rgba(148,163,184,.12),
      -2px -2px 6px white;
  }

  .sng-notifications .sng-alert-input {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 48px;
    margin-top: 8px;
    padding: 12px 14px;
    border: 1px solid #dbe3ee;
    border-radius: 13px;
    background: #f8fafc;
    color: #0f172a;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.7;
    outline: none;
    box-shadow:
      inset 2px 2px 5px rgba(148,163,184,.07),
      inset -2px -2px 5px white;
    transition:
      background .2s ease,
      border-color .2s ease,
      box-shadow .2s ease;
  }

  .sng-notifications .sng-alert-input::placeholder {
    color: #94a3b8;
  }

  .sng-notifications .sng-alert-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-notifications .sng-alert-send {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 48px;
    padding: 12px 20px;
    border: 1px solid #2563eb;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.2),
      0 6px 16px -10px rgba(37,99,235,.6);
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .sng-notifications .sng-alert-send:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  .sng-notifications .sng-alert-send:active {
    transform: scale(.98);
  }

  .sng-notifications .sng-alert-entry {
    animation: sng-alert-enter .35s ease both;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-notifications .sng-alert-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-notifications .sng-alert-panel:hover {
      border-color: #bfdbfe;
      box-shadow: 0 14px 32px -25px rgba(37,99,235,.3);
    }

    .sng-notifications .sng-alert-send:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 22px -12px rgba(37,99,235,.6);
    }
  }

  @keyframes sng-alert-enter {
    from { opacity: 0; transform: translateY(7px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-notifications * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  await requireUser([Role.ADMIN, Role.EDITOR]);

  const params = await searchParams;

  const subscribers = await prisma.pushSubscription.count({
    where: { isActive: true },
  });

  return (
    <main className="sng-notifications mx-auto max-w-4xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          Audience communication
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Push notifications
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Send a short newsroom update and direct readers to a page
          on your website.
        </p>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Notification audience"
        className="sng-alert-panel flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6"
      >
        <div className="flex items-center gap-4">
          <span className="sng-alert-icon">
            <Globe className="h-5 w-5" aria-hidden="true" />
          </span>

          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {subscribers.toLocaleString("en-LK")}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Active browser subscriptions
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-2 text-xs font-semibold ${
            subscribers > 0
              ? "border-blue-100 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {subscribers > 0
            ? "Subscribers available"
            : "No active subscriptions"}
        </span>
      </section>

      <section
        aria-labelledby="news-alert-heading"
        className="sng-alert-panel sng-alert-entry"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-7">
          <span className="sng-alert-icon">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </span>

          <div>
            <h2
              id="news-alert-heading"
              className="text-base font-bold text-slate-900"
            >
              Compose newsroom alert
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Keep the title clear and the message brief.
            </p>
          </div>
        </header>

        <form action={sendNewsAlert} className="p-5 sm:p-7">
          <div className="space-y-6">
            <label className="block text-sm font-semibold text-slate-700">
              <span className="flex items-center justify-between gap-3">
                <span>Notification title *</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Up to 80 characters
                </span>
              </span>

              <input
                name="title"
                required
                maxLength={80}
                placeholder="செய்தியின் முக்கிய தலைப்பு…"
                className="sng-alert-input"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <MessageSquare
                    className="h-4 w-4 text-blue-500"
                    aria-hidden="true"
                  />
                  Message *
                </span>

                <span className="text-[10px] font-normal text-slate-400">
                  Up to 180 characters
                </span>
              </span>

              <textarea
                name="body"
                required
                maxLength={180}
                rows={4}
                placeholder="வாசகருக்கு அனுப்ப வேண்டிய சுருக்கமான செய்தி…"
                className="sng-alert-input resize-y"
              />

              <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
                Include the key update and why readers should open it.
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <Link2
                  className="h-4 w-4 text-blue-500"
                  aria-hidden="true"
                />
                Internal destination *
              </span>

              <input
                name="url"
                required
                defaultValue="/"
                pattern="/.*"
                title="Enter a website path starting with /."
                spellCheck={false}
                className="sng-alert-input"
              />

              <span className="mt-2 block text-xs font-normal leading-6 text-slate-500">
                Use a page path starting with{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  /
                </code>
                . For an article, paste its path from the website.
              </span>
            </label>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
              aria-hidden="true"
            />
            <p className="text-xs leading-6 text-blue-800">
              Published breaking stories can also alert subscribers
              automatically. This form sends a manual newsroom alert.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Send to browser subscribers
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {subscribers.toLocaleString("en-LK")} active subscriptions
                recorded when this page loaded.
              </p>
            </div>

            <button type="submit" className="sng-alert-send">
              <Send className="h-4 w-4" aria-hidden="true" />
              Send notification
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}