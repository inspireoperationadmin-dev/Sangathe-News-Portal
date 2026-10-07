import { Role } from "@prisma/client";
import { FileText, Save } from "lucide-react";
import { saveSitePage } from "@/actions/pages";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_PAGES } from "@/lib/site-pages";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";
export default async function PagesManager({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireUser([Role.ADMIN]); const params = await searchParams;
  const saved = await prisma.sitePage.findMany(); const bySlug = new Map(saved.map(page => [page.slug, page]));
  const field = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
  return <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 md:px-6"><header><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Trust and legal content</p><h1 className="mt-1 text-3xl font-black">Public pages</h1><p className="mt-2 text-slate-600">Edit and publish the legal, editorial and organisation pages shown to readers.</p></header><AdminToast key={params.error || params.success || "none"} success={params.success} error={params.error}/>
    <div className="space-y-5">{SITE_PAGES.map(definition=>{const page=bySlug.get(definition.slug);return <details key={definition.slug} className="rounded-2xl border border-slate-200 bg-white shadow-sm" open={!page}><summary className="flex cursor-pointer items-center gap-3 p-5 font-black"><FileText className="h-5 w-5 text-blue-700"/><span>{page?.title||definition.title}</span><span className="ml-auto text-xs font-normal text-slate-400">/{definition.slug}</span></summary><form action={saveSitePage} className="border-t border-slate-200 p-5"><input type="hidden" name="slug" value={definition.slug}/><label className="text-sm font-bold">Page title<input name="title" required defaultValue={page?.title||definition.title} className={field}/></label><label className="mt-4 block text-sm font-bold">Page content<textarea name="content" required rows={12} defaultValue={page?.content||definition.content} className={field+" py-3 font-mono text-sm"}/><span className="mt-1 block text-xs font-normal text-slate-500">Safe HTML headings, paragraphs, lists and links are supported.</span></label><button className="mt-4 flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 font-bold text-white"><Save className="h-4 w-4"/>Publish page</button></form></details>})}</div>
  </main>;
}
