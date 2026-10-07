import Link from "next/link";
import { ArticleStatus, Role } from "@prisma/client";
import { CalendarClock, CheckCircle2, CircleAlert, Clock3, ExternalLink, Play, RotateCcw, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatColomboDateTime, toColomboDateTimeInput } from "@/lib/datetime";
import { cancelScheduledArticle, publishScheduledArticleNow, rescheduleArticle, runScheduledPublisherNow } from "@/actions/schedule";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

function relativeSchedule(date: Date, now: Date) {
  const minutes = Math.round((date.getTime() - now.getTime()) / 60_000);
  if (minutes < 0) return `${Math.abs(minutes)} minute${Math.abs(minutes) === 1 ? "" : "s"} overdue`;
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} days`;
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireUser([Role.ADMIN, Role.EDITOR]);
  const params = await searchParams;
  const now = new Date();
  const [articles, runs] = await Promise.all([
    prisma.article.findMany({
      where: { status: ArticleStatus.SCHEDULED },
      orderBy: { scheduledAt: "asc" },
      include: { category: { select: { name: true } }, author: { select: { name: true } } },
    }),
    prisma.schedulerRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
  ]);
  const dueSoon = articles.filter((article) => article.scheduledAt && article.scheduledAt.getTime() <= now.getTime() + 24 * 60 * 60 * 1000).length;
  const overdue = articles.filter((article) => article.scheduledAt && article.scheduledAt < now).length;
  const lastSuccess = runs.find((run) => run.status === "SUCCEEDED");
  const healthy = Boolean(lastSuccess && now.getTime() - lastSuccess.startedAt.getTime() < 5 * 60_000);

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Publishing operations</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-black"><CalendarClock className="h-8 w-8"/>Schedule desk</h1><p className="mt-2 text-slate-600">All publication times are shown in Sri Lanka time (Asia/Colombo).</p></div>
      <form action={runScheduledPublisherNow}><button className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 font-bold text-white hover:bg-slate-800"><Play className="h-4 w-4"/>Run publisher now</button></form>
    </div>
    <AdminToast key={params.error || params.success || "none"} success={params.success} error={params.error}/>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Schedule summary">
      <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-3xl font-black">{articles.length}</p><p className="mt-1 text-sm font-bold text-slate-500">Scheduled articles</p></div>
      <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-3xl font-black text-cyan-700">{dueSoon}</p><p className="mt-1 text-sm font-bold text-slate-500">Due within 24 hours</p></div>
      <div className="rounded-xl border bg-white p-4 shadow-sm"><p className={`text-3xl font-black ${overdue ? "text-red-700" : "text-emerald-700"}`}>{overdue}</p><p className="mt-1 text-sm font-bold text-slate-500">Overdue</p></div>
      <div className={`rounded-xl border p-4 shadow-sm ${healthy ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><p className="flex items-center gap-2 font-black">{healthy ? <CheckCircle2 className="h-5 w-5 text-emerald-700"/> : <CircleAlert className="h-5 w-5 text-amber-700"/>}{healthy ? "Publisher healthy" : "Publisher needs attention"}</p><p className="mt-2 text-xs text-slate-600">{lastSuccess ? `Last success ${formatColomboDateTime(lastSuccess.startedAt)}` : "No successful run recorded yet."}</p></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-black">Publication queue</h2><p className="mt-1 text-sm text-slate-500">Reschedule, publish immediately, or return an item to approved status.</p></div>
      {articles.length === 0 ? <div className="p-12 text-center"><Clock3 className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-3 font-bold">No articles are scheduled.</p><Link href="/admin/articles?status=APPROVED" className="mt-2 inline-block text-sm font-bold text-blue-700">View approved articles</Link></div> : <div className="divide-y divide-slate-200">{articles.map((article) => <article key={article.id} className="grid gap-5 p-5 xl:grid-cols-[1fr_430px] xl:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{article.category.name}</span><span>·</span><span>{article.author.name}</span>{article.isBreaking && <span className="rounded-full bg-red-600 px-2 py-1 text-white">Breaking</span>}</div><h3 className="mt-2 text-xl font-black">{article.title}</h3><p className={`mt-2 flex items-center gap-2 text-sm font-bold ${article.scheduledAt && article.scheduledAt < now ? "text-red-700" : "text-cyan-800"}`}><Clock3 className="h-4 w-4"/>{article.scheduledAt ? `${formatColomboDateTime(article.scheduledAt)} · ${relativeSchedule(article.scheduledAt, now)}` : "Missing publication time"}</p><Link href={`/admin/articles/${article.id}/edit`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-700">Open article <ExternalLink className="h-3.5 w-3.5"/></Link></div>
        <div className="space-y-3"><form action={rescheduleArticle.bind(null, article.id)} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor={`schedule-${article.id}`}>New publication time for {article.title}</label><input id={`schedule-${article.id}`} type="datetime-local" name="scheduledAt" required defaultValue={toColomboDateTimeInput(article.scheduledAt)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3"/><button className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-cyan-300 px-3 text-sm font-bold text-cyan-900"><RotateCcw className="h-4 w-4"/>Reschedule</button></form><div className="grid grid-cols-2 gap-2"><form action={publishScheduledArticleNow.bind(null, article.id)}><button className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white"><Play className="h-4 w-4"/>Publish now</button></form><form action={cancelScheduledArticle.bind(null, article.id)}><button className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700"><XCircle className="h-4 w-4"/>Cancel schedule</button></form></div></div>
      </article>)}</div>}
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-xl font-black">Publisher run history</h2><p className="mt-1 text-sm text-slate-500">The latest 20 automatic and manual execution attempts.</p></div>{runs.length === 0 ? <p className="p-8 text-center text-slate-500">No runs recorded. Use “Run publisher now” to verify the worker.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Started</th><th className="p-3">Trigger</th><th className="p-3">Status</th><th className="p-3">Published</th><th className="p-3">Breaking expired</th><th className="p-3">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{runs.map((run) => <tr key={run.id}><td className="whitespace-nowrap p-3">{formatColomboDateTime(run.startedAt)}</td><td className="p-3 font-bold">{run.trigger}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${run.status === "SUCCEEDED" ? "bg-emerald-100 text-emerald-800" : run.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{run.status}</span></td><td className="p-3">{run.publishedCount}</td><td className="p-3">{run.expiredBreakingCount}</td><td className="max-w-md truncate p-3 text-red-700" title={run.error || undefined}>{run.error || "—"}</td></tr>)}</tbody></table></div>}</section>
  </main>;
}
