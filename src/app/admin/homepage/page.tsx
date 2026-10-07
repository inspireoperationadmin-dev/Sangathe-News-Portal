import { ArticleStatus, Locale, Role } from "@prisma/client";
import { LayoutDashboard, Save } from "lucide-react";
import { saveHomepage } from "@/actions/homepage";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";
const LIVE = [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED];

export default async function HomepageManager({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireUser([Role.ADMIN, Role.EDITOR]);
  const params = await searchParams;
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({ where: { locale: Locale.ta, status: { in: LIVE } }, orderBy: { publishedAt: "desc" }, take: 150, select: { id: true, title: true, status: true, publishedAt: true, isHomepageLead: true, homepageOrder: true } }),
    prisma.category.findMany({ where: { locale: Locale.ta }, orderBy: [{ homepageOrder: "asc" }, { order: "asc" }], select: { id: true, name: true, parentId: true, showOnHomepage: true, homepageOrder: true } }),
  ]);
  const lead = articles.find(article => article.isHomepageLead)?.id || "";
  const featured = articles.filter(article => article.homepageOrder !== null).sort((a, b) => (a.homepageOrder || 0) - (b.homepageOrder || 0));
  const selectClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
  const storyOptions = articles.map(article => <option key={article.id} value={article.id}>{article.title} · {article.status}</option>);

  return <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 md:px-6">
    <header><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Editorial curation</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-black"><LayoutDashboard className="h-8 w-8 text-blue-700"/>Homepage management</h1><p className="mt-2 text-slate-600">Choose the lead story, order featured stories and control the category sections shown to readers.</p></header>
    <AdminToast key={params.error || params.success || "none"} success={params.success} error={params.error}/>
    <form action={saveHomepage} className="space-y-7">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><h2 className="text-lg font-black">Lead story</h2><p className="mt-1 text-sm text-slate-500">Leave automatic enabled by selecting no story; the newest published article will be used.</p><label className="mt-4 block text-sm font-bold">Homepage lead<select name="leadArticleId" defaultValue={lead} className={selectClass}><option value="">Automatic — newest published article</option>{storyOptions}</select></label></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><h2 className="text-lg font-black">Featured story order</h2><p className="mt-1 text-sm text-slate-500">These six positions fill the main news grid. Empty positions fall back to the latest stories.</p><div className="mt-5 grid gap-5 md:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <label key={index} className="text-sm font-bold">Position {index + 1}<select name={`featured-${index + 1}`} defaultValue={featured[index]?.id || ""} className={selectClass}><option value="">Automatic fallback</option>{storyOptions}</select></label>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><h2 className="text-lg font-black">Homepage category sections</h2><p className="mt-1 text-sm text-slate-500">Select the sections that should appear below the main news area and assign their order.</p><div className="mt-5 divide-y divide-slate-200">{categories.map((category, index) => <div key={category.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_10rem] sm:items-center"><label className="flex min-h-11 cursor-pointer items-center gap-3 font-bold"><input type="checkbox" name={`category-visible-${category.id}`} defaultChecked={category.showOnHomepage} className="h-5 w-5 rounded"/><span>{category.parentId ? "↳ " : ""}{category.name}</span></label><label className="text-sm font-bold">Display order<input type="number" min="1" max="99" name={`category-order-${category.id}`} defaultValue={category.homepageOrder || index + 1} className={selectClass}/></label></div>)}</div></section>
      <div className="sticky bottom-3 z-20 flex justify-end rounded-2xl border border-slate-300 bg-white/95 p-4 shadow-xl backdrop-blur"><button className="flex min-h-12 items-center gap-2 rounded-lg bg-blue-700 px-6 font-bold text-white hover:bg-blue-800"><Save className="h-4 w-4"/>Publish homepage layout</button></div>
    </form>
  </main>;
}
