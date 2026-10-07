import Link from "next/link";
import { ArticleStatus, Role } from "@prisma/client";
import { Archive, CheckCircle2, Clock3, Flame, Pencil, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { deleteArticle, toggleBreakingStatus, updateArticleStatus } from "@/actions/article";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";
const labels: Record<ArticleStatus, string> = {
  DRAFT: "Draft", SUBMITTED_FOR_REVIEW: "Awaiting sub-edit", SUBMITTED_FOR_APPROVAL: "Awaiting final approval", EDITING: "Editing", RETURNED: "Returned",
  APPROVED: "Approved", SCHEDULED: "Scheduled", PUBLISHED: "Published", UPDATED: "Updated",
  CORRECTED: "Corrected", ARCHIVED: "Archived",
};
const tones: Partial<Record<ArticleStatus, string>> = {
  PUBLISHED: "bg-emerald-100 text-emerald-800", UPDATED: "bg-emerald-100 text-emerald-800", CORRECTED: "bg-emerald-100 text-emerald-800",
  SUBMITTED_FOR_REVIEW: "bg-amber-100 text-amber-900", EDITING: "bg-blue-100 text-blue-800", RETURNED: "bg-red-100 text-red-800",
  SUBMITTED_FOR_APPROVAL: "bg-orange-100 text-orange-900",
  APPROVED: "bg-violet-100 text-violet-800", SCHEDULED: "bg-cyan-100 text-cyan-900",
};
function mayEdit(role: Role, status: ArticleStatus) {
  if (role === Role.REPORTER) return status === ArticleStatus.DRAFT || status === ArticleStatus.RETURNED;
  if (role === Role.SUB_EDITOR) return status === ArticleStatus.SUBMITTED_FOR_REVIEW || status === ArticleStatus.EDITING;
  return status !== ArticleStatus.ARCHIVED;
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ status?: string; success?: string; error?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const selected = Object.values(ArticleStatus).includes(params.status as ArticleStatus) ? params.status as ArticleStatus : undefined;
  const scope = user.role === Role.REPORTER ? { authorId: user.id } : {};
  const [articles, statusGroups] = await Promise.all([
    prisma.article.findMany({
      where: { ...(selected ? { status: selected } : {}), ...scope },
      orderBy: { updatedAt: "desc" },
      include: { category: true, author: { select: { name: true } }, lastEditedBy: { select: { name: true } }, _count: { select: { revisions: true } } },
    }),
    prisma.article.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);
  const statusCount = new Map(statusGroups.map(group => [group.status, group._count._all]));
  const canPublish = user.role === Role.ADMIN || user.role === Role.EDITOR;
  const canSubEdit = user.role === Role.SUB_EDITOR;
  const queue = user.role === Role.REPORTER
    ? [[ArticleStatus.DRAFT, "Drafts"], [ArticleStatus.RETURNED, "Returned"], [ArticleStatus.SUBMITTED_FOR_REVIEW, "In review"]] as const
    : user.role === Role.SUB_EDITOR
      ? [[ArticleStatus.SUBMITTED_FOR_REVIEW, "Waiting for edit"], [ArticleStatus.EDITING, "Being edited"], [ArticleStatus.RETURNED, "Returned"]] as const
      : [[ArticleStatus.SUBMITTED_FOR_APPROVAL, "Awaiting decision"], [ArticleStatus.APPROVED, "Approved"], [ArticleStatus.SCHEDULED, "Scheduled"]] as const;
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Professional newsroom workflow</p><h1 className="mt-1 text-3xl font-black">Articles</h1><p className="mt-2 text-slate-600">{user.role === Role.REPORTER ? "Your drafts and submitted stories" : "Review, approve, schedule and publish newsroom content"}</p></div>{user.role!==Role.SUB_EDITOR&&<Link href="/admin/articles/create" className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 font-bold text-white hover:bg-blue-800"><Plus className="h-4 w-4"/>New article</Link>}</div>
    <AdminToast key={params.error || params.success || "none"} success={params.success} error={params.error}/>
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Newsroom queue">{queue.map(([status,label])=><Link key={status} href={`/admin/articles?status=${status}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"><p className="text-2xl font-black">{statusCount.get(status) || 0}</p><p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p></Link>)}</section>
    <nav aria-label="Filter by workflow status" className="flex gap-2 overflow-x-auto pb-2 text-sm font-bold"><Link href="/admin/articles" className={`whitespace-nowrap rounded-full px-4 py-2 ${!selected ? "bg-slate-950 text-white" : "border bg-white"}`}>All</Link>{Object.values(ArticleStatus).map(status=><Link key={status} href={`/admin/articles?status=${status}`} className={`whitespace-nowrap rounded-full px-4 py-2 ${selected===status ? "bg-slate-950 text-white" : "border bg-white"}`}>{labels[status]}</Link>)}</nav>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Article list">
      {articles.length === 0 ? <p className="p-10 text-center text-slate-500">No articles match this view.</p> : <div className="divide-y divide-slate-200">{articles.map(article=><article key={article.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[article.status] || "bg-slate-100 text-slate-700"}`}>{labels[article.status]}</span>{article.isBreaking && <span className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white"><Flame className="h-3 w-3"/>Breaking</span>}{article.isDeveloping&&<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">Developing</span>}{article.isExclusive&&<span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-900">Exclusive</span>}</div><h2 className="mt-2 truncate text-lg font-black">{article.title}</h2><p className="mt-1 text-sm text-slate-600">{article.category.name} · {article.author.name} · {article._count.revisions} revision{article._count.revisions===1?"":"s"} · Updated {article.updatedAt.toLocaleString("en-LK")}</p>{article.scheduledAt && <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-cyan-800"><Clock3 className="h-4 w-4"/>Scheduled {article.scheduledAt.toLocaleString("en-LK")}</p>}</div>
        <div className="flex flex-wrap items-center gap-2">
          {canSubEdit && article.status===ArticleStatus.SUBMITTED_FOR_REVIEW && <form action={async()=>{"use server";await updateArticleStatus(article.id, ArticleStatus.EDITING)}}><button className="min-h-11 cursor-pointer rounded-lg border border-blue-300 px-3 text-sm font-bold text-blue-800">Start editing</button></form>}
          {canPublish && (article.status === ArticleStatus.SUBMITTED_FOR_APPROVAL || article.status === ArticleStatus.SUBMITTED_FOR_REVIEW || article.status === ArticleStatus.EDITING) && <form action={async()=>{"use server";await updateArticleStatus(article.id, ArticleStatus.APPROVED)}}><button className="flex min-h-11 cursor-pointer items-center gap-1 rounded-lg border border-violet-300 px-3 text-sm font-bold text-violet-800"><CheckCircle2 className="h-4 w-4"/>Approve</button></form>}
          {canPublish && (article.status===ArticleStatus.APPROVED||article.status===ArticleStatus.SCHEDULED) && <form action={async()=>{"use server";await updateArticleStatus(article.id, ArticleStatus.PUBLISHED)}}><button className="flex min-h-11 cursor-pointer items-center gap-1 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white"><Send className="h-4 w-4"/>Publish</button></form>}
          {canPublish && <form action={async()=>{"use server";await toggleBreakingStatus(article.id,article.isBreaking)}}><button aria-label={article.isBreaking?"Remove breaking status":"Mark as breaking"} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-300"><Flame className={`h-4 w-4 ${article.isBreaking?"text-red-600":"text-slate-400"}`}/></button></form>}
          {mayEdit(user.role, article.status)&&<Link href={`/admin/articles/${article.id}/edit`} aria-label={`Edit ${article.title}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300"><Pencil className="h-4 w-4"/></Link>}
          {canPublish&&(article.status===ArticleStatus.PUBLISHED||article.status===ArticleStatus.UPDATED||article.status===ArticleStatus.CORRECTED)&&<form action={async()=>{"use server";await updateArticleStatus(article.id,ArticleStatus.ARCHIVED)}}><button aria-label={`Archive ${article.title}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"><Archive className="h-4 w-4"/></button></form>}
          {canPublish&&article.status===ArticleStatus.ARCHIVED&&<form action={async()=>{"use server";await updateArticleStatus(article.id,ArticleStatus.APPROVED)}}><button aria-label={`Restore ${article.title} to approved`} title="Restore to approved" className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-emerald-300 px-3 text-sm font-bold text-emerald-800"><RotateCcw className="h-4 w-4"/>Restore</button></form>}
          {(user.role===Role.ADMIN || (user.role===Role.REPORTER && article.status===ArticleStatus.DRAFT)) && <form action={async()=>{"use server";await deleteArticle(article.id)}}><ConfirmSubmitButton ariaLabel={`Delete ${article.title}`} title="Delete article" dialogTitle="Delete this article?" description={`“${article.title}” and its revision history will be permanently removed. This action cannot be undone.`} confirmLabel="Delete article" className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"><Trash2 className="h-4 w-4"/></ConfirmSubmitButton></form>}
        </div>
      </article>)}</div>}
    </section>
  </main>;
}
