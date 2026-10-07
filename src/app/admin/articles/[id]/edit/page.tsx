import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { ArticleStatus, Locale, Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateArticle } from "@/actions/article";
import { ArticleForm } from "@/components/article-form";
import { AdminToast } from "@/components/admin-toast";

export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const query = await searchParams;
  const [article,categories,relatedOptions] = await Promise.all([prisma.article.findUnique({ where:{id}, include:{ tags:{include:{tag:true}},media:{orderBy:{order:"asc"},include:{media:true}},relatedFrom:{orderBy:{order:"asc"},include:{relatedArticle:{select:{id:true,title:true}}}},revisions:{orderBy:{revisionNumber:"desc"},include:{editor:{select:{name:true}}}}, auditEvents:{orderBy:{createdAt:"desc"},take:20,include:{actor:{select:{name:true}}}} } }),prisma.category.findMany({where:{locale:Locale.ta},orderBy:{order:"asc"}}),prisma.article.findMany({where:{locale:Locale.ta,status:{in:[ArticleStatus.PUBLISHED,ArticleStatus.UPDATED,ArticleStatus.CORRECTED]}},orderBy:{publishedAt:"desc"},take:100,select:{id:true,title:true}})]);
  if(!article)notFound();
  if(user.role===Role.REPORTER&&(article.authorId!==user.id||!["DRAFT","RETURNED"].includes(article.status)))redirect("/admin/articles?error=You+may+only+edit+your+own+draft+or+returned+articles");
  if(user.role===Role.SUB_EDITOR&&!["SUBMITTED_FOR_REVIEW","EDITING"].includes(article.status))redirect("/admin/articles?error=Sub-editors+may+only+work+on+submitted+or+editing+articles");
  if(article.status===ArticleStatus.ARCHIVED)redirect("/admin/articles?error=Archived+articles+are+read-only");
  const action=updateArticle.bind(null,article.id);
  return <main className="mx-auto max-w-5xl px-4 py-8 md:px-6"><Link href="/admin/articles" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4"/>Back to articles</Link><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Revision {article.revisions.length}</p><h1 className="mt-1 text-3xl font-black">Edit article</h1><p className="mt-2 text-slate-600">Every save creates an immutable revision and audit event.</p></div><AdminToast key={query.error || "none"} error={query.error}/><ArticleForm action={action} categories={categories} role={user.role} article={article} relatedOptions={relatedOptions}/>
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-black"><History className="h-5 w-5 text-blue-700"/>Article history</h2><ol className="mt-4 space-y-3">{article.auditEvents.map(event=><li key={event.id} className="border-l-2 border-slate-200 pl-4"><p className="text-sm font-bold">{event.action.replaceAll("_"," ")}</p><p className="text-sm text-slate-600">{event.actor?.name||"System"} · {event.createdAt.toLocaleString("en-LK")}</p>{event.details&&<p className="mt-1 text-sm text-slate-500">{event.details}</p>}</li>)}</ol></section>
  </main>;
}
