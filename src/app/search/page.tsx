import Link from "next/link";
import { Locale } from "@prisma/client";
import { ArrowLeft, ArrowRight, Newspaper, Search } from "lucide-react";
import Image from "next/image";
import { searchArticles } from "@/queries/article";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Advanced news search", robots: { index: false, follow: true } };

type Params = { q?: string; category?: string; tag?: string; location?: string; person?: string; from?: string; to?: string; page?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const [{ articles, total, pages }, categories, tags] = await Promise.all([
    searchArticles({ query: params.q, category: params.category, tag: params.tag, location: params.location, person: params.person, from: params.from, to: params.to, page }, Locale.ta),
    prisma.category.findMany({ where: { locale: Locale.ta }, orderBy: { order: "asc" }, select: { slug: true, name: true } }),
    prisma.tag.findMany({ where: { locale: Locale.ta }, orderBy: { name: "asc" }, take: 100, select: { slug: true, name: true } }),
  ]);
  const field = "min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100";
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value && value !== "1") as [string, string][]);

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 shadow-sm"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4"/>முகப்பு</Link><Link href="/" className="flex items-center gap-2 text-xl font-black"><Newspaper className="h-6 w-6 text-red-600"/>சங்கதி</Link></div></header>
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-7"><h1 className="flex items-center gap-2 text-3xl font-black"><Search className="h-7 w-7 text-red-600"/>Advanced search</h1><p className="mt-2 text-sm text-slate-500">Search the Tamil archive by keyword, category, tag, person, location and date.</p></div>
      <form action="/search" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <input name="q" defaultValue={params.q} placeholder="Keyword or headline" className={field}/>
        <select name="category" defaultValue={params.category || ""} className={field}><option value="">All categories</option>{categories.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <select name="tag" defaultValue={params.tag || ""} className={field}><option value="">All tags</option>{tags.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <input name="location" defaultValue={params.location} placeholder="Location" className={field}/>
        <input name="person" defaultValue={params.person} placeholder="Person mentioned" className={field}/>
        <label className="text-xs font-bold text-slate-500">From<input type="date" name="from" defaultValue={params.from} className={field + " mt-1 w-full"}/></label>
        <label className="text-xs font-bold text-slate-500">To<input type="date" name="to" defaultValue={params.to} className={field + " mt-1 w-full"}/></label>
        <button className="min-h-11 rounded-lg bg-red-600 px-5 font-bold text-white hover:bg-red-700">Search archive</button>
      </form>
      <p className="my-6 text-sm text-slate-500"><strong>{total}</strong> stories found</p>
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{articles.map(article => <article key={article.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{article.featuredImage ? <Image src={article.featuredImage} alt="" width={640} height={360} className="aspect-video w-full object-cover"/> : <div className="flex aspect-video items-center justify-center bg-slate-100 text-xs text-slate-400">படம் இல்லை</div>}<div className="p-4"><p className="text-xs font-bold text-red-600">{article.category.name}</p><Link href={`/news/${article.slug}`}><h2 className="mt-1 line-clamp-2 font-black hover:text-red-600">{article.title}</h2></Link><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{article.summary}</p><p className="mt-3 text-[11px] text-slate-400">{article.publishedAt?.toLocaleDateString("ta-LK")}</p></div></article>)}</section>
      {articles.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No stories match these filters.</div>}
      {pages > 1 && <nav className="mt-8 flex items-center justify-center gap-3">{page > 1 && <Link href={`/search?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page - 1) })}`} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-bold"><ArrowLeft className="h-4 w-4"/>Previous</Link>}<span className="text-sm font-bold">Page {page} of {pages}</span>{page < pages && <Link href={`/search?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page + 1) })}`} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-bold">Next<ArrowRight className="h-4 w-4"/></Link>}</nav>}
    </main>
  </div>;
}
