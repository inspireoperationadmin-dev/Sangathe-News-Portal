import Link from "next/link";
import { ArticleStatus, Role } from "@prisma/client";
import {
  Archive,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  FolderOpen,
  History,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  deleteArticle,
  toggleBreakingStatus,
  updateArticleStatus,
} from "@/actions/article";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

const labels: Record<ArticleStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED_FOR_REVIEW: "Awaiting sub-edit",
  SUBMITTED_FOR_APPROVAL: "Awaiting final approval",
  EDITING: "Editing",
  RETURNED: "Returned",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  UPDATED: "Updated",
  CORRECTED: "Corrected",
  ARCHIVED: "Archived",
};

const tones: Record<ArticleStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  SUBMITTED_FOR_REVIEW: "border-amber-200 bg-amber-50 text-amber-800",
  SUBMITTED_FOR_APPROVAL: "border-orange-200 bg-orange-50 text-orange-800",
  EDITING: "border-blue-200 bg-blue-50 text-blue-700",
  RETURNED: "border-rose-200 bg-rose-50 text-rose-700",
  APPROVED: "border-violet-200 bg-violet-50 text-violet-700",
  SCHEDULED: "border-cyan-200 bg-cyan-50 text-cyan-800",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  UPDATED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CORRECTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-500",
};

function mayEdit(role: Role, status: ArticleStatus) {
  if (role === Role.REPORTER) {
    return status === ArticleStatus.DRAFT || status === ArticleStatus.RETURNED;
  }

  if (role === Role.SUB_EDITOR) {
    return (
      status === ArticleStatus.SUBMITTED_FOR_REVIEW ||
      status === ArticleStatus.EDITING
    );
  }

  return status !== ArticleStatus.ARCHIVED;
}

function formatDate(date: Date) {
  return date.toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = `
  .sng-articles {
    position: relative;
    isolation: isolate;
  }

  .sng-articles .sng-list-panel {
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 32px -26px rgba(15,23,42,.3);
  }

  .sng-articles .sng-queue-card {
    position: relative;
    display: block;
    overflow: hidden;
    padding: 22px;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background: linear-gradient(145deg, white, #f8fafc);
    box-shadow:
      inset 0 1px 0 white,
      0 7px 20px -18px rgba(15,23,42,.3);
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease;
  }

  .sng-articles .sng-queue-card.is-selected {
    border-color: #93c5fd;
    background: linear-gradient(145deg, white, #eff6ff);
  }

  .sng-articles .sng-queue-icon {
    display: flex;
    width: 42px;
    height: 42px;
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

  .sng-articles .sng-status-filter {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 8px 13px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    transition:
      color .2s ease,
      border-color .2s ease,
      background .2s ease;
  }

  .sng-articles .sng-status-filter.is-selected {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 5px 12px -8px rgba(37,99,235,.6);
  }

  .sng-articles .sng-story-card {
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: white;
    box-shadow: 0 4px 12px -12px rgba(15,23,42,.3);
    animation: sng-story-enter .3s ease both;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-articles .sng-row-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 42px;
    min-height: 42px;
    padding: 9px 12px;
    border: 1px solid #dbe3ee;
    border-radius: 11px;
    background: linear-gradient(145deg, white, #f8fafc);
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
    cursor: pointer;
    box-shadow: inset 0 1px 0 white;
    transition:
      transform .18s ease,
      background .18s ease,
      box-shadow .18s ease;
  }

  .sng-articles .sng-row-action.is-blue {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .sng-articles .sng-row-action.is-violet {
    border-color: #ddd6fe;
    background: #f5f3ff;
    color: #6d28d9;
  }

  .sng-articles .sng-row-action.is-green {
    border-color: #047857;
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
  }

  .sng-articles .sng-row-action.is-red {
    border-color: #fecdd3;
    background: #fff1f2;
    color: #be123c;
  }

  .sng-articles .sng-create-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 12px 18px;
    border: 1px solid #2563eb;
    border-radius: 13px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    font-size: 14px;
    font-weight: 600;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.2),
      0 8px 20px -12px rgba(37,99,235,.6);
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .sng-articles a:focus-visible,
  .sng-articles button:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-articles .sng-list-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-articles .sng-queue-card:hover {
      transform: translateY(-3px);
      border-color: #93c5fd;
      box-shadow: 0 14px 30px -22px rgba(37,99,235,.35);
    }

    .sng-articles .sng-status-filter:hover:not(.is-selected) {
      border-color: #bfdbfe;
      background: #eff6ff;
      color: #2563eb;
    }

    .sng-articles .sng-story-card:hover {
      border-color: #bfdbfe;
      box-shadow: 0 12px 28px -24px rgba(37,99,235,.4);
    }

    .sng-articles .sng-row-action:hover,
    .sng-articles .sng-create-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 7px 14px -10px rgba(15,23,42,.4);
    }
  }

  @keyframes sng-story-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-articles * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const selected = Object.values(ArticleStatus).includes(
    params.status as ArticleStatus,
  )
    ? (params.status as ArticleStatus)
    : undefined;

  const scope =
    user.role === Role.REPORTER ? { authorId: user.id } : {};

  const [articles, statusGroups] = await Promise.all([
    prisma.article.findMany({
      where: {
        ...scope,
        ...(selected ? { status: selected } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        author: { select: { name: true } },
        lastEditedBy: { select: { name: true } },
        _count: { select: { revisions: true } },
      },
    }),
    prisma.article.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
    }),
  ]);

  const statusCount = new Map(
    statusGroups.map((group) => [group.status, group._count._all]),
  );

  const total = statusGroups.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );

  const canPublish =
    user.role === Role.ADMIN || user.role === Role.EDITOR;

  const canSubEdit = user.role === Role.SUB_EDITOR;
  const canCreate = user.role !== Role.SUB_EDITOR;

  const queue =
    user.role === Role.REPORTER
      ? [
          [ArticleStatus.DRAFT, "Drafts", "Continue your unfinished stories"],
          [ArticleStatus.RETURNED, "Returned", "Review the requested changes"],
          [ArticleStatus.SUBMITTED_FOR_REVIEW, "In review", "Stories sent to the editorial desk"],
        ] as const
      : user.role === Role.SUB_EDITOR
        ? [
            [ArticleStatus.SUBMITTED_FOR_REVIEW, "Waiting for edit", "Stories ready for your review"],
            [ArticleStatus.EDITING, "Being edited", "Stories currently in editing"],
            [ArticleStatus.RETURNED, "Returned", "Stories sent back for changes"],
          ] as const
        : [
            [ArticleStatus.SUBMITTED_FOR_APPROVAL, "Awaiting decision", "Review stories for final approval"],
            [ArticleStatus.APPROVED, "Approved", "Stories ready for release"],
            [ArticleStatus.SCHEDULED, "Scheduled", "Stories queued for publication"],
          ] as const;

  return (
    <main className="sng-articles mx-auto max-w-7xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Editorial workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Articles
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {user.role === Role.REPORTER
              ? "Manage your drafts, revisions and submitted stories."
              : user.role === Role.SUB_EDITOR
                ? "Review incoming stories and prepare them for final approval."
                : "Review, approve and manage newsroom publishing."}
          </p>
        </div>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Newsroom queue"
        className="grid gap-4 sm:grid-cols-3"
      >
        {queue.map(([status, label, description]) => (
          <Link
            key={status}
            href={`/admin/articles?status=${status}`}
            aria-current={selected === status ? "page" : undefined}
            className={`sng-queue-card ${
              selected === status ? "is-selected" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="sng-queue-icon">
                {status === ArticleStatus.SCHEDULED ? (
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                ) : status === ArticleStatus.APPROVED ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : status === ArticleStatus.RETURNED ? (
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <FileText className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <ArrowUpRight
                className="h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
              {(statusCount.get(status) || 0).toLocaleString("en-LK")}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {label}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </Link>
        ))}
      </section>

      <section className="sng-list-panel p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Layers3 className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Workflow filters
          </h2>
          <span className="text-xs text-slate-500">
            {total.toLocaleString("en-LK")} total
          </span>
        </div>

        <nav
          aria-label="Filter by workflow status"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          <Link
            href="/admin/articles"
            aria-current={!selected ? "page" : undefined}
            className={`sng-status-filter ${!selected ? "is-selected" : ""}`}
          >
            All articles
            <span className="rounded-md bg-current/5 px-1.5 py-0.5 text-[10px]">
              {total.toLocaleString("en-LK")}
            </span>
          </Link>

          {Object.values(ArticleStatus).map((status) => (
            <Link
              key={status}
              href={`/admin/articles?status=${status}`}
              aria-current={selected === status ? "page" : undefined}
              className={`sng-status-filter ${
                selected === status ? "is-selected" : ""
              }`}
            >
              {labels[status]}
              <span className="rounded-md border border-current/15 px-1.5 py-0.5 text-[10px]">
                {(statusCount.get(status) || 0).toLocaleString("en-LK")}
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <section aria-labelledby="article-list-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2
            id="article-list-heading"
            className="text-sm font-semibold text-slate-800"
          >
            {selected ? labels[selected] : "All articles"}
            <span className="ml-2 rounded-full bg-slate-200/60 px-2 py-1 text-[10px] text-slate-600">
              {articles.length.toLocaleString("en-LK")}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Latest updated first · Times in Sri Lanka
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="sng-list-panel flex flex-col items-center px-5 py-14 text-center">
            <span className="sng-queue-icon mb-5">
              <FolderOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-semibold text-slate-800">
              No articles in this view
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {selected
                ? "Choose another workflow filter to see more stories."
                : "Your newsroom stories will appear here."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {selected && (
                <Link href="/admin/articles" className="sng-row-action">
                  View all articles
                </Link>
              )}
              {canCreate && (
                <Link href="/admin/articles/create" className="sng-create-button">
                  <Plus className="h-4 w-4" />
                  New article
                </Link>
              )}
            </div>
          </div>
        ) : (
          articles.map((article) => {
            const editable = mayEdit(user.role, article.status);
            const live = [
              ArticleStatus.PUBLISHED,
              ArticleStatus.UPDATED,
              ArticleStatus.CORRECTED,
            ].some((status) => status === article.status);

            return (
              <article key={article.id} className="sng-story-card">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${tones[article.status]}`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-current"
                      />
                      {labels[article.status]}
                    </span>

                    {article.isBreaking && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                        <Flame className="h-3 w-3" aria-hidden="true" />
                        Breaking
                      </span>
                    )}

                    {article.isDeveloping && (
                      <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                        Developing
                      </span>
                    )}

                    {article.isExclusive && (
                      <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                        Exclusive
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 break-words text-lg font-bold leading-8 text-slate-900">
                    {editable ? (
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="rounded-sm transition-colors hover:text-blue-700"
                      >
                        {article.title}
                      </Link>
                    ) : (
                      article.title
                    )}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs leading-5 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {article.category.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {article.author.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {article._count.revisions}{" "}
                      {article._count.revisions === 1 ? "revision" : "revisions"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Updated {formatDate(article.updatedAt)}
                    </span>
                  </div>

                  {article.lastEditedBy && (
                    <p className="mt-2 text-xs text-slate-500">
                      Last edited by {article.lastEditedBy.name}
                    </p>
                  )}

                  {article.scheduledAt && (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-800">
                      <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Scheduled time: {formatDate(article.scheduledAt)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                  {canSubEdit &&
                    article.status === ArticleStatus.SUBMITTED_FOR_REVIEW && (
                      <form action={async () => {
                        "use server";
                        await updateArticleStatus(article.id, ArticleStatus.EDITING);
                      }}>
                        <button type="submit" className="sng-row-action is-blue">
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Start editing
                        </button>
                      </form>
                    )}

                  {canPublish &&
                    (
                      article.status === ArticleStatus.SUBMITTED_FOR_APPROVAL ||
                      article.status === ArticleStatus.SUBMITTED_FOR_REVIEW ||
                      article.status === ArticleStatus.EDITING
                    ) && (
                      <form action={async () => {
                        "use server";
                        await updateArticleStatus(article.id, ArticleStatus.APPROVED);
                      }}>
                        <button type="submit" className="sng-row-action is-violet">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Approve
                        </button>
                      </form>
                    )}

                  {canPublish &&
                    (
                      article.status === ArticleStatus.APPROVED ||
                      article.status === ArticleStatus.SCHEDULED
                    ) && (
                      <form action={async () => {
                        "use server";
                        await updateArticleStatus(article.id, ArticleStatus.PUBLISHED);
                      }}>
                        <button type="submit" className="sng-row-action is-green">
                          <Send className="h-4 w-4" aria-hidden="true" />
                          Publish
                        </button>
                      </form>
                    )}

                  {canPublish && (
                    <form action={async () => {
                      "use server";
                      await toggleBreakingStatus(article.id, article.isBreaking);
                    }}>
                      <button
                        type="submit"
                        aria-label={`${article.isBreaking ? "Remove breaking status from" : "Mark as breaking:"} ${article.title}`}
                        title={article.isBreaking ? "Remove breaking status" : "Mark as breaking"}
                        className={`sng-row-action ${article.isBreaking ? "is-red" : ""}`}
                      >
                        <Flame className="h-4 w-4" aria-hidden="true" />
                        <span>{article.isBreaking ? "Unmark breaking" : "Breaking"}</span>
                      </button>
                    </form>
                  )}

                  {editable && (
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      aria-label={`Edit ${article.title}`}
                      className="sng-row-action is-blue"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                  )}

                  {canPublish && live && (
                    <form action={async () => {
                      "use server";
                      await updateArticleStatus(article.id, ArticleStatus.ARCHIVED);
                    }}>
                      <button
                        type="submit"
                        aria-label={`Archive ${article.title}`}
                        title="Archive article"
                        className="sng-row-action"
                      >
                        <Archive className="h-4 w-4" aria-hidden="true" />
                        Archive
                      </button>
                    </form>
                  )}

                  {canPublish && article.status === ArticleStatus.ARCHIVED && (
                    <form action={async () => {
                      "use server";
                      await updateArticleStatus(article.id, ArticleStatus.APPROVED);
                    }}>
                      <button
                        type="submit"
                        aria-label={`Restore ${article.title} to approved`}
                        title="Restore to approved"
                        className="sng-row-action is-blue"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Restore
                      </button>
                    </form>
                  )}

                  {(
                    user.role === Role.ADMIN ||
                    (
                      user.role === Role.REPORTER &&
                      article.status === ArticleStatus.DRAFT
                    )
                  ) && (
                    <form action={async () => {
                      "use server";
                      await deleteArticle(article.id);
                    }}>
                      <ConfirmSubmitButton
                        ariaLabel={`Delete ${article.title}`}
                        title="Delete article"
                        dialogTitle="Delete this article?"
                        description={`“${article.title}” and its revision history will be permanently removed. This action cannot be undone.`}
                        confirmLabel="Delete article"
                        className="sng-row-action is-red"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}