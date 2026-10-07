import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sanitizeArticleHtml } from "@/lib/article-content";
import { SITE_PAGES, type SitePageSlug } from "@/lib/site-pages";
import { SiteFooter } from "@/components/site-footer";

export async function LegalPage({ slug }: { slug: SitePageSlug }) {
  const fallback = SITE_PAGES.find(page => page.slug === slug)!;
  const page = await prisma.sitePage.findUnique({ where: { slug } });
  const title = page?.isPublished ? page.title : fallback.title;
  const content = page?.isPublished ? sanitizeArticleHtml(page.content) : sanitizeArticleHtml(fallback.content);
  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4"><Link href="/" className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600 hover:text-red-600"><ArrowLeft className="h-4 w-4"/>முகப்பு</Link><Link href="/" className="flex items-center gap-2 text-xl font-black"><Newspaper className="h-6 w-6 text-red-600"/>சங்கதி</Link></div></header><main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10"><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10"><h1 className="text-3xl font-black md:text-4xl">{title}</h1><div className="article-content mt-7 leading-8 text-slate-700" dangerouslySetInnerHTML={{ __html: content }}/>{page?.updatedAt&&<p className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">Updated {page.updatedAt.toLocaleDateString("ta-LK")}</p>}</article></main><SiteFooter/></div>;
}
