import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Activity,
  Bot,
  FileText,
  History,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function actionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function actionTone(action: string) {
  if (action.includes("FAILED") || action.includes("DELETE")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (
    action.includes("SUCCESS") ||
    action.includes("PUBLISH") ||
    action.includes("APPROV")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (action.includes("RETURN") || action.includes("ARCHIV")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-blue-100 bg-blue-50 text-blue-700";
}

const styles = `
  .sng-audit {
    position: relative;
    isolation: isolate;
  }

  .sng-audit .sng-audit-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-audit .sng-audit-icon {
    display: flex;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid #dbeafe;
    border-radius: 14px;
    background: linear-gradient(145deg, white, #e8efff);
    color: #2563eb;
    box-shadow:
      3px 3px 8px rgba(148,163,184,.12),
      -2px -2px 6px white;
  }

  .sng-audit .sng-audit-input {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 46px;
    margin-top: 8px;
    padding: 11px 13px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: #f8fafc;
    color: #334155;
    font-size: 13px;
    outline: none;
    box-shadow: inset 2px 2px 5px rgba(148,163,184,.06);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-audit .sng-audit-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-audit .sng-audit-input::placeholder {
    color: #94a3b8;
  }

  .sng-audit .sng-audit-search {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 11px 17px;
    border: 1px solid #2563eb;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .sng-audit .sng-audit-row {
    transition: background .2s ease;
  }

  .sng-audit button:focus-visible,
  .sng-audit a:focus-visible,
  .sng-audit summary:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-audit .sng-audit-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-audit .sng-audit-panel:hover {
      border-color: #bfdbfe;
    }

    .sng-audit .sng-audit-row:hover {
      background: #f8fafc;
    }

    .sng-audit .sng-audit-search:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -12px rgba(37,99,235,.5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-audit * {
      transition: none !important;
    }
  }
`;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    action?: string;
  }>;
}) {
  await requireUser([Role.ADMIN]);

  const [events, params] = await Promise.all([
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        actor: { select: { name: true, email: true } },
        article: { select: { title: true } },
      },
    }),
    searchParams,
  ]);

  const query = (params.q || "").trim();
  const queryLower = query.toLowerCase();

  const availableActions = Array.from(
    new Set(events.map((event) => event.action)),
  ).sort();

  const selectedAction =
    availableActions.find((action) => action === params.action) || "";

  const filtered = events.filter((event) => {
    const text = [
      event.action,
      actionLabel(event.action),
      event.actor?.name || "System",
      event.actor?.email || "",
      event.article?.title || "",
      event.details || "",
    ]
      .join(" ")
      .toLowerCase();

    return (
      text.includes(queryLower) &&
      (!selectedAction || event.action === selectedAction)
    );
  });

  const actorCount = new Set(
    events
      .map((event) => event.actor?.email)
      .filter((email): email is string => Boolean(email)),
  ).size;

  const stats = [
    {
      label: "Events loaded",
      value: events.length,
      icon: History,
    },
    {
      label: "Users in loaded events",
      value: actorCount,
      icon: Users,
    },
    {
      label: "Events without a linked actor",
      value: events.filter((event) => !event.actor).length,
      icon: Bot,
    },
  ];

  return (
    <main className="sng-audit mx-auto max-w-7xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Security & editorial accountability
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Activity log
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Review recorded newsroom actions, account activity and
            editorial changes.
          </p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          Read-only history
        </span>
      </header>

      <section
        aria-label="Loaded activity overview"
        className="grid gap-4 sm:grid-cols-3"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-audit-panel flex items-center gap-4 p-5"
          >
            <span className="sng-audit-icon">
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stat.value.toLocaleString("en-LK")}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {stat.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section
        aria-label="Filter activity"
        className="sng-audit-panel p-5"
      >
        <form
          action="/admin/audit"
          method="get"
          className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_230px_auto]"
        >
          <label className="block text-xs font-semibold text-slate-600">
            Search activity
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search user, article or event details…"
              className="sng-audit-input"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Action type
            <select
              name="action"
              defaultValue={selectedAction}
              className="sng-audit-input"
            >
              <option value="">All actions</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {actionLabel(action)}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="sng-audit-search">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] leading-5 text-slate-500">
            Search and summary counts cover the latest 200 events.
          </p>

          {(query || selectedAction) && (
            <Link
              href="/admin/audit"
              className="rounded-md text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear filters
            </Link>
          )}
        </div>
      </section>

      <section
        aria-labelledby="activity-table-heading"
        className="sng-audit-panel overflow-hidden"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2
              id="activity-table-heading"
              className="flex items-center gap-2 text-base font-bold text-slate-900"
            >
              <Activity
                className="h-4 w-4 text-blue-500"
                aria-hidden="true"
              />
              Recorded activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Newest first · All times in Sri Lanka
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {filtered.length.toLocaleString("en-LK")} results
          </span>
        </header>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="sng-audit-icon">
              <History className="h-5 w-5" aria-hidden="true" />
            </span>

            <h3 className="mt-5 text-lg font-semibold text-slate-800">
              {events.length === 0
                ? "No activity recorded yet"
                : "No matching events"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {events.length === 0
                ? "Recorded newsroom actions will appear here."
                : "Try another search term or action filter."}
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Activity history table"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-4">Time</th>
                  <th scope="col" className="px-4 py-4">Action</th>
                  <th scope="col" className="px-4 py-4">Actor</th>
                  <th scope="col" className="px-4 py-4">Article</th>
                  <th scope="col" className="px-4 py-4">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((event) => (
                  <tr
                    key={event.id}
                    className="sng-audit-row align-top"
                  >
                    <td className="whitespace-nowrap px-5 py-5 leading-6 text-slate-500">
                      {formatDate(event.createdAt)}
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${actionTone(event.action)}`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                        />
                        {actionLabel(event.action)}
                      </span>
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex items-start gap-2">
                        {event.actor ? (
                          <UserRound
                            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                        ) : (
                          <Bot
                            className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                            aria-hidden="true"
                          />
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold leading-6 text-slate-700">
                            {event.actor?.name || "System"}
                          </p>
                          {event.actor?.email && (
                            <p className="mt-1 break-all text-[10px] leading-5 text-slate-500">
                              {event.actor.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-5">
                      {event.article ? (
                        <div className="flex max-w-xs items-start gap-2">
                          <FileText
                            className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                          <p className="break-words leading-7 text-slate-600">
                            {event.article.title}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-5">
                      {event.details ? (
                        <details className="min-w-36 max-w-sm">
                          <summary className="cursor-pointer rounded-sm font-semibold leading-6 text-blue-700">
                            View details
                          </summary>
                          <p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-3 leading-6 text-slate-600">
                            {event.details}
                          </p>
                        </details>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}