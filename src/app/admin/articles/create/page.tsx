import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createArticle } from "@/actions/article";
import { ArticleForm } from "@/components/article-form";
import { ArticleStatus, Locale, Role } from "@prisma/client";

export default async function CreateArticlePage() {
  const [user, categories, relatedOptions] = await Promise.all([requireUser([Role.REPORTER, Role.EDITOR, Role.ADMIN]), prisma.category.findMany({ where: { locale: Locale.ta }, orderBy: { order: "asc" } }), prisma.article.findMany({ where: { locale: Locale.ta, status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] } }, orderBy: { publishedAt: "desc" }, take: 100, select: { id: true, title: true } })]);
  return <main className="mx-auto max-w-5xl px-4 py-8 md:px-6"><Link href="/admin/articles" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4"/>Back to articles</Link><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-blue-700">New newsroom item</p><h1 className="mt-1 text-3xl font-black">Create article</h1><p className="mt-2 text-slate-600">The signed-in journalist will be recorded as the author.</p></div><ArticleForm action={createArticle} categories={categories} role={user.role} relatedOptions={relatedOptions}/></main>;
}
