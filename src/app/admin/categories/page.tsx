import { ArrowDown, ArrowUp, FolderTree, Plus, Save, Trash2 } from "lucide-react";
import { Locale, Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "@/actions/categories";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireUser([Role.ADMIN]);
  const params = await searchParams;
  const categories = await prisma.category.findMany({
    where: { locale: Locale.ta },
    orderBy: [{ parentId: "asc" }, { order: "asc" }],
    include: { parent: { select: { name: true } }, _count: { select: { articles: true, children: true } } },
  });
  const parents = categories.filter(category => !category.parentId);
  const input = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";

  return <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 md:px-6">
    <header><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Information architecture</p><h1 className="mt-1 text-3xl font-black">Categories</h1><p className="mt-2 text-slate-600">Create Tamil categories and subcategories, then control their navigation order.</p></header>
    <AdminToast key={params.error || params.success || "none"} success={params.success} error={params.error}/>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="flex items-center gap-2 text-lg font-black"><Plus className="h-5 w-5 text-blue-700"/>New category</h2>
      <form action={createCategory} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-bold">Tamil name<input name="name" required className={input}/></label>
        <label className="text-sm font-bold">URL slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="northern-province" className={input}/></label>
        <label className="text-sm font-bold">Parent category<select name="parentId" className={input}><option value="">Top-level category</option>{parents.map(parent => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select></label>
        <label className="text-sm font-bold">Description<input name="description" className={input}/></label>
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 font-bold text-white md:col-span-2 lg:col-span-1"><Plus className="h-4 w-4"/>Create category</button>
      </form>
    </section>

    <section className="space-y-4" aria-labelledby="category-list-heading">
      <div><h2 id="category-list-heading" className="flex items-center gap-2 text-lg font-black"><FolderTree className="h-5 w-5 text-blue-700"/>Tamil category structure</h2><p className="mt-1 text-sm text-slate-500">A category containing articles or subcategories cannot be deleted.</p></div>
      {categories.map(category => <article key={category.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${category.parentId ? "ml-4 border-l-4 border-l-blue-300 md:ml-10" : "border-slate-200"}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{category.parent ? `Subcategory of ${category.parent.name}` : "Top-level category"}</p><p className="mt-1 text-sm text-slate-500">{category._count.articles} articles · {category._count.children} subcategories · Order {category.order}</p></div><div className="flex gap-2"><form action={moveCategory}><input type="hidden" name="id" value={category.id}/><button name="direction" value="up" title="Move up" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300"><ArrowUp className="h-4 w-4"/></button></form><form action={moveCategory}><input type="hidden" name="id" value={category.id}/><button name="direction" value="down" title="Move down" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300"><ArrowDown className="h-4 w-4"/></button></form></div></div>
        <form action={updateCategory} className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto] lg:items-end">
          <input type="hidden" name="id" value={category.id}/>
          <label className="text-sm font-bold">Tamil name<input name="name" required defaultValue={category.name} className={input}/></label>
          <label className="text-sm font-bold">URL slug<input name="slug" required defaultValue={category.slug} pattern="[a-z0-9-]+" className={input}/></label>
          <label className="text-sm font-bold">Parent<select name="parentId" defaultValue={category.parentId || ""} disabled={category._count.children > 0} className={input}><option value="">Top-level category</option>{parents.filter(parent => parent.id !== category.id).map(parent => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select>{category._count.children > 0 && <input type="hidden" name="parentId" value=""/>}</label>
          <label className="text-sm font-bold">Description<input name="description" defaultValue={category.description || ""} className={input}/></label>
          <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 font-bold text-white"><Save className="h-4 w-4"/>Save</button>
        </form>
        <form action={deleteCategory} className="mt-3 flex justify-end"><input type="hidden" name="id" value={category.id}/><ConfirmSubmitButton disabled={category._count.articles > 0 || category._count.children > 0} dialogTitle="Delete this category?" description={`“${category.name}” will be permanently removed. This action cannot be undone.`} confirmLabel="Delete category" className="flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4"/>Delete empty category</ConfirmSubmitButton></form>
      </article>)}
    </section>
  </main>;
}
