import Link from "next/link";
import { ArticleStatus, Role } from "@prisma/client";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Flame,
  History,
  Play,
  RotateCcw,
  UserRound,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  formatColomboDateTime,
  toColomboDateTimeInput,
} from "@/lib/datetime";
import {
  cancelScheduledArticle,
  publishScheduledArticleNow,
  rescheduleArticle,
  runScheduledPublisherNow,
} from "@/actions/schedule";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

function relativeSchedule(date: Date, now: Date) {
  const difference = date.getTime() - now.getTime();

  if (difference < 0) {
    const minutes = Math.max(1, Math.ceil(-difference / 60_000));

    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} overdue`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 48) {
      return `${hours} hour${hours === 1 ? "" : "s"} overdue`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} overdue`;
  }

  if (difference < 60_000) return "Due in less than a minute";

  const minutes = Math.ceil(difference / 60_000);

  if (minutes < 60) {
    return `In ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 48) {
    return `In ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.floor(hours / 24);
  return `In ${days} day${days === 1 ? "" : "s"}`;
}

const styles = `
  .sng-schedule {
    position: relative;
    isolation: isolate;
  }

  .sng-schedule .sng-schedule-panel {
    min-width: 0;
    overflow: hidden;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-schedule .sng-schedule-icon {
    display: flex;
    width: 42px;
    height: 42px;
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

  .sng-schedule .sng-schedule-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 10px 14px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: linear-gradient(145deg, white, #f8fafc);
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
    cursor: pointer;
    box-shadow: inset 0 1px 0 white;
    transition:
      transform .18s ease,
      border-color .18s ease,
      box-shadow .18s ease;
  }

  .sng-schedule .sng-schedule-button.is-primary {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
  }

  .sng-schedule .sng-schedule-button.is-green {
    border-color: #047857;
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
  }

  .sng-schedule .sng-schedule-button.is-red {
    border-color: #fecdd3;
    background: #fff1f2;
    color: #be123c;
  }

  .sng-schedule .sng-schedule-input {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: white;
    padding: 12px;
    color: #334155;
    font-size: 13px;
    outline: none;
    box-shadow: inset 2px 2px 5px rgba(148,163,184,.06);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-schedule .sng-schedule-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-schedule .sng-queue-item {
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: white;
    animation: sng-schedule-enter .3s ease both;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-schedule .sng-queue-item.is-overdue {
    border-color: #fecdd3;
  }

  .sng-schedule .sng-run-row {
    transition: background .2s ease;
  }

  .sng-schedule a:focus-visible,
  .sng-schedule button:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-schedule .sng-schedule-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-schedule .sng-schedule-panel:hover,
    .sng-schedule .sng-queue-item:hover {
      border-color: #bfdbfe;
      box-shadow: 0 12px 28px -24px rgba(37,99,235,.3);
    }

    .sng-schedule .sng-queue-item.is-overdue:hover {
      border-color: #fda4af;
    }

    .sng-schedule .sng-schedule-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -12px rgba(15,23,42,.4);
    }

    .sng-schedule .sng-run-row:hover {
      background: #f8fafc;
    }
  }

  @keyframes sng-schedule-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-schedule * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  await requireUser([Role.ADMIN, Role.EDITOR]);

  const params = await searchParams;
  const now = new Date();

  const [articles, runs] = await Promise.all([
    prisma.article.findMany({
      where: { status: ArticleStatus.SCHEDULED },
      orderBy: { scheduledAt: "asc" },
      include: {
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.schedulerRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
  ]);

  const dueSoon = articles.filter((article) => {
    if (!article.scheduledAt) return false;

    const time = article.scheduledAt.getTime();

    return (
      time >= now.getTime() &&
      time <= now.getTime() + 24 * 60 * 60 * 1000
    );
  }).length;

  const overdue = articles.filter(
    (article) => article.scheduledAt && article.scheduledAt < now,
  ).length;

  const lastSuccess = runs.find((run) => run.status === "SUCCEEDED");

  const recentSuccess = Boolean(
    lastSuccess &&
      now.getTime() - lastSuccess.startedAt.getTime() < 5 * 60_000,
  );

  const stats = [
    {
      label: "Scheduled articles",
      value: articles.length,
      icon: CalendarClock,
      tone: "text-slate-900",
    },
    {
      label: "Upcoming · Next 24 hours",
      value: dueSoon,
      icon: Clock3,
      tone: "text-blue-700",
    },
    {
      label: "Overdue articles",
      value: overdue,
      icon: CircleAlert,
      tone: overdue ? "text-rose-700" : "text-emerald-700",
    },
  ];

  return (
    <main className="sng-schedule mx-auto max-w-7xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Publishing operations
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Schedule desk
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage scheduled stories and review publisher activity.
            All times use Asia/Colombo.
          </p>
        </div>

        <form action={runScheduledPublisherNow}>
          <button
            type="submit"
            className="sng-schedule-button is-primary"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Run publisher now
          </button>
        </form>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Schedule summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-schedule-panel p-5"
          >
            <span className="sng-schedule-icon">
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className={`mt-4 text-3xl font-bold ${stat.tone}`}>
              {stat.value.toLocaleString("en-LK")}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {stat.label}
            </p>
          </article>
        ))}

        <article className="sng-schedule-panel p-5">
          <span className="sng-schedule-icon">
            {recentSuccess ? (
              <CheckCircle2
                className="h-5 w-5 text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <CircleAlert
                className="h-5 w-5 text-amber-600"
                aria-hidden="true"
              />
            )}
          </span>

          <p className="mt-4 text-sm font-bold text-slate-900">
            {recentSuccess ? "Recent successful run" : "Check publisher activity"}
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            {lastSuccess
              ? `Last recorded success: ${formatColomboDateTime(lastSuccess.startedAt)}`
              : "No success in the latest 20 recorded runs."}
          </p>
          <p className="mt-2 text-[10px] leading-5 text-slate-400">
            Recent means within five minutes. This is run history,
            not a live worker connection check.
          </p>
        </article>
      </section>

      <section aria-labelledby="publication-queue-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="publication-queue-heading"
              className="text-lg font-bold text-slate-900"
            >
              Publication queue
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Reschedule, publish immediately or return a story to approved.
            </p>
          </div>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {articles.length} scheduled
          </span>
        </div>

        {articles.length === 0 ? (
          <div className="sng-schedule-panel flex flex-col items-center px-5 py-12 text-center">
            <span className="sng-schedule-icon">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-slate-800">
              Your schedule is clear
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Scheduled articles will appear here.
            </p>
            <Link
              href="/admin/articles?status=APPROVED"
              className="sng-schedule-button mt-6"
            >
              View approved articles
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => {
              const isOverdue = Boolean(
                article.scheduledAt && article.scheduledAt < now,
              );

              return (
                <article
                  key={article.id}
                  className={`sng-queue-item ${isOverdue ? "is-overdue" : ""}`}
                >
                  <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                            !article.scheduledAt
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : isOverdue
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                        >
                          {!article.scheduledAt
                            ? "Time missing"
                            : isOverdue
                              ? "Overdue"
                              : "Scheduled"}
                        </span>

                        {article.isBreaking && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                            <Flame className="h-3 w-3" aria-hidden="true" />
                            Breaking
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 break-words text-lg font-bold leading-8 text-slate-900">
                        {article.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                          {article.category.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                          {article.author.name}
                        </span>
                      </div>

                      <div
                        className={`mt-5 rounded-xl border p-3 ${
                          isOverdue
                            ? "border-rose-100 bg-rose-50/70"
                            : "border-blue-100 bg-blue-50/50"
                        }`}
                      >
                        <p className="flex items-start gap-2 text-xs font-semibold leading-6 text-slate-700">
                          <Clock3
                            className="mt-1 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {article.scheduledAt
                            ? formatColomboDateTime(article.scheduledAt)
                            : "Missing publication time"}
                        </p>
                        {article.scheduledAt && (
                          <p
                            className={`mt-1 pl-6 text-xs ${
                              isOverdue ? "text-rose-700" : "text-blue-700"
                            }`}
                          >
                            {relativeSchedule(article.scheduledAt, now)}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-xs font-semibold text-blue-700 hover:text-blue-900"
                      >
                        Open article
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <form action={rescheduleArticle.bind(null, article.id)}>
                        <label
                          htmlFor={`schedule-${article.id}`}
                          className="block text-xs font-semibold text-slate-600"
                        >
                          New publication time · Sri Lanka
                        </label>
                        <input
                          id={`schedule-${article.id}`}
                          type="datetime-local"
                          name="scheduledAt"
                          required
                          defaultValue={toColomboDateTimeInput(article.scheduledAt)}
                          className="sng-schedule-input mt-2"
                        />
                        <button
                          type="submit"
                          className="sng-schedule-button mt-3 w-full"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          Reschedule
                        </button>
                      </form>

                      <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2 xl:grid-cols-1">
                        <form action={publishScheduledArticleNow.bind(null, article.id)}>
                          <button
                            type="submit"
                            className="sng-schedule-button is-green w-full"
                          >
                            <Play className="h-4 w-4" aria-hidden="true" />
                            Publish now
                          </button>
                        </form>

                        <form action={cancelScheduledArticle.bind(null, article.id)}>
                          <button
                            type="submit"
                            className="sng-schedule-button is-red w-full"
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            Cancel schedule
                          </button>
                        </form>
                      </div>
                      <p className="mt-3 text-[11px] leading-5 text-slate-500">
                        Cancelling returns the story to approved status.
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        aria-labelledby="publisher-history-heading"
        className="sng-schedule-panel"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
          <span className="sng-schedule-icon">
            <History className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="publisher-history-heading"
              className="text-base font-bold text-slate-900"
            >
              Publisher run history
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Latest 20 automatic and manual execution attempts.
            </p>
          </div>
        </header>

        {runs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No runs recorded
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Run publisher now to record a manual execution.
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Publisher execution history"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-4">Started</th>
                  <th scope="col" className="px-4 py-4">Trigger</th>
                  <th scope="col" className="px-4 py-4">Status</th>
                  <th scope="col" className="px-4 py-4">Published</th>
                  <th scope="col" className="px-4 py-4">Breaking expired</th>
                  <th scope="col" className="px-4 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((run) => (
                  <tr key={run.id} className="sng-run-row">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatColomboDateTime(run.startedAt)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {run.trigger}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${
                          run.status === "SUCCEEDED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : run.status === "FAILED"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {run.publishedCount}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {run.expiredBreakingCount}
                    </td>
                    <td className="px-4 py-4">
                      {run.error ? (
                        <details className="min-w-40 max-w-sm">
                          <summary className="cursor-pointer font-semibold text-rose-700">
                            View error
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-rose-50 p-3 leading-6 text-rose-700">
                            {run.error}
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

      <p className="px-1 text-[11px] leading-5 text-slate-500">
        Counts and relative times reflect when this page was loaded.
        Refresh to see the latest activity.
      </p>
    </main>
  );
}